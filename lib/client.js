var request = require('needle');
var _ = require('lodash');
var generateJwt = require('./generateJwt');
var pkg = require('../package.json');
var Stream = require('./stream');
var Broadcast = require('./broadcast');
var defaultConfig = {
  apiKey: null,
  apiSecret: null,
  apiUrl: 'https://api.opentok.com',
  endpoints: {
    createSession: '/session/create',
    getStream:
      '/v2/project/<%apiKey%>/session/<%sessionId%>/stream/<%streamId%>',
    listStreams: '/v2/project/<%apiKey%>/session/<%sessionId%>/stream',
    setArchiveLayout: '/v2/project/<%apiKey%>/archive/<%archiveId%>/layout',
    setStreamClassLists: '/v2/project/<%apiKey%>/session/<%sessionId%>/stream',
    dial: '/v2/project/<%apiKey%>/dial',
    playDTMFToSession: '/v2/project/<%apiKey%>/session/<%sessionId%>/play-dtmf',
    playDTMFToClient:
      '/v2/project/<%apiKey%>/session/<%sessionId%>/connection/<%connectionId%>/play-dtmf',
    forceMuteStream:
      '/v2/project/<%apiKey%>/session/<%sessionId%>/stream/<%streamId%>/mute',
    forceMute: '/v2/project/<%apiKey%>/session/<%sessionId%>/mute',
    startBroadcast: '/v2/project/<%apiKey%>/broadcast',
    stopBroadcast: '/v2/project/<%apiKey%>/broadcast/<%broadcastId%>/stop',
    getBroadcast: '/v2/project/<%apiKey%>/broadcast/<%broadcastId%>',
    patchBroadcast: '/v2/project/<%apiKey%>/broadcast/<%broadcastId%>/streams',
    setBroadcastLayout:
      '/v2/project/<%apiKey%>/broadcast/<%broadcastId%>/layout',
    listBroadcasts: '/v2/project/<%apiKey%>/broadcast',
    audioStreamer: '/v2/project/<%apiKey%>/connect'
  },
  request: {
    timeout: 20000 // 20 seconds
  },
  auth: {
    expire: 300
  }
};

var Client = function (c) {
  this.c = {};
  this.config(_.defaults(c, defaultConfig));
};

Client.prototype.config = function (c) {
  _.merge(this.c, c);
  if (this.c.endpoints && this.c.endpoints.dial && this.c.apiKey) {
    this.c.endpoints.dial = this.c.endpoints.dial.replace(
      /<%apiKey%>/g,
      this.c.apiKey
    );
  }
  if ('request' in this.c) {
    request.defaults(this.c.request);
  }

  return this.c;
};

Client.prototype.createSession = function (opts, cb) {
  request.post(
    this.c.apiUrl + this.c.endpoints.createSession,
    opts,
    {
      // TODO: only works while apiUrl is always up to the domain, without the ending slash
      headers: this.generateHeaders()

    },
    function (err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }

      // handle client errors
      if (resp.statusCode === 403) {
        return cb(new Error('An authentication error occurred: ('
              + resp.statusCode
              + ') '
              + JSON.stringify(body)));
      }

      // handle server errors
      if (resp.statusCode >= 500 && resp.statusCode <= 599) {
        return cb(new Error('A server error occurred: ('
              + resp.statusCode
              + ') '
              + JSON.stringify(body)));
      }

      // check if the returned object is valid JSON
      if (typeof body !== 'object') {
        return cb(new Error('Server returned invalid JSON'));
      }

      return cb(null, body);
    }
  );
};

Client.prototype.startArchive = function () {};

Client.prototype.stopArchive = function () {};

Client.prototype.getArchive = function () {};

Client.prototype.listArchives = function () {};

Client.prototype.deleteArchive = function () {};

Client.prototype.playDTMF = function (opts, cb) {
  var url;

  if (opts.sessionId) {
    url = this.c.apiUrl
      + this.c.endpoints.playDTMFToSession
        .replace(/<%apiKey%>/g, this.c.apiKey)
        .replace(/<%sessionId%>/g, opts.sessionId);
  }
  if (opts.connectionId) {
    url = this.c.apiUrl
      + this.c.endpoints.playDTMFToClient
        .replace(/<%apiKey%>/g, this.c.apiKey)
        .replace(/<%sessionId%>/g, opts.sessionId)
        .replace(/<%connectionId%>/g, opts.connectionId);
  }

  request.post(
    url,
    {
      digits: opts.digits
    },
    {
      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));

      if (resp.statusCode === 200) {
        // Success
        return cb(null);
      }

      return cb(new Error('(' + resp.statusCode + ') ' + JSON.stringify(body)));
    }
  );
};

Client.prototype.forceMuteStream = function (opts, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.forceMuteStream
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, opts.sessionId)
      .replace(/<%streamId%>/g, opts.streamId);

  request.post(
    url,
    {},
    {
      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));

      if (resp.statusCode === 200) {
        // Success
        return cb(null);
      }

      return cb(new Error('(' + resp.statusCode + ') ' + JSON.stringify(body)));
    }
  );
};

Client.prototype.forceMuteAll = function (opts, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.forceMute
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, opts.sessionId);

  opts.options.active = true;

  request.post(
    url,
    opts.options,
    {
      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));

      if (resp.statusCode === 200) {
        // Success
        return cb(null);
      }

      return cb(new Error('(' + resp.statusCode + ') ' + JSON.stringify(body)));
    }
  );
};

Client.prototype.disableForceMute = function (opts, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.forceMute
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, opts.sessionId);

  var options = {
    active: false
  };

  request.post(
    url,
    options,
    {
      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));

      if (resp.statusCode === 200) {
        // Success
        return cb(null);
      }

      return cb(new Error('(' + resp.statusCode + ') ' + JSON.stringify(body)));
    }
  );
};

Client.prototype.setArchiveLayout = function setArchiveLayout(opts, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.setArchiveLayout
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%archiveId%>/g, opts.archiveId);
  request.put(
    url,
    {
      type: opts.type,
      stylesheet: opts.stylesheet || undefined,
      screenshareType: opts.screenshareType || undefined
    },
    {
      headers: this.generateHeaders()
    },
    function requestCallback(err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }
      if (resp.statusCode === 200) {
        return cb(null, body);
      }
      return cb(new Error('(' + resp.statusCode + ') ' + body.message));
    }
  );
};

Client.prototype.startBroadcast = function (opts, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.startBroadcast.replace(/<%apiKey%>/g, this.c.apiKey);

  request.post(
    url,
    opts,
    {
      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));

      if (resp.statusCode !== 200) {
        return cb(new Error('(' + resp.statusCode + ') ' + JSON.stringify(body)));
      }

      return cb(null, JSON.stringify(body));
    }
  );
};

Client.prototype.patchBroadcast = function patchBroadcast(broadcastId, opts, cb) {
  var url = this.c.apiUrl + this.c.endpoints.patchBroadcast.replace(/<%apiKey%>/g, this.c.apiKey)
    .replace(/<%broadcastId%>/g, broadcastId);

  request.patch(
    url,
    opts,
    {

      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed'));
      if (resp.statusCode === 204) {
        return cb(null, JSON.stringify(body));
      }
      return cb(new Error('(' + resp.statusCode + ') ' + JSON.stringify(body)));
    }
  );
};

Client.prototype.stopBroadcast = function (broadcastId, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.stopBroadcast
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%broadcastId%>/g, broadcastId);

  request.post(
    url,
    {},
    {
      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));

      if (resp.statusCode === 200) {
        // Success
        return cb(null, body);
      }

      return cb(new Error('(' + resp.statusCode + ') ' + JSON.parse(body).message));
    }
  );
};

Client.prototype.getBroadcast = function getBroadcast(broadcastId, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.getBroadcast
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%broadcastId%>/g, broadcastId);
  request.get(
    url,
    {
      headers: this.generateHeaders()
    },
    function requestCallback(err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }
      if (resp.statusCode === 200) {
        return cb(null, body);
      }
      return cb(new Error('(' + resp.statusCode + ') ' + body ? body.message : ''));
    }
  );
};

Client.prototype.listBroadcasts = function listBroadcasts(queryString, cb) {
  var baseUrl = this.c.apiUrl
    + this.c.endpoints.listBroadcasts.replace(/<%apiKey%>/g, this.c.apiKey);
  var url = queryString.length > 0 ? baseUrl + '?' + queryString : baseUrl;
  var parsedBody;
  request.get(
    url,
    {
      headers: this.generateHeaders()
    },
    function requestCallback(err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }
      if (resp.statusCode === 200) {
        parsedBody = JSON.parse(body);
        return cb(
          null,
          parsedBody.items.map(function itemIterator(item) {
            return new Broadcast(Client, JSON.stringify(item));
          }),
          parsedBody.count
        );
      }
      return cb(new Error('(' + resp.statusCode + ') ' + body ? body.message : ''));
    }
  );
};

Client.prototype.setBroadcastLayout = function setBroadcastLayout(opts, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.setBroadcastLayout
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%broadcastId%>/g, opts.broadcastId);
  request.put(
    url,
    {
      type: opts.type,
      stylesheet: opts.stylesheet || undefined,
      screenshareType: opts.screenshareType || undefined
    },
    {
      headers: this.generateHeaders()
    },
    function requestCallback(err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }
      if (resp.statusCode === 200) {
        return cb(null, body);
      }
      return cb(new Error('(' + resp.statusCode + ') ' + body.message));
    }
  );
};

Client.prototype.websocketConnect = function websocketConnect(opts, cb) {
  var url = this.c.apiUrl + this.c.endpoints.audioStreamer
    .replace(/<%apiKey%>/g, this.c.apiKey);

  request.post(
    url,
    opts,
    {
      headers: this.generateHeaders(),
      json: true
    },
    function requestCallback(err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }
      if (resp.statusCode === 200) {
        return cb(null, body);
      }
      return cb(new Error('(' + resp.statusCode + ') ' + body.message));
    }
  );
};

Client.prototype.setStreamClassLists = function setStreamClassLists(
  sessionId,
  classListArray,
  cb
) {
  var url = this.c.apiUrl
    + this.c.endpoints.setStreamClassLists
      .replace(/<%apiKey%>/, this.c.apiKey)
      .replace(/<%sessionId%>/g, sessionId);
  request.put(
    url,
    {
      items: classListArray
    },
    {
      headers: this.generateHeaders()
    },
    function requestCallback(err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));
      // handle client errors
      switch (resp.statusCode) {
        case 200:
          return cb(null, body);
        case 400:
          return cb(new Error('Invalid session ID or stream ID (400).'));
        case 403:
          return cb(new Error('Invalid API key or secret (403).'));
        default:
          if (resp.statusCode >= 500 && resp.statusCode <= 599) {
            // handle server errors
            return cb(new Error('A server error occurred: ('
                  + resp.statusCode
                  + ') '
                  + JSON.stringify(body)));
          }
      }
      return cb(new Error('An unexpected error occurred: ('
            + resp.statusCode
            + ') '
            + JSON.stringify(body)));
    }
  );
};

Client.prototype.dial = function (opts, cb) {
  request.post(
    this.c.apiUrl + this.c.endpoints.dial,
    opts,
    {
      // TODO: only works while apiUrl is always up to the domain, without the ending slash
      headers: this.generateHeaders()
    },
    function (err, resp, body) {
      if (err) return cb(new Error('The request failed: ' + err));
      // handle client errors
      if (resp.statusCode === 400) {
        if (body.code === 15204) {
          return cb(new Error('SIP Interconnect for Video is not enabled in this project'));
        }
        return cb(new Error('Bad session ID, token, SIP credentials, or SIP URI (sip:user@domain.tld)'));
      }

      if (resp.statusCode === 403) {
        return cb(new Error('Invalid API key or secret'));
      }

      if (resp.statusCode === 409) {
        return cb(new Error('Only Routed Sessions are allowed to initiate SIP Calls.'));
      }

      // handle server errors
      if (resp.statusCode >= 500 && resp.statusCode <= 599) {
        return cb(new Error('A server error occurred: (' + resp.statusCode + ') ' + body));
      }

      // Parse data from server
      return cb(null, body);
    }
  );
};

Client.prototype.getStream = function getStream(sessionId, streamId, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.getStream
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%streamId%>/g, streamId)
      .replace(/<%sessionId%>/g, sessionId);
  request.get(
    url,
    {
      headers: this.generateHeaders()
    },
    function requestCallback(err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }
      if (resp.statusCode === 200) {
        return cb(null, body);
      }
      return cb(new Error('(' + resp.statusCode + ') ' + body.message));
    }
  );
};

Client.prototype.listStreams = function listStreams(sessionId, cb) {
  var url = this.c.apiUrl
    + this.c.endpoints.listStreams
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, sessionId);
  request.get(
    url,
    {
      headers: this.generateHeaders()
    },
    function requestCallback(err, resp, body) {
      if (err) {
        return cb(new Error('The request failed: ' + err));
      }
      if (resp.statusCode === 200) {
        return cb(
          null,
          JSON.parse(body).items.map(function itemIterator(item) {
            return new Stream(JSON.stringify(item));
          })
        );
      }
      return cb(new Error('(' + resp.statusCode + ') ' + body.message));
    }
  );
};

Client.prototype.generateHeaders = function () {
  return {
    'User-Agent':
      'OpenTok-Node-SDK/'
      + pkg.version
      + (this.c.uaAddendum ? ' ' + this.c.uaAddendum : ''),
    'X-OPENTOK-AUTH': generateJwt(this.c),
    Accept: 'application/json'
  };
};

module.exports = Client;
