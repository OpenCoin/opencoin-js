//////////////////////// Fields ///////////////////////////
function Field(name,dv) {
    this.name = name;
    this.dv = dv;
}

Field.prototype.get = function (obj) {
    var value =  obj[this.name] || this.dv;
    return value;
}

Field.prototype.set = function (obj,value) {
    obj[this.name] = value; 
}


function SubitemsField(name,fields) {
    this.name = name;    
    this.fields = fields;
    this.dv = {};
} 
SubitemsField.prototype = new Field();
SubitemsField.prototype.constructor = SubitemsField;

SubitemsField.prototype.get = function(obj) {
    var out = {};
    var subobj = obj[this.name] || {};
    for (i in this.fields) {
        var field = this.fields[i];
        var name = field.name;
        out[name] = field.get(subobj);
    }   
    return out;
}

SubitemsField.prototype.set = function(obj,data) {
    var newobj = {};
    for (i in this.fields) {
        var field = this.fields[i];
        var name = field.name;
        if (data[name] != undefined) {
            field.set(newobj,data[name]);
        } else {
            newobj[name]=this.dv;    
        }
    }
    obj[this.name] = newobj;
}

function DateField(name,dv){
    this.name = name;
    this.dv = dv;
}

DateField.prototype = new Field();
DateField.prototype.constructor = DateField;


//////////////////////// Container ///////////////////////////
function Container() {
}

Container.prototype.fromData = function(data) {
    for (i in this.fields ) {
        var field = this.fields[i];
        var name = field.name;
        if (data[name] != undefined) {
            field.set(this,data[field.name]);
        } else {
            this[name]=field.dv;    
        }
    }
}

Container.prototype.toData = function() {
    var out = {};
    for (i in this.fields) {
        var field = this.fields[i];
        var name = field.name;
        var value = field.get(this);
        out[name] = value;
    }   
    out['type'] = this.constructor.name.toLowerCase();
    return out;
}


function CDD () {
}

CDD.prototype = new Container();
CDD.prototype.constructor = CDD;

CDD.prototype.fields=[new Field('protocol_version','1.0'),
                      new Field('cdd_location',''),
                      new SubitemsField('issuer_public_master_key',[
                          new Field('n',''),
                          new Field('e','')]),
                      new Field('issuer_cipher_suite',''),
                      new Field('cdd_serial',''),
                      new DateField('cdd_signing_date',''),
                      new DateField('cdd_expiry_date',''),
                      new Field('currency_name',''),
                      new Field('currency_divisor',100),
                      new Field('info_service',''),
                      new Field('validation_service',''),
                      new Field('renewal_service',''),
                      new Field('invalidation_service',''),
                      new Field('denominations',[1,2,3]),
                      new Field('additional_info','')];

//////////////////////// Playground ///////////////////////////
var c = new Container();
c.fields=[new Field('first',''),
          new Field('last',''),
          new SubitemsField('address',[
              new Field('zipcode',''),
              new Field('town','')])
          ];
data = {'first':'Joerg',
        'address':{'town':'Bielefeld',
                   'zipcode':33615}};
c.fromData(data);

c2 = new CDD();
data = {
  "protocol_version": "1.0",
  "cdd_location": "http://opencent.org",
  "issuer_public_master_key": {
    "n": "1",
    "e": "2"
  },
  "issuer_cipher_suite": "",
  "cdd_serial": "",
  "cdd_signing_date": "",
  "cdd_expiry_date": "",
  "currency_name": "",
  "currency_divisor": 100,
  "info_service": "",
  "validation_service": "",
  "renewal_service": "",
  "invalidation_service": "",
  "denominations": [1,2,3],
  "additional_info": "",
  "type": "cdd"
}
c2.fromData(data)

data2 = c2.toData();
console.log(data);
console.log(data2);




jd = JSON.stringify(data,null,'  ');
console.log(jd);
/*

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        var F = function () {};
        F.prototype = o;
        return new F();
    };
}


var CDD = {type:'cdd',
           fields:['protocol_version',
                   'cdd_location',
                   'issuer_public_master_key',
                   'issuer_cipher_suite',
                   'cdd_serial',
                   'cdd_signing_date',
                   'cdd_expiry_date',
                   'currency_name',
                   'currency_divisor',
                   'info_service',
                   'validation_service',
                   'renewal_service',
                   'invalidation_service',
                   'denominations',
                   'additional_info']}
CDD.fields.sort();                   

var containers = {'cdd':CDD}

function toJson(obj) {
    out = {'type':obj.type}
    for (i in obj.fields) {
        field = obj.fields[i]
        out[field]=obj[field]
    }
    return JSON.stringify(out,null,' ');    
}

function toObj(data) {
    type = data.type;
    obj = Object.create(containers[type]);

    for (i in obj.fields) {
        field = obj.fields[i];
        obj[field]=data[field];
    }
    return obj        
}

function fromJson(json) {
    return toObj(JSON.parse(json));
}

function encodeBencode(o) {
    fields = containers[obj.type].fields; //already sorted        
        



}

testcdd = Object.create(CDD);
testcdd.protocol_version='1';
testcdd.cdd_location='http://opencent.org/issuer';
testcdd.issuer_public_master_key={'n':1,'p':1,'q':1};
testcdd.issuer_cipher_suite='sha123-rsa';
testcdd.cdd_serial=1;
testcdd.signing_date='2012-12-05T13:00';
testcdd.cdd_expiry_date='2013-12-05T13:00';
testcdd.currency_name='OpenCent';
testcdd.currency_divisor=1;
testcdd.validation_service=[[10,'http://opencent.org/issuer']];
testcdd.invalidation_service=[[10,'http://opencent.org/issue']];
testcdd.renewal_service=[[10,'http://opencent.org/issuer']];
testcdd.info_service=[[10,'http://opencent.org/info']];
testcdd.denominations=[1,2,5,10,20,50,100,200,500,1000,2000,5000,10000];
testcdd.additional_info='';
testjson = toJson(testcdd);
console.log(testjson);
data = JSON.parse(testjson);
console.log(data['issuer_public_master_key']);
test2 = toObj(data);
test3 = fromJson(testjson);
console.log(data);

*/
