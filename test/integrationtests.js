process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app.js');

chai.should();

chai.use(chaiHttp);

describe('Read all documents', () => {
    describe('GET /readall', () => {
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
});

// describe('Read one document', () => {
//     describe('GET /readone/<docid>', () => {
//         it('Request returns status 200 and index 0 is an object', (done) => {
//             chai.request(server)
//                 .get("/readone/6142614335193fe5e5ac75b5")
//                 .end((err, res) => {
//                     res.should.have.status(200);
//                     res.body.should.be.an("array");
//                     res.body[0].should.be.an("object");
//                     done();
//                 });
//         });
//     });
// });

describe('Create one document', () => {
    describe('POST /createone', () => {
        it('Request returns status 201 and index 0 is an object', (done) => {
            chai.request(server)
                .post("/createone")
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    filename: 'createfilename2',
                    title: 'createtitle2',
                    content: 'createcontent2'
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
});
