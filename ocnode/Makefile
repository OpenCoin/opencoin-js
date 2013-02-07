
server_SOURCES=jsclient/containerbase.js jsclient/container.js jsclient/messages.js jsclient/BigInt.js jsclient/sha256.js jsclient/occrypto.js jsclient/ocapi.js jsclient/oclayer.js issuer.js 

server.js: $(server_SOURCES)
	cat $(server_SOURCES) > $@


.PHONY: server 
server: server.js
	node server.js
