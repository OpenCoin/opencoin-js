oc.api = function opencoin_api (suite) {
    this.suite = suite;
    this.protocol_version='http://opencoin.org/1.0';

    this.dummy_keydata = {
        'modulus':'137627420215484234701721646622614134035680017820700550897128019440493435188877430084940366257362693308659242780499396454890049417770866301913797798227248721767947064584657744116247566520613710933458713694795183480467194587032719718416458430053454414857653438887583679573632870036023559424097873288353108344861',
        'private_exponent':'129531689614573397366326255644813302621816487360659342020826371238111468413061110668179168242223711349326346146352373134014164157901991813565927339507998774808028897511519697716430856191729346662107207826891008540344853653285790423370550900140303308237827533695719282831919524504925285881835557243854872803505',
        'public_exponent':'17'
    }

    this.createKeys = function (length) {
        return this.suite.createKeys(length);
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
        console.log(cdd);
        cddc.signature = this.suite.sign(privkey,cdd.toJson());
        return cddc;
    }

    this.makeMKC = function (issuer_privkey,cddc,params) {
        var mk = new oc.c.MintKey();        
        //here we would actually genereate a mintkey
        var mint_privkey = new oc.c.RSAPrivateKey();
        mint_privkey.fromData(this.dummy_keydata);
        mk.public_mint_key = mint_privkey.getPublicKey();
        mk.id = this.suite.hash(mk.public_mint_key.toJson());
        mk.issuer_id = this.suite.hash(issuer_privkey.getPublicKey().toJson());
        mk.cdd_serial = cddc.cdd.cdd_serial;
        mk.denomination = params.denomination;
        mk.sign_coins_not_before = params.notBefore;
        mk.sign_coins_not_after = params.notAfter;
        mk.coins_expiry_date = params.coins_expiry_date;
        var mkc = new oc.c.MintKeyCertificate();
        mkc.mint_key = mk;
        mkc.signature = this.suite.sign(issuer_privkey,mk.toJson());
        out = {}
        out.mkc = mkc;
        out.private_mintkey = mint_privkey;
        return out;

    };

    this.makeBlind = function(cddc,mkc,reference) {
        var out, serial, mk, pub, keylength, tmp, token,hash,hashnumber, blind;
        mk = mkc.mint_key;
        pub = mk.public_mint_key;
        console.log(mkc);
        //keylength = suite.guessKeyLength(pub);

        token = new oc.c.Blank();
        token.protocol_version = cddc.cdd.protocol_version;
        token.issuer_id = this.suite.hash(cddc.cdd.issuer_public_master_key.toJson());
        token.cdd_location = cddc.cdd.cdd_location;
        token.denomination = mk.denomination;
        token.mint_key_id = mk.id;
        token.serial = this.suite.getRandomNumber(128);
        
        hash = this.suite.hash(token.toJson());
        hashnumber = this.suite.s2b(hash,16);
        tmp = this.suite.blind(pub,hashnumber);
        
        blind = new oc.c.Blind();
        blind.reference = reference;
        blind.blinded_token_hash = tmp.blinded_token_hash;
        blind.mint_key_id = mk.id;

        out = {};
        out.blank = token;
        out.blind = blind;
        out.r = tmp.r;
        return out;
    }

    this.signBlind = function(mkpriv,blind) {
        var signature = this.suite.sign(mkpriv,blind.blinded_token_hash);
        
        var blindsignature = new oc.c.BlindSignature();
        blindsignature.reference = blind.reference;
        blindsignature.blind_signature = signature;
        
        return blindsignature;
    }

    this.makeCoin = function (blank,blindsignature,r,mkc) {
        var pub = mkc.mint_key.public_mint_key;
        var signature = this.suite.unblind(pub,blindsignature.blind_signature,r);

        var hash = this.suite.hash(blank.toJson());
        var hashnumber = this.suite.s2b(hash,16);

        if (!this.suite.verify(pub,hashnumber,signature)) throw 'verification failed';    
        
        var coin = new oc.c.Coin();
        coin.token = blank;
        coin.signature = signature;

        return coin;
    }
}
        


    /*
    
    storage
    =======          |from here on is the actual storage object
    {id(issuer_key): {
        'cdds': {serial:cddc,
                 ...},
        'mintkeys': {id:{'mkc':mkc,
                         'private_key':key},                         
                     ...,
                     'bydate':{date:[id,...],
                               ...},
                     'denominations':{denomination:id,
                                      ...},
                     },
        'private_key': key,
        'blanks':{tref:[blank,blank,...],
                  ...},
        'blinds':{reference:[[blinded_hash,secret],[],..],
                  ...},
        'coins':{denomination:[coin,...],
                 ...},
        'message_queue':{'next_id':id,
                         'id':message,
                         ...}
        },
     ...}
    
    requestCDDSerial
    responseCDDSerial
    requestCDD
    responseCDD
    requestMintKeys
    responseMintKeys
    requestValidation
    responseValidation
    requestRenewal
    responseRenewal
    requestInvalidation
    responseInvalidation
    requestResume
    sendCoins
    receivedCoins
   
    requestCDDSerial(storage) -> message
    responseCDDSerial(message,storage) -> message
    requestCDD(storage,serial) -> message
    responseCDD(message,storage) -> message
    requestMintKeys(storage,mintkeyids,denominations) -> message
    responseMintKeys(message,storage) -> message
    requestValidation(storage,authinfo,[denomination,...]) -> message, blanks
    responseValidation(message,storage) -> message
    requestRenewal(storage,coins) -> message //XXX
    responseRenewal(message,storage) -> message
    requestInvalidation(storage,authinfo,coins) -> message
    responseInvalidation(message,storage) -> message
    requestResume(storage,tref) -> message
    sendCoins(storage,subject,coins) -> message
    receivedCoins(message,status) -> message    


    What apis are more then just Container creation?
    requestCDDSerial
    responseCDDSerial
    requestCDD
    responseCDD
    requestMintKeys
    responseMintKeys
    requestValidation * -> makeBlind
    responseValidation * -> signBlind, unblindSignature
    requestRenewal * -> makeBlind
    responseRenewal * -> signBlind, applyBlindSignature(blank,blindsignature)
    requestInvalidation
    responseInvalidation
    requestResume
    sendCoins
    receivedCoins


    */
