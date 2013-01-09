issuer_keydata = {'modulus':'50627820219869774840534863587014811269175028232047628519071590862595588659880326373570321832391367905095022692904368723070494008484969214316957188279155652278651718833989334392440029145157766561275408580411085909849634394981874535917349655299726547254564053932537532246064690142381334535190022716641846367601', 
          'public_exponent':'65537',
          'private_exponent':'2342242563844014180028101780609867826848019982598660446310100607220193551989824825131837218606445633584816345039993377303656527362046273979721595356247614189731625650586359912191221460315110551825131536281801580160766703515370733464284839788088479004626861588270785599409899702397806382050775837170006750817'};

issuer_private = new oc.c.RSAPrivateKey()
issuer_private.fromData(issuer_keydata);
issuer_public = issuer_private.getPublicKey();

suite = oc.crypto.rsa_sha256_chaum86;
api = new oc.api(suite);
console.log(api);
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
params.denominations=[1,2,3];
params.additional_info='';

var cddc = api.makeCDDC(issuer_private,params);
console.log('CDDC');
console.log(cddc.toJson());

params = {};
params.denomination = 1;
params.notBefore = new Date("2013-01-01");
params.notAfter = new Date("2013-06-30");
params.coins_expiry_date = new Date('2013-12-31');
var mkout = api.makeMKC(issuer_private,cddc,params);
mkc = mkout.mkc;
private_mintkey = mkout.private_mintkey;

console.log('MKC');
console.log(mkc.toJson());


//alice has cdd and mkc

blindout = api.makeBlind(cddc,mkc,'reference_1234');

r = blindout.r;
blind = blindout.blind;
blank = blindout.blank;

console.log('blank/token');
console.log(blank.toJson());

console.log('blind');
console.log(blind.toJson());

blindsignature = api.signBlind(private_mintkey,blind);

console.log('blindsignature');
console.log(blindsignature.toJson());

coin = api.makeCoin(blank,blindsignature,r,mkc);
console.log('coin');
console.log(coin.toJson());

