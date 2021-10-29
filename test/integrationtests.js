/**
 * @fileOverview Integration tests using Mocha with the Chai and Chai-Http libraries
 * A local MongoDB database is created for the tests.
 * @author - xlsson
 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const mongo = require("mongodb").MongoClient;

const jwt = require('jsonwebtoken');
const config = require('../db/testconfig.json');

var testUser1Data = require('./testUser1Data.js');
var testUser2Data = require('./testUser2Data.js');

var client;
var db;

// var testUser1Id;
var testUser1;
var testUser1Token;
var testUser2;
var testUser2Token;

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

        // testUser1Id = testUser1.insertedId.toString();

    });

    after( function(done) {
        /** Run once after the last test block: closes database connection */
        client.close(done);
    });

    describe('Creating new user, logging in, reading a document', () => {

        before( async function() {
            /** Setup database collection by first wiping it and then adding a document */
            await db.dropDatabase();

            testUser1 = await db.collection("users").insertOne(testUser1Data);

            /** Create a JSON web token needed for http requests */
            testUser1Token = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
        });


        it('Reading a document works', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testUser1Token)
                .send({
                    query: `
                    { doc (filename: "meinbuch" ) {
                        filename, title, content, allowedusers, ownerName,
                        ownerEmail, comments { nr, text } } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.doc.filename.should.equal("meinbuch");
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

        it('The new user can be found in the database', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testUser1Token)
                .send({
                    query: `{ users { email } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.users.should.deep.include({ email: 'unique@emailadress.com' });
                    done();
                });
        });

        it('Registering an already existing user fails', (done) => {
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

        it('Logging in existing user works', (done) => {
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

        it('Logging in with wrong password fails', (done) => {
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

        it('Logging in with non-existing user fails', (done) => {
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

    describe('Creating and updating a document', () => {

        before( async function() {
            /** Setup database collection by first wiping it and then adding a document */
            await db.dropDatabase();

            testUser1 = await db.collection("users").insertOne(testUser1Data);

            /** Create a JSON web token needed for http requests */
            testUser1Token = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
        });

        it('Creating a new document works', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testUser1Token)
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

        it('Reading newly created document works', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testUser1Token)
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
                .set('x-access-token', testUser1Token)
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
                .set('x-access-token', testUser1Token)
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
                .set('x-access-token', testUser1Token)
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

        it('Updating a document with missing properties fails', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testUser1Token)
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

    describe('Editing rights: sharing, accessing', () => {

        before( async function() {
            /** Setup database collection by first wiping it and then adding a document */
            await db.dropDatabase();

            testUser1 = await db.collection("users").insertOne(testUser1Data);
            testUser2 = await db.collection("users").insertOne(testUser2Data);

            /** Create a JSON web token needed for http requests */
            testUser1Token = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
            testUser2Token = jwt.sign({ email: "lisa@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
        });

        it('Array of allowed text docs contains expected number of documents', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testUser1Token)
                .send({
                    query: `{ allowedDocs (email: "max@mustermann.de", code: false) { filename } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.allowedDocs.should.have.lengthOf(3);
                    done();
                });
        });

        it('Array of allowed code docs contains expected number of documents', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testUser2Token)
                .send({
                    query: `{ allowedDocs (email: "lisa@mustermann.de", code: true) { filename } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.allowedDocs.should.have.lengthOf(4);
                    done();
                });
        });

    });

});
