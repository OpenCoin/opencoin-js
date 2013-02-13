

function interact(url,message,guihandler,print) {
    if (print == undefined) print = false;
    if (print) console.log(message);
    if (guihandler == undefined) guihandler = wallet.callHandler;
    $.post(url,message.toJson(),function(data) {
        var parsed = JSON.parse(data);
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
}

function pr(obj) {
    console.log(JSON.stringify(obj));    
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
                    $.mobile.changePage('#addingcurrency');  
                    var html = '';
                    for (var i=0; i < cdd_cid.length; i++) {
                        html+=cdd_cid[i];
                        if ((i+1)%4==0) html+=' ';
                    }
                    $('#cidarea').html(html);
                    $('#addingcurrency').data('r',r);
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
            makeCurrencyList();
            $.mobile.changePage('#currencies');
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
        console.log(cid);
        delete database[cid];
        storeDB();
        wallet.setActiveStorage({});
    });
    
    coinsound = document.createElement('audio');
    coinsound.setAttribute('src', 'coinsound.mp3');
    
    
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
        $('#sendmessage').html(m.toJson());
        $('#sendresult a.email').attr('href','mailto:?subject=Some '+wallet.currencyName()+' for you&body='+JSON.stringify(m.toData()));
    });
    
    $("#sendmessage, #receipt").focus(function() {
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
        console.log(data);
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
                $('#receipt').html(response.toJson());
                $('#receiveresult a.email').attr('href','mailto:?subject=Your receipt&body='+JSON.stringify(response.toData()));
            });
        });
    });

    $('#processreceipt .confirm').on('click',function(e,data) {
        var area = $('#receivedreceipt');
        var data = area.val();
        var parsed = JSON.parse(data);
        var message = wallet.parseData(parsed);
        wallet.callHandler(message);
        storeDB();
        area.val('');
        showAlert('Processed','The receipt is processed');
        return false;
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


$(document).bind('pagebeforechange',function(e,data){
    if (typeof data.toPage !== 'string') return;
    var parsed = $.mobile.path.parseUrl(data.toPage);
    if (parsed.hash != "" && ['#currencies','#addcurrency'].indexOf(parsed.hash) === -1 && wallet.storage == undefined) {
        if (0 && Object.keys(database).length) { //for development, turn off in real life
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


$(document).live('pageshow',function(e,data) {
    var page = $.mobile.activePage;
    page.find('.currencyname').each(function(i,v) {
        $(v).text(wallet.currencyName.call(wallet));
    });
    page.find('.currencysum').each(function(i,v) {
        $(v).text(wallet.sumStoredCoins.call(wallet)/wallet.getCurrentCDDC().cdd.currency_divisor);
    });
    page.find('.currencyid').each(function(i,v) {
        $(v).text(wallet.currencyId.call(wallet).substr(0,20)+'...');
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

