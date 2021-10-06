"use strict";

const jwt = require('jsonwebtoken');

let config;
let secret;

if (process.env.NODE_ENV === 'test') {
    config = require("./testconfig.json");
} else {
    config = require("./config.json");
}

const auth = {

    checkToken: function (req, res, next) {
        const token = req.headers['x-access-token'];

        secret = config.jwtsecret;

        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                res.locals.tokenIsVerified = false;
            } else {
                res.locals.tokenIsVerified = true;
            }
            next();
        });
    }
};

module.exports = auth;
