# OpenTokSDK for Node.js

# TODO

*  redo readme
*  markup and generate JSDoc
*  unit testing
*  site
*  examples
*  travis badge

OpenTok is a free set of APIs from TokBox that enables websites to weave live group video communication into their online experience. With OpenTok you have the freedom and flexibility to create the most engaging web experience for your users. OpenTok is currently available as a JavaScript and ActionScript 3.0 library. Check out <http://www.tokbox.com/> and <http://www.tokbox.com/opentok/tools/js/gettingstarted> for more information.

This is the OpenTok NodeJS Module.

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

### TODO: Archiving

### Reference Documenation

See the full reference documentation in the `/doc` directory.

## Example

A simple example server and web client which uses it is included in the `/example` directory.

## License

This project is MIT licensed and a copy is included in the `LICENSE` file.

## Contributing

We <3 opensource and would be more than happy to take contributions.

*  When contributing code, please try to also include a test, and ensure the suite passes (`npm install --dev && npm test`)
*  If you find a bug, please report it by sending details and instructions to reproduce to support@tokbox.com

