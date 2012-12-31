//////////////////////// Playground ///////////////////////////


cdd = new oc.c.CDD();
cdd.protocol_version = 'http://opencoin.org/1.0';
cdd.cdd_location = 'http://opencent.org';
cdd.issuer_public_master_key =  new oc.c.RSAPublicKey();
cdd.issuer_public_master_key.modulus = 23;
cdd.issuer_public_master_key.public_exponent = 5;
cdd.issuer_cipher_suite = 'RSA2048-SHA512-CHAUM86';
cdd.cdd_serial = 1;
cdd.cdd_signing_date = new Date("2012-12-30T11:46:00");
cdd.cdd_expiry_date = new Date("2014-12-31T23:59:59");
cdd.currency_name = 'OpenCent';
cdd.currency_divisor = 100;
cdd.validation_service = [[10,'http://opencent.org'],
                          [20,'http://opencent.com/validate']];
cdd.info_service =  [[10,'http://opencent.org']];
cdd.renewal_service =  [[10,'http://opencent.org']];
cdd.invalidation_service =  [[10,'http://opencent.org']];
cdd.denominations=[1,2,3];
cdd.additional_info='';
json1 = cdd.toJson();
bc1 = cdd.bencode();


cddc = new oc.c.CDDCertificate();
cddc.cdd = cdd
cddc.signature = 'mysignature';

console.log(cdd.toJson());
console.log(cdd.bencode());
console.log(cddc.toJson());

mk = new oc.c.MintKey();
mk.id = '1234';
mk.issuer_id = 'abcd';
mk.cdd_serial = 1;
mk.public_mint_key = new oc.c.RSAPublicKey();
mk.public_mint_key.public_exponent = 5;
mk.public_mint_key.modulus = 23;
mk.denomination = 1;
mk.sign_coins_not_before =  new Date("2012-12-30T11:46:00");
mk.sign_coins_not_after =  new Date("2013-12-30T11:46:00");
mk.coins_expiry_date =  new Date("2014-12-30T11:46:00");
console.log(mk.toJson());

mkc = new oc.c.MintKeyCertificate();
mkc.mint_key = mk;
mkc.signature = 'my signature';

console.log(mkc.toJson());

blank = new oc.c.Blank();
blank.protocol_version = 'http://opencoin.org/1.0';
blank.issuer_id = 'abcd';
blank.cdd_location = 'http://opencent.org';
blank.denomination = 1;
blank.mint_key_id = '1234';
blank.serial = '789abc';

console.log(blank.toJson());

blind = new oc.c.Blind();
blind.reference = 'b1';
blind.blinded_token_hash = 'aaabbbccc';
blind.mint_key_id = '1234';

console.log(blind.toJson());

bsignature = new oc.c.BlindSignature();
bsignature.reference = 'b1';
bsignature.blind_signature = 'xxx123';

//console.log(bsignature.toJson());

coin = new oc.c.Coin();
coin.token = blank;
coin.signature = 'yyy345';
console.log(coin.toJson());

//messages
requestcddserial = new oc.c.RequestCDDSerial();
requestcddserial.message_reference = 1;
console.log(requestcddserial.toJson());

responsecddserial = new oc.c.ResponseCDDSerial();
responsecddserial.message_reference = 1;
responsecddserial.status_code = 200;
responsecddserial.status_description = 'ok';
responsecddserial.serial = 1;
console.log(responsecddserial.toJson());

rqcdd = new oc.c.RequestCDD();
rqcdd.message_reference = 2;
rqcdd.cdd_serial = 1;
console.log(rqcdd.toJson());

rscdd = new oc.c.ResponseCDD();
rscdd.message_reference = 2;
rscdd.status_code = 200;
rscdd.status_description = 'ok';
rscdd.cdd = cdd;
console.log(rscdd.toJson());

rqmk = new oc.c.RequestMintKeys();
rqmk.message_reference = 3;
rqmk.mint_key_ids = [1234];
console.log(rqmk.toJson())

rqmk2 = new oc.c.RequestMintKeys();
rqmk2.message_reference = 3;
rqmk2.denominations = [1,2];
console.log(rqmk2.toJson())

rsmk = new oc.c.ResponseMintKeys();
rsmk.message_reference = 3;
rsmk.status_code = 200;
rsmk.status_description = 'ok';
rsmk.keys = [mkc];
console.log(rsmk.toJson());

rqv = new oc.c.RequestValidation();
rqv.message_reference = 4;
rqv.transaction_reference = 111222333;
rqv.authorization_info = 'mysecret';
rqv.tokens = [blank];
console.log(rqv.toJson());

rsv = new oc.c.ResponseValidation();
rsv.message_reference = 4;
rsv.status_code = 300;
rsv.status_description = 'come back later';
rsv.retry_after = new Date("2013-01-01T00:00:01");
console.log(rsv.toJson());

rsv2 = new oc.c.ResponseValidation();
rsv2.message_reference = 4;
rsv2.status_code = 200;
rsv2.status_description = 'ok';
rsv2.blind_signatures = [bsignature];
console.log(rsv2.toJson());

rqrn = new oc.c.RequestRenewal();
rqrn.message_reference = 5;
rqrn.transaction_reference = 444555666;
rqrn.coins = [coin];
rqrn.tokens = [blank];
console.log(rqrn.toJson());

rsrn = new oc.c.ResponseRenewal();
rsrn.message_reference = 5;
rsrn.status_code = 300;
rsrn.status_description = 'come back later';
rsrn.retry_after = new Date("2013-01-01T00:00:01");
console.log(rsrn.toJson());

rsrn2 = new oc.c.ResponseRenewal();
rsrn2.message_reference = 5;
rsrn2.status_code = 200;
rsrn2.status_description = 'ok';
rsrn2.blind_signatures = [bsignature];
console.log(rsrn2.toJson());

rqiv = new oc.c.RequestInvalidation();
rqiv.message_reference = 6;
rqiv.transaction_reference = 777888999;
rqiv.authorization_info = 'myaccount';
rqiv.coins = [coin];
console.log(rqiv.toJson());

rsiv = new oc.c.ResponseInvalidation();
rsiv.message_reference = 6;
rsiv.status_code = 200;
rsiv.status_description = 'ok';
console.log(rsiv.toJson());

rqr = new oc.c.RequestResume();
rqr.message_reference = 7;
rqr.transaction_reference = 444555666;
console.log(rqr.toJson());

rqsc = new oc.c.SendCoins();
rqsc.message_reference = 8;
rqsc.subject = 'Payment for foobar';
rqsc.coins = [coin];
console.log(rqsc.toJson());

rsrc = new oc.c.ReceivedCoins();
rsrc.messge_reference = 8;
rsrc.status_code = 200;
rsrc.status_description = 'ok';
