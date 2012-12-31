//////////////////// Messages ////////////////////////

oc.addContainer('RequestCDDSerial','request cdd serial').prototype.fields = {
    'message_reference' : new oc.f.Field()};


oc.addContainer('ResponseCDDSerial','response cdd serial').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'status_code':        new oc.f.Field(),
    'status_description': new oc.f.Field(),
    'serial':             new oc.f.Field()};


oc.addContainer('RequestCDD','request cdd').prototype.fields = {
    'message_reference' :   new oc.f.Field(),
    'cdd_serial' :          new oc.f.Field()};


oc.addContainer('ResponseCDD','response cdd').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'status_code':        new oc.f.Field(),
    'status_description': new oc.f.Field(),
    'cdd':                new oc.f.ContainerField(oc.c.CDD)};


oc.addContainer('RequestMintKeys','request mint keys').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'mint_key_ids':       new oc.f.ValuesField(new oc.f.Field()),
    'denominations':      new oc.f.ValuesField(new oc.f.Field())};


oc.addContainer('ResponseMintKeys','response mint keys').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'status_code':        new oc.f.Field(),
    'status_description': new oc.f.Field(),
    'keys':               new oc.f.ContainersField(oc.c.MintKeyCertificate)};


oc.addContainer('RequestValidation','request validation').prototype.fields = {
    'message_reference' :       new oc.f.Field(),
    'transaction_reference':    new oc.f.Field(),
    'authorization_info':       new oc.f.Field(),
    'tokens':                   new oc.f.ContainersField(oc.c.Blank)};


oc.addContainer('ResponseValidation','response validation').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'status_code':        new oc.f.Field(),
    'status_description': new oc.f.Field(),
    'retry_after':        new oc.f.DateField(),
    'blind_signatures':   new oc.f.ContainersField(oc.c.BlindSignature)};


oc.addContainer('RequestRenewal','request renewal').prototype.fields = {
    'message_reference' :       new oc.f.Field(),
    'transaction_reference':    new oc.f.Field(),
    'coins':                    new oc.f.ContainersField(oc.c.Coin),
    'tokens':                   new oc.f.ContainersField(oc.c.Blank)};


oc.addContainer('ResponseRenewal','response renewal').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'status_code':        new oc.f.Field(),
    'status_description': new oc.f.Field(),
    'retry_after':        new oc.f.DateField(),
    'blind_signatures':   new oc.f.ContainersField(oc.c.BlindSignature)};


oc.addContainer('RequestInvalidation','request invalidation').prototype.fields = {
    'message_reference' :       new oc.f.Field(),
    'authorization_info':       new oc.f.Field(),
    'coins':                    new oc.f.ContainersField(oc.c.Coin)};


oc.addContainer('ResponseInvalidation','response invalidation').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'status_code':        new oc.f.Field(),
    'status_description': new oc.f.Field()};


oc.addContainer('RequestResume','request resume').prototype.fields = {
    'message_reference' :       new oc.f.Field(),
    'transaction_reference':    new oc.f.Field()};


oc.addContainer('SendCoins','send coins').prototype.fields = {
    'message_reference' :   new oc.f.Field(),
    'subject':              new oc.f.Field(),
    'coins':                new oc.f.ContainersField(oc.c.Coin)};


oc.addContainer('ReceivedCoins','received coins').prototype.fields = {
    'message_reference' : new oc.f.Field(),
    'status_code':        new oc.f.Field(),
    'status_description': new oc.f.Field()};

