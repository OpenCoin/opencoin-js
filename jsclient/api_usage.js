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

params = {};
params.denomination = 1;
params.notBefore = new Date("2013-01-01");
params.notAfter = new Date("2013-06-30");
params.coins_expiry_date = new Date('2013-12-31');

var mkout = api.makeMKC(issuer_private,cddc,params);
var mkc = mkout.mkc;
var private_mintkey = mkout.private_mintkey;



//alice has cdd and mkc

requestcddserial = new oc.c.RequestCDDSerial();
requestcddserial.message_reference = 1;
pcontainer('Message: Request CDD Serial',requestcddserial);

responsecddserial = new oc.c.ResponseCDDSerial();
responsecddserial.message_reference = 1;
responsecddserial.status_code = 200;
responsecddserial.status_description = 'ok';
responsecddserial.serial = 1;
pcontainer('Message: Response CDD Serial',responsecddserial);

rqcdd = new oc.c.RequestCDD();
rqcdd.message_reference = 2;
rqcdd.cdd_serial = 1;
pcontainer('Message: Request CDD',rqcdd);

rscdd = new oc.c.ResponseCDD();
rscdd.message_reference = 2;
rscdd.status_code = 200;
rscdd.status_description = 'ok';
rscdd.cdd = cddc;
pcontainer('Message: Response CDD',rscdd);

rqmk = new oc.c.RequestMintKeys();
rqmk.message_reference = 3;
rqmk.mint_key_ids = ["0e7e7fef1972c42e658e16fd3f9c2fed9b994278d3552007a42a74e85bbd8c73"];
pcontainer('Message: Request MintKeys (by id)',rqmk);

rqmk2 = new oc.c.RequestMintKeys();
rqmk2.message_reference = 3;
rqmk2.denominations = [1];
pcontainer('Message: Request MintKeys (by denomination)',rqmk2);

rsmk = new oc.c.ResponseMintKeys();
rsmk.message_reference = 3;
rsmk.status_code = 200;
rsmk.status_description = 'ok';
rsmk.keys = [mkc];
pcontainer('Message: Response MintKeys',rsmk);


var blindout = api.makeBlind(cddc,mkc,'reference_1234');

var r = blindout.r;
var blind = blindout.blind;
var blank = blindout.blank;

var tref = this.suite.b2s(this.suite.getRandomNumber(128));

rqv = new oc.c.RequestValidation();
rqv.message_reference = 4;
rqv.transaction_reference = tref;
rqv.authorization_info = 'mysecret';
rqv.tokens = [blind];
pcontainer('Message: Request validation',rqv);


rsv = new oc.c.ResponseValidation();
rsv.message_reference = 4;
rsv.status_code = 300;
rsv.status_description = 'come back later';
rsv.retry_after = new Date("2013-01-01T00:00:01");
pcontainer('Message: Response validation - delayed',rsv);

var blindsignature = api.signBlind(private_mintkey,blind);

rsv2 = new oc.c.ResponseValidation();
rsv2.message_reference = 4;
rsv2.status_code = 200;
rsv2.status_description = 'ok';
rsv2.blind_signatures = [blindsignature];
pcontainer('Message: Response validation - signatures',rsv2);

var coin = api.makeCoin(blank,blindsignature,r,mkc);


var blindout2 = api.makeBlind(cddc,mkc,'reference_5678');
var r2 = blindout2.r;
var blind2 = blindout2.blind;
var blank2 = blindout2.blank;

var tref2 = this.suite.b2s(this.suite.getRandomNumber(128));
rqrn = new oc.c.RequestRenewal();
rqrn.message_reference = 5;
rqrn.transaction_reference = tref2;
rqrn.coins = [coin];
rqrn.tokens = [blank2];
pcontainer('Message: Request renewal',rqrn);

rsrn = new oc.c.ResponseRenewal();
rsrn.message_reference = 5;
rsrn.status_code = 300;
rsrn.status_description = 'come back later';
rsrn.retry_after = new Date("2013-01-01T00:00:01");
pcontainer('Message: Response renewal - delayed',rsrn);

var blindsignature2 = api.signBlind(private_mintkey,blind2);

rsrn2 = new oc.c.ResponseRenewal();
rsrn2.message_reference = 5;
rsrn2.status_code = 200;
rsrn2.status_description = 'ok';
rsrn2.blind_signatures = [blindsignature2];
pcontainer('Message: Response renewal - signatures',rsrn2);

var coin2 = api.makeCoin(blank2,blindsignature2,r2,mkc);

rqsc = new oc.c.SendCoins();
rqsc.message_reference = 8;
rqsc.subject = 'Payment for foobar';
rqsc.coins = [coin2];
pcontainer('Message: send coins',rqsc);

rsrc = new oc.c.ReceivedCoins();
rsrc.messge_reference = 8;
rsrc.status_code = 200;
rsrc.status_description = 'ok';
pcontainer('Message: received coins',rsrc);

var tref3 = this.suite.b2s(this.suite.getRandomNumber(128));
rqiv = new oc.c.RequestInvalidation();
rqiv.message_reference = 6;
rqiv.transaction_reference = tref3;
rqiv.authorization_info = 'myaccount';
rqiv.coins = [coin2];
pcontainer('Message: Request invalidation',rqiv);

rsiv = new oc.c.ResponseInvalidation();
rsiv.message_reference = 6;
rsiv.status_code = 200;
rsiv.status_description = 'ok';
pcontainer('Message: Response invalidation',rsiv);

rqr = new oc.c.RequestResume();
rqr.message_reference = 7;
rqr.transaction_reference = tref3;
pcontainer('Message: Request resume',rqr);
