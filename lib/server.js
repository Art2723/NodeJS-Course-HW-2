/*
*
* Server-related tasks
*
*/

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
// var util = require('util');
// var debug = util.debuglog('server');

// Insantiate the server module object
var server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer(function(req, res){
	server.unifiedServer(req,res);
});



// // Instantiate the HTTPS server
// server.httpsServerOptions = {
// 	'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
// 	'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
// };
// server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
// 	server.unifiedServer(req,res);
// });


//Http and https serever logic
server.unifiedServer = function(req,res){
	// Get the URL and parse it
	var parsedUrl = url.parse(req.url, true);

	// Get the path
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	var queryStringObject = parsedUrl.query;


	// Get the http method
	var method = req.method.toLowerCase();

	// Get the headers as an object
	var headers = req.headers;

	// Get the payload if any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function(data){
		buffer += decoder.write(data);
	});
	req.on('end', function(){
		buffer += decoder.end();

        // Choose the handler this request should go or if not exist go to notFound handler
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };



        // route the request to the router specified in the router
        chosenHandler(data, function(statusCode, payload){
            // Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number'? statusCode : 200;

            // Use the payload called back by the handler or default to the empty string
            payload = typeof(payload) == 'object'? payload : {};

            // Convert payload to a string
            var payloadString = JSON.stringify(payload);

            //Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            //If the response is 200, print green otherwise print red
            if(statusCode == 200){
                console.log('\x1b[36m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+ statusCode);
            } else {
                console.log('\x1b[31m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+ statusCode);
            };

        });
    });

};

// Define a request router
server.router = {
	'ping': handlers.ping,
	'users': handlers.users,
	'tokens': handlers.tokens,
    'menu': handlers.menu,
    'orders': handlers.orders,
    'checkout': handlers.checkout
};



// Init script
server.init = function(){
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function(){
	console.log('\x1b[36m%s\x1b[0m',"The server is listening on port "+config.httpPort +" in "+config.envName+" now");
    });

    // // Start the HTTPS server
    // server.httpsServer.listen(config.httpsPort, function(){
	// console.log('\x1b[35m%s\x1b[0m',"The server is listening on port "+config.httpsPort +" in "+config.envName+" now");

// });
}

// Export the module
module.exports = server;