/*
 * OpenTok server-side SDK
 */

// Dependencies
var net = require('net'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    _ = require('lodash'),
    encodeToken = require('opentok-token'),
    Client = require('./client'),
    Session = require('./session'),
    archiving = require('./archiving'),
    package = require('../package.json'),
    errors = require('./errors');

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
* <a href="https://dashboard.tokbox.com">OpenTok dashboard</a> page.)
*/
var OpenTok = function(apiKey, apiSecret, env) {
  // we're loose about calling this constructor with `new`, we got your back
  if (!(this instanceof OpenTok)) return new OpenTok(apiKey, apiSecret, env);

  // validate arguments: apiKey := Number|String, apiSecret := String
  if (!(_.isNumber(apiKey) || _.isString(apiKey)) || !_.isString(apiSecret)) {
    throw new Error('Invalid arguments when initializing OpenTok: apiKey=' + apiKey + ', apiSecret=' + apiSecret);
  }

  // apiKey argument can be a Number, but we will internally store it as a String
  if (_.isNumber(apiKey)) apiKey = apiKey.toString();

  this._client = new Client({ apiKey: apiKey, apiSecret: apiSecret });
  this.apiKey = apiKey;
  this.apiSecret = apiSecret;

  // TODO: this is a pretty obvious seam, the integration could be more smooth
  var archiveConfig = {
    apiEndpoint: 'https://api.opentok.com',
    apiKey: apiKey,
    apiSecret: apiSecret
  };

  // env can be either an object with a bunch of DI options, or a simple string for the apiUrl
  var clientConfig = {
    request: {}
  };
  if (_.isString(env)) {
    clientConfig.apiUrl = env;
    archiveConfig.apiEndpoint = env;
  } else if (_.isObject(env) && !_.isFunction(env) && !_.isArray(env)) {
    if (_.isString(env.apiUrl)) {
      clientConfig.apiUrl = env.apiUrl;
      archiveConfig.apiEndpoint = env.apiUrl;
    }
    if (_.isString(env.proxy)) {
      clientConfig.request.proxy = env.proxy;
      archiveConfig.proxy = env.proxy;
    }
  }
  var config = this._client.config(clientConfig);
  this.apiUrl = config.apiUrl;

  /**
  * Starts archiving an OpenTok session.
  * <p>
  * Clients must be actively connected to the OpenTok session for you to successfully start
  * recording an archive.
  * <p>
  * You can only record one archive at a time for a given session. You can only record archives
  * of sessions that uses the OpenTok Media Router (sessions with the media mode set to routed);
  * you cannot archive sessions with the media mode set to relayed.
  *
  * @param sessionId The session ID of the OpenTok session to archive.
  *
  * @param options {Object} An optional options object with the following properties (each
  * of which is optional):
  * <p>
  * <ul>
  *   <li>
  *     <code>name</code> (String) &mdash; the name of the archive, which you can use to identify
  *     the archive. The name is set as a property of the Archive object, and it is a property of
  *     archive-related events in the OpenTok client libraries.
  *   </li>
  *   <li>
  *     <code>hasAudio</code> (Boolean) &mdash; Whether the archive will include an audio track
  *     (<code>true</code>) or not (<code>false</code>). The default value is <code>true</code>
  *     (an audio track is included). If you set both  <code>hasAudio</code> and
  *     <code>hasVideo</code> to <code>false</code>, the call to the <code>startArchive()</code>
  *     method results in an error.
  *   </li>
  *   <li>
  *     <code>hasVideo</code> (Boolean) &mdash; Whether the archive will include a video track
  *     (<code>true</code>) or (not <code>false</code>). The default value is <code>true</code>
  *     (a video track is included). If you set both  <code>hasAudio</code> and
  *     <code>hasVideo</code> to <code>false</code>, the call to the <code>startArchive()</code>
  *     method results in an error.
  *   </li>
  *   <li>
  *     <code>outputMode</code> (String) &mdash; Whether all streams in the archive are recorded
  *     to a single file ("composed", the default) or to individual files ("individual").
  *   </li>
  * </ul>
  *
  * For more information on archiving and the archive file formats, see the
  * <a href="https://tokbox.com/opentok/tutorials/archiving/">OpenTok archiving</a>
  * programming guide.
  *
  * @param callback {Function} The function to call upon completing the operation. Two arguments
  * are passed to the function:
  *
  * <ul>
  *
  *   <li>
  *      <code>error</code> &mdash; An error object (if the call to the method fails).
  *   </li>
  *
  *   <li>
  *       <code>archive</code> &mdash; The {@link Archive} object. This object includes properties
  *       defining the archive, including the archive ID.
  *   </li>
  *
  * </ul>
  *
  * @method #startArchive
  * @memberof OpenTok
  */
  this.startArchive = archiving.startArchive.bind(null, archiveConfig);


  /**
  * Stops an OpenTok archive that is being recorded.
  * <p>
  * Archives automatically stop recording after 90 minutes or when all clients have disconnected
  * from the session being archived.
  *
  * @param archiveId {String} The archive ID of the archive you want to stop recording.
  * @return The {@link Archive} object corresponding to the archive being STOPPED.
  *
  * @param callback {Function} The function to call upon completing the operation. Two arguments
  * are passed to the function:
  *
  * <ul>
  *
  *   <li>
  *      <code>error</code> &mdash; An error object (if the call to the method fails).
  *   </li>
  *
  *   <li>
  *       <code>archive</code> &mdash; The {@link Archive} object.
  *   </li>
  *
  * </ul>
  *
  * @method #stopArchive
  * @memberof OpenTok
  */
  this.stopArchive = archiving.stopArchive.bind(null, archiveConfig);

  /**
  * Gets an {@link Archive} object for the given archive ID.
  *
  * @param archiveId The archive ID.
  *
  * @return The {@link Archive} object.
  *
  * @method #getArchive
  * @memberof OpenTok
  */
  this.getArchive = archiving.getArchive.bind(null, archiveConfig);

  /**
  * Deletes an OpenTok archive.
  * <p>
  * You can only delete an archive which has a status of "available" or "uploaded". Deleting an
  * archive removes its record from the list of archives. For an "available" archive, it also
  * removes the archive file, making it unavailable for download.
  *
  * @param {String} archiveId The archive ID of the archive you want to delete.
  *
  * @param callback {Function} The function to call upon completing the operation. On successfully
  * deleting the archive, the function is called with no arguments passed in. On failure, an error
  * object is passed into the function.
  *
  * @method #deleteArchive
  * @memberof OpenTok
  */
  this.deleteArchive = archiving.deleteArchive.bind(null, archiveConfig);

  /**
  * Retrieves a List of {@link Archive} objects, representing archives that are both
  * both completed and in-progress, for your API key.
  *
  * @param options {Object} An options parameter with two properties:
  *
  * <ul>
  *
  *   <li>
  *     <code>count</code> &mdash; The index offset of the first archive. 0 is offset of the most
  *     recently started archive. 1 is the offset of the archive that started prior to the most
  *     recent archive. This limit is 1000 archives.
  *   </li>
  *
  *   <li>
  *     <code>offset</code> &mdash; The offset for the first archive to list (starting with the
  *     first archive recorded as offset 0).
  *   </li>
  *
  * </ul>
  *
  * <p>If you don't pass in an <code>options</code> argument, the method returns up to 1000 archives
  * starting with the first archive recorded.
  *
  * @param callback {Function} The function to call upon completing the operation. Two arguments
  * are passed to the function:
  *
  * <ul>
  *
  *   <li>
  *      <code>error</code> &mdash; An error object (if the call to the method fails).
  *   </li>
  *
  *   <li>
  *       <code>archives</code> &mdash; An array of {@link Archive} objects.
  *   </li>
  *
  * </ul>
  *
  * @method #listArchives
  * @memberof OpenTok
  */
  this.listArchives = archiving.listArchives.bind(null, archiveConfig);
};

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
 * You can also create a session using the
 * <a href="http://www.tokbox.com/opentok/api/#session_id_production">OpenTok REST API</a>
 * or the <a href="https://dashboard.tokbox.com/projects">OpenTok dashboard</a>.
 *
 * @param   {Object} options
 * This object defines options for the session, including the following properties (both of which
 * are optional):
 *
 * <ul>
 *
 *     <li><code>location</code> (String) &mdash;
 * An IP address that the OpenTok servers will use to situate the session in the global
 * OpenTok network. If you do not set a location hint, the OpenTok servers will be based on
 * the first client connecting to the session.
 * </li>
 *
 *     <li><code>mediaMode</code> (String) &mdash;
 * Determines whether the session will transmit streams using the OpenTok Media Router
 * (<code>"routed"</code>) or not (<code>"relayed"</code>). By default, the setting is
 * <code>"relayed"</code>.
 * <p>
 * With the <code>mediaMode</code> parameter set to <code>"relayed"</code>, the session
 * will attempt to transmit streams directly between clients. If clients cannot connect due to
 * firewall restrictions, the session uses the OpenTok TURN server to relay audio-video
 * streams.
 * <p>
 * The <a href="https://tokbox.com/opentok/tutorials/create-session/#media-mode" target="_top">
 * OpenTok Media Router</a> provides the following benefits:
 *
 *      <li><code>archiveMode</code> (String) &mdash;
 * Whether the session is automatically archived (<code>"always"</code>) or not 
 * (<code>"manual"</code>). By default, the setting is <code>"manual"</code>, and you must call the
 * <code>StartArchive()</code> method of the OpenTok object to start archiving. To archive the
 * session (either automatically or not), you must set the <code>mediaMode</code> parameter to
 * <code>"routed"</code>.
 *
 * <ul>
 *   <li>The OpenTok Media Router can decrease bandwidth usage in multiparty sessions.
 *       (When the <code>mediaMode</code> parameter is set to <code>"relayed"</code>,
 *       each client must send a separate audio-video stream to each client subscribing to
 *       it.)</li>
 *   <li>The OpenTok Media Router can improve the quality of the user experience through
 *     <a href="https://tokbox.com/platform/fallback" target="_top">audio fallback and video
 *     recovery</a>. With these features, if a client's connectivity degrades to a degree that
 *     it does not support video for a stream it's subscribing to, the video is dropped on
 *     that client (without affecting other clients), and the client receives audio only.
 *     If the client's connectivity improves, the video returns.</li>
 *   <li>The OpenTok Media Router supports the
 *     <a href="https://tokbox.com/opentok/tutorials/archiving" target="_top">archiving</a>
 *     feature, which lets you record, save, and retrieve OpenTok sessions.</li>
 * </ul>
 *
 * @param   {Function}   callback
 * The function that is called when the operation completes. This function is passed two arguments:
 *
 * <ul>
 *   <li>
 *      <code>sessionId</code> &mdash; On sucess, this parameter is set to the session ID of
 *      the session. Otherwise it is set to null.
 *   </li>
 *   <li>
 *      <code>error</code> &mdash; On failiure, this parameter is set to an error object.
 *      Check the error message for details.
 *   </li>
 * </ul>
 */
OpenTok.prototype.createSession = function(opts, callback) {
  var backupOpts, self = this;

  if (_.isFunction(opts)) {
    // shift arguments if the opts is left out
    callback = opts;
    opts = {};
  } else if (!_.isFunction(callback)) {
    // one of the args has to be a function, or we bail
    throw new Error('Invalid arguments when calling createSession, must provide a callback');
  }

  // whitelist the keys allowed
  _.pick(_.defaults(opts, { "mediaMode" : "relayed", "archiveMode" : "manual" }),
        "mediaMode", "archiveMode", "location");
  if ( opts.mediaMode !== "routed" && opts.mediaMode !== "relayed" ) {
    opts.mediaMode = "relayed";
  }
  if ( opts.archiveMode !== "manual" && opts.archiveMode !== "always" ) {
    opts.archiveMode = "manual";
  }

  if ( opts.archiveMode == "always" && opts.mediaMode != "routed" ) {
    return process.nextTick(function() {
      callback(new Error('A session with always archive mode must also have the routed media mode.'));
    });
  }
  if ( "location" in opts && !net.isIPv4(opts.location) ) {
    return process.nextTick(function() {
      callback(new Error('Invalid arguments when calling createSession, location must be an ' +
                         'IPv4 address'));
    });
  }

  // rename mediaMode -> p2p.preference
  // store backup for use in constucting Session
  backupOpts = _.clone(opts);
  // avoid mutating passed in options
  opts = _.clone(opts);
  var mediaModeToParam = {
    routed : 'disabled',
    relayed : 'enabled'
  };
  opts['p2p.preference'] = mediaModeToParam[opts.mediaMode];
  delete opts.mediaMode;

  this._client.createSession(opts, function(err, json) {
    if (err) return callback(new Error('Failed to createSession. '+err));
    callback(null, new Session(self, json.sessions.Session.session_id, backupOpts));
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
*      since the UNIX epoch. The maximum expiration time is 30 days after the creation time. If
*      a fractional number is specified, then it is rounded down to the nearest whole number.
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
  var decoded, tokenData, now = Math.round(new Date().getTime() / 1000);

  if (!opts) opts = {};
  // avoid mutating passed in options
  opts = _.clone(opts);

  if ( !_.isString(sessionId) ) {
    throw new Error('Token cannot be generated without a sessionId parameter');
  }

  // validate the sessionId belongs to the apiKey of this OpenTok instance
  decoded = decodeSessionId(sessionId);
  if ( !decoded || decoded.apiKey !== this.apiKey) {
    throw new Error('Token cannot be generated unless the session belongs to the API Key');
  }

  // combine defaults, opts, and whitelisted property names to create tokenData
  if (_.isNumber(opts.expireTime) || _.isString(opts.expireTime)) {
    // Automatic rounding to help out people who pass in a fractional expireTime
    opts.expire_time = Math.round(opts.expireTime);
  }
  if (opts.data) {
    opts.connection_data = opts.data;
  }
  tokenData = _.pick(_.defaults(opts, {
    session_id: sessionId,
    create_time: now,
    expire_time: now + (60*60*24), // 1 day
    nonce: Math.random(),
    role: 'publisher'
  }), 'session_id', 'create_time', 'nonce', 'role', 'expire_time', 'connection_data');

  // validate tokenData
  if (!_.contains(['publisher', 'subscriber', 'moderator'], tokenData.role)) {
    throw new Error('Invalid role for token generation: ' + tokenData.role);
  }
  if (!_.isNumber(tokenData.expire_time)) {
    throw new Error('Invalid expireTime for token generation: ' + tokenData.expire_time);
  }
  if (tokenData.expire_time < now) {
    throw new Error('Invalid expireTime for token generation, time cannot be in the past: ' +
                    tokenData.expire_time + ' < ' + now);
  }
  if (tokenData.connection_data &&
      (tokenData.connection_data.length > 1024 || !_.isString(tokenData.connection_data))) {
    throw new Error('Invalid data for token generation, must be a string with maximum length 1024');
  }

  return encodeToken(tokenData, this.apiKey, this.apiSecret);
};

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

for(var key in errors) {
  if(errors.hasOwnProperty(key)) {
    OpenTok[key] = errors[key];
  }
}
