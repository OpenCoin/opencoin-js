x = alice.toJson();
suite = oc.crypto.rsa_sha256_chaum86;
api = new oc.api(suite);
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
charlie = new oc.layer(api,newStorage());
charlie.fromJson(x);
console.log(charlie.toJson() == alice.toJson());
