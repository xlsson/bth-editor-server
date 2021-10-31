/**
 * @fileOverview Server for CirrusDocs, a real-time collaborative editor.
 * @author - xlsson
 * {@link https://github.com/xlsson/bth-editor-server}
 * {@link https://github.com/xlsson/bth-reactjs-editor}
 */

"use strict";

const express = require("express");
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require("body-parser");
const auth = require('./db/auth');

/** GraphQL middleware to enable GraphQL routes using its query language */
const visual = false;
const { graphqlHTTP } = require('express-graphql');
const { GraphQLSchema } = require("graphql");
const RootQueryType = require("./graphql/root.js");
const schema = new GraphQLSchema({ query: RootQueryType });

/** Route definitions */
const routeCreateUser = require('./routes/createuser');
const routeVerifyLogin = require('./routes/verifylogin');
const routeCreateOne = require('./routes/createone');
const routeUpdateOne = require('./routes/updateone');
const routeUpdateUsers = require('./routes/updateusers');
const routePrintPdf = require('./routes/printpdf');
const routeSendInvite = require('./routes/sendinvite');

const app = express();

const port = process.env.PORT || 1234;

let config;

if (process.env.NODE_ENV === 'test') {
    console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
    config = require("./db/testconfig.json");
} else if (process.env.NODE_ENV === 'dev') {
    console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);
    config = require("./db/config.json");
} else {
    /** Use morgan to log at command line */
    app.use(morgan('combined'));
    config = require("./db/config.json");
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/graphql', auth.checkToken);
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: visual,
}));

/** Routes without JWT verification */
app.post("/createuser", routeCreateUser);
app.post("/verifylogin", routeVerifyLogin);
app.post("/printpdf", routePrintPdf);

/** Routes with JWT verification */
app.post("/sendinvite", auth.checkToken, routeSendInvite);
app.put("/createone", auth.checkToken, routeCreateOne);
app.put("/updateone", auth.checkToken, routeUpdateOne);
app.put("/updateusers", auth.checkToken, routeUpdateUsers);

const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
    cors: {
        origin: config.websocketorigin,
        methods: ["GET", "POST"]
    }
});

/**
 * Use socket.IO to enable real-time editing over web sockets.
 *
 * @param {object} socket       A Socket instance
 * @param {string} room         The room to enter/leave. Room = filename.
 * @param {object} data         The data being received and emitted.
 * @param {string} data.room    The room to emit to.
 * @param {string} data.title   File title
 * @param {string} data.content File contents
 * @param {array} data.comments Array of comments
 */
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
