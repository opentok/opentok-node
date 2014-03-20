# OpenTokSDK for Node.js

The OpenTok server SDKs include code for your web server. Use these SDKs to generate
[sessions](http://tokbox.com/opentok/tutorials/create-session/) and to obtain
[tokens](http://tokbox.com/opentok/tutorials/create-token/) for [OpenTok](http://www.tokbox.com/)
applications.

This version of the SDK also includes support for working with OpenTok 2.0 archives.

## Installation

Install as a regular npm package using `npm install --save opentok`

## Usage

### Import the `opentok` module

First, import the module to get a constructor for an OpenTokSDK object.

```javascript
    var OpenTokSDK = require('opentok');
```

### Instantiate the SDK with your own API Key and API Secret

Once you've signed up for an account and got your API Key from the [OpenTok Dashboard](http://dashboard.tokbox.com),
use it and the corresponding API Secret to instantiate the OpenTokSDK object.

```javascript
    var opentok = new OpenTokSDK('API_KEY', 'API_SECRET');
```

### Creating Sessions

You create Sessions so that clients can connect to the OpenTok service and communicate with one another. Give any
clients the same session when they are meant to be in the same "room". The sessionId is returned in a callback:

```javascript
    opentok.createSession(function(err, sessionId) {
      if (err) throw err;      // handle error your own way
      console.log(sessionId);  // you might want to save this in a database or send it in a response
    });
```

If you want the clients to connect peer-to-peer, you should specify this option when you create it:

```javascript
    opentok.createSession({ p2p : true }, callback);
```
You can optionally specify a location hint in the form of an IP address to help the OpenTok service pick a server
closest to the IP given to run the particular session from.

```javascript
    opentok.createSession({ location : '12.34.56.78' }, callback);
```

### Generating Tokens

In addition to a Session, each client will also need a unique Token in order to connect to the OpenTok service. A token
can be used to assign a "role" to a particular client, which limits or raises the clients permissions.

```javascript
    var publisherToken = opentok.generateToken(sessionId); // the default role for a token is PUBLISHER
    // -- OR --
    var moderatorToken = opentok.generateToken(sessionId, { role : opentok.RoleConstants.MODERATOR });
    // -- OR --
    var subscriberToken = opentok.generateToken(sessionId, { role : opentok.RoleConstants.SUBSCRIBER });
```



## Working with archives

The following function starts recording an archive of an OpenTok 2.0 session (given a session ID)
and returns the archive ID (on success).

<pre>
startArchive = function(sessionId) {
  startArchiveOptions = {name: "archive-" + new Date()}
  ot.startArchive(sessionId, startArchiveOptions, function(error, archive) {
    if (error) {
      console.log("error:", error);
    } else {
      console.log("new archive:" + archive.id);
      return archive.id;
    }
  });
}
</pre>

The following function stops the recording of an archive (given an archive ID), returning
true on success, and false on failure.

<pre>
stopArchive = function(archiveId) {
  ot.stopArchive(sessionId, function(error, archive) {
    if (error) {
      console.log("error:", error);
    } else {
      console.log("Stopped archive:" + archive.id);
    }
  });
}
</pre>

The following function logs information on a given archive:

<pre>
getArchive = function(archiveId) {
  ot.getArchive(archiveId, function(error, archive) {
    if (error) {
      console.log("error:", error);
    } else {
      console.log("Archive:", archive);
    }
  });
}
</pre>

The following method logs information on multiple archives. If you do not pass in
offset and count parameters, the method logs information on up to 50 archives:

<pre>
listArchives = function(offset, count) {
  listArchiveOptions = {};
  if (offset) {
    listArchiveOptions.offset = offset;
  }
  if (count) {
    listArchiveOptions.count = count;
  }
  ot.listArchives(listArchiveOptions, function(error, archives, totalCount) {
    if (error) {
      console.log("error:", error);
    } else {
      console.log(totalCount + " archives");
      for (var i = 0; i &lt; archives.length; i++) {
        console.log(archives[i].id);
      }
    }
  });
}
</pre>

The following function deletes an archive:

<pre>
deleteArchive = function(archiveId) {
  ot.deleteArchive(archiveId, function(error) {
    if (error) {
      console.log("error:", error);
    } else {
      console.log("Deleted archive:", archiveId);
    }
  });
}
</pre>


## Examples

  Check out the basic working example in examples/app.js

### To run test suite:
    jasmine-node --captureExceptions spec/



We <3 opensource and would be more than happy to take contributions.

*  When contributing code, please try to also include a test, and ensure the suite passes (`npm install --dev && npm test`)
*  If you find a bug, please report it by sending details and instructions to reproduce to support@tokbox.com

