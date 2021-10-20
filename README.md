[![Build Status](https://app.travis-ci.com/xlsson/bth-editor-server.svg?branch=main)](https://app.travis-ci.com/xlsson/bth-editor-server)

# bth-editor-server
Server for the reactjs collaborative editor ([xlsson/bth-reactjs-editor](https://github.com/xlsson/bth-reactjs-editor)), for the course JavaScript-based web frameworks at Blekinge Technical University (BTH). The server works as an API for a MongoDB database, stored
in the MongoDB Atlas cloud.

### Installing modules
To install a new module in the project, use `npm install <module-name>` in the
project root.

### Start the API ( = the server)
`npm run start` starts the server without setting the NODE_ENV variable, using
the production database.

`npm run production` starts the server in production mode, with the NODE_ENV
variable set to `production`, using the production database.

`npm run dev` starts the server in dev = development mode,  with the NODE_ENV
variable set to `dev`, using the test database.

`npm run watch` does the same thing as `npm run dev`, but also restarts the
server automatically whenever a file is updated.

### Available routes
The following routes are available:

`/graphql` – POST method, takes a graphql query object as its body.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns an object with the requested data.
If the token does not verify, it returns `{ tokenNotValid: true }`.
Return status: 200.

`/createone` – PUT method, takes `filename`, `title`, `content` and `email` as arguments.
Takes a JWT token as an `x-access-token` header.
If the token verifies, and the
`filename` property does not already exists in database, it saves the
created document in the database, and returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1 }`.
If the token does not verify, it returns `{ tokenNotValid: true }`.
If the token verifies, but the filename already exists, it returns `{ tokenIsVerified: true }`.
Return status: 201.

`/updateone` – PUT method, takes `filename`, `title` and `content` as arguments.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1 }`.
If the token does not verify, it returns `{ tokenNotValid: true }`.
Return status: 200.

`/createuser` – POST method, takes `name`, `email` and `password` as arguments.
If `email`is unique, it adds a new user and returns `{ acknowledged: true, insertedId: <ObjectId> }`.
If `email` already exists, it does not save the user, and instead returns
`{ acknowledged: true }`.
Return status: 201.

`/updateusers` – PUT method, takes `filename` and `allowedusers` (an array) as arguments.
The array is an array of users who should be allowed to edit the document.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1, allowedusers: <array> }`.
If the token does not verify, it returns `{ tokenNotValid: true }`.
Return status: 200.

`/verifylogin` – POST method, takes `email` and `password` as arguments.
Tries to find user in db. Checks password against password hash stored in db.
Returns `{ userexists: true, verified: true,  name: <name>, email: <email> }` if
both succeed. Returns `{ userexists: true, verified: false,  name: <name>, email: <email> }`
if password is wrong. Returns `{ userexists: false }` if user is not in db.
Return status: 201.

`/printpdf` – POST method, takes `html` as an argument. `html` is the currentContent
with some extra HTML elements wrapped around it for style.
Creates a PDF file of the current document and opens it in a new tab for downloading or printing. Returns a blob of binary data, representing the pdf file.

`/invitesend` – GET method, takes `recipient` (e-mail), `inviterName`, `inviterEmail`, `filename` and `title` as arguments.
Sends an e-mail using SendGrid to `recipient`, with an invitation to register and
edit `filename`.
