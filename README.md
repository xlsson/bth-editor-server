![Github Actions](https://github.com/xlsson/bth-editor-server/actions/workflows/node.js.yml/badge.svg)

# bth-editor-server
Server for CirrusDocs ([xlsson/bth-reactjs-editor](https://github.com/xlsson/bth-reactjs-editor)), a real-time collaborative editor. A student project for the course JavaScript-based web frameworks at Blekinge Institute of Technology (BTH). The server works as an API for a MongoDB database, stored in the MongoDB Atlas cloud.

### Dependencies
The project uses the `Express` framework for routing. The packages `morgan` (HTTP request logging), `CORS` (cross-origin resource sharing), `bodyParser` (json and urlencoded parsing), `jsonwebtoken` (JSON web token utilisation) and `express-graphql` and `GraphQL` (API query language) are used as middleware.

Tests use `mocha` (test framework) and `nyc` (code coverage). The test script also uses `cross-env` (for cross-OS compatibility). In the tests, `chai` (assertion library), `chaiHttp` (http integration tests library) and `mongodb` (MongoDB driver) are used.

The project's other dependencies are `Socket.IO` (web socket communication), `bcrypt.js` (encryption), `sendgrid` (SendGrid mail service) and `html-pdf-node` (HTML to PDF).

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
Tests are executed by running `npm test`. A local test database is created when the
tests are run, to avoid corrupting the production database.

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
Takes a JWT token as an `x-access-token` header. If the token verifies, it returns an object with the requested data with status 200.
If the token does not verify, it returns `{ tokenNotValid: true }` with status 401.
The server is built to respond to the following GraphQL query objects used by the frontend:

`{ allowedDocs (email: <email>, code: <code>) { filename } }`, where `<email>` is the current user's email, and `<code>`  is set to `true` if code mode is currently on, otherwise `false`. Returns the filenames for all documents that the user is allowed to edit, within the current mode.

`{ doc (filename: <filename> ) { filename, title, content, allowedusers, ownerName, ownerEmail, comments { nr, text } } }` returns the document with the corresponding filename.

`{ users { email } }` returns the e-mail addresses of all users in the database.

#### `/printpdf` (POST)
Takes `html` as its only query parameter. `html` is the currentContent
with some extra HTML elements wrapped around it for style.
Creates a PDF file of the current document and opens it in a new tab for downloading or printing. Returns a blob of binary data, representing the pdf file.

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
