oc.crypto = {};
oc.crypto.rsa_sha256_chaum86 = new function() {
    this.identifier = 'RSA-SHA512-CHAUM86';
    this.default_key_length = 512; //in real life 1024,2048 or 4096

    this.s2b = function (text,base) {
        if (base==undefined) base = 16;
        out =  str2bigInt(text,base,0);    
        return out;
    }

    
    this.b2s = function (num,base) {
        if (base==undefined) base = 16;
        return bigInt2str(num,base).toLowerCase();    
    }

    this.hash = function (text) {
        if (typeof(text)!='string') {
            text = this.b2s(text);
        }
        return sha256_digest(text);
    }

    this.paddedhashContainer = function (pub,container) {
        //XXX do RSA PSS padding instead (or is it RSASSA-PSS?)
        var bencoded = container.toBencode();
        var shahash = sha256_digest(bencoded);
        var keylength = this.b2s(pub.modulus,16).length;
        var missing = keylength - shahash.length - 1;
        if (missing<0) throw 'hash is too long for keylength';
        for(var i=1; i<missing; i++) shahash = 'f'+shahash;
        return this.s2b(shahash,16);
    }


    this.sign = function (privkey,message) { //rsa low level
        //message is a bigint
        signature = powMod(message,privkey.private_exponent,privkey.modulus);
        //signature is a bigint
        return signature;
    }


    this.verify = function (pubkey,message,signature) { //rsa low level
        //message and signature are bigInts
        clear = powMod(signature,pubkey.public_exponent,pubkey.modulus);
        return (this.b2s(clear) == this.b2s(message));
    }

    this.signtext = function (privkey,text) {
        var hash = this.hash(text);
        var hashnumber = this.s2b(hash,16);
        var signaturenumber = this.sign(privkey,hashnumber);
        var signature =  this.b2s(signaturenumber,16);
        return signature.toLowerCase();
    }

    this.verifytext = function (pubkey,text,signature) {
        var orighash = this.hash(text);
        var signaturenumber = this.s2b(signature,16);
        var clear = powMod(signaturenumber,pubkey.public_exponent,pubkey.modulus);
        var newhash = this.b2s(clear,16).toLowerCase();
        return (orighash == newhash);
    
    }


    this.signContainer = function (privkey,container) {
        var hash = this.paddedhashContainer(privkey.getPublicKey(),container);
        return this.sign(privkey,hash);
    }


    this.verifyContainerSignature = function(pubkey,container,signature) {
        var orighash = this.paddedhashContainer(pubkey,container);
        return this.verify(pubkey,orighash,signature);
    }

    
    this.getRandomNumber = function (length) {
        return randBigInt(length,1);    
    }


    this.blind = function (pubkey,num) {
        var r, blinder, bm, keylength;
        keylength = this.b2s(pubkey.modulus,2).length;
        r = this.getRandomNumber(keylength-1);
        blinder = powMod(r,pubkey.public_exponent,pubkey.modulus);
        blinded_number = multMod(blinder,num,pubkey.modulus);
        return {'r':r,'blinded_payload_hash':blinded_number};
    }


    this.unblind = function(pubkey,bs,r) {
        var unblinder = inverseMod(r,pubkey.modulus);
        return multMod(unblinder,bs,pubkey.modulus);
    }

    this.makeKey = function (length) {
        console.log('keylength: '+length);
        //XXX do this with a proper algorithm
        if (length==undefined) length = this.default_key_length;

        var e = this.s2b('10001');
        var l = length/2;
        var i = 1;
        var j = 1;
        while (1) {
            while (1) {
                var r1 = randTruePrime(l);
                var r2 = randTruePrime(l);
                if (!equals(r1,r2) && !equalsInt(mod(r2,e),1)) {
                    break;
                }
            }
            var n = mult(r1,r2);
            var phi = mult(addInt(r1,-1),addInt(r2,-1));
            var d = inverseMod(e,phi)
            if (d) break;
        }
        var priv = new oc.c.RSAPrivateKey();
        priv.modulus = n;
        priv.public_exponent = e;
        priv.private_exponent = d;
        return priv;
    }

}();



