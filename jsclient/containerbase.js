oc = new function OpenCoin() {
    this.c = {}; //containers
    this.f = {}; //fields
    this.registry = {}; //comined registry using types as key

    this.addContainer = function(name,type,prototype) {
        if (this.c[name]!=undefined) {
            throw 'Container already exists';  
        }
        
        if (prototype==undefined) {
            prototype = this.c.Container;
        }

        container = function () {
            this.type = type;    
            this.toString = function(){return name}
        }
        container.prototype = new prototype();
        container.prototype.constructor = container;
        container.prototype.constructor.name = name;
        this.c[name] = container;
        this.registry[type] = container;
        return this.c[name];
    }    
}()


////////////////// Field validators //////////////////

oc.f.Field = function Field() {}
oc.f.Field.prototype.fromData = function (data,master) {
    return data;
}
oc.f.Field.prototype.toData = function (data,master) {
    return data;
}

//-----------------------------------

oc.f.PublicKeyField = function PublicKeyField(){}
oc.f.PublicKeyField.prototype.fromData = function(data,master) {
    ciphersuite = master['issuer_cipher_suite'];
    //fetch appropriate key module
    var key = new oc.c.RSAPublicKey()
    key.fromData(data);
    return key;
}
oc.f.PublicKeyField.prototype.toData = function(data,master) {
    //we know data is a container
    return data.toData(null,master);
}

//-----------------------------------

oc.f.DateField = function DateField(){}
oc.f.DateField.prototype.fromData = function(data,master) {
    if(data) return new Date(data);    
    else return data
}
oc.f.DateField.prototype.toData = function(data,master) {
    if (data) {
        var out =  data.toISOString();    
        out = out.slice(0,-5)+'Z';
        return out
    }
    else return data;
}

//-----------------------------------

oc.f.ListField = function ListField(fields){
    this.fields = fields;
}
oc.f.ListField.prototype.fromData = function(data,master) {
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
oc.f.ListField.prototype.toData = function(data,master) {
    return data;    
}

//-----------------------------------

oc.f.ValuesField = function ValuesField(field){
    this.field = field
}
oc.f.ValuesField.prototype.fromData = function(data,master) {
    var out = [];
    for (i in data) {
        out[i] = this.field.fromData(data[i],master);
    }
    return out;
}
oc.f.ValuesField.prototype.toData = function(data,master) {
    var out = [];
    for (i in data) {
        out[i] = this.field.toData(data[i],master);
    }
    return out;    
}

//-----------------------------------

oc.f.ContainerField = function ContainerField(klass){
    this.klass = klass;    
}
oc.f.ContainerField.prototype.fromData = function(data,master) {
    var obj = new this.klass();
    obj.fromData(data,master);
    return obj;
}
oc.f.ContainerField.prototype.toData = function(data,master) {
    return data.toData(null,master);     
}

//-----------------------------------

oc.f.ContainersField = function ContainersField(klass){
    this.klass = klass;    
}
oc.f.ContainersField.prototype.fromData = function(data,master) {
    var out = [];
    for (i in data) {
        var obj = new this.klass();
        obj.fromData(data[i],master);
        out[i] = obj;
    }
    return out;
}
oc.f.ContainersField.prototype.toData = function(data,master) {
    var out = [];
    for (i in data) {
        out[i] = data[i].toData(null,master);
    }
    return out;    
}



//-----------------------------------

oc.f.Base64Field = function Base64Field() {}
oc.f.Base64Field.prototype.fromData = function (data,master) {
    return oc.crypto.rsa_sha256_chaum86.s2b(data);
    //return atob(data);
}
oc.f.Base64Field.prototype.toData = function (data,master) {
    return oc.crypto.rsa_sha256_chaum86.b2s(data);
    //return btoa(data);
}

oc.f.BigIntField = function BigIntField() {}
oc.f.BigIntField.prototype.fromData = function (data,master) {
    
}

////////////////// Containerbase //////////////////
oc.c.Container = function Container () {
    this.type = 'Container';
}
oc.c.Container.prototype.fields = {}
oc.c.Container.prototype.getType = function() {
    return this.constructor.name.toLowerCase();
}
oc.c.Container.prototype.fromData = function (data,master) {
    if (master==undefined) var master = this;
    for (name in this.fields) {
        this[name] = this.fields[name].fromData(data[name],master);
    }
    return this;
}
oc.c.Container.prototype.toData = function(ignored,master) {
    var out = {};
    if (master==undefined) var master = this;
    for (name in this.fields) {
        out[name] = this.fields[name].toData(this[name],master);    
    } 
    out['type'] = this.type;
    return out;
}

function toBencode(data) {
    var type = typeof(data);
    if (type=='string') {
        return data.length+':'+data;
    } else if (type=='number') {
        return 'i'+data+'e';    
    } else if (Array.isArray(data)) {
        var out = 'l';
        for (i in data) {
            out += toBencode(data[i])    
        }
        out += 'e';
        return out;
    } else { //must be an object then    
        var out = 'd';
        var keys = Object.keys(data);
        keys.sort()
        for (i in keys) {
            var key = keys[i];
            out += toBencode(key);
            out += toBencode(data[key]);
        }
        out += 'e';
        return out;
    }
}
oc.c.Container.prototype.toBencode = function () {
    return toBencode(this.toData(null,this));    
}

oc.c.Container.prototype.toJson = function () {
    return JSON.stringify(this.toData(),null,4);    
}

oc.c.Container.prototype.fromJson = function (jsonstring) {
    return this.fromData(JSON.parse(jsonstring));    
}


