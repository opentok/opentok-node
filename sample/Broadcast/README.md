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

Finally, start the app using Node:

```
$ node index.js
```

Visit <http://localhost:3000/host> in your browser. Then, mute the audio on your computer
(to prevent feedback) and load the  <http://localhost:3000/participant> page in another browser tab
(or in a browser on another computer). The two client pages are connected in an OpenTok session.

In the host page, set broadast options -- maximum duration and resolution -- and then click the **Start Broadcast** button to start the live streaming broadcast of the session. (The maximum
duration setting is optional. The default maximum duration of a broadcast is 2 hours
(7200 seconds). 

Then, visit <http://localhost:3000/broadcast> in Safari. This page shows the live streaming
HLS broadcast of the session. Safari supports HLS streams natively. To support the HLS
broadcast in other browsers, you will need to use an extension or script such as
[videojs-http-streaming](https://github.com/videojs/http-streaming).

In the host page, click the **Toggle Layout** button to switch the layout of the archive between
horizontal and vertical presentation. Click any stream to make it the focus (larger) video in
the layout.

## Walkthrough

This demo application uses the same frameworks and libraries as the HelloWorld sample. If you have
not already gotten familiar with the code in that project, consider doing so before continuing.

Each section will focus on a route handler within the main Express index.js file.

### Starting a live streaming broadcast

This is the route handler, in the Express index.js file, for the host page at
<http://localhost:3000/host>:

```javascript
app.get('/host', function(req, res) {
  var sessionId = app.get('sessionId');
  // generate a fresh token for this client
  var token = opentok.generateToken(sessionId, {
    role: 'publisher',
    initialLayoutClassList: ['focus']
  });

  res.render('host.ejs', {
    apiKey: apiKey,
    sessionId: sessionId,
    token: token,
    initialBroadcastId: app.get('broadcastId'),
    focusStreamId: app.get('focusStreamId') || '',
    initialLayout: app.get('layout')
  });
});
```

If you've completed the HelloWorld walkthrough, this should look familiar. This route handler passes
three strings that the client (JavaScript) needs to connect to the session: `apiKey`, `sessionId`,
and `token`. It also passes a broadcast ID (if a broadcast is already in progress), and the layout
state (the focus stream ID and the current layout type), which will be discussed later.

When the host user clicks the 'Start Broadcast' button, the client sends an XHR request to the
<http://localhost:3000/start> URL. The route handler for this URL is shown below:

```javascript
app.post('/start', function(req, res) {
  var broadcastOptions = {
    outputs: {
      hls: {}
    }
    maxDuration: Number(req.param('maxDuration')) || undefined,
    resolution: req.param('resolution'),
    layout: req.param('layout'),
  };
  opentok.startBroadcast(app.get('sessionId'), broadcastOptions, function (err, broadcast) {
    if (err) {
      return res.send(
        500,
        'Could not start broadcast for session ' + app.get('sessionId') + '. error=' + err.message
      );
    }
    app.set('broadcastId', broadcast.id);
    return res.json(broadcast);
  });
});
```

In this handler, the `startBroadcast()` method of the `opentok` instance is called with the
`sessionId` for the session. This will trigger the broadcast to start.

The optional second argument is for options. In this app, the broadcast options are passed in
from the client. These options include:

* `outputs` -- This sets the HLS and RTMP outputs for the broadcast. This application simply
  broadcasts to an HLS stream. You could also specify RTMP stream URLs (in addition to or
  without specifying an HLS output):
  
  ```javascript
  outputs: {
    hls: {},
    rtmp: [{
      id: 'foo',
      serverUrl: 'rtmp://myfooserver/myfooapp',
      streamName: 'myfoostream'
    },
    {
      id: 'bar',
      serverUrl: 'rtmp://mybarserver/mybarapp',
      streamName: 'mybarstream'
    }]
  },
  ```

  Set `hls` to an object (with no properties) to have an HLS broadcast be started. Set `rtmp`
  options for each RTMP stream you want to be started (if any) or leave `rtmp` unset if you
  do not want RTMP streams (as in this sample application).

* `maxDuration` (Optional) -- The maximum duration of the archive, in seconds.

* `resolution` (Optional) -- The resolution of the archive (either '640x480' or '1280x720').

* `layout` (Optional) -- The layout type of the broadcast, discussed ahead.
  
The last argument is the callback for the result of this asynchronous function.
The callback signature follows the common node pattern of using the first argument fo
an error if one occurred, otherwise the second parameter is a Broadcast object (defined by
the OpenTok Node SDK). If there is no error, a response is sent back to the client's XHR request
with the JSON representation of the broadcast. This JSON includes a `broadcastId` property,
the unique ID of the broadcast.

When the host client receives this response, the **Start Broadcast** button is hidden and the **Stop Broadcast** is displayed.

### Stopping the broadcast

When the host user presses the **Stop Broadcast**, the client sends
an XHR request is sent to the <http://localhost:3000/stop/:broadcastId> URL where `:broadcastId` is the broadcast ID. This is route handler for this request (from the Express index.js file):

```javascript
app.get('/stop/:broadcastId', function(req, res) {
  var broadcastId = req.param('broadcastId');
  opentok.stopBroadcast(broadcastId, function (err, broadcast) {
    if (err) {
      return res.send(500, 'Could not stop broadcast ' + broadcastId + '. Error = ' + err.message);
    }
    app.set('broadcastId', null);
    return res.json(broadcast);
  });
});
```

This handler is very similar to the previous one. Instead of calling the `startBroadcast()` method,
the `stopBroadcast()` method is called. This method takes an `broadcastId` as its first parameter.
The second parameter is the callback function that indicates success or failure in stopping the
broadcast.

### Viewing the broadcast stream

When you load the broadcast URL <http://localhost:3000/broadcast>, this Express route handler
is invoked:

```javascript
app.get('/broadcast', function (req, res) {
  var broadcastId = app.get('broadcastId');
  if (!broadcastId) {
    return res.send(404, 'Broadcast not in progress.');
  }
  return opentok.getBroadcast(broadcastId, function (err, broadcast) {
    if (err) {
      return res.send(500, 'Could not get broadcast ' + broadcastId + '. error=' + err.message);
    }
    if (broadcast.status === 'started') {
      return res.redirect(broadcast.broadcastUrls.hls);
    }
    return res.send(404, 'Broadcast not in progress.');
  });
});
```

The app set the `broadcastId` property from the Broadcast object passed into the
`OpenTok.startBroadcast()` callback function.

The router method for the broadcast URL calls the `Opentok.getBroadcast()`, defined in the
OpenTok Node SDK, to get information about the broadcast. The Broadcast object returned to the
`getBroadcast()` completion handler includes the HLS broadcast URL (the `broadcastUrls.hls` property) as well as the `status` of the broadcast. If the `status` of the broacast is `'started'`,
the Express router redirects the client to the URL of the HLS stream.

Again, only Safari natively support viewing of an HLS stream. In other clients, you will need to
use a HLS viewing extension.

### Changing Broadcast Layout

When you start the broadcast, by calling the `OpenTok.startBroadcast()` method of the OpenTok Node
SDK, you set the `layout` property of the `options` object. This sets the initial layout type
of the broadcast. In our case, we set it to `'horizontalPresentation'` or `'verticalPresentation'`,
which are two of the predefined layout types for live streaming broadcasts.

You can change the layout dynamically. The host view includes a **Toggle layout** button.
This toggles the layout of the streams between a horizontal and vertical presentation.
When you click this button, the host client switches makes an HTTP POST request to
the '/broadcast/:broadcastId/layout' endpoint:

```javascript
app.post('/broadcast/:broadcastId/layout', function (req, res) {
  var broadcastId = req.param('broadcastId');
  var type = req.body.type;
  app.set('layout', type);
  if (broadcastId) {
    opentok.setBroadcastLayout(broadcastId, type, null, function (err) {
      if (err) {
        return res.send(500, 'Could not set layout ' + type + '. Error: ' + err.message);
      }
      return res.send(200, 'OK');
    });
  }
});
```

This calls the `OpenTok.setBroadcastLayout()` method of the OpenTok Node.js SDK, setting the
broadcast layout to the layout type defined in the POST request's body. In this app, the layout
type is set to `horizontalPresentation` or `verticalPresentation`, two of the [predefined layout
types](https://tokbox.com/developer/guides/broadcast/live-streaming/#predefined-layout-types)
available to live streaming broadcasts.

In the host view you can click any stream to set it to be the focus stream in the broadcast layout.
(Click outside of the mute audio icon.) Doing so sends an HTTP POST request to the `/focus`
endpoint:

```javascript
app.post('/focus', function (req, res) {
  var otherStreams = req.body.otherStreams;
  var focusStreamId = req.body.focus;
  var classListArray = [];
  var i;

  if (otherStreams) {
    for (i = 0; i < otherStreams.length; i++) {
      classListArray.push({
        id: otherStreams[i],
        layoutClassList: []
      });
    }
  }
  classListArray.push({
    id: focusStreamId,
    layoutClassList: ['focus']
  });
  app.set('focusStreamId', focusStreamId);
  opentok.setStreamClassLists(app.get('sessionId'), classListArray, function (err) {
    if (err) {
      return res.send(500, 'Could not set class lists. Error:' + err.message);
    }
    return res.send(200, 'OK');
  });
});
```

The body of the  POST request includes the stream ID of the "focus" stream and an array of
other stream IDs in the session. The server-side method that handles the POST requests assembles
a `classListArray` array, based on these stream IDs:

```javascript
[
  {
    "id": "6ad90229-df4f-4849-8974-5d675727c8b5",
    "layoutClassList": []
  },
  {
    "id": "aef616a5-769c-43e9-96d2-221edb986cbf",
    "layoutClassList": []
  },
  {
    "id": "db9f2372-7564-4b38-9bb2-d6ba4249fe63",
    "layoutClassList": ["focus"]
  }
]
```

This is passed in as the `classListArray` parameter of the `OpenTok.setStreamClassLists()` method
of the OpenTok Node.js SDK: 

```javascript
opentok.setStreamClassLists(app.get('sessionId'), classListArray, function (err) {
  if (err) {
    return res.send(500, 'Could not set class lists. Error:' + err.message);
  }
  return res.send(200, 'OK');
});
```

This sets one stream to have the `focus` class, which causes it to be the large stream
displayed in the broadcast. (This is the behavior of the `horizontalPresentation` and
`verticalPresentation` layout types.) To see this effect, you should open the host and participant
pages on different computers (using different cameras). Or, if you have multiple cameras connected
to your machine, you can use one camera for publishing from the host, and use another for the
participant. Or, if you are using a laptop with an external monitor, you can load the host page
with the laptop closed (no camera) and open the participant page with the laptop open.

The host client page also uses OpenTok signaling to notify other clients when the layout type and
focus stream changes, and they then update the local display of streams in the HTML DOM accordingly.
However, this is not necessary. The layout of the broadcast is unrelated to the layout of
streams in the web clients.

When you view the broadcast stream, the layout type and focus stream changes, based on calls
to the `OpenTok.setBroadcastLayout()` and `OpenTok.setStreamClassLists()` methods during
the broadcast.

For more information, see [Configuring video layout for OpenTok live streaming
broadcasts](https://tokbox.com/developer/guides/broadcast/live-streaming/#configuring-video-layout-for-opentok-live-streaming-broadcasts).
