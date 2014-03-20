/*
 * OpenTok server-side SDK
 */

// Dependencies
var https = require('https'),
    http = require('http'),
    url = require('url'),
    net = require('net'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    to_json = require('xmljson').to_json,
    _ = require('underscore'),
    helpers = require('./helpers'),
    getArchive = require('./archiving'),
    package = require ('../package.json');

// Internal Constants
// TODO: this can be turned into config in the future (DI)
var TOKEN_SENTINEL = "T1==",
    API_HOST = "api.opentok.com",
    ENDPOINTS = {
      SESSION_CREATE: {
        path: "/hl/session/create",
        method: "POST"
      },
    };

// External Constants
var RoleConstants = {
    SUBSCRIBER: "subscriber",
    PUBLISHER: "publisher",
    MODERATOR: "moderator"
};
var AuthScheme = {
    PARTNER: "X-TB-PARTNER-AUTH",
    TOKEN: "X-TB-TOKEN-AUTH"
};

/**
 * @constructor
 * @param  {(number|string)}   apiKey
 * @param  {string}            apiSecret
 */
var OpenTok = function(apiKey, apiSecret, env) {
  // TODO: to allow for DI, we can add a third argument which can take non-default config/dependencies

  // we're loose about calling this constructor with `new`, we got your back
  if (!(this instanceof OpenTok)) return new OpenTok(apiKey, apiSecret, env);

  // validate arguments: apiKey := Number|String, apiSecret := String
  if (!(_.isNumber(apiKey) || _.isString(apiKey)) || !_.isString(apiSecret)) {
    return new Error('Invalid arguments when initializing OpenTok:');
  }

  // apiKey argument can be a Number, but we will internally store it as a String
  if (_.isNumber(apiKey)) apiKey = apiKey.toString();

  // env can be either an object with a bunch of DI options, or a simple string for the apiUrl
  if (_.isString(env)) {
    this.apiUrl = env;
  }

  this.apiKey = apiKey;
  this.apiSecret = apiSecret;
}

/**
 * creates a new OpenTok Session (calls the API server) and returns the sessionId via callback
 * @param   {Object}                             [opts]
 * @param   {string}                             [opts.location=""] a hint to help
 *    the OpenTok media server chose a location for the server; formatted as an
 *    IP address or a host name
 * @param   {boolean}                            [opts.p2p=false] when set
 *    to true, the created session will allow clients to stream peer-to-peer
 * @param   {OpenTok~createSessionCallback}   callback
 */
OpenTok.prototype.createSession = function(opts, callback) {
  // NOTE: the callback's signature is now error-first
  // NOTE: removing first param and folding it into opts (it was already optional)
  // NOTE: removing older method aliases
  // NOTE: p2p.preference -> p2p

  if (_.isFunction(opts)) {
    // shift arguments if the opts is left out
    callback = opts;
    opts = {};
  } else if (!_.isFunction(callback)) {
    // one of the args has to be a function, or we bail
    return new Error('Invalid arguments when calling createSession, must provide a callback');
  }

  // whitelist the keys allowed
  _.pick(_.defaults(opts, { "p2p" : false }), "p2p", "location");
  if ( !_.isBoolean(opts.p2p) || ( "location" in opts && !net.isIPv4(opts.location)) ) {
    return callback(new Error('Invalid arguments when calling createSession, p2p must be Boolean and location must be an IPv4 address'));
  }


  // rename p2p -> p2p.preference
  opts["p2p.preference"] = opts["p2p"];
  delete opts["p2p"];

  this._doRequest(ENDPOINTS.SESSION_CREATE, AuthScheme.PARTNER, opts, function(err, xml) {
    if (err) return helpers.handleError({ action: 'createSession', props: opts, cause: err}, callback);
    to_json(xml, function(err, json) {
      if (err) return helpers.handleError({ action: 'createSession', props: opts, cause: err}, callback);
      callback(null, json.sessions.Session.session_id);
    });
  });
};

/**
 * generates a token which is used to access an OpenTok Session
 * @param   {string}    sessionId
 * @param   {Object}    [opts]
 * @param   {string}    [opts.role="publisher"] describes the permissions available for a client who has used this token to connect
 * @param   {number}    [opts.expire_time] unix timestamp of when the token is no longer usable to connect (default is 1 day)
 * @param   {string}    [opts.connection_data] static metadata associated with the client who uses this token to
 *    connect; this is read-only and available at every client who is connected to the session
 * @returns {string}    token
 */
OpenTok.prototype.generateToken = function(sessionId, opts) {
  // NOTE: sessionId is a required paramerter and now the first param
  // NOTE: removing older method aliases
  var decoded, tokenData;

  if ( !_.isString(sessionId) ) return null;

  // validate the sessionId belongs to the apiKey of this OpenTok instance
  decoded = decodeSessionId(sessionId);
  if ( !decoded || decoded.apiKey !== this.apiKey) return null;

  // combine defaults, opts, and whitelisted property names to create tokenData
  tokenData = _.pick(_.extend({
    session_id: sessionId,
    create_time: Math.round(new Date().getTime() / 1000),
    nonce: Math.floor(Math.random()*999999),
    role: RoleConstants.PUBLISHER
  }, opts), 'session_id', 'create_time', 'nonce', 'role', 'expire_time', 'connection_data');

  return encodeToken(tokenData, this.apiKey, this.apiSecret);
}

OpenTok.prototype.getArchive = function(archiveId, callback) {
  return getArchive(this, archiveId, callback);
};


/**
 * sends a request to the OpenTok REST API using the given parameters
 * @param    {Object}                       endpoint
 * @param    {string}                       auth - "token" or "partner"
 * @param    {?(Object|string)}             data
 * @param    {OpenTok~doRequestCallback} callback
 */
OpenTok.prototype._doRequest = function(endpoint, auth, data, callback) {
  var options, req, authHeader, web = https;

  // take care of encoding a JSON object into a string
  if (!_.isString(data)) data = querystring.stringify(data);

  // create the auth header
  authHeader = {};
  if (auth === AuthScheme.PARTNER) {
    authHeader[AuthScheme.PARTNER] =  this.apiKey + ":" + this.apiSecret;
  } else if (auth === AuthScheme.TOKEN) {
    authHeader[AuthScheme.TOKEN] = encodeToken({
      create_time: Math.round(new Date().getTime() / 1000),
      nonce: Math.floor(Math.random()*999999),
      role: RoleConstants.MODERATOR
    }, this.apiKey, this.apiSecret);
  } else {
    callback(new Error('Invalid authentication scheme used.'));
  }

  // set up request and headers
  options = {
    host: API_HOST,
    path: endpoint.path,
    method: endpoint.method,
    headers: _.extend({
      'User-Agent': 'OpenTok-Node-SDK/' + package.version,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length
    }, authHeader)
  };

  // use DI if set
  if (typeof this.apiUrl !== 'undefined') {
    var parsed = url.parse(this.apiUrl);
    if (parsed) {
      options.host = parsed.host;
      // TODO: support path adjustment? have to detect root path ('/') before adding
      //options.path = parsed.path + options.path;
      web = (parsed.protocol === 'http:') ? http : https;
    } else {
      // TODO: log a warning?
    }
  }

  // perform the request
  req = web.request(options, function(res) {
    var bufs = [];
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return callback(new Error('The server responded with status code ' + res.statusCode + '. ' +
                                'Request options: ' + JSON.stringify(options) + '. ' +
                                'Request payload: ' + data));
    }
    res.on('data', function(d) { bufs.push(d) });
    res.on('end', function() {
      var buf = Buffer.concat(bufs)
      return callback(null, buf.toString('utf8'));
    });
  });
  if (data) req.write(data, 'utf8');
  req.end();
};

/**
 * decodes a sessionId into the metadata that it contains
 * @param     {string}         sessionId
 * @returns   {?SessionInfo}    sessionInfo
 */
function decodeSessionId(sessionId) {
  var fields, sessionInfo;
  // remove sentinal (e.g. '1_', '2_')
  sessionId = sessionId.substring(2);
  // replace invalid base64 chars
  sessionId = sessionId.replace(/-/g, "+").replace(/_/g, "/");
  // base64 decode
  sessionId = new Buffer(sessionId, "base64").toString("ascii");
  // separate fields
  fields = sessionId.split("~");
  if (fields.length !== 6) return null;
  return {
    apiKey: fields[1],
    location: fields[2],
    create_time: new Date(fields[3])
  };
}

/**
 * encodes token data into a valid token
 * @param   {Object}   data
 * @param   {string}   apiKey
 * @param   {string}   apiSecret
 * @returns {string}   token
 */
function encodeToken(data, apiKey, apiSecret) {
  var dataString = querystring.stringify(data),
      sig = signString(dataString, apiSecret),
      decoded = new Buffer("partner_id="+apiKey+"&sig="+sig+":"+dataString, 'utf8');
  return TOKEN_SENTINEL + decoded.toString('base64');
}

/**
 * sign a string
 * @param   {string}   unsigned
 * @param   {string}   key
 * @returns {string}   signed
 */
function signString(unsigned, key) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.update(unsigned);
  return hmac.digest('hex');
}

/**
 * handles the result of a session creation
 * @callback OpenTok~createSessionCallback
 * @param {?Error} err
 * @param {string} sessionId
 */

/**
 * handles the result of a REST request
 * @callback OpenTok~doRequestCallback
 * @param {?Error} err
 * @param {string} responseXml
 */

/**
 * is interested in an error, can be a super-type of OpenTok~createSessionCallback
 * @callback OpenTok~doRequestCallback
 * @param {?Error} err
 * @param {...*} arguments
 */

/** 
 *  @typedef SessionInfo
 *  @type {Object}
 *  @property {string} apiKey       The API Key that created the session
 *  @property {number} location     The location hint used when creating the session
 *  @property {Date]   create_time  The time at which the session was created
 */

/*
 * External Interface
 */

// Attach external constants
// NOTE: RoleConstants is now a static property of the OpenTok constructor function
OpenTok.RoleConstants = RoleConstants;
// NOTE: AuthScheme is new
OpenTok._AuthScheme = AuthScheme;

// NOTE: required value is now the OpenTok constructor function
module.exports = OpenTok;

