////////////////// Field validators //////////////////

function Field() {}
Field.prototype.fromData = function (data,master) {
    return data;
}
Field.prototype.toData = function (data,master) {
    return data;
}

//-----------------------------------

function PublicKeyField(){}
PublicKeyField.prototype.fromData = function(data,master) {
    ciphersuite = master['issuer_cipher_suite'];
    //fetch appropriate key module
    var key = new RSAPublicKey()
    key.fromData(data);
    return key;
}
PublicKeyField.prototype.toData = function(data,master) {
    //we know data is a container
    return data.toData(null,master);
}

//-----------------------------------

function DateField(){}
DateField.prototype.fromData = function(data,master) {
    return new Date(data);    
}
DateField.prototype.toData = function(data,master) {
    return data.toISOString();    
}

//-----------------------------------

function ListField(fields){
    this.fields = fields;
}
ListField.prototype.fromData = function(data,master) {
    var out = [];
    for (i in data) {
        var datarow = data[i];
        var outrow = [];
        for (j in this.fields) {
            var field = this.fields[j];
            outrow[j] = field.fromData(datarow[j],master);
        }    
        out[i]=outrow;
    }
    return out;
}
ListField.prototype.toData = function(data,master) {
    return data;    
}

//-----------------------------------

function ValuesField(field){
    this.field = field
}
ValuesField.prototype.fromData = function(data,master) {
    var out = [];
    for (i in data) {
        out[i] = this.field.fromData(data[i],master);
    }
    return out;
}
ValuesField.prototype.toData = function(data,master) {
    var out = [];
    for (i in data) {
        out[i] = this.field.fromData(data[i],master);
    }
    return out;    
}

//-----------------------------------

function ContainerField(klass){
    this.klass = klass;    
}
ContainerField.prototype.fromData = function(data,master) {
    obj = new this.klass();
    obj.fromData(data,master);
    return obj;
}
ContainerField.prototype.toData = function(data,master) {
    return data.toData(null,master);     
}


//-----------------------------------

function Base64Field() {}
Base64Field.prototype.fromData = function (data,master) {
    return atob(data);
}
Base64Field.prototype.toData = function (data,master) {
    return btoa(data);
}



////////////////// Containerbase //////////////////
function Container () {
    this.type = 'Container';
}
Container.prototype.fields = {}
Container.prototype.getType = function() {
    return this.constructor.name.toLowerCase();
}
Container.prototype.fromData = function (data,master) {
    if (master==undefined) var master = this;
    for (name in this.fields) {
        this[name] = this.fields[name].fromData(data[name],master);
    }
    return this;
}
Container.prototype.toData = function(ignored,master) {
    var out = {}
    if (master==undefined) var master = this;
    for (name in this.fields) {
        out[name] = this.fields[name].toData(this[name],master);    
    } 
    out['type'] = this.type;
    return out;
}

function bencode(data) {
    var type = typeof(data);
    if (type=='string') {
        return data.length+':'+data;
    } else if (type=='number') {
        return 'i'+data+'e';    
    } else if (Array.isArray(data)) {
        var out = 'l';
        for (i in data) {
            out += bencode(data[i])    
        }
        out += 'e';
        return out;
    } else { //must be an object then    
        var out = 'd';
        var keys = Object.keys(data);
        keys.sort()
        for (i in keys) {
            var key = keys[i];
            out += bencode(key);
            out += bencode(data[key]);
        }
        out += 'e';
        return out;
    }
}
Container.prototype.bencode = function () {
    return bencode(this.toData(null,this));    
}

Container.prototype.toJson = function () {
    return JSON.stringify(this.toData(),null,4);    
}

Container.prototype.fromJson = function (jsonstring) {
    return this.fromData(JSON.parse(jsonstring));    
}

////////////////// Containers //////////////////

function RSAPublicKey(){
    this.type = 'RSA Public Key';    
}
RSAPublicKey.prototype = new Container();
RSAPublicKey.prototype.constructor = RSAPublicKey;
RSAPublicKey.prototype.fields = {'modulus': new Base64Field(),
                                 'public_exponent': new Base64Field()}

//-----------------------------------

function CDD () {
    this.type='cdd';
}
CDD.prototype = new Container();
CDD.prototype.constructor = CDD;
CDD.prototype.fields = {'protocol_version':         new Field(),
                        'cdd_location':             new Field(),
                        'issuer_cipher_suite':      new Field(),
                        'issuer_public_master_key': new PublicKeyField(),
                        'cdd_serial':               new Field(),
                        'cdd_signing_date':         new DateField(),
                        'cdd_expiry_date':          new DateField(),
                        'currency_name':            new Field(),
                        'currency_divisor':         new Field(),
                        'info_service':             new ListField([new Field(),
                                                                   new Field()]),
                        'validation_service':       new ListField([new Field(),
                                                                   new Field()]),
                        'renewal_service':          new ListField([new Field(),
                                                                   new Field()]),
                        'invalidation_service':     new ListField([new Field(),
                                                                   new Field()]),
                        'denominations':            new ValuesField(new Field()),
                        'additional_info':          new Field()
                       }

//-----------------------------------

function CDDCertificate () {
    this.type='cdd certificate';   
}
CDDCertificate.prototype = new Container();
CDDCertificate.prototype.constructor = CDDCertificate;
CDDCertificate.prototype.fields = {'cdd':      new ContainerField(CDD),
                                   'signature': new Field()};

//-----------------------------------

function MintKey () {
    this.type = 'mint key';
}
MintKey.prototype = new Container();
MintKey.prototype.constructor = MintKey;
MintKey.prototype.fields = {'id':                       new Field(),
                            'issuer_id':                new Field(),
                            'cdd_serial':               new Field(),
                            'public_mint_key':          new PublicKeyField(),
                            'denomination':             new Field(),
                            'sign_coins_not_before':    new DateField(),
                            'sign_coins_not_after':     new DateField(),
                            'coins_expiry_date':        new DateField()
                           }

//-----------------------------------

function MintKeyCertificate () {
    this.type='mint key certificate';   
}
MintKeyCertificate.prototype = new Container();
MintKeyCertificate.prototype.constructor = MintKeyCertificate;
MintKeyCertificate.prototype.fields = {'mint_key':  new ContainerField(MintKey),
                                       'signature': new Field()};

//-----------------------------------

function Blank () {
    this.type = 'token' //XXX Really?
}
Blank.prototype = new Container();
Blank.prototype.constructor = Blank;
Blank.prototype.fields = {'protocol_version':   new Field(),
                          'issuer_id':          new Field(),
                          'cdd_location':       new Field(),
                          'denomination':       new Field(),
                          'mint_key_id':        new Field(),
                          'serial':             new Field()
                         }

//-----------------------------------

function Blind () {
    this.type = 'blinded token hash';
}
Blind.prototype = new Container();
Blind.prototype.constructor = Blind;
Blind.prototype.fields = {'reference':          new Field(),
                          'blinded_token_hash': new Field(),
                          'mint_key_id':        new Field()
                         }

//-----------------------------------

function BlindSignature () {
    this.type = 'blind signature';
}
BlindSignature.prototype = new Container();
BlindSignature.prototype.constructor = BlindSignature;
BlindSignature.prototype.fields = {'reference':          new Field(),
                                   'blind_signature': new Field()
                                  }

//-----------------------------------

function Coin () {
    this.type = 'coin'    
}                     
Coin.prototype = new Container();
Coin.prototype.constructor = Coin;
Coin.prototype.fields = {'token':        new ContainerField(Blank),
                         'signature':    new Field()
                        }




//////////////////////// Playground ///////////////////////////
cdd = new CDD();
cdd.protocol_version = 'http://opencoin.org/1.0';
cdd.cdd_location = 'http://opencent.org';
cdd.issuer_public_master_key =  new RSAPublicKey();
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


cddc = new CDDCertificate();
cddc.cdd = cdd
cddc.signature = 'mysignature';

//console.log(cdd.toJson());
//console.log(cdd.bencode());
//console.log(cddc.toJson());

mk = new MintKey();
mk.id = '1234';
mk.issuer_id = 'abcd';
mk.cdd_serial = 1;
mk.public_mint_key = new RSAPublicKey();
mk.public_mint_key.public_exponent = 5;
mk.public_mint_key.modulus = 23;
mk.denomination = 1;
mk.sign_coins_not_before =  new Date("2012-12-30T11:46:00");
mk.sign_coins_not_after =  new Date("2013-12-30T11:46:00");
mk.coins_expiry_date =  new Date("2014-12-30T11:46:00");
//console.log(mk.toJson());

mkc = new MintKeyCertificate();
mkc.mint_key = mk;
mkc.signature = 'my signature';

//console.log(mkc.toJson());

blank = new Blank();
blank.protocol_version = 'http://opencoin.org/1.0';
blank.issuer_id = 'abcd';
blank.cdd_location = 'http://opencent.org';
blank.denomination = 1;
blank.mint_key_id = '1234';
blank.serial = '789abc';

//console.log(blank.toJson());

blind = new Blind();
blind.reference = 'b1';
blind.blinded_token_hash = 'aaabbbccc';
blind.mint_key_id = '1234';

//console.log(blind.toJson());

bsignature = new BlindSignature();
bsignature.reference = 'b1';
bsignature.blind_signature = 'xxx123';

//console.log(bsignature.toJson());

coin = new Coin();
coin.token = blank;
coin.signature = 'yyy345';

console.log(coin.toJson());
