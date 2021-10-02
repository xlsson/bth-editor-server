"use strict";

const express = require("express");
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require("body-parser");

const jwt = require('jsonwebtoken');
const config = require("./db/config.json");

// Define routes
const routeReadAll = require('./routes/readall');
const routeReadOne = require('./routes/readone');
const routeCreateUser = require('./routes/createuser');
const routeVerifyLogin = require('./routes/verifylogin');
const routeCreateOne = require('./routes/createone');
const routeUpdateOne = require('./routes/updateone');

const app = express();

const port = process.env.PORT || 1234;

// don't show the log when it is test
if ((process.env.NODE_ENV !== 'test') || (process.env.NODE_ENV !== 'dev')) {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Routes without JWT verification
app.post("/createuser", routeCreateUser);
app.post("/verifylogin", routeVerifyLogin);

// Routes with JWT verification
app.get("/readall/:user", (req, res, next) => checkToken(req, res, next), routeReadAll);
app.get("/readone/:filename", (req, res, next) => checkToken(req, res, next), routeReadOne);
app.put("/createone", (req, res, next) => checkToken(req, res, next), routeCreateOne);
app.put("/updateone", (req, res, next) => checkToken(req, res, next), routeUpdateOne);

function checkToken(req, res, next) {
    const token = req.headers['x-access-token'];

    jwt.verify(token, config.jwtsecret, function(err, decoded) {
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
