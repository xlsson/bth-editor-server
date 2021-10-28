/**
 * @fileOverview Auth middleware, checking if the token in the header
 * can be verified.
 * @author - xlsson
 *
 * @type {Object} config -          Object containing login credentials
 * @type {string} secret -          The JWT secret used to decode the token,
 *                                  as specified in the config file.
 */

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
    /**
     * Register a new user by adding them as a new document in the collection.
     * @param {object} req                              Request object, consisting of:
     * @param {string} req.headers['x-access-token']    A JSON web token
     * @param {object} res                              Result object
     * @param {function} next                           The next middleware function
     *
     * @return {object} result              The result as a JSON object.
     *
     * If the token does not validate
     * @return {boolean} result.tokenNotValid    true
     *
     * If the token validates, the next function is run.
     */
    checkToken: function (req, res, next) {
        const token = req.headers['x-access-token'];

        secret = config.jwtsecret;

        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                res.status(200).json({ tokenNotValid: true });
                return;
            }
            next();
        });
    }
};

module.exports = auth;
