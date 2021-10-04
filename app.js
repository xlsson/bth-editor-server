"use strict";

console.log(process.env.NODE_ENV);

const express = require("express");
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require("body-parser");

const jwt = require('jsonwebtoken');

let config;
let secret;

try {
    config = require("./db/config.json");
} catch (e) {
    console.log(e);
}

// Define routes
const routeCreateUser = require('./routes/createuser');
const routeVerifyLogin = require('./routes/verifylogin');
const routeReadAll = require('./routes/readall');
const routeReadOne = require('./routes/readone');
const routeAllUsers = require('./routes/allusers');
const routeCreateOne = require('./routes/createone');
const routeUpdateOne = require('./routes/updateone');
const routeUpdateUsers = require('./routes/updateusers');

const app = express();

const port = process.env.PORT || 1234;

if ((process.env.NODE_ENV !== 'test') && (process.env.NODE_ENV !== 'dev')) {
    // Unless during test, use morgan to log at command line
    app.use(morgan('combined'));
} else {
    config = require("./db/testconfig.json");
}

secret = config.jwtsecret;

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Routes without JWT verification
app.post("/createuser", routeCreateUser);
app.post("/verifylogin", routeVerifyLogin);

// Routes with JWT verification
app.get("/readall/:user", (req, res, next) => checkToken(req, res, next), routeReadAll);
app.get("/readone/:filename", (req, res, next) => checkToken(req, res, next), routeReadOne);
app.get("/allusers", (req, res, next) => checkToken(req, res, next), routeAllUsers);
app.put("/createone", (req, res, next) => checkToken(req, res, next), routeCreateOne);
app.put("/updateone", (req, res, next) => checkToken(req, res, next), routeUpdateOne);
app.put("/updateusers", (req, res, next) => checkToken(req, res, next), routeUpdateUsers);

function checkToken(req, res, next) {
    const token = req.headers['x-access-token'];

    jwt.verify(token, secret, function(err, decoded) {
        if (err) {
            res.locals.tokenIsVerified = false;
        } else {
            res.locals.tokenIsVerified = true;
        }
        next();
    });
}


// Use socket.io to enable real-time collaborative editing
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
    cors: {
        origin: `https://www.student.bth.se`,
        methods: ["GET", "POST"]
    }
});

io.on('connection', function(socket) {
    socket.on('join', function(room) {
        socket.join(room);
    });

    socket.on('leave', function(room) {
        socket.leave(room);
    });

    socket.on('send', function(data) {
        socket.to(data.room).emit("send", data);
    });
});

const server = httpServer.listen(port, function() {
    return console.log(`Express running on port: ${port}`);
});

module.exports = server;
