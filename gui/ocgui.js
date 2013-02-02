suite = oc.crypto.rsa_sha256_chaum86;
api = new oc.api(suite);

var database = {};
var activecurrencyid;
var response;

wallet = new oc.layer(api);



function interact(url,message,guihandler,print) {
    if (print == undefined) print = false;
    if (print) console.log(message);
    $.post(url,message.toJson(),function(data) {
        var parsed = JSON.parse(data);
        var reply = wallet.parseData(parsed);
        //var out = wallet.callHandler(reply);
        guihandler(reply);
        if (print) console.log(reply);
        response = reply;            
    }).fail(function(){console.log('fail on post')});
}

function showError(text) {
    $.mobile.changePage('#error',{'role':'dialog'});
    $('#errormessage').html(text);
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
                if (cdd_cid.indexOf(cid) != 0) {
                    showError('The currency id does not match')
                } else {
                    $.mobile.changePage('#addingcurrency');  
                    $('#cidarea').html(cdd_cid);
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
        var url = cddc.cdd.info_service[0][1];
        interact(url,wallet.requestMintKeys(),function(r){
            wallet.callHandler(r);   
            var cdd_cid = wallet.api.getKeyId(cddc.cdd.issuer_public_master_key);
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

});

$('#currencies').live('pageinit',function (e,data) {
    makeCurrencyList();
});

function makeCurrencyList() {
    console.log('make currency list');
    var page = $('#currencies');
    var clist = $('#currencies #currencylist');
    clist.html('');
    for (name in database) {
        var storage = database[name];        
        var tmp = new oc.layer(api,storage);
        var cddc = tmp.getCurrentCDDC();
        var cname = cddc.cdd.currency_name;
        clist.append("<li><a href='#currency'>"+cname+"</a></li>");

    }
    clist.listview('refresh');
}
