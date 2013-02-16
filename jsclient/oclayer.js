oc.layer = function opencoin_layer(api,storage) {
    this.setActiveStorage = function(storage) {
        this.storage = storage;
        this.mq = storage.message_queue;
    }
    if (storage!=undefined) this.setActiveStorage(storage);
    this.api = api;
    this.sh = {} //server handler functions;



    this.isEmpty = function(a) {
        if (a == undefined) return true;
        if (a.length == undefined) return false;
        if (a.length == 0) return true;
        return false;
    }

    this.setDefault = function (obj,key,def) {
        var out = obj[key];
        if (out == undefined) {
            obj[key] = def;    
            out = obj[key];
        }
        return out;
    }

    this.newStorage = function newStorage() {
        return {
            'message_queue':{'next_id':0},
            'cddcs':{},
            'mintkeys':{'denominations':{}},
            'validation':{},
            'private_keys':{},
            'coins':{},
        } 
    }



    this.buildMessage = function(name) {
        var message = new oc.c[name]();
        var id = this.mq.next_id;
        message.message_reference = id;
        return message;
    }


    this.buildReply =function(message,name,status_code,status_description) {
        var reply = new oc.c[name]();
        reply.status_code = status_code || 200;
        reply.status_description = status_description || 'ok';
        reply.message_reference = message.message_reference;
        return reply;
    }


    this.queueMessage = function(message) {
        var id = message.message_reference;
        this.mq[id] = message;
        this.mq.next_id = id+1;
    }

    this.parseData = function(data) {
        var type = data.type;
        if (!(type in oc.registry)) throw 'non existent type';
        message = new oc.registry[type]();
        message.fromData(data);
        return message;
    }

    this.callHandler = function(message) {
        var handler = this.sh[message.type];
        if (handler == undefined) throw 'non existent handler for "'+obj.type+'"';
        var out = handler.call(this,message);
        return out; 
    }

    this.dispatch = function(data) {
        var message = this.parseData(data);
        return this.callHandler(message);
    }

    this.serializeStorage = function(storage) {
        if (storage == undefined) storage = this.storage;
        function innerToData(value,ignored,master) {
            var type = typeof(value);
            if (['string','number'].indexOf(type)!=-1) {
                return value;    
            } else if (Array.isArray(value)) {
                var tmp = [];
                for (var i in value) {
                    tmp[i] = innerToData(value[i],ignored,master);    
                }
                return tmp;
            } else if (value.toData != undefined) {//must be an container
                return value.toData(ignored,master);
            } else {
                var tmp = {};
                for (var name in value) {
                    tmp[name] = innerToData(value[name],ignored,master);    
                }
                return tmp;
            }
        }
        var out = {};
        for (name in storage) {
            out[name] = innerToData(storage[name],undefined,storage);
        }
        return out;
    }

    this.toJson = function() {
        return JSON.stringify(this.serializeStorage(),null,4);    
    }

    this.fromJson = function(json) {
        this.storage = this.deserializeStorage(JSON.parse(json));    
        return this.storage;
    }

    this.deserializeStorage = function(data) {

        function innerFromData(value,ignored,master) {
            var type = typeof(value);
            if (['string','number'].indexOf(type)!=-1) {
                return value;    
            } else if (Array.isArray(value)) {
                var tmp = [];
                for (var i in value) {
                    tmp[i] = innerFromData(value[i],ignored,master);    
                }
                return tmp;
            } else if (value.type != undefined) {//must be an container
                var klass = oc.registry[value.type];
                container = new klass();
                container.fromData(value,master);
                return container;
            } else {
                var tmp = {};
                for (var name in value) {
                    tmp[name] = innerFromData(value[name],ignored,master);    
                }
                return tmp;
            }
        }

        var out = {};
        for (name in data) {
            out[name] = innerFromData(data[name],undefined,data);
        }
        return out;

    }




    //////////////////// CDDC /////////////////////////////////////

    this.addCDDC = function(cddc) {
        var serial = cddc.cdd.cdd_serial;
        this.storage.cddcs[serial] = cddc;
    }


    this.getCurrentCDDC = function () {
        //alert(arguments.callee.caller.toString());
        var keys = Object.keys(this.storage.cddcs);
        keys.sort();
        var highest = keys[keys.length-1];
        return this.storage.cddcs[highest];
    }


    this.requestCDDSerial = function() {
        var message = this.buildMessage('RequestCDDSerial');
        this.queueMessage(message);
        return message;
    }


    this.responseCDDSerial = function (message) {
        var current = this.getCurrentCDDC();
        reply = this.buildReply(message,'ResponseCDDSerial');
        reply.cdd_serial = current.cdd.cdd_serial;
        return reply;
    }
    this.sh['request cdd serial'] = this.responseCDDSerial;


    this.handleResponseCDDSerial = function (response) {
        delete this.mq[response.message_reference];
        return response.serial;
    } 
    this.sh['response cdd serial'] = this.handleResponseCDDSerial;


    this.requestCDD = function (serial) {
        var message = this.buildMessage('RequestCDD');
        message.cdd_serial = serial;
        this.queueMessage(message);
        return message;
    }


    this.responseCDD = function(message) {
        var cddc = this.storage.cddcs[message.cdd_serial];
        if (cddc == undefined) {
            reply = this.buildReply(message,'ResponseCDD',404,'not found');
        } else {
            reply = this.buildReply(message,'ResponseCDD');
            reply.cdd = cddc;
        }
        return reply;
    }
    this.sh['request cdd'] = this.responseCDD;


    this.handleResponseCDD = function (response) {
        var cddc = response.cdd;
        var cdd = cddc.cdd;
        var verified = this.api.suite.verifyContainerSignature(cdd.issuer_public_master_key,cdd,cddc.signature);
        if (!verified) throw 'could not verify cdd signature';
        this.addCDDC(cddc);
        delete this.mq[response.message_reference];
    } 
    this.sh['response cdd'] = this.handleResponseCDD;


    ///////////////// Mint keys ////////////////////////////////
    
    this.addMKC = function(mkc,private_key) {
        var mk = mkc.mint_key;
        this.storage.mintkeys[mk.id]=mkc;
        var denomination = mk.denomination;
        if (this.storage.mintkeys.denominations[denomination] == undefined) 
            this.storage.mintkeys.denominations[denomination] = [];
        var denominations = this.storage.mintkeys.denominations[denomination];
        if (denominations.indexOf(mk.id) == -1) {
            denominations[denominations.length]=mk.id;
            //console.log('added key '+ mk.id);
            if (private_key!=undefined) {
                this.storage.private_keys[mk.id]=private_key;
            }
        } 
        //else console.log('we already had that key');

    }

    this.getCurrentMKC = function (denomination) {
        var d = this.storage.mintkeys.denominations[denomination];
        var id =  d[d.length-1]; 
        return this.storage.mintkeys[id];
    }


    this.requestMintKeys = function(mint_key_ids,denominations) {
        var message = this.buildMessage('RequestMintKeys');
        message.mint_key_ids = mint_key_ids;
        message.denominations = denominations;
        this.queueMessage(message);
        return message;
    }

    this.responseMintKeys = function(message) {
        var reply = this.buildReply(message,'ResponseMintKeys');
        if (this.isEmpty(message.mint_key_ids) && this.isEmpty(message.denominations)) {
            var cddc = this.getCurrentCDDC();
            message.denominations = cddc.cdd.denominations;
        } 
       
        var keys = [];
        if (!this.isEmpty(message.mint_key_ids)) {
            for (var i in message.mint_key_ids) {
                var mkc = this.storage.mintkeys[message.mint_key_ids[i]];
                if (mkc != undefined) keys[keys.length] = mkc;
            }    
        } else { //denominations it is
            for (var i in message.denominations) {
                var d = message.denominations[i];
                var dk = this.storage.mintkeys.denominations[d]; //denominationkeys
                if (dk != undefined && dk.length) keys[keys.length] = this.storage.mintkeys[dk[dk.length-1]]; //the last one
            }
        }
        if (keys.length) {
            reply.keys = keys;    
        } else {
            reply.status_code = 404;
            reply.status_description = 'at least one key was not found';
        }
        return reply;
    }
    this.sh['request mint keys'] = this.responseMintKeys;


    this.handleResponseMintKeys = function (response) {
        var orig = this.mq[response.message_reference];
        var cddc = this.getCurrentCDDC();
        //if (orig == undefined) throw 'response to unknown request';
        if (response.keys.length == 0) throw 'no mint keys returned';
        for (var i in response.keys) {
            var mkc = response.keys[i];
            var verified = this.api.suite.verifyContainerSignature(cddc.cdd.issuer_public_master_key,mkc.mint_key,mkc.signature);
            if (!verified) throw 'could not verify mkc signature';
        }
        for (var i in response.keys) {
            this.addMKC(response.keys[i]); 
        }
        delete this.mq[response.message_reference];
    } 
    this.sh['response mint keys'] = this.handleResponseMintKeys;


    this.requestValidation = function(amount,authorization_info) {
        var message = this.buildMessage('RequestValidation');
        var cddc = this.getCurrentCDDC();
        var tokens = this.api.tokenize(cddc.cdd.denominations,amount);
        var store = {};
        var blinds = [];
        //var refbase = this.api.getRandomInt(100000,999999);
        for (var i in tokens) {
            var t = tokens[i];
            var mkc = this.getCurrentMKC(t);
            var ref = 'r_'+i;
            var parts = this.api.makeBlind(cddc,mkc,ref);
            parts.r = this.api.suite.b2s(parts.r);
            store[ref] = parts;
            blinds[blinds.length] = parts.blind;
        }

        var tref = this.api.suite.b2s(this.api.suite.getRandomNumber(128));
        message.transaction_reference = tref;
        message.authorization_info = authorization_info;
        message.blinds = blinds;
        this.storage.validation[tref]=store;
        this.queueMessage(message);
        return message;
    }

    this.responseValidation = function (message) {
        reply = this.buildReply(message,'ResponseMinting');
        
        var blinds = message.blinds;
        var sum = this.sanitycheckBlinds(blinds);
                
        //the magic of authorization
        if (!this.authorize(message.authorization_info,sum)) throw 'unauthorized';
        
        var blind_signatures = this.batchSignBlinds(blinds);

        if (message.authorization_info == 'please delay') {
            reply.status_code = 300;
            reply.status_description = 'come back later';
            var now = new Date();
            var d = new Date(now.getTime() + 10*60000);
            reply.retry_after = d;
            this.storage.validation[message.transaction_reference] = blind_signatures;
        } else {
            reply.blind_signatures = blind_signatures;
        }
        return reply;
    }
    this.sh['request validation'] = this.responseValidation;


    this.sanitycheckBlinds = function (blinds) {
        var sum = 0;
        var today = new Date();
        for (var i in blinds) {
            var blind = blinds[i];
            var keyid = blind.mint_key_id;
            if (keyid in {'bydate':0,'denominations':0}) throw 'evil key id';
            if (!keyid in this.storage.mintkeys) throw 'invalid key id';
            var key = this.storage.mintkeys[keyid].mint_key;
            if (today < key.sign_coins_not_before) throw 'future key';
            if (today > key.sign_coins_not_after) throw 'outdated key';
            sum += key.denomination;
        }
        return sum
    }


    this.batchSignBlinds = function(blinds) {
        var blind_signatures = [];
        for (var i in blinds) {
            var blind = blinds[i];
            var pk = this.storage.private_keys[blind.mint_key_id];
            var signature = this.api.signBlind(pk,blind);
            blind_signatures[blind_signatures.length] = signature;
        }
        return blind_signatures;
    }


    this.authorize = function (authorization_info,amount) {
        //console.log('Authorize '+amount+ ' with '+authorization_info);
        return true;
    }


    this.handleResponseMinting = function (response) {
        if (response.status_code == 300) throw 'delayed';
        var bs = response.blind_signatures;
        var bsbyref = {};
        for (var i in bs) {
            var s = bs[i];
            bsbyref[s.reference] = s;
        }
        var message = this.mq[response.message_reference];
        
        var tref = message.transaction_reference
        if (tref == undefined) throw 'unknown transaction reference';
        var store = this.storage.validation[tref];
        if (tref == undefined) throw 'undefined storage';
        
        var sum = 0;
        for (ref in store) {
            var parts = store[ref];
            var mkc = this.storage.mintkeys[parts.payload.mint_key_id];
            var s = bsbyref[ref];
            r =  this.api.suite.s2b(parts.r);
            var coin = this.api.makeCoin(parts.payload,s,r,mkc);
            this.addCoin(coin);
            sum += coin.payload.denomination;
        }
         
        delete this.storage.validation[message.transaction_reference];
        for (name in this.mq) {
            var mq_message =  this.mq[name];
            if (mq_message.transaction_reference == tref) {
                delete this.mq[name]; 
            }
        }    
        //delete this.mq[response.message_reference];
        return sum;
    } 
    this.sh['response minting'] = this.handleResponseMinting;


    this.addCoin = function(coin) {
        var coins = this.setDefault(this.storage.coins,coin.payload.denomination,[]);
        coins[coins.length] = coin;
    }


    this.requestSendCoins = function (amount,subject) {
        var message = this.buildMessage('SendCoins');
        var available = this.sumStoredCoins();
        if (amount>available) throw 'we only have '+available;
        message.coins = this.pickCoins(amount);
        message.subject = subject;
        this.queueMessage(message);
        return message;
    }
   
   
   this.pickCoins = function (amount) {
        var sum = 0;
        var selected = [];
        var denominations = Object.keys(this.storage.coins);
        denominations.sort(this.api.compI);
        var i = denominations.length-1;
        var d;
        while (sum<amount) {
            if (i<0) throw 'non existent denomination';
            d = parseInt(denominations[i]);
            if (d>amount-sum) {
                i --;
            } else if(this.storage.coins[d].length>0) {
                selected.push(this.storage.coins[d].shift());    
                sum += d;
            } else if(i>0) {
                i--;    
            } else {
                throw 'run out of coins'    
            }
        }
        return selected;
    }


    this.sanitycheckCoins = function(coins) {
        var cddc = this.getCurrentCDDC();
        var cid = this.api.getKeyId(cddc.cdd.issuer_public_master_key);
        var sum = 0;
        var out = [];
        for (var i in coins) {
            var coin = coins[i];
            var payload = coin.payload;
            if (payload.issuer_id!=cid) throw 'wrong issuer';
            var mkc = this.storage.mintkeys[payload.mint_key_id];
            if (mkc == undefined) throw 'unknown mint key';
            if (mkc.mint_key.id != payload.mint_key_id) throw 'wrong mint id';
            var verified = this.api.suite.verifyContainerSignature(mkc.mint_key.public_mint_key,coin.payload,coin.signature);
            if (!verified) throw 'invalid coin signature';            
            sum += mkc.mint_key.denomination;
            out.push(mkc.mint_key.denomination);
        }
        return out;
    }


    this.requestRenewal = function (newcoins) {
        var message = this.buildMessage('RequestRenewal');
        var cddc = this.getCurrentCDDC();
        var existing = [];
        
        for (d in this.storage.coins) {
            for (i = 0; i<this.storage.coins[d].length; i++) {
                existing.push(parseInt(d));
            }    
        }
        
        if (newcoins == undefined) newcoins = [];
        else this.sanitycheckCoins(newcoins);

        var newd = [];
        for (var i in newcoins) {
            newd.push(newcoins[i].payload.denomination);
        }
        var tmp = this.api.prepare_for_exchange(cddc.cdd.denominations,existing,newd);
        var blinds = [];
        var store = {};
        for (var i in tmp.makenew) {
            var t = tmp.makenew[i];
            var mkc = this.getCurrentMKC(t);
            var ref = 'r_'+i;
            var parts = this.api.makeBlind(cddc,mkc,ref);
            parts.r = this.api.suite.b2s(parts.r);
            store[ref] = parts;
            blinds[blinds.length] = parts.blind;
        }

        var to_send = [];
        for (var i in tmp.fromold) to_send.push(this.storage.coins[tmp.fromold[i]].shift());
        for (var i in newcoins) to_send.push(newcoins[i]);

        var tref = this.api.suite.b2s(this.api.suite.getRandomNumber(128));
        message.transaction_reference = tref;
        message.coins = to_send;
        message.blinds = blinds;
        this.storage.validation[tref]=store;
        this.queueMessage(message);
        return message;
    }


   this.responseRenewal = function (message) {
        reply = this.buildReply(message,'ResponseMinting');
        
        var blinds = message.blinds;
        var sum = this.sanitycheckBlinds(blinds);
 
        var sum2 = this.api.sumArray(this.sanitycheckCoins(message.coins));
       
        if (sum != sum2) throw 'mismatching amounts';
        if (this.inDSDB(message.coins)) throw 'double spend';
        this.addCoinsToDSDB(message.coins);
        reply.blind_signatures = this.batchSignBlinds(blinds);
        return reply;
    }
    this.sh['request renewal'] = this.responseRenewal;


    this.inDSDB = function (coins) {
        for (var i in coins) {
            var key = this.makeDSDBKey(coins[i]);
            if (key in this.storage.dsdb) return 1;
        }
        return 0;
    }


    this.addCoinsToDSDB = function (coins) {
        for (var i in coins) {
            var key = this.makeDSDBKey(coins[i]);
            console.log('add to dsdb: '+key);
            this.storage.dsdb[key] = 1;//coin.signature;
        }    
    }


    this.makeDSDBKey = function (coin) {
        var key =  this.api.suite.b2s(coin.payload.serial,16);
        return key;
        //var data = coin.payload.serial + '_' + coin.signature;    
        //var data = coin.payload.serial + '_' + coin.signature;    
        var key = this.api.suite.hash(data);
        return key;
    }


    this.responseSendCoins = function (message) {
        var reply = this.buildReply(message,'ReceivedCoins');
        return reply;
    }
    this.sh['send coins'] = this.responseSendCoins;


    this.handleReceivedCoins = function (response) {
        delete this.mq[response.message_reference];
    } 
    this.sh['received coins'] = this.handleReceivedCoins;


    this.requestInvalidation = function (amount,authorization_info) {
        var message = this.buildMessage('RequestInvalidation');
        message.coins = this.pickCoins(amount);
        message.authorization_info = authorization_info;
        this.queueMessage(message);
        return message;
    }

    this.responseInvalidation = function (message) {
        reply = this.buildReply(message,'ResponseInvalidation');
        var coins = message.coins; 
        var sum = this.api.sumArray(this.sanitycheckCoins(coins));
        if (this.inDSDB(coins)) throw 'double spend';
        this.addCoinsToDSDB(message.coins);
        this.creditInvalidation(sum,message.authorization_info);
        return reply;
    }
    this.sh['request invalidation'] = this.responseInvalidation;


    this.creditInvalidation = function (amount,authorization_info) {
        return amount;
    }


    this.handleResponseInvalidation = function (response) {
        delete this.mq[response.message_reference];
    } 
    this.sh['response invalidation'] = this.handleResponseInvalidation;


    this.requestResume = function (tref) {
        var message = this.buildMessage('RequestResume');
        if (!tref in this.storage.validation) throw 'unknown transaction';
        message.transaction_reference = tref;
        this.queueMessage(message);
        return message;
    }
   

   this.responseResume = function (message) {
        reply = this.buildReply(message,'ResponseMinting');
        var tref = message.transaction_reference;
        
        if (!tref in this.storage.validation) throw 'unknown transaction referene';
        
        var blind_signatures = this.storage.validation[tref];

        if (blind_signatures == undefined) {
            reply.status_code = 300;
            reply.status_description = 'come back later';
            var now = new Date();
            var d = new Date(now.getTime() + 10*60000);
            reply.retry_after = d;
        } else {
            reply.blind_signatures = blind_signatures;  
            //do this maybe later, just in case
            delete this.storage.validation[tref];
        }
        return reply;
    }
    this.sh['request resume'] = this.responseResume;


    
    this.sumStoredCoins = function() {
        var sum = 0;
        for (d in this.storage.coins) {
            sum += d*this.storage.coins[d].length;    
        }
        return sum;
    }

    this.sumCoins = function(coinarray) {
        var sum = 0;
        for (var i in coinarray) sum += coinarray[i].payload.denomination;
        return sum;
    }
  
    this.currencyName = function currencyName() {
        //alert(arguments.callee.caller.toString());
        return this.getCurrentCDDC().cdd.currency_name;    
    }

    this.currencyId = function currencyId() {
        key = this.getCurrentCDDC().cdd.issuer_public_master_key;       
        return this.api.getKeyId(key);
    }

}
