/*
* Create and export configuration variables
*/


//Container for all the enviroments
var enviroments = {};

// Staging (default) object
enviroments.staging = {
	'httpPort':3000,
	'httpsPort':3001,
	'envName':'staging',
    'hashingSecret': 'pizzaSecret',
    'stripe': {
        'authKey': 'sk_test_w0yu5Oem7zOq1O46kj3qELXT',
        'currency': 'usd'
	},
	'mailgun':{
		'authKey': 'key-c1ebe5b17e2c4e9bce04fef8577bfaa0',
		'senderMail': 'postman@sandboxef06fc5721174280a91a08bf26c44853.mailgun.org'
	}
};


//Production enviroment
enviroments.production = {
	'httpPort':5000,
	'httpsPort':5001,
	'envName':'production',
	'hashingSecret': 'ninjaSecret',
	'stripe': {
        'authKey': '',
        'currency': 'usd'
	},
	'mailgun':{
		'authKey': ''
	}
};

// Determine which enviroment was passed as a command-line ergument
var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() :'';

// Check that the current enviroment is one of the above
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object'? enviroments[currentEnviroment]:enviroments.staging;

//Export the module
module.exports = enviromentToExport;
