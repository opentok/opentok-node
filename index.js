/*
 * OpenTok server-side SDK
 */

// Dependencies
var https = require('https'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    to_json = require('xmljson').to_json,
    _ = require('underscore'),
    getArchive = require('./lib/archiving');

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
var OpenTokSDK = function(apiKey, apiSecret) {
  // TODO: to allow for DI, we can add a third argument which can take non-default config/dependencies

  // we're loose about calling this constructor with `new`, we got your back
  if (!(this instanceof OpenTokSDK)) return new OpenTokSDK(apiKey, apiSecret);

  // validate arguments: apiKey := Number|String, apiSecret := String
  if (!(_.isNumber(apiKey) || _.isString(apiKey)) || !_.isString(apiSecret)) {
    return null;
  }

  // apiKey argument can be a Number, but we will internally store it as a String
  if (_.isNumber(apiKey)) apiKey = apiKey.toString();

  this.apiKey = apiKey;
  this.apiSecret = apiSecret;
}

/**
 * creates a new OpenTok Session (calls the API server) and returns the sessionId via callback
 * @param   {Object}                             [opts]
 * @param   {string}                             [opts.location="127.0.0.1"] a hint to help
 *    the OpenTok media server chose a location for the server; formatted as an
 *    IP address or a host name
 * @param   {boolean}                            [opts.p2p_preference=false] when set
 *    to true, the created session will only allow two clients (1-to-1) that
 *    will stream medapeer-to-peer
 * @param   {OpenTokSDK~createSessionCallback}   callback
 */
OpenTokSDK.prototype.createSession = function(opts, callback) {
  // NOTE: the callback's signature is now error-first
  // NOTE: removing first param and folding it into opts (it was already optional)
  // NOTE: removing older method aliases
  // NOTE: p2p.preference -> p2p_preference

  // shift arguments if there opts is left out
  if (_.isFunction(opts)) {
    callback = opts;
    opts = {};
  }

  // use defaults for missing options
  _.defaults(opts, { "location" : "127.0.0.1", "p2p_preference" : false });

  // rename p2p_preference -> p2p.preference
  opts["p2p.preference"] = opts["p2p_preference"];
  delete opts["p2p_preference"];

  this._doRequest(ENDPOINTS.SESSION_CREATE, AuthScheme.PARTNER, opts, function(err, xml) {
    if (err) return handleError({ action: 'createSession', props: opts, cause: err}, callback);
    to_json(xml, function(err, json) {
      if (err) return handleError({ action: 'createSession', props: opts, cause: err}, callback);
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
OpenTokSDK.prototype.generateToken = function(sessionId, opts) {
  // NOTE: sessionId is a required paramerter and now the first param
  // NOTE: removing older method aliases
  var decoded, tokenData;

  if ( !_.isString(sessionId) ) return null;

  // validate the sessionId belongs to the apiKey of this OpenTokSDK instance
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

OpenTokSDK.prototype.getArchive = function(archiveId, callback) {
  return getArchive(this, archiveId, callback);
};


/**
 * sends a request to the OpenTok REST API using the given parameters
 * @param    {Object}                       endpoint
 * @param    {string}                       auth - "token" or "partner"
 * @param    {?(Object|string)}             data
 * @param    {OpenTokSDK~doRequestCallback} callback
 */
OpenTokSDK.prototype._doRequest = function(endpoint, auth, data, callback) {
  // TODO: we may want another param to specify the type of auth (X-TB-TOKEN-AUTH)
  var options, req, authHeader;

  // take care of encoding a JSON object into a string
  if (!_.isString(data)) data = querystring.stringify(data);

  // create the auth header
  if (auth === AuthScheme.PARTNER) {
    authHeader = { auth : this.apiKey + ":" + this.apiSecret};
  } else if (auth === AuthScheme.TOKEN) {
    authHeader = { auth : encodeToken({
      create_time: Math.round(new Date().getTime() / 1000),
      nonce: Math.floor(Math.random()*999999),
      role: RoleConstants.MODERATOR
    }, this.apiKey, this.apiSecret) };
  } else {
    callback(new Error('Invalid authentication scheme used.'));
  }

  // set up request and headers
  options = {
    host: API_HOST,
    path: endpoint.path,
    method: endpoint.method,
    headers: _.extend({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length
    }, authHeader)
  };

  // perform the request
  req = https.request(options, function(res) {
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
 * sends errors to callback functions in pretty, readable messages
 * @param   {Object}                    details
 * @param   {string}                    details.action - the action whose error needs handling
 * @param   {Error}                     [details.cause] - an underlying error that caused the error
 * @param   {OpenTokSDK~errorCallback}  cb
 */
function handleError(details, cb) {
  var message;

  // Construct message according the the action (or method) that is triggering the error
  if (details.action === 'createSession') {
    message = 'Failed to create new OpenTok Session using properties: ' + JSON.stringify(details.props) + '.\n';
  }

  // When there is an underlying error that caused this one, give some details about it
  if (details.cause) {
    message += 'This error was caused by another error: "' + details.cause.message + '".\n';
  }

  return cb(new Error(message));
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
 * @callback OpenTokSDK~createSessionCallback
 * @param {?Error} err
 * @param {string} sessionId
 */

/**
 * handles the result of a REST request
 * @callback OpenTokSDK~doRequestCallback
 * @param {?Error} err
 * @param {string} responseXml
 */

/**
 * is interested in an error, can be a super-type of OpenTokSDK~createSessionCallback
 * @callback OpenTokSDK~doRequestCallback
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
// NOTE: RoleConstants is now a static property of the OpenTokSDK constructor function
OpenTokSDK.RoleConstants = RoleConstants;
// NOTE: AuthScheme is new
OpenTokSDK._AuthScheme = AuthScheme;

// NOTE: required value is now the OpenTokSDK constructor function
module.exports = OpenTokSDK;
