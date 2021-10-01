"use strict";

const express = require("express");
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require("body-parser");

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

// Routes
app.get("/readall/:user", routeReadAll);
app.get("/readone/:filename", routeReadOne);
app.post("/createuser", routeCreateUser);
app.post("/verifylogin", routeVerifyLogin);
app.put("/createone", routeCreateOne);
app.put("/updateone", routeUpdateOne);

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
