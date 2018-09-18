# OpenTok Broadcast Sample for Node

This is a simple demo app that shows how you can use the OpenTok Node SDK to create a
[live-streaming broadcasts](https://tokbox.com/developer/guides/broadcast/live-streaming)
of an OpenTok session.

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

Visit <http://localhost:3000> in your browser. Click the **Start Broadcast** button to start
the live streaming broadcast of the session.

Visit <http://localhost:3000/broadcast> in Safari. This page shows the live streaming HLS
broadcast of the session. Safari supports HLS streams natively. To support the HLS broadcast
in other browsers, you will need to use an extension or script such as
[videojs-http-streaming](https://github.com/videojs/http-streaming).
