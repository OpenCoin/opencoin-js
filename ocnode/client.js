
suite = oc.crypto.rsa_sha256_chaum86;
api = new oc.api(suite);

function newStorage() {
    return {
        'message_queue':{'next_id':0},
        'cddcs':{},
        'mintkeys':{'denominations':{}},
        'validation':{},
        'private_keys':{},
        'coins':{},
    } 
}

function Tempcontainer (data) {
    this.data = data;
    this.toJson = function() {
        return this.data;;    
    }
}

var response;
$.ajaxSetup({async:false});

function interact(client,m,print) {
    if (print == undefined) print = true;
    if (print) pcontainer(client.name+': '+m.type,m);
    $.post('http://localhost:6789/',m.toJson(),function(data) {
        var parsed = JSON.parse(data);
        var reply = client.parseData(parsed);
        var out = client.callHandler(reply);
        if (print) pcontainer(client.name+': '+reply.type,reply);
        response = reply;
    }).fail(function(){console.log('fail on post')});
}





var alice = new oc.layer(api,newStorage());
alice.name = 'Alice';
var bob = new oc.layer(api,newStorage());
bob.name = 'Bob';
interact(alice,alice.requestCDDSerial());
interact(alice,alice.requestCDD(response.cdd_serial));
interact(alice,alice.requestMintKeys());
interact(alice,alice.requestValidation('testauth',10));

interact(bob,bob.requestCDDSerial());
interact(bob,bob.requestCDD(response.cdd_serial));
interact(bob,bob.requestMintKeys());

m = alice.requestSendCoins(5,'payment 1');
pcontainer('Alice: Send Coins',m);

interact(bob,bob.requestRenewal(m.coins));

r = bob.responseSendCoins(m.toData());
alice.dispatch(r.toData());
pcontainer('Alice: Received Coins',response);

interact(alice,alice.requestRenewal());
interact(bob,bob.requestInvalidation(3,'my account'));


