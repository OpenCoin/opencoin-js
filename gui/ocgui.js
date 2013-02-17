

function interact(url,message,guihandler,print) {
    if (print == undefined) print = false;
    if (print) console.log(message);
    if (guihandler == undefined) guihandler = wallet.callHandler;
    $.post(url,message.toJson(),function(data) {
        if (typeof data == 'string') parsed = JSON.parse(data);
        else parsed = data;
        var reply = wallet.parseData(parsed);
        //var out = wallet.callHandler(reply);
        guihandler(reply);
        if (print) console.log(reply);
        response = reply;    
        storeDB();
    }).fail(function(){console.log('fail on post')});
}

function showError(text) {
    $.mobile.changePage('#error',{'role':'dialog'});
    $('#errormessage').html(text);
}

function showInfo(header,text) {
    $.mobile.changePage('#info',{'role':'dialog'});
    $('#infoheader').html(header);
    $('#infotext').html(text);
}

function showAlert(header,text,target) {
    $.mobile.changePage('#alert',{'role':'dialog'});
    $('#alertheader').html(header);
    $('#alerttext').html(text);
    if (target != undefined) {
    $('#alert .ok').attr('href',target);
    }
}

function pr(obj) {
    console.log(JSON.stringify(obj));    
}

function quads(text) {
    var out = '';
    for (var i=0; i < text.length; i++) {
        out+=text[i];
        if ((i+1)%4==0) out+=' ';
    }
    return out;
}


$(function(e,data) {


       $('#addcurrency form').on('submit',function(e,data) {
        wallet.setActiveStorage(wallet.newStorage());
        var cid = $('#addcurrency input[name=currencyid]').val();
        var url = $('#addcurrency input[name=url]').val();
        interact(url,wallet.requestCDDSerial(),function(r){
            var cdd_serial = r.cdd_serial;
            wallet.callHandler(r);
            interact(url,wallet.requestCDD(cdd_serial),function(r) {
                //console.log(r);
                var cddc = r.cdd;
                var cdd_cid = wallet.api.getKeyId(cddc.cdd.issuer_public_master_key);
                if (0 && cdd_cid.indexOf(cid) != 0) {
                    showError('The currency id does not match')
                } else {
                    $('#cidarea').html(quads(cdd_cid));
                    $('#addingcurrency').data('r',r);
                    $.mobile.changePage('#addingcurrency');  
                };
                //console.log(cdd_cid);
            });                   
        }); 
        return false;
    });


    $("#addingcurrency a.confirm").on('click',function(e,data){
        var page =  $('#addingcurrency')
        var r = page.data('r');
        out = wallet.callHandler(r);
        page.removeData('r');
        var cddc = wallet.getCurrentCDDC();
        var url = cddc.cdd.cdd_location;
        interact(url,wallet.requestMintKeys(),function(r){
            wallet.callHandler(r);   
            var cdd_cid = wallet.currencyId();
            database[cdd_cid]=wallet.storage;
            $.mobile.changePage('#currency');
            //makeCurrencyList();
        }); 
        return false;
    });


     $("#addingcurrency a.cancel").on('click',function(e,data){
        var page =  $('#addingcurrency')
        var r = page.data('r');
        var i = r.message_reference;
        delete wallet.mq[i];
        page.removeData('r');
     });



   
    $('#deletecurrency a.confirm').on('click',function(e,data){
        var cid = wallet.currencyId()
        delete database[cid];
        storeDB();
        wallet.setActiveStorage({});
    });
    
    coinsound = document.createElement('audio');
    coinsound.setAttribute('src', 'coinsound.ogg');
  
    
    $('#withdraw .confirm').on('click',function(e,data) {
        var amount = parseFloat($('#withdraw input[name="amount"]').val());
        if (isNaN(amount)) {
            showError('The amount needs to be a number');
            return false;
        }
        var cdd = wallet.getCurrentCDDC().cdd;
        if (amount % 1 != 0) {
            amount = amount.toFixed(Math.log(cdd.currency_divisor)/Math.log(10));
        }
        amount = amount * cdd.currency_divisor;
        var auth_info = $('#withdraw input[name="subject"]').val();
        var validationurl = cdd.validation_service[0][1];
        var renewalurl = cdd.renewal_service[0][1];
        showInfo('Please wait','withdrawing coins...');
        cdd_mk_interaction(function(){
             interact(validationurl,wallet.requestValidation(amount,auth_info),function(r) {
                wallet.callHandler(r);    
                //showInfo('Please wait','refreshing coins...');
                //interact(renewalurl,wallet.requestRenewal(),function(r) {
                //    wallet.callHandler(r);
                    coinsound.play();
                    $.mobile.changePage('#currency');  
                //});
             });
        });
    });


    $('#getchange').on('click',function(e,data) {
        showInfo('Please wait','refreshing coins...');
        var cdd = wallet.getCurrentCDDC().cdd;
        var renewalurl = cdd.renewal_service[0][1];
        cdd_mk_interaction(function(){
            interact(renewalurl,wallet.requestRenewal(),function(r) {
                wallet.callHandler(r);
                coinsound.play();
                $.mobile.changePage('#currency');  
            });
        });
        return false;    
    });


    $('#deposit .confirm').on('click',function(e,data) {
        var amount = parseFloat($('#deposit input[name="amount"]').val());
        if (isNaN(amount)) {
            showError('The amount needs to be a number');
            return false;
        }
        var cdd = wallet.getCurrentCDDC().cdd;
        if (amount % 1 != 0) {
            amount = amount.toFixed(Math.log(cdd.currency_divisor)/Math.log(10));
        }
        amount = amount * cdd.currency_divisor;
        var auth_info = $('#deposit input[name="subject"]').val();
        var invalidationurl = cdd.invalidation_service[0][1];
        var renewalurl = cdd.renewal_service[0][1];
        showInfo('Please wait','deposit coins...');
        interact(invalidationurl,wallet.requestInvalidation(amount,auth_info),function(r) {
            wallet.callHandler(r);    
            //showInfo('Please wait','refreshing coins...');
            //interact(renewalurl,wallet.requestRenewal(),function(r) {
            //        wallet.callHandler(r);
                    $.mobile.changePage('#currency');  
            //    });
        });
        return false;
    });


    $('#send .confirm').on('click',function(e,data) {
        var amount = parseFloat($('#send input[name="amount"]').val());
        if (isNaN(amount)) {
            showError('The amount needs to be a number');
            return false;
        }
        var cdd = wallet.getCurrentCDDC().cdd;
        if (amount % 1 != 0) {
            amount = amount.toFixed(Math.log(cdd.currency_divisor)/Math.log(10));
        }
        amount = amount * cdd.currency_divisor;
        var auth_info = $('#send input[name="subject"]').val();
        m = wallet.requestSendCoins(amount,auth_info);
        storeDB();
        var description = amount/cdd.currency_divisor+' '+wallet.currencyName()+'. Open with any OpenCoin wallet app.';
        var encoded = wallet.armor('STACK', m.toJson(),description);
        $('#sendmessage').html(encoded);
        $('#sendresult a.email').attr('href','mailto:?subject=Some '+wallet.currencyName()+' for you&body='+escape(encoded));
    });


    $("#sendmessage, #receipt,#exportmessage").focus(function() {
        var $this = $(this);
        $this.select();

        // Work around Chrome's little problem
        $this.mouseup(function() {
            // Prevent further mouseup intervention
            $this.unbind("mouseup");
            return false;
        });
    });


    $('#receive .confirm').on('click',function(e,data) {
        var data = $('#receivemessage').val();
        data = wallet.unarmor('STACK',data);
        var parsed = JSON.parse(data);
        var message = wallet.parseData(parsed); 
        var cdd = wallet.getCurrentCDDC().cdd;
        var renewalurl = cdd.renewal_service[0][1];
        cdd_mk_interaction(function(){
            interact(renewalurl,wallet.requestRenewal(message.coins),function(r) {
                wallet.callHandler(r);
                coinsound.play();
                storeDB();
                $.mobile.changePage('#receiveresult');
                response = wallet.responseSendCoins(message);
                $('#receivemessage').val('');
                var encoded = wallet.armor('RECEIPT',response.toJson(),'A receipt for '+wallet.currencyName());
                $('#receivedamount').html(wallet.sumCoins(message.coins)/cdd.currency_divisor);
                $('#receipt').html(encoded);
                $('#receiveresult a.email').attr('href','mailto:?subject=Your receipt&body='+escape(encoded));
            });
        });
    });


    $('#processreceipt .confirm').on('click',function(e,data) {
        var area = $('#receivedreceipt');
        var data = area.val();
        data = wallet.unarmor('RECEIPT',data);
        var parsed = JSON.parse(data);
        var message = wallet.parseData(parsed);
        wallet.callHandler(message);
        storeDB();
        area.val('');
        showAlert('Processed','Finished processing receipt');
        return false;
    });
    
    $('#import .import').on('click',function(e,data) {
        var data = $('#importmessage').val();
        data = wallet.unarmor('DATABASE',data);
        var key =  'OPENCOINWALLET--';
        if (data.length && data.indexOf(key)==0) {
            try {
                data = data.slice(key.length);
                var parsed = JSON.parse(data);
                database = parsed;
                storeDB();
                showAlert('Database imported','Successfully imported the database.','#advanced');
                return false;

            } catch (e) {
                showAlert('Could not import','Data found, but wrong format. No changes applied.','#advanced');
                return false;
            }
        } else {
            showAlert('No data found','We could not find valid data. No changes applied','#advanced');
            return false;
        }
    });
});

function cdd_mk_interaction (interaction) {
    var cddurl = wallet.getCurrentCDDC().cdd.cdd_location;
    interact(cddurl,wallet.requestCDDSerial(),function(r) {
        var cdd_serial = r.cdd_serial;
        wallet.callHandler(r);
        interact(cddurl,wallet.requestCDD(cdd_serial),function(r) {
            wallet.callHandler(r);
            interact(cddurl,wallet.requestMintKeys(),function(r) {
                wallet.callHandler(r);
                interaction();
            });
        });
    });
}
   
$('#currencies').live('pageshow',function (e,data) {
    makeCurrencyList();
});

$('#coins').live('pageshow', function(e,data) {
    var page = $('#coins');
    var clist = $('#coins #coinlist');
    clist.html('');
    var cddc = wallet.getCurrentCDDC();

    for (d in wallet.storage.coins) {
        var coinlist = wallet.storage.coins[d];
        for (i in coinlist) {
            var coin = coinlist[i];
            var d = coin.payload.denomination;
            var amount = d/cddc.cdd.currency_divisor;
            clist.append("<li><a href='#coin' coinid='"+d+'-'+i+"'>"+amount+" <span class='currencyname'></span></a></li>");
        }
    }
    $('#coinlist a').on('click',function(e,data){
        var coinid = $(this).attr('coinid');
        var parts = coinid.split('-');
        var coin = wallet.storage.coins[parts[0]][parts[1]];
        $('#coin textarea').html(coin.toJson()); 
        $('#coin #coinvalue').html(coin.payload.denomination/cddc.cdd.currency_divisor); 
    });
    clist.listview('refresh');
});


$('#cddcs').live('pageshow', function(e,data) {
    var page = $('#cddcs');
    var clist = $('#cddcs ul');
    clist.html('');

    for (i in wallet.storage.cddcs) {
        var cddc = wallet.storage.cddcs[i];
        var cdd = cddc.cdd;
        clist.append("<li><a href='#cddc' cddcid='"+i+"'>serial "+cdd.cdd_serial+", "+cdd.currency_name+", "+cdd.cdd_location+"</a></li>");
    }
    $('#cddcs ul a').on('click',function(e,data){
        var cddcid = $(this).attr('cddcid');
        var cddc = wallet.storage.cddcs[cddcid];
        $('#cddc textarea').html(cddc.toJson());
        $('#cddcserial').html(cddc.cdd.cdd_serial);
    });
    clist.listview('refresh');
});

function shortDate(datetime) {
    var out = '';    
    out+=datetime.getDate();
    out+= '. '+(datetime.getMonth()+1);
    out+= '. '+datetime.getFullYear();
    return out;
}

$('#mkcs').live('pageshow', function(e,data) {
    var page = $('#mkcs');
    var clist = $('#mkcs ul');
    clist.html('');

    for (i in wallet.storage.mintkeys) {
        console.log(i);
        if (i=='denominations') continue;
        var mkc = wallet.storage.mintkeys[i];
        var mint_key = mkc.mint_key;
        var html = "<li><a href='#mkc' mkcid='"+i+"'>"+mint_key.denomination;
        html+=', start: '+shortDate(mint_key.sign_coins_not_before);
        html+=', end: '+shortDate(mint_key.sign_coins_not_after);
        html+="</a></li>";
        clist.append(html);
    }
    $('#mkcs ul a').on('click',function(e,data){
        var mkcid = $(this).attr('mkcid');
        var mkc = wallet.storage.mintkeys[mkcid];
        var mint_key = mkc.mint_key;
        $('#mkc textarea').html(mkc.toJson());
        //$('#cddcserial').html(cddc.cdd.cdd_serial);
        $('#mkcdenomination').html(mint_key.denomination);
        $('#mkcstart').html(shortDate(mint_key.sign_coins_not_before));
        $('#mkcend').html(shortDate(mint_key.sign_coins_not_after));
    });
    clist.listview('refresh');
});


$('#messages').live('pageshow', function(e,data) {
    var page = $('#messages');
    var clist = $('#messages #messagelist');
    clist.html('');
    var cddc = wallet.getCurrentCDDC();

    for (name in wallet.mq) {
        if (name=='next_id') continue;
        var message = wallet.mq[name];
        clist.append("<li><a href='#message' messageid='"+name+"'>Message "+name+": "+message.type+"</a></li>");
    }
    $('#messagelist a').on('click',function(e,data){
        var messageid = $(this).attr('messageid');
        var message = wallet.mq[messageid];
        $('#message textarea').html(message.toJson()); 
        $('#message #message_type').html(message.type);
        //if (message.type=='send coins') $('#recover_coins').button('enable');
    });
    clist.listview('refresh');
});


$('#export').live('pageshow',function (e,data) {
    var dbstring = 'OPENCOINWALLET--'+serializeDB();
    var encoded = wallet.armor('DATABASE', dbstring,'opencoin wallet database. Backup with care.');
        $('#exportmessage').html(encoded);
});

$(document).bind('pagebeforechange',function(e,data){
    return
    //even though this code is not called, I leave it in for the moment 
    //because I need it as a place to copy from
    console.log('beforechange');
    if (wallet.storage == undefined || Object.keys(wallet.storage).length==0) {
        if (Object.keys(database).length) {
            wallet.setActiveStorage(database[Object.keys(database)[0]]);
            return true;
        } else {
            if (typeof data.toPage !== 'string') {
                $.mobile.changePage('#addcurrency');
                console.log('nostring');
                return true;
            }
            console.log('have '+data.toPage);
            var parsed = $.mobile.path.parseUrl(data.toPage);
            console.log(parsed);
            if (parsed.hash == ""|| ['#addcurrency'].indexOf(parsed.hash)===-1) {
                console.log('change to addcurrency');
                $.mobile.changePage('#addcurrency');
                return false;
            } else {
                console.log('how did we end here?');    
                return false;
            }
            return false;
        }
    }

    if (typeof data.toPage !== 'string') return;
    var parsed = $.mobile.path.parseUrl(data.toPage);
    //if (parsed.hash != "" && ['#currencies','#addcurrency'].indexOf(parsed.hash) === -1 && wallet.storage == undefined) {
    if (wallet.storage == undefined) {        
        if (1 && Object.keys(database).length) { //for development, turn off in real life
            wallet.setActiveStorage(database[Object.keys(database)[0]]);
            return true;
        } else {
            e.preventDefault();
            document.location.href=parsed.pathname;
            console.log('redirect');
            return false;
        }
     }
});


$(document).live('pagebeforeshow',function(e,data){
    var page = $.mobile.activePage;
    var pageid = page.attr('id');
    //console.log('pageid: '+pageid);
    if (wallet.storage==undefined || Object.keys(wallet.storage).length==0) {
        if (Object.keys(database).length!=0) {
            //console.log('setting first currency');
            wallet.setActiveStorage(database[Object.keys(database)[0]]);
        } else {
            //console.log('no currency defined'); 
            if (['addcurrency','addingcurrency'].indexOf(pageid) === -1) {
                //console.log('redirecting to addcurrency');
                /*
                console.log(page);
                var parsed = $.mobile.path.parseUrl(document.location.href);
                var target = parsed.hrefNoHash+'#addcurrency';
                console.log(target);
                e.preventDefault();
                document.location.href=target;
                */
                $.mobile.changePage('#addcurrency');
                return false;
            } 
            return;
        }
    };
});

$(document).live('pageshow',function(e,data) {
    if (wallet.storage==undefined || Object.keys(wallet.storage).length==0) return;
    
    var page = $.mobile.activePage;
    
    page.find('.currencyname').each(function(i,v) {
        $(v).text(wallet.currencyName.call(wallet));
    });
    
    page.find('.currencysum').each(function(i,v) {
        $(v).text(wallet.sumStoredCoins.call(wallet)/wallet.getCurrentCDDC().cdd.currency_divisor);
    });
    
    page.find('.currencyid').each(function(i,v) {
        $(v).text(quads(wallet.currencyId.call(wallet)));
    });
});


function makeCurrencyList() {
    var page = $('#currencies');
    var clist = $('#currencies #currencylist');
    clist.html('');
    for (name in database) {
        var storage = database[name];        
        var tmp = new oc.layer(api,storage);
        var cddc = tmp.getCurrentCDDC();
        var cname = cddc.cdd.currency_name;
        var amount = tmp.sumStoredCoins()/cddc.cdd.currency_divisor;
        clist.append("<li><a href='#currency' cid='"+name+"'><h3>"+cname+"</h3><p>You have <strong>"+amount+"</strong> "+cname+"</p></a></li>");
    }
    $('#currencies #currencylist a').on('click',function(e,data){
        var cid = $(this).attr('cid');
        wallet.setActiveStorage(database[cid]); 
    });
    clist.listview('refresh');
}



function serializeDB() {
    var out = {};
    for (name in database) {
        out[name] = wallet.serializeStorage(database[name]);
    }
    return JSON.stringify(out);
}

function deserializeDB(json) {
    var db = JSON.parse(json);
    var out = {};
    for (name in db) {
        out[name] = wallet.deserializeStorage(db[name]);    
    }
    return out;
}

function storeDB() {
    var json = serializeDB();
    localStorage['opencoin'] = json;
    //console.log('stored db');
}

function loadDB() {
    var json = localStorage['opencoin'];
    if (json == undefined) {
        database = {};
        storeDB();
    } else {
        database = deserializeDB(json);
    }
}

suite = oc.crypto.rsa_sha256_chaum86;
api = new oc.api(suite);

var activecurrencyid;
var response;

wallet = new oc.layer(api);
loadDB();

