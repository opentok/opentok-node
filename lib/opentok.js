/*
 * OpenTok server-side SDK
 */

// Dependencies
var net = require('net'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    _ = require('lodash'),
    Client = require('./client'),
    Session = require('./session'),
    archiving = require('./archiving'),
    package = require ('../package.json')
    errors = require('./errors');

// Internal Constants
var TOKEN_SENTINEL = "T1==";

/**
 * @constructor
 * @param  {(number|string)}   apiKey
 * @param  {string}            apiSecret
 */
var OpenTok = function(apiKey, apiSecret, env) {
  // we're loose about calling this constructor with `new`, we got your back
  if (!(this instanceof OpenTok)) return new OpenTok(apiKey, apiSecret, env);

  // validate arguments: apiKey := Number|String, apiSecret := String
  if (!(_.isNumber(apiKey) || _.isString(apiKey)) || !_.isString(apiSecret)) {
    return new Error('Invalid arguments when initializing OpenTok:');
  }

  // apiKey argument can be a Number, but we will internally store it as a String
  if (_.isNumber(apiKey)) apiKey = apiKey.toString();

  this.client = new Client({ apiKey: apiKey, apiSecret: apiSecret });
  this.apiKey = apiKey;
  this.apiSecret = apiSecret;

  // TODO: this is a pretty obvious seam, the integration could be more smooth
  var archiveConfig = {
    apiEndpoint: 'https://api.opentok.com',
    apiKey: apiKey,
    apiSecret: apiSecret
  };

  // env can be either an object with a bunch of DI options, or a simple string for the apiUrl
  if (_.isString(env)) {
    this.client.config({ apiUrl: env });
    archiveConfig.apiEndpoint = env;
  }

  this.startArchive = archiving.startArchive.bind(null, archiveConfig);
  this.stopArchive = archiving.stopArchive.bind(null, archiveConfig);
  this.getArchive = archiving.getArchive.bind(null, archiveConfig);
  this.deleteArchive = archiving.deleteArchive.bind(null, archiveConfig);
  this.listArchives = archiving.listArchives.bind(null, archiveConfig);
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
  var backupOpts;

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
  backupOpts = _.clone(opts);
  opts["p2p.preference"] = opts["p2p"];
  delete opts["p2p"];

  this.client.createSession(opts, function(err, json) {
    if (err) return callback(new Error('Failed to createSession. '+err));
    callback(null, new Session(this, json.sessions.Session.session_id, backupOpts));
  });
};

/**
 * generates a token which is used to access an OpenTok Session
 * @param   {string}    sessionId
 * @param   {Object}    [opts]
 * @param   {string}    [opts.role="publisher"] describes the permissions available for a client who has used this token to connect
 * @param   {number}    [opts.expireTime] unix timestamp of when the token is no longer usable to connect (default is 1 day)
 * @param   {string}    [opts.data] static metadata associated with the client who uses this token to
 *    connect; this is read-only and available at every client who is connected to the session
 * @returns {string}    token
 */
OpenTok.prototype.generateToken = function(sessionId, opts) {
  var decoded, tokenData;

  if (!opts) opts = {};

  if ( !_.isString(sessionId) ) return null;

  // validate the sessionId belongs to the apiKey of this OpenTok instance
  decoded = decodeSessionId(sessionId);
  if ( !decoded || decoded.apiKey !== this.apiKey) return null;

  // combine defaults, opts, and whitelisted property names to create tokenData
  if (_.isNumber(opts.expireTime) || _.isString(opts.expireTime)) opts.expire_time = opts.expireTime;
  if (opts.data) opts.connection_data = opts.data;
  tokenData = _.pick(_.defaults(opts, {
    session_id: sessionId,
    create_time: Math.round(new Date().getTime() / 1000),
    expire_time: Math.round(new Date().getTime() / 1000) + (60*60*24), // 1 day
    nonce: Math.random(),
    role: 'publisher'
  }), 'session_id', 'create_time', 'nonce', 'role', 'expire_time', 'connection_data');

  // validate tokenData
  if (!_.contains(['publisher', 'subscriber', 'moderator'], tokenData.role)) return null;
  if (!_.isNumber(tokenData.expire_time)) return null;
  if (tokenData.connection_data &&
      (tokenData.connection_data.length > 1024 || !_.isString(tokenData.connection_data))) {
        return null;
  }

  return encodeToken(tokenData, this.apiKey, this.apiSecret);
}

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

module.exports = OpenTok;

for(var key in errors) {
  if(errors.hasOwnProperty(key)) {
    OpenTok[key] = errors[key];
  }
}
