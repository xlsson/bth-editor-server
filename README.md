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

`/readall` – GET method, takes no arguments.
Returns a JSON-formatted array with all documents (and all their properties).

`/readone/:<docId>` – GET method, takes `docid` as argument.
If the id is found, it returns
`[ { "_id": <id>, "filename": <filename>, "title": <title>, "content": <content>, "exists": "true" } ]`.
If the id is not found, it returns `[ { "exists": "false" } ]`.

`/createone` – POST method, takes `filename`, `title` and `content` as arguments.
Checks if the `filename` property does not already exists in database. If not, it saves the
created document in the database, and returns `[ { "exists": "false", "acknowledged": "true", "insertedId": "<id>" } ]`.
If the filename already exists, it does not save the document, and instead returns
`[ { "_id": <id>, "filename": <filename>, "title": <title>, "content": <content>, "exists": "true" } ]`.

`/updateone` – PUT method, takes `docid`, `title` and `content` as arguments.
This route has no return value.
