# Pizza-delivery site back-end API

_Note: * - required data_


## User operations

### Create new user
```
method: post
path: /users
query params: none
payload:    firtsName*: string
            lastName*: string
            phone*: string 10 chars
            email*: formatted string
            address*: string
            password*: string
            tosAgreement*: boolean
returns: code (200 - success; 400, 500 - errors), error object
```
### Find existing user
```
method: get
path: /users
query params: email*
payload: none
header: token*
returns: code (200 - success; 400, 403, 404 - errors), user data object/error object
```
### Update user info
```
method: put
path: /users
query params: none
payload:    firtsName: string
            lastName: string
            phone: string 10 chars
            email*: formatted string
            address: string
            password: password
header: token*
returns: code (200 - success; 400, 403, 500 - errors), error object
```
### Delete existing user
```
method: delete
path: /users
query params: email*
payload: none
header: token*
returns: code (200 - success; 400, 403, 500 - errors), error object
```

## Token operations

### Create new token
```
method: post
path: /tokens
query params: none
payload:    email*: formatted string
            password*: string
returns: code (200 - success; 400, 500 - errors), error object
```

### Find existing token
```
method: get
path: /tokens
query params: id*
payload: none
returns: code (200 - success; 400, 404 - errors), token data object/error object
```

### Extend token expiration
```
method: put
path: /tokens
query params: none   
payload:    id*
            extend*: boolean 
returns: code (200 - success; 400, 500 - errors), error object
```

### Delete token
```
method: delete
path: /tokens
query params: id*
payload: none
returns: code (200 - success; 400, 500 - errors), error object
```

## Shopping operation

### Get menu items
```
method: get
path: /menu
query params: none
payload: none
header: token*
returns: code, menu object/error object
```

### Put the choosen items to the basket
```
method: post
path: /orders
query params: none
payload: items*: array of objects {id:XXX, quantity:XXX}
header: token*
returns: code, error object
```

### Get the items from the basket
```
method: get
path: /orders
query params: id*
payload: none
header: token*
returns: code, order object/error object
```

### Update the items in the basket
```
method: put
path: /orders
query params: id*
payload: items
header: token*
returns: code, error object
```

### Delete order from the basket
```
method: delete
path: /orders
query params: id*
payload: none
header: token*
returns: code, error object
```
### Checkout (confirm and pay the order, send email)
```
method: post
path: /checkout
query params: cardToken*
payload: none
header: token*
returns: code, error object
```

## Formats

All prices should be in cents.

Order format should be an array of objects with id's and amounts: 
```
[
    {"id":"XXX","quantity":"XXX"},
    {"id":"XXX","quantity":"XXX"}, 
    ...
]
```

Menu format is an object with the following format:
```
{
    "<id>":    {
                "name":"XXXXX",
                "weight":"XXX",
                "description":"XXX",
                "price":"XXX"
            },
...
}
```
A user can have only one order.
