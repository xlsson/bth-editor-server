process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');
const mongo = require("mongodb").MongoClient;

var client;

var testDocId;

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

        let testDoc = await db.collection("docs").insertOne({
            filename: "justanothername",
            title: "justanothertitle",
            content: "justsomemorecontent"
        });

        testDocId = testDoc.insertedId.toString();
    });

    after( function(done) {
    // runs once after the last test in this block: closes database connection
        client.close(done);
    });

    describe('Read all documents: GET /readall', () => {
        it('Request returns status 200 and is array', (done) => {
            chai.request(server)
                .get("/readall")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an("array");
                    done();
                });
        });
    });

    describe('Create one document: POST /createone', () => {
        it('Request returns status 201 and index 0 is an object', (done) => {
            chai.request(server)
                .post("/createone")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'afilename',
                    title: 'atitle',
                    content: 'somecontent'
                })
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.be.an("array");
                    res.body[0].should.be.an("object");
                    res.body[0].exists.should.equal("false");
                    done();
                });
        });
    });

    describe('Read one document: GET /readone/<docid>', () => {
        it('Request returns status 200 and result body contains expected property', (done) => {
            chai.request(server)
                .get(`/readone/${testDocId}`)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an("array");
                    res.body[0].should.be.an("object");
                    res.body[0].filename.should.equal("justanothername");
                    done();
                });
        });
    });

    describe('Update one document: PUT /updateone', () => {
        it('Request returns status 200 and res.body is an object', (done) => {
            chai.request(server)
                .put("/updateone")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    docid: testDocId,
                    title: 'newtitle',
                    content: 'newcontent'
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body[0].should.be.an("object");
                    res.body[0].title.should.equal("newtitle");
                    done();
                });
        });
    });
});
