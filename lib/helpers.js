// Helpers for various tasks

// Dependencies
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');

// Container for all the helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str){
    if (typeof(str)=='string' && str.length>0){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }

};

// Parse a JSON to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
        return obj;
    }catch(e){
        return {};
    }
}

// Validate email format
helpers.validateEmail = function(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength){
        // Define all the possible characters that could go into a string
        var possibleCharacters = 'abcdefghijkopqrstuvwxyz0123456789';

        // Start the final string
        var str = '';
        for (var i=1; i <=strLength; i++){
            // Get a random charecter
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()* possibleCharacters.length));
            // Append it to the final string
            str += randomCharacter;
        }
        // Return the final string
        return str;
    } else {
        return false;
    }
}

// Charge customer's credit card via Stripe
helpers.chargeStripeCard = function(amount, cardToken, description, callback){
    // Validate params
    amount = typeof(amount) == 'number' && Number.isInteger(amount) && amount >= 50 ? amount : false;
    cardToken = typeof(cardToken) == 'string' && cardToken.indexOf('tok_') == 0 ? cardToken : false;

    if(amount) {
        if(cardToken){
            // Configure the request payload
            var payload = {
                amount : amount,
                currency : config.stripe.currency,
                source: cardToken,
                description: description
            };
            // Stringify the payload
            var stringPayload = querystring.stringify(payload);
            // Configure the request details
            var requestDetails = {
                protocol : 'https:',
                hostname : 'api.stripe.com',
                method : 'POST',
                path : '/v1/charges',
                headers : {
                    Authorization: `Bearer ${config.stripe.authKey}`
                }
            };
            // Instantiate the request object
            var req = https.request(requestDetails, function(res){
                // grab the status of the sent message
                var status = res.statusCode;
                // Callback successfully if the request went through
                if(status == 200 || status == 201){
                    callback(false);
                } else {
                    callback('Status code returned was ' +status, JSON.stringify(res.headers));
                }
            });
            // Bind to the error event so it doesn't get thrown
            req.on('error', function(e){
                callback(e);
            });

            // Add the payload
            req.write(stringPayload);

            // End the request
            req.end();
        } else {
            callback('Wrong card token');
        }
    } else {
        callback('Wrong amount');
    }
};

// Send email
helpers.sendMail = function(sender, receiver, subj, message, callback){
    // Validate params
    sender = typeof(sender) == 'string' && helpers.validateEmail(sender) ? sender : false;
    receiver = typeof(receiver) == 'string' && helpers.validateEmail(receiver) ? receiver : false;
    subj = typeof(subj) == 'string' && subj.length <= 78 ? subj : false;
    message = typeof(message) == 'string' && message.length > 0 ? message : false;
    if(sender && receiver && subj && message) {
        // Configure the request payload
        var payload = {
            from : sender,
            to : receiver,
            subject: subj,
            text: message

        };
        // Stringify the payload
        var stringPayload = querystring.stringify(payload);
        // Configure the request details
        var requestDetails = {
            protocol : 'https:',
            hostname : 'api.mailgun.net',
            method : 'POST',
            path : '/v3/sandboxef06fc5721174280a91a08bf26c44853.mailgun.org/messages',
            headers : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                authorization: 'Basic ' + Buffer.from(('api:'+ config.mailgun.authKey)).toString('base64')
            }
        };
        // Instantiate the request object
        var req = https.request(requestDetails, function(res){
            // This part for checking server's answer
            // var chunks = [];
            // res.on("data", function (chunk) {
            //     chunks.push(chunk);
            // });
            // res.on("end", function () {
            //     var body = Buffer.concat(chunks);
            //     console.log(body.toString());
            // });
 
            // grab the status of the sent message
            var status = res.statusCode;
            // Callback successfully if the request went through
            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback('Status code returned was ' +status, JSON.stringify(res.headers));
            }
        });
        // Bind to the error event so it doesn't get thrown
        req.on('error', function(e){
            callback(e);
        });

        // Add the payload
        req.write(stringPayload);

        // End the request
        req.end();
    } else {
        callback('Error: Missing required field')
    }
};




// Export the module
module.exports = helpers;