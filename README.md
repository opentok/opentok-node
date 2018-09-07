# OpenTok Node SDK

[![Build Status](https://travis-ci.org/opentok/opentok-node.png)](https://travis-ci.org/opentok/opentok-node)

The OpenTok Node SDK lets you generate
[sessions](https://tokbox.com/developer/guides/create-session/) and
[tokens](https://tokbox.com/developer/guides/create-token/) for
[OpenTok](http://www.tokbox.com/) applications. It also includes methods for
working with OpenTok [archives](https://tokbox.com/developer/guides/archiving),
working with OpenTok [SIP interconnect](https://tokbox.com/developer/guides/sip),
and [disconnecting clients from sessions](https://tokbox.com/developer/guides/moderation/rest/).

If you are looking for the JavaScript Client SDK please see the [@opentok/client](https://www.npmjs.com/package/@opentok/client) NPM module.

## Installation using npm (recommended):

npm helps manage dependencies for node projects. Find more info here: <http://npmjs.org>.

Run this command to install the package and adding it to your `package.json`:

```
$ npm install opentok --save
```

## Usage

### Initializing

Import the module to get a constructor function for an OpenTok object, then call it with `new` to
instantiate an OpenTok object with your own API Key and API Secret.

```javascript
var OpenTok = require('opentok'),
    opentok = new OpenTok(apiKey, apiSecret);
```

### Creating Sessions

To create an OpenTok Session, use the `OpenTok.createSession(properties, callback)` method. The
`properties` parameter is an optional object used to specify whether the session uses the OpenTok
Media Router, to specify a location hint, and to specify whether the session will be automatically
archived or not. The callback has the signature `function(error, session)`. The `session` returned
in the callback is an instance of Session. Session objects have a `sessionId` property that is
useful to be saved to a persistent store (such as a database).

```javascript
// Create a session that will attempt to transmit streams directly between
// clients. If clients cannot connect, the session uses the OpenTok TURN server:
opentok.createSession(function(err, session) {
  if (err) return console.log(err);

  // save the sessionId
  db.save('session', session.sessionId, done);
});

// The session will the OpenTok Media Router:
opentok.createSession({mediaMode:"routed"}, function(err, session) {
  if (err) return console.log(err);

  // save the sessionId
  db.save('session', session.sessionId, done);
});

// A Session with a location hint
opentok.createSession({location:'12.34.56.78'}, function(err, session) {
  if (err) return console.log(err);

  // save the sessionId
  db.save('session', session.sessionId, done);
});

// A Session with an automatic archiving
opentok.createSession({mediaMode:'routed', archiveMode:'always'}, function(err, session) {
  if (err) return console.log(err);

  // save the sessionId
  db.save('session', session.sessionId, done);
});
```
### Generating Tokens

Once a Session is created, you can start generating Tokens for clients to use when connecting to it.
You can generate a token by calling the `OpenTok.generateToken(sessionId, options)` method. Another
way is to call the `generateToken(options)` method of a Session object. The `options`
parameter is an optional object used to set the role, expire time, and connection data of the Token.
For layout control in archives and broadcasts, the initial layout class list of streams published
from connections using this token can be set as well.

```javascript
// Generate a Token from just a sessionId (fetched from a database)
token = opentok.generateToken(sessionId);

// Generate a Token from a session object (returned from createSession)
token = session.generateToken();

// Set some options in a Token
token = session.generateToken({
  role :                   'moderator',
  expireTime :             (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
  data :                   'name=Johnny',
  initialLayoutClassList : ['focus']
});
```

### Working with archives

You can start the recording of an OpenTok Session using the `OpenTok.startArchive(sessionId,
options, callback)` method. The `options` parameter is an optional object used to set the name of
the Archive. The callback has the signature `function(err, archive)`. The `archive` returned in
the callback is an instance of `Archive`. Note that you can only start an archive on a Session with
connected clients.

```javascript
opentok.startArchive(sessionId, { name: 'Important Presentation' }, function(err, archive) {
  if (err) {
    return console.log(err);
  } else {
    // The id property is useful to save off into a database
    console.log("new archive:" + archive.id);
  }
});
```

You can also disable audio or video recording by setting the `hasAudio` or `hasVideo` property of
the `options` parameter to `false`:

```javascript
var archiveOptions = {
  name: 'Important Presentation',
  hasVideo: false  // Record audio only
};
opentok.startArchive(sessionId, archiveOptions, function(err, archive) {
  if (err) {
    return console.log(err);
  } else {
    // The id property is useful to save to a database
    console.log("new archive:" + archive.id);
  }
});
```

By default, all streams are recorded to a single (composed) file. You can record the different
streams in the session to individual files (instead of a single composed file) by setting the
`outputMode` option to `'individual'` when you call the `OpenTok.startArchive()` method:

```javascript
var archiveOptions = {
  name: 'Important Presentation',
  outputMode: 'individual'
};
opentok.startArchive(sessionId, archiveOptions, function(err, archive) {
  if (err) {
    return console.log(err);
  } else {
    // The id property is useful to save off into a database
    console.log("new archive:" + archive.id);
  }
});
```

You can stop the recording of a started Archive using the `OpenTok.stopArchive(archiveId, callback)`
method. You can also do this using the `Archive.stop(callback)` method an `Archive` instance. The
callback has a signature `function(err, archive)`. The `archive` returned in the callback is an
instance of `Archive`.

```javascript
opentok.stopArchive(archiveId, function(err, archive) {
  if (err) return console.log(err);

  console.log("Stopped archive:" + archive.id);
});

archive.stop(function(err, archive) {
  if (err) return console.log(err);
});
```

To get an `Archive` instance (and all the information about it) from an `archiveId`, use the
`OpenTok.getArchive(archiveId, callback)` method. The callback has a function signature
`function(err, archive)`. You can inspect the properties of the archive for more details.

```javascript
opentok.getArchive(archiveId, function(err, archive) {
  if (err) return console.log(err);

  console.log(archive);
});
```

To delete an Archive, you can call the `OpenTok.deleteArchive(archiveId, callback)` method or the
`delete(callback)` method of an `Archive` instance. The callback has a signature `function(err)`.

```javascript
// Delete an Archive from an archiveId (fetched from database)
opentok.deleteArchive(archiveId, function(err) {
  if (err) console.log(err);
});

// Delete an Archive from an Archive instance, returned from the OpenTok.startArchive(), 
// OpenTok.getArchive(), or OpenTok.listArchives() methods
archive.delete(function(err) {
  if (err) console.log(err);
});
```

You can also get a list of all the Archives you've created (up to 1000) with your API Key. This is
done using the `OpenTok.listArchives(options, callback)` method. The parameter `options` is an
optional object used to specify an `offset` and `count` to help you paginate through the results.
The callback has a signature `function(err, archives, totalCount)`. The `archives` returned from
the callback is an array of `Archive` instances. The `totalCount` returned from the callback is
the total number of archives your API Key has generated.

```javascript
opentok.listArchives({offset:100, count:50}, function(error, archives, totalCount) {
  if (error) return console.log("error:", error);

  console.log(totalCount + " archives");
  for (var i = 0; i < archives.length; i++) {
    console.log(archives[i].id);
  }
});
```

Note that you can also create an automatically archived session, by passing in `'always'`
as the `archiveMode` option when you call the `OpenTok.createSession()` method (see "Creating
Sessions," above).

For composed archives, you can set change the layout dynamically, using the `OpenTok.setArchiveLayout(archiveId, type, stylesheet, callback)` method:

```javascript
opentok.setArchiveLayout(archiveId, type, null, function (err) {
  if (err) return console.log("error:", error);
});
```

You can set the initial layout class for a client's streams by setting the `layout` option when
you create the token for the client, using the `OpenTok.generateToken()` method. And you can
change the layout classes for streams in a session by calling the
`OpenTok.setStreamClassLists(sessionId, classListArray, callback)` method.

Setting the layout of composed archives is optional. By default, composed archives use the
"best fit" layout (see [Customizing the video layout for composed
archives](https://tokbox.com/developer/guides/archiving/layout-control.html)).

For more information on archiving, see the
[OpenTok archiving developer guide](https://tokbox.com/developer/guides/archiving/).

### Sending signals

You can send a signal to all participants in an OpenTok Session by calling the
`OpenTok.signal(sessionId, connectionId, payload, callback)` method and setting
the `connectionId` parameter to `null`:

```javascript
var sessionId = '2_MX2xMDB-flR1ZSBOb3YgMTkgMTE6MDk6NTggUFNUIDIwMTN-MC2zNzQxNzIxNX2';
opentok.signal(sessionId, null, { 'type': 'chat', 'data': 'Hello!' }, function(error) {
  if (error) return console.log("error:", error);
});
```

Or send a signal to a specific participant in the session by calling the
`OpenTok.signal(sessionId, connectionId, payload, callback)` method and setting all paramters,
including `connectionId`:

```javascript
var sessionId = '2_MX2xMDB-flR1ZSBOb3YgMTkgMTE6MDk6NTggUFNUIDIwMTN-MC2zNzQxNzIxNX2';
var connectionId = '02e80876-02ab-47cd-8084-6ddc8887afbc';
opentok.signal(sessionId, connectionId, { 'type': 'chat', 'data': 'Hello!' }, function(error) {
  if (error) return console.log("error:", error);
});
```

This is the server-side equivalent to the signal() method in the OpenTok client SDKs. See
[OpenTok signaling developer guide](https://www.tokbox.com/developer/guides/signaling/) .

### Disconnecting participants

You can disconnect participants from an OpenTok Session using the
`OpenTok.forceDisconnect(sessionId, connectionId, callback)` method.

```javascript
opentok.forceDisconnect(sessionId, connectionId, function(error) {
  if (error) return console.log("error:", error);
});
```

This is the server-side equivalent to the forceDisconnect() method in OpenTok.js:
<https://www.tokbox.com/developer/guides/moderation/js/#force_disconnect>.

### Working with SIP Interconnect

You can add an audio-only stream from an external third-party SIP gateway using the SIP Interconnect
feature. This requires a SIP URI, the session ID you wish to add the audio-only stream to, and a
token to connect to that session ID.

```javascript
opentok.dial(sessionId, token, sipUri, options, function (error, sipCall) {
  if (error) return console.log("error: ", error);

  console.log('SIP audio stream Id: ' + sipCall.streamId+ ' added to session ID: ' + sipCall.sessionId);
});
```

For more information, see the
[OpenTok SIP Interconnect developer guide](https://tokbox.com/developer/guides/sip/).

## Getting Stream Info

You can get information on an active stream in an OpenTok session:

```javascript
var sessionId = '2_MX6xMDB-fjE1MzE3NjQ0MTM2NzZ-cHVTcUIra3JUa0kxUlhsVU55cTBYL0Y1flB';
var streamId = '2a84cd30-3a33-917f-9150-49e454e01572';
opentok.getStream(sessionId, streamId, function(error, streamInfo) {
  if (error) {
    console.log(error.message);
  } else {
    console.log(stream.id); // '2a84cd30-3a33-917f-9150-49e454e01572'
    console.log(stream.videoType); // 'camera'
    console.log(stream.name); // 'Bob'
    console.log(stream.layoutClassList); // ['main']
  }
});
```

Pass a session ID, stream ID, and callback function to the `OpenTok.getStream()` method.
The callback function is called when the operation completes. It takes two parameters:
`error` (in the case of an error) or `stream`. On sucessful completion, the `stream` object
is set, containing properties of the stream.

To get information on *all* active streams in a session, call the `OpenTok.listStreams()` method,
passing in a session ID and a callback function. Upon sucess, the callback function is invoked
with an array of Stream objects passed into the second parameter:

```javascript
opentok.listStreams(sessionId, function(error, streams) {
  if (error) {
    console.log(error.message);
  } else {
    streams.map(function(stream) {
      console.log(stream.id); // '2a84cd30-3a33-917f-9150-49e454e01572'
      console.log(stream.videoType); // 'camera'
      console.log(stream.name); // 'Bob'
      console.log(stream.layoutClassList); // ['main']
    }));
  }
});
```

# Samples

There are sample applications included in this repository. To get going as fast as possible,
clone the whole repository and read the README in each of the sample directories:

*  [HelloWorld](sample/HelloWorld/README.md)
*  [Archiving](sample/Archiving/README.md)
*  [SipInterconnect](sample/StreamInfo/README.md)

## Documentation

Reference documentation is available at <https://tokbox.com/developer/sdks/node/reference/index.html>.

## Requirements

You need an OpenTok API key and API secret, which you can obtain by logging into your
[TokBox account](https://tokbox.com/account).

The OpenTok Node SDK requires Node.js 4 or higher. It may work on older versions but they are no longer tested.

## Release Notes

See the [Releases](https://github.com/opentok/opentok-node/releases) page for details
about each release.

### Important changes since v2.2.0

**Changes in v2.2.3:**

The default setting for the `createSession()` method is to create a session with the media mode set
to relayed. In previous versions of the SDK, the default setting was to use the OpenTok Media Router
(media mode set to routed). In a relayed session, clients will attempt to send streams directly
between each other (peer-to-peer); if clients cannot connect due to firewall restrictions, the
session uses the OpenTok TURN server to relay audio-video streams.

**Changes in v2.2.0:**

This version of the SDK includes support for working with OpenTok archives.

The `createSession()` method has changed to take one parameter: an `options` object that has `location`
and `mediaMode` properties. The `mediaMode` property replaces the `properties.p2p.preference`
parameter in the previous version of the SDK.

The `generateToken()` has changed to take two parameters: the session ID and an `options` object that has `role`, `expireTime` and `data` properties.

See the reference documentation
<http://www.tokbox.com/opentok/libraries/server/node/reference/index.html> and in the
docs directory of the SDK.


## Development and Contributing

Interested in contributing? We :heart: pull requests! See the [Development](DEVELOPING.md) and
[Contribution](CONTRIBUTING.md) guidelines.

## Support

See <https://support.tokbox.com> for all our support options.

Find a bug? File it on the [Issues](https://github.com/opentok/opentok-node/issues) page. Hint:
test cases are really helpful!
