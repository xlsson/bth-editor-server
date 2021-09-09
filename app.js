"use strict";

const express = require("express");
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require("body-parser");

// Define routes
const routeRead = require('./routes/read');
const routeWrite = require('./routes/write');

const app = express();

const port = process.env.PORT || 1234;

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Routes
app.get("/read", routeRead);
app.post("/write", routeWrite);

app.listen(port, function() {
    return console.log(`Express running on port: ${port}`);
});
