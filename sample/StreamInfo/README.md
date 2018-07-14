# OpenTok Stream Info Node

This is a simple demo app that shows how to use the OpenTok Node.js SDK to get
OpenTok stream information

It is based on the Hello World sample app.

## Running the App

First, download the dependencies using [npm](https://www.npmjs.org) in this directory:

```
$ npm install
```

Next, add your own API Key and API Secret to the environment variables. There are a few ways to do
this but the simplest would be to do it right in your shell:

```
$ export API_KEY=0000000
$ export API_SECRET=abcdef1234567890abcdef01234567890abcdef
```

Finally, start the app using node:

```
$ node index.js
```

Visit <http://localhost:3000> in your browser.

Once the client publishes the stream, it calls an endpoint on the sample app server
(/session/:sessionId/stream/:streamId). The server calls the `OpenTok.getStream()` method
and logs the stream info to the server console:

```javascript
app.get('/session/:sessionId/stream/:streamId', function(req) {
  opentok.getStream(req.params.sessionId, req.params.streamId, function(error, streamInfo) {
    console.log('streamInfo', streamInfo);
  });
});
```

This demo application is intentionally simple.

Instead of having the web client make a call to your server when the stream is created, you
can have the OpenTok cloud make HTTP POST requests to a callback URL on your server when streams
are created and destroyed. See the OpenTok [Session Monitoring developer
guide](https://tokbox.com/developer/guides/session-monitoring/).
