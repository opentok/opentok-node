/*
 * OpenTok server-side SDK
 */

// Dependencies
var net = require('net'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    _ = require('lodash'),
    Client = require('./client'),
    archiving = require('./archiving'),
    package = require ('../package.json');

// Internal Constants
var TOKEN_SENTINEL = "T1==";

/**
* Contains methods for creating OpenTok sessions, generating tokens, and working with archives.
* <p>
* To create a new OpenTok object, call the OpenTok constructor with your OpenTok API key
* and the API secret from <a href="https://dashboard.tokbox.com">the OpenTok dashboard</a>.
* Do not publicly share your API secret. You will use it with the OpenTok constructor
* (only on your web server) to create OpenTok sessions.
* <p>
* Be sure to include the entire OpenTok Node.js SDK on your web server.
*
* @class OpenTok
*
* @param apiKey {String} Your OpenTok API key. (See the
* <a href="https://dashboard.tokbox.com">OpenTok dashboard</a> page.)
* @param apiSecret {String} Your OpenTok API secret. (See the
* <a href="https://dashboard.tokbox.com">OpenTok dashboard</a> page)
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
 * Creates a new OpenTok session and returns the session ID, which uniquely identifies
 * the session.
 * <p>
 * For example, when using the OpenTok.js library, use the session ID when calling the
 * <a href="http://tokbox.com/opentok/libraries/client/js/reference/OT.html#initSession">
 * OT.initSession()</a> method (to initialize an OpenTok session).
 * <p>
 * OpenTok sessions do not expire. However, authentication tokens do expire (see the
 * generateToken(String, TokenOptions) method). Also note that sessions cannot
 * explicitly be destroyed.
 * <p>
 * A session ID string can be up to 255 characters long.
 *
 * You can also create a session using the <a href="http://www.tokbox.com/opentok/api/#session_id_production">OpenTok
 * REST API</a> or the <a href="https://dashboard.tokbox.com/projects">OpenTok dashboard</a>.
 *
 *
 * @return A session ID for the new session. For example, when using the OpenTok.js library, use
 * this session ID when calling the <code>OT.initSession()</code> method.
 *
 * @param   {Object} options
 * This object defines options for the session, including the following properties:
 *
 * <ul>
 *
 *     <li><code>location</code> (String) &mdash;
 * An IP address that the OpenTok servers will use to situate the session in the global
 * OpenTok network. If you do not set a location hint, the OpenTok servers will be based on
 * the first client connecting to the session.
 * </li>
 *
 *     <li><code>p2p</code> (Boolean) &mdash;
 * Determines whether the session will transmit streams between peers
 * (true) or using the OpenTok Media Router (false). By default, sessions use the OpenTok
 * Media Router (false).
 * <p>
 * The <a href="http://www.tokbox.com/blog/mantis-next-generation-cloud-technology-for-webrtc/">
 * OpenTok Media Router</a> provides benefits not available in peer-to-peer sessions.
 * For example, the OpenTok media server can decrease bandwidth usage in multiparty sessions.
 * Also, the OpenTok server can improve the quality of the user experience through
 * <a href="http://www.tokbox.com/blog/quality-of-experience-and-traffic-shaping-the-next-step-with-mantis/">dynamic
 * traffic shaping</a>.
 * <p>
 * For peer-to-peer sessions, the session will attempt to transmit streams directly
 * between clients. If clients cannot connect due to firewall restrictions, the session uses
 * the OpenTok TURN server to relay audio-video streams.
 * <p>
 * You will be billed for streamed minutes if you use the OpenTok Media Router or if the
 * peer-to-peer session uses the OpenTok TURN server to relay streams. For information on
 * pricing, see the <a href="http://www.tokbox.com/pricing">OpenTok pricing page</a>.
 *
 * @param   {Function}   callback
 * The function that is called when the operation completes. This function is passed two arguments:
 *
 * <ul>
 *   <li>
 *      <code>sessionId</code> &mdash; On sucess, this paramter is set to the session ID of
 *      the session.
 *   </li>
 *   <li>
 *      <code>error</code> &mdash; On failiure, this parameter is set to an error object.
 *      Check the error message for details.
 *   </li>
 * </ul>
 */
OpenTok.prototype.createSession = function(opts, callback) {

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

  this.client.createSession(opts, function(err, json) {
    if (err) return callback(new Error('Failed to createSession. '+err));
    callback(null, json.sessions.Session.session_id);
  });
};

/**
* Creates a token for connecting to an OpenTok session. In order to authenticate a user
* connecting to an OpenTok session, the client passes a token when connecting to the session.
* <p>
* For testing, you can also use the <a href="https://dashboard.tokbox.com/projects">OpenTok
* dashboard</a> page to generate test tokens.
*
* @param sessionId The session ID corresponding to the session to which the user will connect.
*
* @param options An object that defines options for the token (each of which is optional):
*
* <ul>
*    <li><code>role</code> (String) &mdash; The role for the token. Each role defines a set of
*      permissions granted to the token:
*
*        <ul>
*           <li> <code>'subscriber'</code> &mdash; A subscriber can only subscribe to streams.</li>
*
*           <li> <code>'publisher'</code> &mdash; A publisher can publish streams, subscribe to
*              streams, and signal. (This is the default value if you do not specify a role.)</li>
*
*           <li> <code>'moderator'</code> &mdash; In addition to the privileges granted to a
*             publisher, in clients using the OpenTok.js 2.2 library, a moderator can call the
*             <code>forceUnpublish()</code> and <code>forceDisconnect()</code> method of the
*             Session object.</li>
*        </ul>
*
*    </li>
*
*    <li><code>expireTime</code> (Number) &mdash; The expiration time for the token, in seconds
*      since the UNIX epoch. The maximum expiration time is 30 days after the creation time.
*      The default expiration time of 24 hours after the token creation time.
*    </li>
*
*    <li><code>data</code> (String) &mdash; A string containing connection metadata describing the
*      end-user.For example, you can pass the user ID, name, or other data describing the end-user.
*      The length of the string is limited to 1000 characters. This data cannot be updated once it
*      is set.
*    </li>
* </ul>
*
* @return The token string.
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
  opts.connection_data = opts.data;
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

/*
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

/*
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

/*
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

/*
 * handles the result of a session creation
 * @callback OpenTok~createSessionCallback
 * @param {?Error} err
 * @param {string} sessionId
 */

/*
 * handles the result of a REST request
 * @callback OpenTok~doRequestCallback
 * @param {?Error} err
 * @param {string} responseXml
 */

/*
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

