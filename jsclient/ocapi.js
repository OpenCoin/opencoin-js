oc.api = function opencoin_api (suite) {
    this.suite = suite;
    this.protocol_version='http://opencoin.org/1.0';
   
    this.makeKey = function (length) {
        return this.suite.makeKey(length);
    }

    this.makeCDDC = function (privkey,params) {
        var cdd = new oc.c.CDD();
        cdd.issuer_public_master_key = privkey.getPublicKey();
        cdd.protocol_version = this.protocol_version;
        cdd.issuer_cipher_suite = this.suite.identifier;
        for (name in cdd.fields) {
            var value = params[name];
            if (value != undefined) cdd[name] = params[name];
        }
        
        var cddc = new oc.c.CDDCertificate();
        cddc.cdd = cdd;
        cddc.signature = this.suite.signContainer(privkey,cdd);
        return cddc;
    }



    this.makeMKC = function (issuer_privkey,cddc,params) {
        var mk = new oc.c.MintKey();        
        //here we would actually genereate a mintkey
        //var mint_privkey = new oc.c.RSAPrivateKey();
        //mint_privkey.fromData(this.dummy_keydata);
        var keylength =this.suite.b2s(issuer_privkey.getPublicKey().modulus,2).length;
        keylength += (keylength % 2) //add one if its odd, because it will be too small;
        var mint_privkey = this.makeKey(keylength);
        mk.public_mint_key = mint_privkey.getPublicKey();
        mk.id = this.suite.hash(mk.public_mint_key.toBencode());
        mk.issuer_id = this.getKeyId(issuer_privkey.getPublicKey());
        mk.cdd_serial = cddc.cdd.cdd_serial;
        mk.denomination = params.denomination;
        mk.sign_coins_not_before = params.notBefore;
        mk.sign_coins_not_after = params.notAfter;
        mk.coins_expiry_date = params.coins_expiry_date;
        var mkc = new oc.c.MintKeyCertificate();
        mkc.mint_key = mk;
        mkc.signature = this.suite.signContainer(issuer_privkey,mk);
        out = {}
        out.mkc = mkc;
        out.private_mintkey = mint_privkey;
        return out;

    };

    this.getKeyId = function(key) {
        return this.suite.hash(key.toBencode());
    }

    this.makeBlind = function(cddc,mkc,reference) {
        var out, serial, mk, pub, keylength, tmp, payload,hash,hashnumber, blind;
        mk = mkc.mint_key;
        pub = mk.public_mint_key;
        //keylength = suite.guessKeyLength(pub);

        payload = new oc.c.Payload();
        payload.protocol_version = cddc.cdd.protocol_version;
        payload.issuer_id = this.suite.hash(cddc.cdd.issuer_public_master_key.toBencode());
        payload.cdd_location = cddc.cdd.cdd_location;
        payload.denomination = mk.denomination;
        payload.mint_key_id = mk.id;
        payload.serial = this.suite.getRandomNumber(128);
        
        hash = this.suite.paddedhashContainer(pub,payload);
        tmp = this.suite.blind(pub,hash);
        
        blind = new oc.c.Blind();
        blind.reference = reference;
        blind.blinded_payload_hash = tmp.blinded_payload_hash;
        blind.mint_key_id = mk.id;

        out = {};
        out.payload = payload;
        out.blind = blind;
        out.r = tmp.r;
        return out;
    }

    this.signBlind = function(mkpriv,blind) {
        var signature = this.suite.sign(mkpriv,blind.blinded_payload_hash);
        
        var blindsignature = new oc.c.BlindSignature();
        blindsignature.reference = blind.reference;
        blindsignature.blind_signature = signature;
        
        return blindsignature;
    }

    this.makeCoin = function (payload,blindsignature,r,mkc) {
        var pub = mkc.mint_key.public_mint_key;
        var signature = this.suite.unblind(pub,blindsignature.blind_signature,r);

        if (!this.suite.verifyContainerSignature(pub,payload,signature)) throw 'verification failed';    
        var coin = new oc.c.Coin();
        coin.payload = payload;
        coin.signature = signature;

        return coin;
    }

    this.sumArray = function (a) {
        var s = 0;
        for (var i in a) {
            s += a[i];    
        }
        return s;
    }

    this.compI = function (a,b) {return a-b}

    this.tokenize = function (denominations,amount) {
        /* this gives us a selection of payloads (elements of denominations)
        that allows to pay anything smaller or equal to amount. This is desired
        as a state for a senders wallet - it makes sure that you can always pay
        at least once without running to the issuer beforehand*/

        denominations = denominations.sort(this.compI);
        var payloads = [];
        var i = 0;
        var max_i = denominations.length-1;
        var d, rest;
        while (this.sumArray(payloads) < amount) {
            if (i>max_i) i = max_i;
            d = denominations[i];
            rest = amount - this.sumArray(payloads);
            if (d==1) {
                payloads[payloads.length] = 1;
                i += 1;
            } else if (d <= rest - d + denominations[i-1]+1) {
                payloads[payloads.length] = d;
                i +=1;
            } else if (d > rest -d + denominations[i-1]+1) {
                i -= 1;      
            }
            
        }
        payloads = payloads.sort(this.compI);
        return payloads;
    }

    this.prepare_for_exchange = function (denominations,oldcoins,newcoins) {
        /*returns [[values to kepp],[values to pay], [values to payload]
          values to keep are the ones that don't need changing
          values to pay are oldcoins, that we need to send to pay for [values to payload]
            (and we send all new coins to pay for [values to payload] as well)
          values to payload are the values that we want to have back from the issuer

        so, we send to the issuer: newcoins + values to pay
        and ask for: values to payload
        */
        
        oldcoins = oldcoins.sort(this.compI);
        oldcoins = oldcoins.reverse();

        newcoins = newcoins.sort(this.compI);
        newcoins = newcoins.reverse();

        var amount = this.sumArray(oldcoins) + this.sumArray(newcoins);

        var target = this.tokenize(denominations,amount);
        target = target.sort(this.compI);
        target = target.reverse();
        var keepold = [];
        var makenew = [];
        for (var i in target) {
            var t = target[i];
            var ti = oldcoins.indexOf(t);
            if (ti != -1) {
                var k = oldcoins.splice(ti,1);
                keepold[keepold.length] = k[0];
            } else {
                makenew[makenew.length] = t;    
            }
        }
        out = {'keepold':keepold,
               'fromold':oldcoins,
               'makenew':makenew}
        return out;
    }

    this.getRandomInt = function get (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

