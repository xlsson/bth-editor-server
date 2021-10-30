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

    /** Setup: run once before all tests. Create the database connection */
    before( async function() {
        client = await mongo.connect("mongodb://localhost/test", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        db = await client.db();

    });

    /** Teardown: run once after all tests. Close the database connection */
    after( function(done) {
        client.close(done);
    });

    describe('1. Creating a new user, logging in, reading documents', () => {

        /** Setup:
         * Drop the database
         * Populate it with two users
         * Create JSON web tokens needed for http requests
         */
        before( async function() {
            await db.dropDatabase();
            testMax = await db.collection("users").insertOne(testMaxData);
            testLisa = await db.collection("users").insertOne(testLisaData);
            testMaxToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
            testLisaToken = jwt.sign({ email: "lisa@mustermann.de" }, config.jwtsecret, { expiresIn: '9'});
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
                        filename, code, title, content, allowedusers, ownerName,
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
                        filename, code, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.tokenNotValid.should.equal(true);
                    done();
                });
        });

        it('Reading a document with an expired JSON web token fails', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testLisaToken)
                .send({
                    query: `
                    { doc (filename: "lisasbok" ) {
                        filename, code, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end(async (err, res) => {
                    function waitForTokenToExpire() {
                        return new Promise(resolve => setTimeout(resolve, 10));
                    }
                    await waitForTokenToExpire();
                    res.should.have.status(401);
                    res.body.tokenNotValid.should.equal(true);
                    done();
                });
        });

        it('Registering a new, unique user works', (done) => {
            chai.request(server)
                .post("/createuser")
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
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

    describe('2. Creating and updating documents', () => {

        /** Setup:
         * Drop the database
         * Populate it with one user
         * Create a JSON web token needed for http requests
         */
        before( async function() {
            await db.dropDatabase();
            testMax = await db.collection("users").insertOne(testMaxData);
            testMaxToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
        });

        it('Creating a new document works', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/json')
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
                .send(JSON.stringify({
                    query: `
                    { doc (filename: "newdocument" ) {
                        filename, code, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.doc.filename.should.equal("newdocument");
                    res.body.data.doc.code.should.equal(false);
                    res.body.data.doc.title.should.equal("title");
                    res.body.data.doc.content.should.equal("somecontent");
                    res.body.data.doc.comments.should.deep.equal([{ nr: 2, text: "Comment nr 2" }]);
                    res.body.data.doc.allowedusers.should.deep.equal([ "max@mustermann.de" ]);
                    done();
                });
        });

        it('Creating a document with an existing filename fails', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/json')
                .send({
                    filename: 'newdocument',
                    code: false,
                    title: 'atitle',
                    content: 'somecontent',
                    comments: [],
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
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
                .send({
                    filename: 'thiswillnotbesaved'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.acknowledged.should.equal(false);
                    done();
                });
        });

        it('Reading the not saved document fails', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .send({
                    query: `
                    { doc (filename: "thiswillnotbesaved" ) {
                        filename, code, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.own.property("errors");
                    done();
                });
        });

        it('Updating a document works', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testMaxToken)
                .set('content-type', 'application/json')
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
                        filename, code, title, content, allowedusers, ownerName,
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
                .set('content-type', 'application/json')
                .send({
                    filename: 'meinbuch'
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
                .set('content-type', 'application/json')
                .send({
                    filename: 'meinbuch',
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

        it('Document remains unchanged after failing updates', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({
                    query: `
                    { doc (filename: "meinbuch" ) {
                        filename, code, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.doc.filename.should.equal("meinbuch");
                    res.body.data.doc.code.should.equal(false);
                    res.body.data.doc.title.should.equal("Das Buch");
                    res.body.data.doc.content.should.equal("Das ist ein buch. Das ist mein Buch");
                    res.body.data.doc.comments.should.deep.equal([
                        { nr: 1, text: "Kommentar 1" },
                        { nr: 2, text: "Kommentar 2" }
                    ]);
                    res.body.data.doc.allowedusers.should.deep.equal([ "max@mustermann.de", "lisa@mustermann.de", "johnny@mustermann.de" ]);
                    done();
                });
        });
    });

    describe('3. Editing rights: sharing, inviting, accessing documents', () => {

        /** Setup:
         * Drop the database
         * Populate it with two users
         * Create JSON web tokens needed for http requests
         */
        before( async function() {
            await db.dropDatabase();
            testMax = await db.collection("users").insertOne(testMaxData);
            testLisa = await db.collection("users").insertOne(testLisaData);
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
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
                .send({
                    filename: 'kod2',
                    title: 'updatedtitle',
                    content: 'updatedcontent',
                    comments: []
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
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
                .send({
                    filename: 'kod2',
                    title: 'updatedtitle',
                    content: 'updatedcontent',
                    comments: []
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
                .set('content-type', 'application/json')
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
                .set('content-type', 'application/json')
                .send({
                    recipient: config.testrecipient,
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
                .set('content-type', 'application/json')
                .send({
                    recipient: config.testrecipient,
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
                .set('content-type', 'application/json')
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
                        filename, code, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.body.data.doc.allowedusers.should.deep.include('iamnotregistered@mustermann.de');
                    done();
                });
        });

    });

    describe('4. Generating a PDF file', () => {

        /** Setup:
         * Drop the database
         * Populate it with one user
         * Create a JSON web token needed for http requests
         * Check for already existing PDF file - remove it if it exists
         */
        before( async function() {
            await db.dropDatabase();
            testMax = await db.collection("users").insertOne(testMaxData);
            testMaxToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});

            const file = path.join(__dirname, '../temppdf/temp.pdf');
            if(fs.existsSync(file)) { fs.unlinkSync(file); };

        });

        it('Generating PDF returns expected HTTP status', (done) => {
            chai.request(server)
                .post("/printpdf")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testMaxToken)
                .send({ html: "<p>lorem ipsum</p>" })
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
