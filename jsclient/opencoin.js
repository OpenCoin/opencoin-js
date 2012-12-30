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


////////////////// Containerbase //////////////////
function Container () {}
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
    out['type'] = this.getType();
    return out;
}

////////////////// Containers //////////////////
function RSAPublicKey(){}
RSAPublicKey.prototype = new Container();
RSAPublicKey.prototype.constructor = RSAPublicKey;
RSAPublicKey.prototype.fields = {'n': new Field(),
                                      'e': new Field()}

function CDD () {}
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

function SignedData () {}
SignedData.prototype = new Container();
SignedData.prototype.constructor = SignedData;
SignedData.prototype.fields = {'data':      new ContainerField(),
                               'signature': new Field()};
function CDDCertificate () {
    this.fields['data'] = new ContainerField(CDD);    
}
CDDCertificate.prototype = new SignedData();
CDDCertificate.prototype.constructor = CDDCertificate;

//////////////////////// Playground ///////////////////////////
data = {
  "protocol_version": "1.0",
  "cdd_location": "http://opencent.org",
  "issuer_public_master_key": {
    "n": "23",
    "e": "5",
    "type": "cdd"
  },
  "issuer_cipher_suite": "RSA2048-SHA512",
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
cdd.fromData(data);

signedcdd = new CDDCertificate();
signedcdd.data = cdd
signedcdd.signature = 'mysignature';
signeddata = signedcdd.toData();

cddd2 = new CDDCertificate();
cddd2.fromData(signeddata);



