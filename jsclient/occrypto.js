oc.crypto = {};
oc.crypto.rsa_sha256_chaum86 = new function() {
    this.identifier = 'RSA-SHA512-CHAUM86';

    this.s2b = function (text,base) {
        if (base==undefined) base = 10;
        out =  str2bigInt(text,base,0);    
        return out;
    }

    this.b2s = function (num,base) {
        if (base==undefined) base = 10;
        return bigInt2str(num,base);    
    }

    this.hash = function (text) {
        if (typeof(text)!='string') {
            text = this.b2s(text);
        }
        return sha256_digest(text);
    }

    this.hashContainer = function (container) {
        return this.s2b(sha256_digest(container.toBencode()),16);
    }


    this.pad = function (message,len) {
        if (len==undefined) len=1024;
        var missing = len - message.length;
        if (missing<=0) return message;
        for (i=1; i<missing;i++) {message +='1'}
        return message;
    }

    this.sign = function (privkey,message) {
        //message is a bigint
        signature = powMod(message,privkey.private_exponent,privkey.modulus);
        //signature is a bigint
        return signature;
    }


    this.verify = function (pubkey,message,signature) {
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
        var hash = this.hashContainer(container);
        return this.sign(privkey,hash);
    }

    this.verifyContainerSignature = function(pubkey,container,signature) {
        var orighash = this.hashContainer(container);
        return this.verify(pubkey,orighash,signature);
    }

    this.guessKeyLength = function(key) {
        var l = key.modulus.length;
        if (l <=50) return 512;
        else if (100 > l && l > 50) return 1024;
        else if ( 200 > l && l > 101) return 2048;
        else if (l >= 200) return 4096;
        else return 'no idea';
    }

    this.getRandomNumber = function (length) {
        return randBigInt(length,1);    
    }

    this.blind = function (pubkey,num) {
        var r, blinder, bm, keylength;
        keylength = this.guessKeyLength(pubkey);
        r  = this.getRandomNumber(keylength);
        blinder = powMod(r,pubkey.public_exponent,pubkey.modulus);
        bth = multMod(blinder,num,pubkey.modulus);
        return {'r':r,'blinded_token_hash':bth};
    }

    this.unblind = function(pubkey,bs,r) {
        var unblinder = inverseMod(r,pubkey.modulus);
        return multMod(unblinder,bs,pubkey.modulus);
    }

    this.makeKeys = function (length) {}

}();



