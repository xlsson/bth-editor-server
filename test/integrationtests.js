process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const mongo = require("mongodb").MongoClient;

const jwt = require('jsonwebtoken');
const config = require('../db/config.json');

var client;

var testUserData;
var testUserId;
var testUserToken;

chai.should();

chai.use(chaiHttp);

describe('Test database routes', function() {

    before( async function() {
    // runs once before the first test in this block: drops database
        client = await mongo.connect("mongodb://localhost/test", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const db = await client.db();

        // Setup database collection by first wiping it and then adding a document
        await db.dropDatabase();

        testUserData = {
            name: "Max",
            docs: [
                {
                    filename: "meinbuch",
                    title: "Das Buch",
                    content: "Das ist ein buch. Das ist mein Buch",
                    allowedusers: [ "max@mustermann.de", "lisa@mustermann.de", "johnny@mustermann.de" ]
                },
                {
                    filename: "daszweite",
                    title: "Buch 2",
                    content: "Hier ist ein Buch, das ich geschrieben habe.",
                    allowedusers: [ "pelle@mustermann.de", "johnny@mustermann.de" ]
                }
            ],
            email: "max@mustermann.de",
            password: "$2a$10$sDMqioEmfkbrHr2TvD/IrOoJ1ZanQfrQ.03hym6SKNdSZ59oicUry"
        }

        let testUser = await db.collection("users").insertOne(testUserData);

        testUserId = testUser.insertedId.toString();

        // Create a JSON web token needed for http requests
        testUserToken = jwt.sign({ email: "max@mustermann.de" }, config.jwtsecrettest, { expiresIn: '1h'});
    });

    after( function(done) {
    // runs once after the last test in this block: closes database connection
        client.close(done);
    });

    describe('Read all documents: GET /readall/<email>', () => {
        it('Request returns status 200 and token is verified', (done) => {
            chai.request(server)
                .get("/readall/johnny@mustermann.de")
                .set('x-access-token', testUserToken)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an("object");
                    res.body.tokenIsVerified.should.equal(true);
                    res.body.allFilenames[0].should.equal("meinbuch");
                    done();
                });
        });
    });
    
    describe('Create one document: PUT /createone', () => {
        it('Request returns status 201 is an object, where property acknowledged is true', (done) => {
            chai.request(server)
                .put("/createone")
                .set('x-access-token', testUserToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'afilename',
                    title: 'atitle',
                    content: 'somecontent',
                    email: 'lisa@mustermann.de'
                })
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.be.an("object");
                    res.body.acknowledged.should.equal(true);
                    done();
                });
        });
    });

    describe('Read one document: GET /readone/<filename>', () => {
        it('Request returns status 200 and result body contains expected property', (done) => {
            chai.request(server)
                .get(`/readone/${testUserData.docs[0].filename}`)
                .set('x-access-token', testUserToken)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an("object");
                    res.body.title.should.equal("Das Buch");
                    done();
                });
        });
    });

    describe('Update one document: PUT /updateone', () => {
        it('Request returns status 200 and contains expected property values', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('x-access-token', testUserToken)
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: testUserData.docs[0].filename,
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
