////////////////// Field validators //////////////////

function Field() {}
Field.prototype.fromData = function (data,master) {
    return data;
}
Field.prototype.toData = function (data,master) {
    return data;
}


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

function DateField(){}
DateField.prototype.fromData = function(data,master) {
    return new Date(data);    
}
DateField.prototype.toData = function(data,master) {
    return data.toISOString();    
}

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
    return data;    
}

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
    return JSON.stringify(this.toData(),null,2);    
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
RSAPublicKey.prototype.fields = {'n': new Base64Field(),
                                 'e': new Base64Field()}

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

function SignedData () {
    this.type='signed data';    
}
SignedData.prototype = new Container();
SignedData.prototype.constructor = SignedData;
SignedData.prototype.fields = {'data':      new ContainerField(),
                               'signature': new Field()};
function CDDCertificate () {
    this.type='cdd certificate';   
    this.fields['data'] = new ContainerField(CDD);
}
CDDCertificate.prototype = new SignedData();
CDDCertificate.prototype.constructor = CDDCertificate;

//////////////////////// Playground ///////////////////////////
data = {
  "protocol_version": "1.0",
  "cdd_location": "http://opencent.org",
  "issuer_public_master_key": {
    "n": "MjM=", //23
    "e": "NQ==", //5
  },
  "issuer_cipher_suite": "RSA2048-SHA512-CHAUM86",
  "cdd_serial": 1,
  "cdd_signing_date": "2012-12-30T11:46:00",
  "cdd_expiry_date": "2014-12-31T23:59:59",
  "currency_name": "OpenCent",
  "currency_divisor": 100,
  "info_service": [[10,'http://opencent.org']],
  "validation_service": [[10,'http://opencent.org'],
                         [20,'http://opencent.com/validate']],
  "renewal_service": [[10,'http://opencent.org']],
  "invalidation_service": [[10,'http://opencent.org']],
  "denominations": [
    1,
    2,
    3
  ],
  "additional_info": "",
  "type": "cdd"
}

cdd = new CDD();
cdd.protocol_version = '1.0';
cdd.cdd_location = 'http://opencent.org';
cdd.issuer_public_master_key = new RSAPublicKey();
cdd.issuer_public_master_key.n = 23;
cdd.issuer_public_master_key.e = 5;
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


cdd2 = new CDD();
cdd2.fromData(data);
json2 = cdd2.toJson();
bc2 = cdd.bencode();

console.log(bc1 == bc2);
console.log(json1 == json2);

cddc1 = new CDDCertificate();
cddc1.data = cdd2
cddc1.signature = 'mysignature';
cddc1data = cddc1.toData();

cddc2 = new CDDCertificate();
cddc2.fromData(cddc1data);
json3 = cddc2.data.toJson();
bc3 = cddc2.data.bencode();
console.log(json1 == json2 && json2 == json3);
console.log(bc1 == bc2 && bc2 == bc3);
