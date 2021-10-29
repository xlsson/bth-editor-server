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

var client;

var testUser1Id;
var testUser1Token;

chai.should();

chai.use(chaiHttp);

describe('Test database routes', function() {

    before( async function() {
    /** Run once before the first test in this block: drops the database */
        client = await mongo.connect("mongodb://localhost/test", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const db = await client.db();

        /** Setup database collection by first wiping it and then adding a document */
        await db.dropDatabase();

        let testUser1 = await db.collection("users").insertOne(testUser1Data);

        testUser1Id = testUser1.insertedId.toString();

        /** Create a JSON web token needed for http requests */
        testUser1Token = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecret, { expiresIn: '1h'});
    });

    after( function(done) {
    /** Run once after the last test in this block: closes database connection */
        client.close(done);
    });

    describe('PUT /createone - Create a new document', () => {

        afterEach(function() {
            /** Körs efter varje test i denna describe = PUT createone */
        });

        after(function() {
            console.log("Nollställ/rensa upp någonting efter detta block?");
        });

        it('Create text document = acknowledged: true, status 201', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testUser1Token)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'afilename',
                    code: false,
                    title: 'atitle',
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
        it('Create code document = acknowledged: true, status 201', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testUser1Token)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'codefilename',
                    code: true,
                    title: 'atitle',
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
        it('Already existing filename = acknowledged: false, status 201', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testUser1Token)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'afilename',
                    code: false,
                    title: 'atitle',
                    content: 'somecontent',
                    comments: [{ nr: 2, text: "Comment nr 2" }],
                    email: 'max@mustermann.de'
                })
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.acknowledged.should.equal(false);
                    done();
                });
        });
        it('Missing properties = acknowledged: false, status 400', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testUser1Token)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'afilename2'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.acknowledged.should.equal(false);
                    done();
                });
        });
        it('Missing JSON web token header = status 401', (done) => {
            chai.request(server)
                .put("/createone")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'anotherfilename',
                    code: false,
                    title: 'atitle',
                    content: 'somecontent',
                    comments: [{ nr: 2, text: "Comment nr 2" }],
                    email: 'max@mustermann.de'
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });

    describe('/graphql - Get all docs for one user', () => {
        it('Request returns status 200 and returns expected document', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testUser1Token)
                .send({
                    query: '{ allowedDocs (email: "johnny@mustermann.de", code: false) { filename } }'
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.should.be.an("object");
                    res.body.data.allowedDocs[0].filename.should.equal("meinbuch");
                    done();
                });
        });
    });



    describe('Read one document, using a graphql route', () => {
        it('Request returns status 200 and result body contains expected property', (done) => {
            chai.request(server)
                .post("/graphql")
                .set('content-type', 'application/json')
                .set('Accept', 'application/json')
                .set('x-access-token', testUser1Token)
                .send({
                    query: `{ doc (filename: "${testUser1Data.docs[0].filename}") { filename, title, content, allowedusers, ownerName, ownerEmail } }`
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.data.should.be.an("object");
                    res.body.data.doc.title.should.equal("Das Buch");
                    done();
                });
        });
    });

    describe('Update one document: PUT /updateone', () => {
        it('Request returns status 200 and contains expected property values', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testUser1Token)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: testUser1Data.docs[0].filename,
                    title: 'newtitle',
                    content: 'newcontent'
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.acknowledged.should.equal(true);
                    res.body.modifiedCount.should.equal(1);
                    done();
                });
        });
    });
});
