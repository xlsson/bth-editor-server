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

`/readall/:<email>` – GET method, takes a user's unique id = `email` as argument.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns `{ allFilenames: <array>, tokenIsVerified: true }`.
`<array>` is an array with all filenames where the email in question is among the allowed users.
If the token does not verify, it returns `{ tokenIsVerified: false }`.
Return status: 200.

`/readone/:<filename>` – GET method, takes `filename` as argument.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns
`{ "ownerName": <name>, "ownerEmail": <email>, "title": <title>, "content": <content>, "allowedusers": <array>,  tokenIsVerified: true }`.
`<array>` is an array of email addresses of the users allowed to edit.
If the token does not verify, it returns `{ tokenIsVerified: false }`.
Return status: 200.

`/allusers` – GET method, takes no argument.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns
`{ "allUsers": <array>, tokenIsVerified: true }`.
`<array>` is an array of email addresses of all users in the collection.
If the token does not verify, it returns `{ tokenIsVerified: false }`.
Return status: 200.

`/createone` – PUT method, takes `filename`, `title`, `content` and `email` as arguments.
Takes a JWT token as an `x-access-token` header.
If the token verifies, and the
`filename` property does not already exists in database, it saves the
created document in the database, and returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1, tokenIsVerified: true }`.
If the token does not verify, it returns `{ acknowledged: false, tokenIsVerified: false }`.
If the token verifies, but the filename already exists, it returns `{ acknowledged: false, tokenIsVerified: true }`.
Return status: 201.

`/updateone` – PUT method, takes `filename`, `title` and `content` as arguments.
Takes a JWT token as an `x-access-token` header.
If the token verifies, it returns `{ acknowledged: true, modifiedCount: 1, upsertedId: null, upsertedCount: 0, matchedCount: 1 }`.
If the token does not verify, it returns `{ acknowledged: false, tokenIsVerified: false }`.
Return status: 200.

`/createuser` – POST method, takes `name`, `email` and `password` as arguments.
If `email`is unique, it adds a new user and returns `{ acknowledged: true, insertedId: <ObjectId> }`.
If `email` already exists, it does not save the user, and instead returns
`{ acknowledged: true }`.
Return status: 201.

`/verifylogin` – POST method, takes `email` and `password` as arguments.
Tries to find user in db. Checks password against password hash stored in db.
Returns `{ userexists: true, verified: true,  name: <name>, email: <email> }` if
both succeed. Returns `{ userexists: true, verified: false,  name: <name>, email: <email> }`
if password is wrong. Returns `{ userexists: false }` if user is not in db.
Return status: 201.
