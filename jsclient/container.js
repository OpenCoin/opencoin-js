////////////////// Containers //////////////////
oc.type_registry = {};

oc.addContainer('RSAPublicKey','rsa public key').prototype.fields = {
    'modulus':         new oc.f.Base64Field(),
    'public_exponent': new oc.f.Base64Field()};

oc.addContainer('RSAPrivateKey','rsa private key').prototype.fields = {
    'modulus':          new oc.f.Base64Field(),
    'public_exponent':  new oc.f.Base64Field(),
    'private_exponent': new oc.f.Base64Field()};

oc.c.RSAPrivateKey.prototype.getPublicKey = function () {
    var pub = new oc.c.RSAPublicKey();
    pub.modulus = this.modulus;
    pub.public_exponent = this.public_exponent;
    return pub;
}
    

oc.addContainer('CDD','cdd').prototype.fields = {
    'protocol_version':         new oc.f.Field(),
    'cdd_location':             new oc.f.Field(),
    'issuer_cipher_suite':      new oc.f.Field(),
    'issuer_public_master_key': new oc.f.PublicKeyField(),
    'cdd_serial':               new oc.f.Field(),
    'cdd_signing_date':         new oc.f.DateField(),
    'cdd_expiry_date':          new oc.f.DateField(),
    'currency_name':            new oc.f.Field(),
    'currency_divisor':         new oc.f.Field(),
    'info_service':             new oc.f.ListField([new oc.f.Field(),
                                                    new oc.f.Field()]),
    'validation_service':       new oc.f.ListField([new oc.f.Field(),
                                                    new oc.f.Field()]),
    'renewal_service':          new oc.f.ListField([new oc.f.Field(),
                                                    new oc.f.Field()]),
    'invalidation_service':     new oc.f.ListField([new oc.f.Field(),
                                                    new oc.f.Field()]),
    'denominations':            new oc.f.ValuesField(new oc.f.Field()),
    'additional_info':          new oc.f.Field()};


oc.addContainer('CDDCertificate','cdd certificate').prototype.fields = {
    'cdd':       new oc.f.ContainerField(oc.c.CDD),
    'signature': new oc.f.Base64Field()};


oc.addContainer('MintKey','mint key').prototype.fields = {
    'id':                       new oc.f.Field(),
    'issuer_id':                new oc.f.Field(),
    'cdd_serial':               new oc.f.Field(),
    'public_mint_key':          new oc.f.PublicKeyField(),
    'denomination':             new oc.f.Field(),
    'sign_coins_not_before':    new oc.f.DateField(),
    'sign_coins_not_after':     new oc.f.DateField(),
    'coins_expiry_date':        new oc.f.DateField()};


oc.addContainer('MintKeyCertificate','mint key certificate').prototype.fields = {
    'mint_key':  new oc.f.ContainerField(oc.c.MintKey),
    'signature': new oc.f.Base64Field()};


oc.addContainer('Blank','token').prototype.fields = {
    'protocol_version':   new oc.f.Field(),
    'issuer_id':          new oc.f.Field(),
    'cdd_location':       new oc.f.Field(),
    'denomination':       new oc.f.Field(),
    'mint_key_id':        new oc.f.Field(),
    'serial':             new oc.f.Base64Field()};


oc.addContainer('Blind','blinded token hash').prototype.fields = {
    'reference':          new oc.f.Field(),
    'blinded_token_hash': new oc.f.Base64Field(),
    'mint_key_id':        new oc.f.Field()};


oc.addContainer('BlindSignature','blind signature').prototype.fields = {
    'reference':       new oc.f.Field(),
    'blind_signature': new oc.f.Base64Field()};


oc.addContainer('Coin','coin').prototype.fields = {
    'token':        new oc.f.ContainerField(oc.c.Blank),
    'signature':    new oc.f.Base64Field()};


