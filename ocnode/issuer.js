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
        console.log('parsing');
        server.fromJson(data);
        startServer();
        //read in server
    } else {
        console.log('not found');
        setupServer();  
        console.log('write server data');
        fs.writeFile('serverdata.json',server.toJson(),'utf-8',function (err) {
            startServer();
        });
    }
});


function setupServer() {
    console.log('create new server data');
    issuer_private = suite.makeKey(1024);
    issuer_public = issuer_private.getPublicKey();
    server.storage.dsdb = {};
    params = {};
    params.cdd_location = 'http://localhost:6789/';
    params.cdd_serial = 1;
    params.cdd_signing_date = new Date("2012-12-30T11:46:00");
    params.cdd_expiry_date = new Date("2014-12-31T23:59:59");
    params.currency_name = 'TestTaler';
    params.currency_divisor = 100;
    params.validation_service = [[10,'http://localhost:6789']];
    params.info_service =  [[10,'http://localhost:6789']];
    params.renewal_service =  [[10,'http://localhost:6789']];
    params.invalidation_service =  [[10,'http://localhost:6789']];
    params.denominations=[1,2,5,10,20,50,100,200,500,1000,2000,5000,10000,20000,50000];
    params.additional_info='';

    var cddc = api.makeCDDC(issuer_private,params);
    server.addCDDC(cddc);

    for (i in cddc.cdd.denominations) {
        var denomination = cddc.cdd.denominations[i];
        params = {};
        params.denomination = denomination;
        params.notBefore = new Date("2013-01-01");
        params.notAfter = new Date("2013-06-30");
        params.coins_expiry_date = new Date('2013-12-31');
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





