# OpenTok Node SDK

[![Build Status](https://travis-ci.org/opentok/opentok-node.png)](https://travis-ci.org/opentok/opentok-node)

The OpenTok Node SDK lets you generate
[sessions](http://www.tokbox.com/opentok/tutorials/create-session/) and
[tokens](http://www.tokbox.com/opentok/tutorials/create-token/) for
[OpenTok](http://www.tokbox.com/) applications, and
[archive](https://tokbox.com/opentok/tutorials/archiving) OpenTok sessions.

# Installation using npm (recommended):

npm helps manage dependencies for node projects. Find more info here: <http://npmjs.org>

Run this command to install the package and adding it to your `package.json`:

```
$ npm install opentok --save
```

# Usage

## Initializing

Import the module to get a constructor function for an OpenTok object, then call it with `new` to
initantiate it with your own API Key and API Secret.

```javascript
var OpenTok = require('opentok'),
    opentok = new OpenTok(apiKey, apiSecret);
```

## Creating Sessions

To create an OpenTok Session, use the `opentok.createSession(properties, callback)` method. The
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
## Generating Tokens

Once a Session is created, you can start generating Tokens for clients to use when connecting to it.
You can generate a token by calling the `opentok.generateToken(sessionId, options)` method. Another
way is to call the `session.generateToken(options)` method of a Session object. The `options`
parameter is an optional object used to set the role, expire time, and connection data of the Token.

```javascript
// Generate a Token from just a sessionId (fetched from a database)
token = opentok.generateToken(sessionId);

// Genrate a Token from a session object (returned from createSession)
token = session.generateToken();

// Set some options in a Token
token = session.generateToken({
  role :       'moderator',
  expireTime : (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
  data :       'name=Johnny'
});
```

## Working with archives

You can start the recording of an OpenTok Session using the `opentok.startArchive(sessionId,
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
    // The id property is useful to save off into a database
    console.log("new archive:" + archive.id);
  }
});
```

By default, all streams are recorded to a single (composed) file. You can record the different
streams in the session to individual files (instead of a single composed file) by setting the
`outputMode` option to `'individual'` when you call the `opentok.startArchive()`:

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

You can stop the recording of a started Archive using the `opentok.stopArchive(archiveId, callback)`
method. You can also do this using the `archive.stop(callback)` method an `Archive` instance. The
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
`opentok.getArchive(archiveId, callback)` method. The callback has a function signature
`function(err, archive)`. You can inspect the properties of the archive for more details.

```javascript
opentok.getArchive(archiveId, function(err, archive) {
  if (err) return console.log(err);

  console.log(archive);
});
```

To delete an Archive, you can call the `opentok.deleteArchive(archiveId, callback)` method or the
`delete(callback)` method of an `Archive` instance. The callback has a signature `function(err)`.

```javascript
// Delete an Archive from an archiveId (fetched from database)
opentok.deleteArchive(archiveId, function(err) {
  if (err) console.log(err);
});

// Delete an Archive from an Archive instance (returned from archives.create, archives.find)
archive.delete(function(err) {
  if (err) console.log(err);
});
```

You can also get a list of all the Archives you've created (up to 1000) with your API Key. This is
done using the `opentok.listArchives(options, callback)` method. The parameter `options` is an
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
as the `archiveMode` option when you call the `opentok.createSession()` method (see "Creating
Sessions," above).

For more information on archiving, see the
[OpenTok archiving](https://tokbox.com/opentok/tutorials/archiving/) programming guide.

# Samples

There are two sample applications included in this repository. To get going as fast as possible, clone the whole
repository and follow the Walkthroughs:

*  [HelloWorld](sample/HelloWorld/README.md)
*  [Archiving](sample/Archiving/README.md)

# Documentation

Reference documentation is available at <http://www.tokbox.com/opentok/libraries/server/node/reference/index.html> and in the
docs directory of the SDK.

# Requirements

You need an OpenTok API key and API secret, which you can obtain at <https://dashboard.tokbox.com>.

The OpenTok Node SDK requires node 0.10 or higher.

# Release Notes

See the [Releases](https://github.com/opentok/opentok-node/releases) page for details
about each release.

## Important changes since v2.2.0

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


# Development and Contributing

Interested in contributing? We :heart: pull requests! See the [Development](DEVELOPING.md) and
[Contribution](CONTRIBUTING.md) guidelines.

# Support

See <https://support.tokbox.com> for all our support options.

Find a bug? File it on the [Issues](https://github.com/opentok/opentok-node/issues) page. Hint:
test cases are really helpful!
