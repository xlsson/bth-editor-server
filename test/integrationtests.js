/**
 * @fileOverview Integration tests using Mocha with the Chai and Chai-Http libraries
 * A local MongoDB database is created for the tests.
 * @author - xlsson
 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('chai').assert;
const server = require('../app.js');
const mongo = require("mongodb").MongoClient;

const jwt = require('jsonwebtoken');
const config = require('../db/testconfig.json');

var testMaxData = require('./testMaxData.js');
var testLisaData = require('./testLisaData.js');

const path = require('path');
const fs = require('fs');

var client;
var db;

var testMax;
var testMaxToken;
var testLisa;
var testLisaToken;

chai.should();

chai.use(chaiHttp);

describe('Test server functionality', function() {

    before( async function() {
        /** Run once before the first test in this block: drops the database */
        client = await mongo.connect("mongodb://localhost/test", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        db = await client.db();

    });

    after( function(done) {
        /** Run once after the last test block: closes database connection */
        client.close(done);
    });

    describe('Creating a new user, logging in, reading documents', () => {

        before( async function() {
            /** Setup database collection by first wiping it and then adding a document */
            await db.dropDatabase();

            testMax = await db.collection("users").insertOne(testMaxData);

            /** Create a JSON web token needed for http requests */
            testMaxToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
        });


        it('Reading a document works', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    query: `
                    { doc (filename: "meinbuch" ) {
                        filename, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.doc.filename.should.equal("meinbuch");
                    res.body.data.doc.title.should.equal("Das Buch");
                    done();
                });
        });

        it('Reading a document without a JSON web token fails', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .send({
                    query: `
                    { doc (filename: "meinbuch" ) {
                        filename, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.tokenNotValid.should.equal(true);
                    done();
                });
        });

        it('Registering a new, unique user works', (done) => {
            chai.request(server)
                .post("/createuser")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    name: 'myname',
                    email: 'unique@emailadress.com',
                    password: 'password'
                })
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.acknowledged.should.equal(true);
                    done();
                });
        });

        it('Searching for the new user is successful', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    query: `{ users { email } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.users.should.deep.include({ email: 'unique@emailadress.com' });
                    done();
                });
        });

        it('Trying to register an already existing user fails', (done) => {
            chai.request(server)
                .post("/createuser")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    name: 'myname',
                    email: 'max@mustermann.de',
                    password: 'password'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.acknowledged.should.equal(false);
                    done();
                });
        });

        it('Logging in an existing user works', (done) => {
            chai.request(server)
                .post("/verifylogin")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    email: 'unique@emailadress.com',
                    password: 'password'
                })
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.userexists.should.equal(true);
                    res.body.verified.should.equal(true);
                    res.body.should.have.own.property("token");
                    done();
                });
        });

        it('Logging in with the wrong password fails', (done) => {
            chai.request(server)
                .post("/verifylogin")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    email: 'unique@emailadress.com',
                    password: 'wrongpassword'
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.userexists.should.equal(true);
                    res.body.verified.should.equal(false);
                    res.body.should.not.have.own.property("token");
                    done();
                });
        });

        it('Logging in with a non-existing user fails', (done) => {
            chai.request(server)
                .post("/verifylogin")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    email: 'non-existing@emailadress.com',
                    password: 'password'
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.userexists.should.equal(false);
                    res.body.should.not.have.own.property("token");
                    done();
                });
        });

    });

    describe('Creating and updating documents', () => {

        before( async function() {
            /** Setup database collection by first wiping it and then adding a document */
            await db.dropDatabase();

            testMax = await db.collection("users").insertOne(testMaxData);

            /** Create a JSON web token needed for http requests */
            testMaxToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
        });

        it('Creating a new document works', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'newdocument',
                    code: false,
                    title: 'title',
                    content: 'somecontent',
                    comments: [{ nr: 2, text: "Comment nr 2" }],
                    email: 'max@mustermann.de'
                })
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.acknowledged.should.equal(true);
                    done();
                });
        });

        it('Reading the newly created document works', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    query: `
                    { doc (filename: "newdocument" ) {
                        filename, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.doc.filename.should.equal("newdocument");
                    done();
                });
        });

        it('Creating a document with an existing filename fails', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'newdocument',
                    code: false,
                    title: 'atitle',
                    content: 'somecontent',
                    comments: [{ nr: 2, text: "Comment nr 2" }],
                    email: 'max@mustermann.de'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.acknowledged.should.equal(false);
                    done();
                });
        });

        it('Creating a document without a JSON web token fails', (done) => {
            chai.request(server)
                .put("/createone")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'thiswillnotbesaved',
                    code: false,
                    title: 'atitle',
                    content: 'somecontent',
                    comments: [{ nr: 2, text: "Comment nr 2" }],
                    email: 'max@mustermann.de'
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.tokenNotValid.should.equal(true);
                    done();
                });
        });

        it('Creating a document with missing properties fails', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'thiswillnotbesaved'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.acknowledged.should.equal(false);
                    done();
                });
        });

        it('Updating a document works', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'newdocument',
                    title: 'updatedtitle',
                    content: 'updatedcontent',
                    comments: [{ nr: 75, text: "New comment" }]
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.acknowledged.should.equal(true);
                    done();
                });
        });

        it('Changes to document are found when reading the document', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    query: `
                    { doc (filename: "newdocument" ) {
                        filename, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.doc.filename.should.equal("newdocument");
                    res.body.data.doc.title.should.equal("updatedtitle");
                    res.body.data.doc.content.should.equal("updatedcontent");
                    res.body.data.doc.comments.should.deep.include({ nr: 75, text: "New comment" });
                    done();
                });
        });

        it('Updating a document with missing properties fails', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'newdocument'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.acknowledged.should.equal(false);
                    done();
                });
        });

        it('Updating a document without a JSON web token fails', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'newdocument',
                    title: 'updatedtitle',
                    content: 'updatedcontent',
                    comments: [{ nr: 75, text: "New comment" }]
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.tokenNotValid.should.equal(true);
                    done();
                });
        });

    });

    describe('Editing rights: sharing, accessing text and code documents', () => {

        before( async function() {
            /** Setup database collection by first wiping it and then adding a document */
            await db.dropDatabase();

            testMax = await db.collection("users").insertOne(testMaxData);
            testLisa = await db.collection("users").insertOne(testLisaData);

            /** Create a JSON web token needed for http requests */
            testMaxToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
            testLisaToken = jwt.sign({ email: "lisa@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
        });

        it('Array of allowed text docs for Max contains 3 documents', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    query: `{ allowedDocs (email: "max@mustermann.de", code: false) { filename } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.allowedDocs.should.have.lengthOf(3);
                    done();
                });
        });

        it('Max is not allowed to edit "lisa2", owned by Lisa', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'lisa2',
                    title: 'updatedtitle',
                    content: 'updatedcontent',
                    comments: [{ nr: 9, text: "Max comment" }]
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.notAllowed.should.equal(true);
                    done();
                });
        });

        it('Array of allowed code docs for Lisa contains 4 documents', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testLisaToken)
                .send({
                    query: `{ allowedDocs (email: "lisa@mustermann.de", code: true) { filename } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.allowedDocs.should.have.lengthOf(4);
                    done();
                });
        });

        it('Lisa is allowed to edit "kod2", owned by Max', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testLisaToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'kod2',
                    title: 'updatedtitle',
                    content: 'updatedcontent',
                    comments: [{ nr: 3, text: "My new comment" }]
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.acknowledged.should.equal(true);
                    done();
                });
        });

        it('Updating the array of users allowed to edit works', (done) => {
            chai.request(server)
                .put("/updateusers")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'kod2',
                    allowedusers: [
                        "max@mustermann.de",
                        "pelle@mustermann.de",
                        "johnny@mustermann.de"
                    ]
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.acknowledged.should.equal(true);
                    done();
                });
        });

        it('After update: array of allowed code docs is 1 item shorter', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testLisaToken)
                .send({
                    query: `{ allowedDocs (email: "lisa@mustermann.de", code: true) { filename } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.allowedDocs.should.have.lengthOf(3);
                    done();
                });
        });

        it('Lisa is no longer allowed to edit "kod2", owned by Max', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testLisaToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'kod2',
                    title: 'updatedtitle',
                    content: 'updatedcontent',
                    comments: [{ nr: 3, text: "My new comment" }]
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.notAllowed.should.equal(true);
                    done();
                });
        });

        it('Trying to send invite works', (done) => {
            chai.request(server)
                .post("/sendinvite")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    recipient: config.testrecipient,
                    inviterName: 'Max',
                    filename: 'meinbuch',
                    title: 'Das Buch'
                })
                .end((err, res) => {
                    res.should.have.status(202);
                    res.body.inviteSent.should.equal(true);
                    done();
                });
        });

        it('Trying to send an invite without a JSON web token fails', (done) => {
            chai.request(server)
                .post("/sendinvite")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    recipient: 'notactuallysent@whentesting.com',
                    inviterName: 'Max',
                    filename: 'meinbuch',
                    title: 'Das Buch'
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.tokenNotValid.should.equal(true);
                    done();
                });
        });

        it('Trying to send an invite without being document owner fails', (done) => {
            chai.request(server)
                .post("/sendinvite")
                .set('x-access-token', testLisaToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    recipient: 'notactuallysent@whentesting.com',
                    inviterName: 'Max',
                    filename: 'meinbuch',
                    title: 'Das Buch'
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.notAllowed.should.equal(true);
                    done();
                });
        });

        it('Adding a not yet registered user to allowed users array works', (done) => {
            chai.request(server)
                .put("/updateusers")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'kod2',
                    allowedusers: [
                        "max@mustermann.de",
                        "pelle@mustermann.de",
                        "johnny@mustermann.de",
                        "iamnotregistered@mustermann.de"
                    ]
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.acknowledged.should.equal(true);
                    done();
                });
        });

        it('After update: array of allowed users contains the new e-mail', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    query: `{ doc (filename: "kod2" ) {
                        filename, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.body.data.doc.allowedusers.should.deep.include('iamnotregistered@mustermann.de');
                    done();
                });
        });

    });

    describe('Generating PDF', () => {

        before( async function() {
            /** Setup database collection by first wiping it and then adding a document */
            await db.dropDatabase();

            testMax = await db.collection("users").insertOne(testMaxData);

            /** Create a JSON web token needed for http requests */
            testMaxToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});


            /** Remove any previous PDF file before running tests */
            const file = path.join(__dirname, '../temppdf/temp.pdf');
            if(fs.existsSync(file)) { fs.unlinkSync(file); };

        });

        it('Generating PDF returns expected HTTP status', (done) => {
            chai.request(server)
                .post("/printpdf")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    html: "<p>lorem ipsum</p>"
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('Check that a PDF file was generated', (done) => {
            const file = path.join(__dirname, '../temppdf/temp.pdf');
            assert.isOk(fs.existsSync(file));
            done();
        });

    });

});
