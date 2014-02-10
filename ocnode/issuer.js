var http = require('http');
var url = require('url') ;
var fs = require('fs');
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


var server = new oc.layer(api,newStorage());


console.log('read in data');
fs.readFile('serverdata.json', 'utf-8',function (err,data) {
    if (err == undefined) {
        console.log('parsing data');
        server.fromJson(data);
        startServer();
        //read in server
    } else {
        console.log('data not found');
        setupServer();  
        console.log('write server data');
        fs.writeFile('serverdata.json',server.toJson(),'utf-8',function (err) {
            startServer();
        });
    }
});


function setupServer() {
    console.log('reading in config.json');
    config = fs.readFileSync('config.json','utf-8');
    config = JSON.parse(config);
    console.log('create new server data');
    issuer_private = suite.makeKey(config.keylength);
    issuer_public = issuer_private.getPublicKey();
    server.storage.dsdb = {};
    params = {};
    params.cdd_location = config.cdd_location;
    params.cdd_serial = config.cdd_serial;
    params.cdd_signing_date = new Date(config.signing_date);
    params.cdd_expiry_date = new Date(config.expiry_date);
    params.currency_name = config.currency_name;
    params.currency_divisor = config.currency_divisor;
    params.validation_service = config.validation_service;
    params.info_service =  config.info_service;
    params.renewal_service =  config.renewal_service;
    params.invalidation_service =  config.invalidation_service;
    params.denominations=config.denominations;
    params.additional_info=config.additional_info;
    console.log(params);

    var cddc = api.makeCDDC(issuer_private,params);
    server.addCDDC(cddc);

    for (i in cddc.cdd.denominations) {
        var denomination = cddc.cdd.denominations[i];
        params = {};
        params.denomination = denomination;
        params.notBefore = new Date(config.notBefore);
        params.notAfter = new Date(config.notAfter);
        params.coins_expiry_date = new Date(config.coins_expiry_date);
        mkout = api.makeMKC(issuer_private,cddc,params);
        mkc = mkout.mkc;
        private_mintkey = mkout.private_mintkey;
        server.addMKC(mkc,private_mintkey);
    }
    }

function startServer() {



    http.createServer(
        function (request, response) {
            var full_url = url.parse( request.url, true ) ;
            var pathname = full_url.pathname ;
            var q_params = full_url.query ;
            var body = "" ;
            
            response.statusCode=200;
            response.setHeader("Access-Control-Allow-Origin", "*");
            

            if (request.method === "POST"){
                response.setHeader('Content-Type','application/json');
                request.on('data', function( chunk ) {
                    // append the chunk to the growing message body
                    body += chunk ;
                }) ;

                request.on('end', function(){
                    if (request.url=='/webform') {
                        body = body.slice(8);
                    };
                    try {
                        var mdata = JSON.parse(body);
                        //console.log(body);
                        var res = server.dispatch(mdata);
                        var type = res.type;
                        if (type!=undefined && ['response minting','response invalidation'].indexOf(type)!=-1) {
                            console.log('write server data');
                            fs.writeFile('serverdata.json',server.toJson(),'utf-8');
                        }
                        response.write(res.toJson());
                        response.end();
                    } catch (e) {
                        response.statusCode = 500;
                        response.write('error\n\n' +e);
                        response.end();
        
                    }
                }) ;
            } else {
                request.on('end',function() {
                    response.setHeader('Content-Type','text/html');
                    response.write('<html><head></head><body><h1>Welcome to the opencoin issuer.</h1>');
                    response.write('<form action="/webform" method="POST" enctype="text/plain">');
                    response.write('<div>Please paste your opencoin json message</div>');
                    response.write('<input type="submit"><br/>');
                    response.write('<textarea name="message" cols="120" rows="30"></textarea><br/>');
                    response.write('<input type="submit">');
                    response.write('</form>');
                    response.write('</body></html>');
                    response.end();
                
                });    
            }
        }).listen(6789);

    console.log('Server running on port 6789');
    console.log('currencyid: '+server.currencyId());
}    





