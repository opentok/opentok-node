const _ = require('lodash');
const generateJwt = require('./generateJwt');
const pkg = require('../package.json');
const Stream = require('./stream');
const Broadcast = require('./broadcast');
const fetch = require('node-fetch');
const defaultConfig = {
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

const api = ({
  method,
  url,
  callback,
  body,
  form,
  headers = {},
}) => {
  let requestBody = null;
  if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
   headers['Content-Type'] = 'application/json';
   requestBody = JSON.stringify(body);
  }

  if (form) {
    requestBody = new URLSearchParams(form).toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  Promise.resolve(fetch(
    url,
    {
      method: method,
      body: requestBody,
      headers: headers,
    }
  ))
    .then(async (response) => {
      const bodyText = await response.text();
      let body = bodyText;

      const [contentType] = (response.headers.get('content-type') || '').split(';');
      switch (contentType) {
        case 'application/x-www-form-urlencoded':
          body = response.body
            ? new URLSearchParams(body)
            : '' ;
          break;
        case 'application/json':
          body = JSON.parse(bodyText);
      }

      if (response.status === 400) {
        if (body?.code === 15204) {
          return callback(new Error('SIP Interconnect for Video is not enabled in this project'));
        }
        return callback(new Error('Bad session ID, token, SIP credentials, or SIP URI (sip:user@domain.tld)'));
      }

      // handle client errors
      if (response.status === 403) {
        return callback(new Error('An authentication error occurred: ('
          + response.status
          + ') '
          + bodyText));
      }

      // handle server errors
      if (response.status >= 500 && response.status <= 599) {
        return callback(new Error('A server error occurred: ('
          + response.status
          + ') '
          + bodyText));
      }

      callback(null, body);
    })
    .catch(async (error) => {
      callback(error);
    });
};

const Client = function (c) {
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

  return this.c;
};

Client.prototype.createSession = function (opts, cb) {
  const url = new URL(this.c.apiUrl + this.c.endpoints.createSession);

  api({
    url: url.toString(),
    method: 'POST',
    form: opts,
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.startArchive = function () {};

Client.prototype.stopArchive = function () {};

Client.prototype.getArchive = function () {};

Client.prototype.listArchives = function () {};

Client.prototype.deleteArchive = function () {};

Client.prototype.playDTMF = function (opts, cb) {
  let url;

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

  api({
    url:url,
    method: 'POST',
    body: {
      digits: opts.digits
    },
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.forceMuteStream = function (opts, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.forceMuteStream
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, opts.sessionId)
      .replace(/<%streamId%>/g, opts.streamId);

  api({
    url:url,
    method: 'POST',
    body: { },
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.forceMuteAll = function (opts, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.forceMute
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, opts.sessionId);

  opts.options.active = true;

  api({
    url:url,
    method: 'POST',
    body: opts.options,
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.disableForceMute = function (opts, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.forceMute
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, opts.sessionId);

  const options = {
    active: false
  };

  api({
    url:url,
    method: 'POST',
    body: options,
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.setArchiveLayout = function setArchiveLayout(opts, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.setArchiveLayout
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%archiveId%>/g, opts.archiveId);
  api({
    url:url,
    method: 'PUT',
    body: {
      type: opts.type,
      stylesheet: opts.stylesheet || undefined,
      screenshareType: opts.screenshareType || undefined
    },
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.startBroadcast = function (opts, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.startBroadcast.replace(/<%apiKey%>/g, this.c.apiKey);

  api({
    url:url,
    method: 'POST',
    body: opts,
    headers: this.generateHeaders(),
    callback: (err, json) => {
      const responseText = typeof json === 'object' ? JSON.stringify(json) : json;
      cb(err, responseText);
    },
  });

};

Client.prototype.patchBroadcast = function patchBroadcast(broadcastId, opts, cb) {
  const url = this.c.apiUrl + this.c.endpoints.patchBroadcast.replace(/<%apiKey%>/g, this.c.apiKey)
    .replace(/<%broadcastId%>/g, broadcastId);
  api({
    url:url,
    method: 'PATCH',
    body: opts,
    headers: this.generateHeaders(),
    callback: cb,
  });

};

Client.prototype.stopBroadcast = function (broadcastId, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.stopBroadcast
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%broadcastId%>/g, broadcastId);
  api({
    url:url,
    method: 'POST',
    body: {  },
    headers: this.generateHeaders(),
    callback: (err, json) => {
      const responseText = typeof json === 'object' ? JSON.stringify(json) : json;
      cb(err, responseText);
    },
  });
};

Client.prototype.getBroadcast = function getBroadcast(broadcastId, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.getBroadcast
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%broadcastId%>/g, broadcastId);
  api({
    url:url,
    method: 'GET',
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.listBroadcasts = function listBroadcasts(queryString, cb) {
  const baseUrl = this.c.apiUrl
    + this.c.endpoints.listBroadcasts.replace(/<%apiKey%>/g, this.c.apiKey);
  const url = queryString.length > 0 ? baseUrl + '?' + queryString : baseUrl;
  api({
    url:url,
    method: 'GET',
    headers: this.generateHeaders(),
    callback: (err, items) => {
      cb(
        err,
        items?.items.map((item) => new Broadcast(Client, JSON.stringify(item))),
        items?.count,
      )
    },
  });
};

Client.prototype.setBroadcastLayout = function setBroadcastLayout(opts, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.setBroadcastLayout
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%broadcastId%>/g, opts.broadcastId);
  api({
    url:url,
    method: 'PUT',
    body: {
      type: opts.type,
      stylesheet: opts.stylesheet || undefined,
      screenshareType: opts.screenshareType || undefined
    },
    headers: this.generateHeaders(),
    callback: cb,
  });

};

Client.prototype.websocketConnect = function websocketConnect(opts, cb) {
  const url = this.c.apiUrl + this.c.endpoints.audioStreamer
    .replace(/<%apiKey%>/g, this.c.apiKey);
  api({
    url:url,
    method: 'POST',
    body: opts,
    headers: this.generateHeaders(),
    callback: cb,
  });

};

Client.prototype.setStreamClassLists = function setStreamClassLists(
  sessionId,
  classListArray,
  cb
) {
  const url = this.c.apiUrl
    + this.c.endpoints.setStreamClassLists
      .replace(/<%apiKey%>/, this.c.apiKey)
      .replace(/<%sessionId%>/g, sessionId);
  api({
    url:url,
    method: 'PUT',
    body: {
      items: classListArray
    },
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.dial = function (opts, cb) {
  api({
    url: this.c.apiUrl + this.c.endpoints.dial,
    method: 'POST',
    body: opts,
    headers: this.generateHeaders(),
    callback: cb,
  });
};

Client.prototype.getStream = function getStream(sessionId, streamId, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.getStream
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%streamId%>/g, streamId)
      .replace(/<%sessionId%>/g, sessionId);
  api({
    url: url,
    method: 'GET',
    headers: this.generateHeaders(),
    callback: cb,
  });

};

Client.prototype.listStreams = function listStreams(sessionId, cb) {
  const url = this.c.apiUrl
    + this.c.endpoints.listStreams
      .replace(/<%apiKey%>/g, this.c.apiKey)
      .replace(/<%sessionId%>/g, sessionId);
  api({
    url: url,
    method: 'GET',
    headers: this.generateHeaders(),
    callback: (err, body) => {
      cb(err, body?.items?.map((stream) => new Stream(JSON.stringify(stream))) || [])
    },
  });
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
