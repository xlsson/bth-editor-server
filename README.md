![https://github.com/xlsson/bth-editor-server/actions](https://github.com/xlsson/bth-editor-server/actions/workflows/node.js.yml/badge.svg)

![CirrusDocs](https://github.com/xlsson/bth-reactjs-editor/blob/main/src/img/logo.png?raw=true)

# bth-editor-server
Server for CirrusDocs ([xlsson/bth-reactjs-editor](https://github.com/xlsson/bth-reactjs-editor)), a real-time collaborative editor. A student project for the course JavaScript-based web frameworks at Blekinge Institute of Technology (BTH). The server works as an API for a MongoDB database, stored in the MongoDB Atlas cloud.

### Dependencies
The project uses the `Express` framework for routing. The packages `morgan` (HTTP request logging), `CORS` (cross-origin resource sharing), `bodyParser` (json and urlencoded parsing), `jsonwebtoken` (JSON web token utilisation) and `express-graphql` and `GraphQL` (API query language) are used as middleware.

Tests use `mocha` (test framework) and `nyc` (code coverage). The test script also uses `cross-env` (for cross-OS compatibility). In the tests, `chai` (assertion library), `chaiHttp` (http integration tests library) and `mongodb` (MongoDB driver) are used.

The project's other dependencies are `Socket.IO` (web socket communication), `bcrypt.js` (encryption), `sendgrid` (SendGrid mail service) and `html-pdf-node` (HTML to PDF).

### Installation instructions
1. Create a MongoDB database. To populate the database along the correct pattern, you can follow the data pattern described by `test/testMaxData.js`, or copy and use the functions in `integrationtests.js` to create and populate your own local database.

2. Run `git clone https://github.com/xlsson/bth-editor-server` to clone this repository.

3. Run `npm install` to install the dependencies listed in `package.json`.

4. Create a `./temppf` folder, for temporary PDF file storage.

5. Create the JSON-files `.db/config.json` and `.db/testconfig.json`. `.db/config.json` should include the properties `username`, `password`, and `dbname` for your database, a random `jwtsecret` string used to create JSON web tokens, and two properties for SendGrid (for the e-mail sharing service): `sendgridsender` (e-mail address) and `sendgridsecret`. To get the last two properties, create a SendGrid account.

### Installing new modules
To install a new module in the project, use `npm install <module-name>` in the
project root.

### Starting the server
`npm run start` starts the server without setting the NODE_ENV variable, using
the production database.

`npm run production` starts the server in production mode, with the NODE_ENV
variable set to `production`, using the production database.

`npm run dev` starts the server in dev = development mode,  with the NODE_ENV
variable set to `dev`, using the test database.

`npm run watch` does the same thing as `npm run dev`, but also restarts the
server automatically whenever a file is updated.

### Integration tests
Tests are done using Mocha with the chai and chai-http libraries. A local test database is created when the tests are run, to avoid corrupting the production database. The tests are hooked up to the Github CI: Github Actions, which run the tests whenever the repo is pushed. The test script `npm test` uses the `--invert` and `--grep` flags, and takes one parameter. The tests will exclude any test including the parameter value in its description. For example, `npm test "PDF"` will exclude any tests with PDF in its description. That command is run when tests are performed using the Github Actions CI. Ro run all test, use `npm test ""`.

Github Actions CI status and workflow file: https://github.com/xlsson/bth-editor-server/actions

### API
The following routes are available:

#### `/createone` (PUT)
Takes `filename`, `code`, `title`, `content`, `comments` and `email` as body properties.
Takes a JWT token as an `x-access-token` header.
If the token verifies, and the
`filename` property does not already exists in database, it saves the
created document in the database, and returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1 }` with status 201.
If the token does not verify, it returns `{ tokenNotValid: true }` with status 401.
If the token verifies, but a property is missing, or the filename already exists, it returns `{ acknowledged: false }` with status 400.

#### `/createuser` (POST)
Takes `name`, `email` and `password` as body properties.
If `email` is unique, it adds a new user and returns `{ acknowledged: true, insertedId: <ObjectId> }` with return status 201. If `email` already exists, it does not save the user, and instead returns
`{ acknowledged: false }` with return status 400.

#### `/graphql` (POST)
Takes a GraphQL query object as its body.
Takes a JWT token as an `x-access-token` header. The server is built to respond to the following GraphQL query objects used by the frontend:

`{ allowedDocs (email: <email>, code: <code>) { filename } }`, where `<email>` is the current user's email, and `<code>`  is set to `true` if code mode is currently on, otherwise `false`. Returns the filenames for all documents that the user is allowed to edit, within the current mode.

`{ users { email } }` returns the e-mail addresses of all users in the database.

`{ doc (filename: <filename> ) { filename, title, content, allowedusers, ownerName, ownerEmail, comments { nr, text } } }` returns the document with the corresponding filename.

For the `{ doc...`-query, if no file is found,  it returns `{ errors: <array> }`, describing that the filename property cannot be set to null. In all other cases, it returns an object with the requested data. If the token does not verify, it returns `{ tokenNotValid: true }` with status 401. In all other cases, it returns status 200.


#### `/printpdf` (POST)
Takes `html` as its only query parameter. `html` is the currentContent
with some extra HTML elements wrapped around it for style.
Creates a PDF file of the current document and saves it to the path `../temppdf/temp.pdf`. It creates a readable stream, which is pushed to the response object through the .pipe() method. Return status 200.

#### `/sendinvite` (POST)
Takes `recipient` (e-mail), `inviterName`, `filename` and `title` as body properties.
Takes a JWT token as an `x-access-token` header.
Sends an e-mail using SendGrid to `recipient`, with an invitation to register and
edit `filename`.
If the token does not verify, it returns `{ tokenNotValid: true }` with status 401. If the token verifies, but the user is not the owner of the document, it returns `{ notAllowed: true }` with status 401. If authentication is successful, it returns `{ inviteSent: true }` with status 202 if message is successfully sent, or `{ inviteSent: false }` with status 500 if it was not sent.

#### `/updateone` (PUT)
Takes `filename`, `title`, `content` and `comments` as body properties.
Takes a JWT token as an `x-access-token` header.
If the token verifies, and the user is among the users with editing rights, it returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1 }` with status 200.
If the token does not verify, it returns `{ tokenNotValid: true }` with status 401.
If the token verifies, but the user is not among the users allowed to edit, it returns `{ notAllowed: true }` with status 401.
If the token verifies, but one or more properties is missing, it returns `{ acknowledged: false }` with status 400.

#### `/updateusers` (PUT)
Takes `filename` and `allowedusers` (an array) as body properties.
The array is an array of users who should be allowed to edit the document.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1, allowedusers: <array> }` with status 200.
If the token does not verify, it returns `{ tokenNotValid: true }` with status 401.
If the token verifies, but the user is not the owner of the document, it returns `{ notAllowed: true }` with status 401.

#### `/verifylogin` (POST)
Takes `email` and `password` as body properties.
Tries to find user in db. Checks password against password hash stored in db.
Returns `{ userexists: true, verified: true,  name: <name>, email: <email>, token: <token> }` with status 201 if
both succeed. Returns `{ userexists: true, verified: false,  name: <name>, email: <email> }` with status 401
if password is wrong. Returns `{ userexists: false }` with status 401 if user is not in db.
