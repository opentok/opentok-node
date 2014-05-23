# OpenTok Hello World Node

This is a simple demo app that shows how you can use the OpenTok Node SDK to create Sessions,
generate Tokens with those Sessions, and then pass these values to a JavaScript client that can
connect and conduct a group chat.

## Running the App

First, download the dependencies using [npm](https://www.npmjs.org) in this directory.

```
$ npm install
```

Next, add your own API Key and API Secret to the environment variables. There are a few ways to do
this but the simplest would be to do it right in your shell.

```
$ export API_KEY=0000000
$ export API_SECRET=abcdef1234567890abcdef01234567890abcdef
```

Finally, start the app using node

```
$ node index.js
```

Visit <http://localhost:3000> in your browser. Open it again in a second window. Smile! You've just
set up a group chat.

## Walkthrough

This demo application uses the [express web framework](http://expressjs.com/). It is a popular web
framework and similar to others. Its concepts won't be explained but can be explored further at the
website linked above.

### Server module (index.js)

The first thing done in this file is to require the the dependencies. We now have the express
framework, and most importantly the OpenTok SDK available.

```javascript
// Dependencies
var express = require('express'),
    OpenTok = require('../../lib/opentok');
```

Next the app performs some basic checks on the environment and initializes the express application
(`app`).

The first thing that we do with OpenTok is to initialize an instance. The very next thing we do is
create a Session. This application will be setting up a group chat, where anyone that loads the
page will be be connected to the same Session. So before we get started we need one `sessionId`,
and that will be used for every client that connects. In many applications, you would store this
value in a database. Once the Session is created and there are no errors, we store that `sessionId`
in our `app`. Then we call an `init` function when we know that the app is ready to start.

```javascript
// Initialize OpenTok and store it in the express app
var opentok = new OpenTok(apiKey, apiSecret);

// Create a session and store it in the express app
opentok.createSession(function(err, session) {
  if (err) throw err;
  app.set('sessionId', session.sessionId);
  // We will wait on starting the app until this is done
  init();
});
```

Now we are ready to configure some routes. We only need one GET route for the root path because this
application only has one page. Inside the route handler, we just need to get the three values a
client will need to connect: `sessionId`, `apiKey`, and `token`. The `sessionId` is stored in the
express app, so we get it from there. The `apiKey` is available from the outer scope. Last, we
generate a fresh `token` for this client so that it has permission to connect.

```javascript
app.get('/', function(req, res) {
  var sessionId = app.get('sessionId'),
      // generate a fresh token for this client
      token = opentok.generateToken(sessionId);

  // ...
  });
});

```

To finish the response we load a template called `index.ejs` in the `views/` directory, and pass in the
three values.

```php
  res.render('index.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token
  });
```

Finally, we have the `init` function that we called from inside the `createSession` callback. To
start the express app, it calls the `listen` method, and log that the app is ready.

```javascript
// Start the express app
function init() {
  app.listen(3000, function() {
    console.log('You\'re app is now ready at http://localhost:3000/');
  });
}
```

### Main Template (views/index.ejs)

This file simply sets up the HTML page for the client JavaScript application to run, imports the
JavaScript library, and passes the values created by the server into the client application
`public/js/helloworld.js`.

### JavaScript Applicaton (public/js/helloworld.js)

The group chat is mostly implemented in this file. At a high level, we connect to the given
Session, publish a stream from our webcam, and listen for new streams from other clients to
subscribe to.

For more details, read the comments in the file or go to the
[JavaScript Client Library](http://tokbox.com/opentok/libraries/client/js/) for a full reference.
