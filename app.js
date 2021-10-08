"use strict";

const express = require("express");
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require("body-parser");
const auth = require('./db/auth');

const visual = true;
const { graphqlHTTP } = require('express-graphql');
const { GraphQLSchema } = require("graphql");
const RootQueryType = require("./graphql/root.js");
const schema = new GraphQLSchema({ query: RootQueryType });

// Define routes
const routeCreateUser = require('./routes/createuser');
const routeVerifyLogin = require('./routes/verifylogin');
const routeCreateOne = require('./routes/createone');
const routeUpdateOne = require('./routes/updateone');
const routeUpdateUsers = require('./routes/updateusers');

const app = express();

const port = process.env.PORT || 1234;

if ((process.env.NODE_ENV !== 'test') && (process.env.NODE_ENV !== 'dev')) {
    // Unless test or dev environment, use morgan to log at command line
    app.use(morgan('combined'));
} else {
    // If test or dev, console log environment variable
    console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
}

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/graphql', auth.checkToken);
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: visual,
}));

// Routes without JWT verification
app.post("/createuser", routeCreateUser);
app.post("/verifylogin", routeVerifyLogin);

// Routes with JWT verification
app.put("/createone", auth.checkToken, routeCreateOne);
app.put("/updateone", auth.checkToken, routeUpdateOne);
app.put("/updateusers", auth.checkToken, routeUpdateUsers);

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
