/////////////////some preperation first

suite = oc.crypto.rsa_sha256_chaum86;
api = new oc.api(suite);
issuer_private = suite.makeKey();
issuer_public = issuer_private.getPublicKey();

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


var server = new oc.layer(api,newStorage());
server.storage.dsdb = {};
var alice = new oc.layer(api,newStorage());
var bob = new oc.layer(api,newStorage());


params = {};
params.cdd_location = 'http://opencent.org';
params.cdd_serial = 1;
params.cdd_signing_date = new Date("2012-12-30T11:46:00");
params.cdd_expiry_date = new Date("2014-12-31T23:59:59");
params.currency_name = 'OpenCent';
params.currency_divisor = 100;
params.validation_service = [[10,'http://opencent.org'],
                             [20,'http://opencent.com/validate']];
params.info_service =  [[10,'http://opencent.org']];
params.renewal_service =  [[10,'http://opencent.org']];
params.invalidation_service =  [[10,'http://opencent.org']];
params.denominations=[1,2,5];
params.additional_info='';

var cddc = api.makeCDDC(issuer_private,params);
server.addCDDC(cddc);


params = {};
params.denomination = 1;
params.notBefore = new Date("2013-01-01");
params.notAfter = new Date("2013-06-30");
params.coins_expiry_date = new Date('2013-12-31');
mkout = api.makeMKC(issuer_private,cddc,params);
mkc = mkout.mkc;
private_mintkey = mkout.private_mintkey;
server.addMKC(mkc,private_mintkey);

params = {};
params.denomination = 2;
params.notBefore = new Date("2013-01-01");
params.notAfter = new Date("2013-06-30");
params.coins_expiry_date = new Date('2013-12-31');
mkout2 = api.makeMKC(issuer_private,cddc,params);
mkc2 = mkout2.mkc;
private_mintkey2 = mkout2.private_mintkey;
server.addMKC(mkc2,private_mintkey2);

params = {};
params.denomination = 5;
params.notBefore = new Date("2013-01-01");
params.notAfter = new Date("2013-06-30");
params.coins_expiry_date = new Date('2013-12-31');
mkout3 = api.makeMKC(issuer_private,cddc,params);
mkc3 = mkout3.mkc;
private_mintkey3 = mkout3.private_mintkey;
server.addMKC(mkc3,private_mintkey3);

////////////////////////////// The real fun ////////////////////////////
m = alice.requestCDDSerial();
response = server.dispatch(m.toData());
alice.dispatch(response.toData());

m = alice.requestCDD(response.cdd_serial);
response = server.dispatch(m.toData());
alice.dispatch(response.toData());

console.log('---');
m = alice.requestMintKeys([mkc.mint_key.id]);
response = server.dispatch(m.toData());
alice.dispatch(response.toData());

console.log('denominations');
m = alice.requestMintKeys(undefined,[1]);
response = server.dispatch(m.toData());
alice.dispatch(response.toData());

console.log('nothing');
m = alice.requestMintKeys();
response = server.dispatch(m.toData());
alice.dispatch(response.toData());
pcontainer('foo',response);

//trigger request resume
m = alice.requestValidation('please delay',10);
response = server.dispatch(m.toData());
pcontainer('r',response);
try {
alice.dispatch(response.toData());
} catch (e if e=='delayed') {
    console.log('is delayed');    
}

//trigger validation
m = alice.requestValidation('testauth',10);
response = server.dispatch(m.toData());
pcontainer('r',response);
alice.dispatch(response.toData());


//setup bob
m = bob.requestCDD(1);
response = server.dispatch(m.toData());
bob.dispatch(response.toData());

m = bob.requestMintKeys();
response = server.dispatch(m.toData());
bob.dispatch(response.toData());


//send coins
m = alice.requestSendCoins(3,'payment 1');



// not using dispatcher, -> bob parses data into the message object
m2 = bob.requestRenewal(m.coins);
response2 = server.dispatch(m2.toData());
bob.dispatch(response2.toData());

//bob is cool, can now confirm the coins

response = bob.responseSendCoins(m.toData())
alice.dispatch(response.toData());

//alice refreshes, to be on the safe side again
m = alice.requestRenewal();
response = server.dispatch(m.toData());
alice.dispatch(response.toData());


console.log('---');
console.log(server.storage);
console.log(alice.storage);
console.log(bob.storage);
//pcontainer('Server Layer storage',server);
pcontainer('Client Layer storage',alice);

