
// Request handlers


// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
// Define the handlers
var handlers = {};

// Users
handlers.users = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method)>-1){
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// User - create
//------------------
// method: post
// path: /users
// query params: none
// payload:    firtsName*: string
//             lastName*: string
//             phone*: string 10 chars
//             email*: formatted string
//             address*: string
//             password*: string
//             tosAgreement*: boolean
// returns: code, error object

handlers._users.post = function(data, callback){
    // Check that all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var email = typeof(data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.trim())  ? data.payload.email.trim() : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && email && address && password && tosAgreement){
        // Make sure that the user doesnt already exist
        _data.read('users', email, function(err, data){
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password);
                
                // Create the user object
                if(hashedPassword){
                    var userObject = {
                    'firstName': firstName,
                    'lastName': lastName,
                    'phone': phone,
                    'email' : email,
                    'address' : address,
                    'hashedPassword': hashedPassword,
                    'tosAgreement': true
                    };

                    // Store the user
                    _data.create('users', email, userObject, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create the new user'});
                        }
                    });    
                } else {
                    callback(500, {'Error' : 'Could not hash the user\'s password'});
                }
         
            } else {
                // User already exists
                callback(400,{'Error':'A user with that email already exists'})
            }
        });
    } else {
        callback(400, {'Error':'Missing required fields'});
    }

};


// method: get
// path: /users
// query params: email*
// payload: none
// header: token*
// returns: code, user data object/error object
handlers._users.get = function(data, callback){
    // Check the email is valid
    var email = typeof(data.queryStringObject.email) == 'string' && helpers.validateEmail(data.queryStringObject.email.trim())  ? data.queryStringObject.email.trim() : false;
    if (email){

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        // Verify the given token is valid for the email 
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if(tokenIsValid){
                //Lookup the user
                _data.read('users', email, function(err, data){
                    if(!err && data){
                        // Remove the hashed password from the user object before returning it to the requester
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403,{'Error':'Missing required token in header or token is invalid'})
            }
        });

        
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
};

// method: put
// path: /users
// query params: none
// payload:    firtsName: string
//             lastName: string
//             phone: string 10 chars
//             email*: formatted string
//             address: string
//             password: password
// header: token*
// returns: code, error object
handlers._users.put = function(data, callback){
    // Check for the required field
    var email = typeof(data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.trim())  ? data.payload.email.trim() : false;

    // Check for the optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  
    // Error if the phone is invalid
    if(email){
        // Error if nothing is sent to update
        if(firstName || lastName || phone || address || password){

        //Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        // Verify the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if(tokenIsValid){
                // Lookup the user
                _data.read('users', email, function(err, userData){
                    if(!err && userData){
                        // Update the fields necessary
                        if(firstName){
                            userData.firstName = firstName;
                        }
                        if(lastName){
                            userData.lastName = lastName;
                        }
                        if(phone){
                            userData.phone = phone;
                        }
                        if(address){
                            userData.address = address;
                        }
                        if(password){
                            userData.hashedPassword = helpers.hash(password);
                        }
                        //Store the new update
                        _data.update('users', email, userData, function(err){
                            if(!err){
                                callback(200);
                            } else {
                                console.log(err);
                                callback(500, {'Error': 'Could not update the user'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'The specified user does not exist'});
                    }
                });            
            } else {
                callback(403,{'Error':'Missing required token in header or token is invalid'});
            }
        });

        } else {
            callback(400, {'Error': 'Missing fields to update'});
        }
    } else {
        callback(400,{'Error': 'Missing required field'});
    }
}

// method: delete
// path: /users
// query params: email*
// payload: none
// header: token*
// returns: code, error object
handlers._users.delete = function(data, callback){
    // Check the email is valid
    var email = typeof(data.queryStringObject.email) == 'string' && helpers.validateEmail(data.queryStringObject.email.trim())  ? data.queryStringObject.email.trim() : false;
    if (email){

        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        // Verify the given token is valid for the email
        handlers._tokens.verifyToken(token, email, function(tokenIsValid){
            if(tokenIsValid){
                // Lookup the user
                _data.read('users', email, function(err, userData){
                    if(!err && userData){
                        _data.delete('users', email, function(err){
                            if (!err){
                                // Delete all the checks assotiated with the user
                                var userOrder = typeof(userData.order) == 'string' && userData.order.length == 20 ?  userData.order : '';
                                // Delete the check
                                _data.delete('orders', userOrder, function (err){
                                    if(!err){
                                        callback(200);
                                    } else {
                                        callback(500, {'Error':'Error encountered while deleting'})
                                    }
                                });
                            } else {
                                callback(500,{'Error':'Could not delete the specified user'});
                            }
                        });
                    } else {
                        callback(400, {'Error':'Could not find the specified user'});
                    }
                });                    
            } else {
                callback(403,{'Error':'Missing required token in header or token is invalid'});                   
            }
        });   
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
};

// Tokens
handlers.tokens = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method)>-1){
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the tokens methods
handlers._tokens = {};

// method: post
// path: /tokens
// query params: none
// payload:    email*: formatted string
//             password*: string
// returns: code, error object
handlers._tokens.post = function(data, callback){
    var email = typeof(data.payload.email) == 'string' && helpers.validateEmail(data.payload.email.trim())  ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(email && password){
        // Lookup the user who matches that phone
        _data.read('users', email, function(err, userData){
            if(!err && userData){
                // Hash the sent password and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword){
                    // If valid, create a new token with a random name. Set the expiration date 1 hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000*60*60;
                    var tokenObject = {
                        'email': email,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error':'Could not create the new token'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Password did not match stored user\'s password'});
                }
            } else {
                callback(400,{'Error':'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s)'});
    }
};

// method: get
// path: /tokens
// query params: id*
// payload: none
// returns: code, token data object/error object
handlers._tokens.get = function(data, callback){
    // Check if id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id){
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'})
    }

};

// method: put
// path: /tokens
// query params: none   
// payload:    id*
//             extend*: boolean 
// returns: code, error object
handlers._tokens.put = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
        _data.read('tokens',id, function(err, tokenData){
            if(!err && tokenData){
                // Check if the token already expired
                if(tokenData.expires > Date.now()){
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now()+ 1000*60*60;

                    // Store the new update
                    _data.update('tokens',id,tokenData, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            callback(500, {'Error':'Could not update the token\'s expiration'});
                        }
                    });

                } else {
                    callback(400,{'Error':'The token has already expired and cannot be extended'})
                }
            } else {
                callback(400,{'Error':'Specified token does not exist'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required field(s) or field(s) are invalid'})
    }
};

// method: delete
// path: /tokens
// query params: id*
// payload: none
// returns: code, error object
handlers._tokens.delete = function(data, callback){
    // Check the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id){
        // Lookup the token
        _data.read('tokens', id, function(err, data){
            if(!err && data){
                _data.delete('tokens', id, function(err){
                    if (!err){
                        callback(200);
                    } else {
                        callback(500,{'Error':'Could not delete the specified token'});
                    }
                });
            } else {
                callback(400, {'Error':'Could not find the specified token'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, email, callback){
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData){
        if(!err && tokenData){
            // Check that the token is for the given user and has not expired
            if(tokenData.email == email && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

// Verify if a given token is currently valid
handlers._tokens.checkToken = function(id, callback){
    // Lookup the token and check expiration
    _data.read('tokens', id, function(err, tokenData){
        if(!err && tokenData && tokenData.expires > Date.now()){
            callback(true, tokenData);
        } else {
            callback(false);
        }

    });
}

// Menu
// Can be extended for menu create, update, delete from the admin panel
handlers.menu = function(data, callback){
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method)>-1){
        handlers._menu[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the tokens methods
handlers._menu = {};

// method: get
// path: /menu
// query params: none
// payload: none
// header: token*
// returns: code, menu object/error object
handlers._menu.get = function (data, callback){
    // Get the token from the header
    var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
    // Verify the given token is valid for the phone number
    handlers._tokens.checkToken(token, function(tokenIsValid){
        if(tokenIsValid){
            // Lookup menu
            _data.read('menu', 'menu',function(err, data){
                if(!err && data){
                    callback(200, data);
                } else {
                    callback(404);
                }
            });
        } else {
            callback(403,{'Error':'Missing required token in header or token is invalid'})
        }
    });
};

// Orders
handlers.orders = function(data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method)>-1){
        handlers._orders[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the orders methods
handlers._orders = {};

// method: post
// path: /orders
// query params: none
// payload: items*: array of objects {id:XXX, quantity:XXX}
// header: token*
// returns: code, error object
handlers._orders.post = function(data, callback){
    // Validate input
    var order = typeof(data.payload) == 'object' && data.payload instanceof Array && data.payload.length > 0 ? data.payload : false;
    if(orderList){
        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Lookup the user by reading the token
        handlers._tokens.checkToken(token, function(tokenIsValid, tokenData){
            if(tokenIsValid){
                var userEmail = tokenData.email;
                // Lookup the user data
                _data.read('users', userEmail, function(err, userData){
                    if(!err && userData){
                        var userOrder = typeof(userData.order) == 'string' && userData.order.trim().length>0 ?  userData.order : false;
                        if(!userOrder){
                            // Create a random id for the order
                            var orderId = helpers.createRandomString(20);
                            // Create the order object, and include the user's email
                            var orderObject = {
                                'id': orderId,
                                'userEmail': userEmail,
                                'orderList': orderList
                            };
                            // Save the object
                            _data.create('orders', orderId, orderObject, function(err){
                                if(!err){
                                    // Add checkId to the userObject
                                    userData.order = orderObject.id;
                                    // Save the new user data
                                    _data.update('users', userEmail, userData, function(err){
                                        if(!err){
                                            // Return the data about the new check
                                            callback(200, orderObject);
                                        } else {
                                            callback(500, {'Error':'Could not update the user with the new check'});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error':'Could not create the new check'});
                                }
                            });
      
                        } else {
                            callback(400, {'Error':'The user already has the order'}); 
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);   
            }
        });
    } else {
        callback(400, {'Error':'Missing order'})
    }
};


// method: get
// path: /orders
// query params: id*
// payload: none
// header: token*
// returns: code, order object/error object
handlers._orders.get = function(data, callback){
    // Check the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id){
        // Lookup the check
        _data.read('orders', id, function(err, orderData){
            if(!err && orderData){
                // Get the token from the header
                var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                // Verify the given token is valid and belongs to the user who created the check
                handlers._tokens.verifyToken(token, orderData.userEmail, function(tokenIsValid){
                    if(tokenIsValid){
                        // Return the check data
                        callback(200, orderData);
                    } else {
                        callback(403)
                    }
                });

            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
};


// method: put
// path: /orders
// query params: id*
// payload: items
// header: token*
// returns: code, error object
handlers._orders.put = function(data, callback){
    // Check for the required field
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    // Check for the optional field
    var orderList = typeof(data.payload) == 'object' && data.payload instanceof Array && data.payload.length > 0 ? data.payload : false;
    // Check to make sure id is valid
    if(id){
        // Check to make sure the optional field has been sent
        if(orderList){
            // Lookup the order
            _data.read('orders', id, function(err, orderData){
                if(!err && orderData){
                    // Get the token from the header
                    var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                    // Verify the given token is valid and belongs to the user who created the check
                    handlers._tokens.verifyToken(token, orderData.userEmail, function(tokenIsValid){
                        if(tokenIsValid){
                            orderData.orderList = orderList;
                            // Store the new updates
                            _data.update('orders', id, orderData, function(err){
                                if(!err){
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update the order'});
                                }
                            });
                            
                        } else {
                            callback(403);
                        }
                    });
    
                } else {
                    callback(400, {'Error':'order Id do not exist'});
                }
           });
         } else {
            callback(400, {'Error': 'Missing fields to update'});
        }
    } else {
        callback(400, {'Error':'Missing required fields'});
    }
};

// method: delete
// path: /orders
// query params: id*
// payload: none
// header: token*
// returns: code, error object
handlers._orders.delete = function(data, callback){
    // Check the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id){
        // Lookup the order
        _data.read('orders', id, function(err, orderData){
            if(!err && orderData){
                // Get the token from the header
                var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
                // Verify the given token is valid for the phone number
                handlers._tokens.verifyToken(token, orderData.userEmail, function(tokenIsValid){
                    if(tokenIsValid){
                        // Delete the order data
                        _data.delete('orders', id, function(err){
                            if(!err){
                                // Lookup the user
                                _data.read('users', orderData.userEmail, function(err, userData){
                                    if(!err && userData){
                                        userData.order=[];
                                        // Save the user data
                                        _data.update('users', orderData.userEmail, userData, function(err){
                                            if (!err){
                                                callback(200);
                                            } else {
                                                callback(500,{'Error':'Could not update the user'});
                                            }
                                        });

                                    } else {
                                        callback(500, {'Error':'Could not find the user who created the order, could not remove the order from the user\'s list'});
                                    }
                                });

                            } else {
                                callback(500, {'Error':'Could not delete the order data'});
                            }
                        });
                     
                    } else {
                        callback(403);                   
                    }
                });

            } else {
                callback(400,{'Error':'The specified order ID does not exist'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};




// Checkout
// Can be extended for actions with Stripe acccount from the admin panel
handlers.checkout = function(data, callback){
    var acceptableMethods = ['post'];
    if (acceptableMethods.indexOf(data.method)>-1){
        handlers._checkout[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the checkout methods
handlers._checkout = {};

// method: post
// path: /checkout
// query params: cardToken*
// payload: none
// header: token*
// returns: code, error object
handlers._checkout.post = function(data, callback){
    // Check if card token passed
    var cardToken = typeof(data.queryStringObject.cardToken) == 'string' && data.queryStringObject.cardToken.indexOf('tok_') == 0 ? data.queryStringObject.cardToken : false;
    if (cardToken){
        // Get the token from the header
        var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
        // Verify the given token is valid for the email
        handlers._tokens.checkToken(token, function(tokenIsValid, tokenData){
            if(tokenIsValid){
                // Lookup the user
                _data.read('users', tokenData.email, function(err, userData){
                    if(!err && userData){
                        // Check if the user has an order
                        if(userData.order){
                            // get the user's order
                            _data.read('orders', userData.order, function(err, orderData){
                                if(!err && orderData){
                                    // calculate the order total amount
                                    var totalAmount = 0;
                                    // read menu
                                    _data.read("menu", "menu", function(err, menuData){
                                        if(!err && menuData){
                                            // iterate though every order item for total amount calculation and order message construction
                                            var message = '';
                                            for(var i=0; i<orderData.orderList.length; i++){
                                                totalAmount += menuData[orderData.orderList[i].id].price*orderData.orderList[i].quantity;
                                                message += menuData[orderData.orderList[i].id].name + ' - $' +menuData[orderData.orderList[i].id].price/100+' x '+ orderData.orderList[i].quantity +' pieces\n'
                                            }
                                            // charge the card
                                            helpers.chargeStripeCard(totalAmount, cardToken,'Pizza order charge' ,function(err){
                                                if(!err){
                                                // send email
                                                message = 'Your order has been paid. \nThank you for choosing us! \n\nYour order details: \n' + message + '\tTotal amount: $'+totalAmount/100;
                                                helpers.sendMail(config.mailgun.senderMail, userData.email, 'Pizza order', message, function(err){
                                                    if(!err){
                                                        callback(200);
                                                    } else {
                                                        callback(err);
                                                    }
                                               });
                                                } else {
                                                    callback(err);
                                                }
                                            });
                                        } else {
                                            callback(400, {'Error':'Could not find the menu'});
                                        }

                                    });
                                } else {
                                    callback(400, {'Error':'Could not find the order'});
                                }
                            });
                        } else {
                            callback(400, {'Error':'The user does not have an order'});
                        }
                    } else {
                        callback(400, {'Error':'Could not find the specified user'});
                    }
                });
            } else {
                callback(403,{'Error':'Missing required token in header or token is invalid'});
            }
        });
    } else {
       callback(400, {'Error': 'Missing card token'});
    };   
};


// Ping handler
handlers.ping = function(data, callback){
	callback(200);
};



// Not found handler
handlers.notFound = function(data, callback){
	callback(404);
};

// Export the module
module.exports = handlers;
