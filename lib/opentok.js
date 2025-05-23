/*
 * OpenTok server-side SDK
 */

// Dependencies
const debug = require('debug');
var net = require('net');
var _ = require('lodash');
var encodeToken = require('opentok-token');
var Client = require('./client');
var Session = require('./session');
var Stream = require('./stream');
var archiving = require('./archiving');
var Broadcast = require('./broadcast');
var SipInterconnect = require('./sipInterconnect');
var moderation = require('./moderation');
var signaling = require('./signaling');
var errors = require('./errors');
var callbacks = require('./callbacks');
var generateJwt = require('./generateJwt');
var render = require('./render.js');
var captions = require('./captions.js');
var OpenTok;
var key;
const { tokenGenerate } = require('@vonage/jwt');

const log = debug('@opentok');
/*
 * decodes a sessionId into the metadata that it contains
 * @param     {string}         sessionId
 * @returns   {?SessionInfo}    sessionInfo
 */
function decodeSessionId(sessionId) {
  var fields;
  // remove sentinal (e.g. '1_', '2_')
  sessionId = sessionId.substring(2);
  // replace invalid base64 chars
  sessionId = sessionId.replace(/-/g, '+').replace(/_/g, '/');
  // base64 decode
  if (typeof Buffer.from === 'function') {
    sessionId = Buffer.from(sessionId, 'base64').toString('ascii');
  }

  // separate fields
  fields = sessionId.split('~');
  return {
    apiKey: fields[1],
    location: fields[2],
    create_time: new Date(fields[3])
  };
}

/**
 * Contains methods for creating OpenTok sessions, generating tokens, working with archives, and more.
 * <p>
 * To create a new OpenTok object, call the OpenTok constructor with your OpenTok API key
 * and the API secret for your <a href="https://tokbox.com/account">TokBox account</a>.
 * Do not publicly share your API secret. You will use it with the OpenTok constructor
 * (only on your web server) to create OpenTok sessions.
 * <p>
 * Be sure to include the entire OpenTok Node.js SDK on your web server.
 *
 * @class OpenTok
 *
 * @param apiKey {String} Your OpenTok API key. (See your
 * <a href="https://tokbox.com/account">TokBox account page</a>.)
 * @param apiSecret {String} Your OpenTok API secret. (See your
 * <a href="https://tokbox.com/account">TokBox account page</a>.)
 */
// eslint-disable-next-line consistent-return
OpenTok = function (apiKey, apiSecret, env) {
  var apiConfig;
  var clientConfig;
  var config;
  // we're loose about calling this constructor with `new`, we got your back
  if (!(this instanceof OpenTok)) return new OpenTok(apiKey, apiSecret, env);

  // validate arguments: apiKey := Number|String, apiSecret := String
  if (!(_.isNumber(apiKey) || _.isString(apiKey)) || !_.isString(apiSecret)) {
    throw new Error('Invalid arguments when initializing OpenTok: apiKey='
        + apiKey
        + ', apiSecret='
        + apiSecret);
  }

  // apiKey argument can be a Number, but we will internally store it as a String
  if (_.isNumber(apiKey)) apiKey = apiKey.toString();

  this.client = new Client({ apiKey: apiKey, apiSecret: apiSecret });
  this.apiKey = apiKey;
  this.apiSecret = apiSecret;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const callVonage = `${apiSecret}`.startsWith('-----BEGIN PRIVATE KEY') && uuidRegex.test(apiKey);

  // TODO: this is a pretty obvious seam, the integration could be more smooth
  apiConfig = {
    apiEndpoint: callVonage ? 'https://video.api.vonage.com' : 'https://api.opentok.com' ,
    apiKey: apiKey,
    apiSecret: apiSecret,
    auth: {
      expire: 300
    },
    callVonage: callVonage,
  };

  // env can be either an object with a bunch of DI options, or a simple string for the apiUrl
  clientConfig = {
    request: {},
    apiUrl: callVonage ? 'https://video.api.vonage.com' : 'https://api.opentok.com',
    callVonage: callVonage,
  };
  if (_.isString(env)) {
    clientConfig.apiUrl = env;
    apiConfig.apiEndpoint = env;
  }

  if (_.isObject(env) && !_.isFunction(env) && !_.isArray(env)) {
    if (_.isString(env.apiUrl)) {
      clientConfig.apiUrl = env.apiUrl;
      apiConfig.apiEndpoint = env.apiUrl;
    }
    if (_.isString(env.proxy)) {
      clientConfig.request.proxy = env.proxy;
      apiConfig.proxy = env.proxy;
    }
    if (_.isString(env.uaAddendum)) {
      clientConfig.uaAddendum = env.uaAddendum;
      apiConfig.uaAddendum = env.uaAddendum;
    }

    if (parseInt(env.timeout, 10)) {
      clientConfig.request.timeout = parseInt(env.timeout, 10);
    }
  }

  config = this.client.config(clientConfig);
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
  *   <li>
  *     <code>layout</code> (Object) &mdash; An object defining the initial layout options
  *     for a composed archive. This object has three properties: <code>type</code>,
  *     <code>stylesheet</code>, and <code>screenshareType</code>, which are each strings.
  *     Set <code>type</code> to "bestFit",
  *     "pip", "verticalPresentation", "horizontalPresentation", or "custom". Set the
  *     <code>stylesheet</code> property if <code>type</code> is set to "custom", and
  *     set it to the stylesheet defining the custom layout. For example, set the
  *     <code>layout</code> object to <code>{ type: "pip" }</code> to set the initial layout
  *     of the archive to picture-in-picture. Set the <code>screenshareType</code> property
  *     to the layout type to use when there is a screen-sharing stream in the session
  *     (This property is optional.) Note if you set the <code>screenshareType</code> property,
  *     you must set the <code>type</code> property to "bestFit" and leave
  *     the <code>stylesheet</code> property unset. For details, see
  *     <a href="https://tokbox.com/developer/guides/archiving/layout-control.html">Customizing
  *     the video layout for composed archives</a>.
  *   </li>
  *   <li>
  *     <code>resolution</code> (String) &mdash; For a composed archive, set this to the
  *     resolution of the archive. Valid values are "1920x1080", "1280x720" or "640x480"
  *     (the default).
  *   </li>
  *   <li>
  *      <code>streamMode</code> (optional) &mdash; The stream mode for the archive. This can be
  *      set to one of the the following:
  *
  *        <ul>
  *          <li> "auto" &mdash; Streams included in the archive are selected automatically
  *          (the default).</li>
  *
  *          <li> "manual" &mdash; Specify streams to be included based on calls to the
  *          {@link OpenTok#addArchivetStream OpenTok.addArchiveStream()} and
  *          {@link OpenTok#removeArchiveStream OpenTok.removeArchiveStream()} methods.</li>
  *       </ul>
  *   </li>
  *   <li>
  *     <code>multiArchiveTag</code> (String) &mdash; Set this to support recording
  *     multiple archives for the same session simultaneously. Set this to a unique string
  *     for each simultaneous archive of an ongoing session. You must also set this option
  *     when manually starting an archive that is automatically archived. Note that the
  *     <code>multiArchiveTag</code> value is not included in the response for
  *     the methods to list archives and retrieve archive information. If you do not specify a
  *     unique <code>multiArchiveTag</code> you can only record one archive at a time for a
  *     given session.
  *   </li>
  *   <li>
  *     <code>maxBitrate</code> (Number) &mdash; The maximum video bitrate for the archive,
  *     in bits per second. This option is only valid for composed archives. Set the maximum
  *     video bitrate to control the size of the composed archive. This maximum bitrate
  *     applies to the video bitrate only. If the output archive has audio, those bits will be
  *     excluded from the limit. This value is mutually exclusive with <code>quantizationParameter</code>
  *   </li>
   *   <li>
   *     <code>quantizationParameter</code> (Number) &mdash;quantization parameter (QP) is an optional video encoding
   *     value allowed for composed archiving, smaller values generate higher quality and larger archives, larger values
   *     generate lower quality and smaller archives, QP uses variable bitrate (VBR). This value is mutally exclusive
   *     with <code>maxBitrate</code>
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

  this.startArchive = archiving.startArchive.bind(null, this, apiConfig);

  /**
   * Stops an OpenTok archive that is being recorded.
   * <p>
   * Archives automatically stop recording after 120 minutes or when all clients have disconnected
   * from the session being archived.
   * <p>
   * You cannot stop an archive that is not being recorded.
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
  this.stopArchive = archiving.stopArchive.bind(null, apiConfig);

  /**
   * Gets an {@link Archive} object for the given archive ID.
   *
   * @param archiveId {String} The archive ID.
   *
   * @param callback {Function} The function to call upon completing the operation. Two arguments
   * are passed to the function:
   * <ul>
   *   <li><code>error</code> &mdash; An error object (if the call to the method fails). </li>
   *   <li><code>archive</code> &mdash; The {@link Archive} object.</li>
   * </ul>
   *
   * @method #getArchive
   * @memberof OpenTok
   */
  this.getArchive = archiving.getArchive.bind(null, apiConfig);

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
  this.deleteArchive = archiving.deleteArchive.bind(null, apiConfig);

  /**
   * Retrieves a List of {@link Archive} objects, representing archives that are both
   * completed and in-progress, for your API key.
   *
   * @param options {Object} An options parameter with three properties:
   *
   * <ul>
   *
   *   <li>
   *     <code>count</code> &mdash; The maximum number of archives to return. The default number of
   *     archives returned is 50 (or fewer, if there are fewer than 50 archives). The method returns
   *     a maximum of 1000 archives.
   *   </li>
   *
   *   <li>
   *     <code>offset</code> &mdash; The offset for the first archive to list (starting with the
   *     first archive recorded as offset 0). 1 is the offset of the archive that started prior
   *     to the most recent archive. This property is optional; the default is 0.
   *   </li>
   *
   *   <li>
   *     <code>sessionId</code> &mdash; Specify the ID of a session in order to retrieve archives
   *     specifically for that session. This property is optional. When no session ID is specified,
   *     then the method will return archives from any session created with your API key.
   *   </li>
   *
   * </ul>
   *
   * <p>If you don't pass in an <code>options</code> argument,
   * the method returns up to 1000 archives
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
  this.listArchives = archiving.listArchives.bind(null, apiConfig);

  /**
  * Adds a stream to an archive that has the streamMode set to manual.
  * You can call the method repeatedly with the same stream ID, to toggle
  * the stream's audio or video in the archive.
  *
  * @param archiveId {String} The archive ID.
  *
  * @param streamId {String} The stream ID to add to archive.
  *
  * @param archiveOptions {Object} An object that has these properties:
  *
  * <ul>
  *
  *   <li>
  *     <code>hasAudio</code> &mdash; Whether the composed archive should include the stream's audio
  *    (true, the default) or not (false).
  *   </li>
  *
  *   <li>
  *     <code>hasVideo</code> &mdash; Whether the composed archive should include the stream's video
  *    (true, the default) or not (false).
  *   </li>
  *
  * </ul>
  *
  * @param callback {Function} The function to call upon completing the operation. One argument is
  * passed to the function
  *
  * <ul>
  *
  *   <li>
  *      <code>error</code> &mdash; An error object (if the call to the method fails).
  *   </li>
  *
  * </ul>
  *
  * @method #addArchiveStream
  * @memberof OpenTok
  */
  this.addArchiveStream = archiving.addArchiveStream.bind(null, apiConfig);

  /**
  * Removes a stream from a composed archive that has the streamMode set to manual.
  *
  * @param archiveId {String} The archive ID.
  *
  * @param streamId {String} The stream ID to remove from the archive.
  *
  * @param callback {Function} The function to call upon completing the operation. An error is
  * passed into the function if the call fails.
  *
  * @method #removeArchiveStream
  * @memberof OpenTok
  */
  this.removeArchiveStream = archiving.removeArchiveStream.bind(null, apiConfig);

  /**
   * Sets the layout type for a composed archive. For a description of layout types, see
   * <a href="https://tokbox.com/developer/guides/archiving/layout-control.html">Customizing
   * the video layout for composed archives</a>.
   *
   * @param archiveId {String} The archive ID.
   *
   * @param type {String} The layout type. Set this to "bestFit", "pip", "verticalPresentation",
   * "horizontalPresentation", "focus", or "custom". For a description of these layout types, see
   * <a href="https://tokbox.com/developer/guides/archiving/layout-control.html">Customizing
   * the video layout for composed archives</a>.
   *
   * @param stylesheet {String} (Optional) The stylesheet for a custom layout. Set this parameter
   * if you set <code>type</code> to <code>"custom"</code>. Otherwise, leave it undefined or set
   * to null.
   *
   * @param screenshareType {String} (Optional) The layout type to use when
   * there is a screen-sharing
   * stream in the session. Note that to use this parameter, you must set the <code>type</code>
   * parameter to "bestFit" and set the <code>stylesheet</code> parameter to <code>null</code>.
   *
   * @param callback {Function} The function to call upon completing the operation. Upon error,
   * an <code>error</code> object is passed into the function. Upon success, the function is called
   * with no error object passed in.
   *
   * @method #setArchiveLayout
   * @memberof OpenTok
   */
  this.setArchiveLayout = function setArchiveLayout(
    archiveId,
    type,
    stylesheet,
    screenshareType,
    callback
  ) {
    if (typeof archiveId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide an archiveId string.'));
    }
    if (typeof type !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a type string.'));
    }
    if (typeof stylesheet === 'function') {
      if (callback) {
        return callback(new Error('Invalid arguments -- stylesheet cannot be a function.'));
      }
      callback = stylesheet; // eslint-disable-line no-param-reassign
    }
    else if (stylesheet && typeof stylesheet !== 'string') {
      return callback(new Error('Invalid arguments -- stylesheet must be a string.'));
    }
    if (typeof screenshareType === 'function') {
      if (callback) {
        return callback(new Error('Invalid arguments -- screenshareType cannot be a function.'));
      }
      callback = screenshareType; // eslint-disable-line no-param-reassign
    }
    else if (screenshareType && typeof screenshareType !== 'string') {
      return callback(new Error('Invalid arguments -- screenshareType must be a string.'));
    }
    else if (screenshareType && type !== 'bestFit') {
      return callback(new Error('Invalid arguments -- type must be set to "bestFit" if you set screenshareType.'));
    }
    if (typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }
    return this.client.setArchiveLayout(
      {
        archiveId: archiveId,
        type: type,
        stylesheet: stylesheet,
        screenshareType: screenshareType
      },
      callback
    );
  };


  /**
   * Starts live captions for an OpenTok session.
   * <p>
   * The maximum allowed duration is 4 hours, after which the audio captioning will stop without
   * any effect on the ongoing OpenTok Session. An event will be posted to your callback URL if
   * provided when starting the captions.
   * <p>
   * Each OpenTok session supports only one audio captioning session.
   *
   * @param sessionId The session ID of the OpenTok session to archive.
   *
   * @param token A valid OpenTok token with role set to Moderator.
   *
   * @param options {Object} An optional options object with the following properties (each
   * of which is optional):
   * <p>
   * <ul>
   *   <li>
   *     <code>languageCode</code> (String) &mdash; The BCP-47 code for a spoken language used on
   *     this call. The default value is "en-US". The following language codes are supported:
   *     "en-AU" (English, Australia), "en-GB" (Englsh, UK), "es-US" (English, US),
   *     "zh-CN” (Chinese, Simplified), "fr-FR" (French), "fr-CA" (French, Canadian),
   *     "de-DE" (German), "hi-IN" (Hindi, Indian), "it-IT" (Italian), "ja-JP" (Japanese),
   *     "ko-KR" (Korean), "pt-BR" (Portuguese, Brazilian), "th-TH" (Thai).
   *   </li>
   *   <li>
   *     <code>maxDuration</code> (Integer) &mdash; The maximum duration for the audio captioning,
   *     in seconds. The default value is 14,400 seconds (4 hours), the maximum duration allowed.
   *     The minimum value for maxDuration is 300 (300 seconds, or 5 minutes).
   *   </li>
   *   <li>
   *     <code>partialCaptions</code> (Boolean) &mdash; Whether to enable this to faster captioning
   *     at the cost of some degree of inaccuracies. The default value is true.
   *   </li>
   * </ul>
   *
   * For more information on captions, see the
   * <a href="https://tokbox.com/developer/rest/#starting-live-captions">OpenTok captions</a>
   * programming guide.
   *
   * @param callback {Function} The function to call upon completing the operation. Two arguments
   * are passed to the function:
   *
   * <ul>
   *   <li>
   *      <code>error</code> &mdash; An error object (if the call to the method fails).
   *   </li>
   *
   *   <li>
   *       <code>captionID</code> &mdash; The id of the captions
   *   </li>
   *
   * </ul>
   *
   * @method #startCaptions
   * @memberof OpenTok
   */

  this.startCaptions = captions.startCaptions.bind(null, apiConfig);


  /**
   * Stops live captions for an OpenTok Session
   *
   * @param captionId The session ID of the OpenTok session to archive.
   *
   * </ul>
   *
   * For more information on captions, see the
   * <a href="https://tokbox.com/developer/rest/#starting-live-captions">OpenTok captions</a>
   * programming guide.
   *
   * @param callback {Function} The function to call upon completing the operation. Two arguments
   * are passed to the function:
   *
   * <ul>
   *   <li>
   *      <code>error</code> &mdash; An error object (if the call to the method fails).
   *   </li>
   *
   *   <li>
   *       <code>success</code> &mdash; True always
   *   </li>
   *
   * </ul>
   *
   * @method #startCaptions
   * @memberof OpenTok
   */

  this.stopCaptions = captions.stopCaptions.bind(null, apiConfig);


  /**
   * Retrieves a List of {@link Render} objects, representing any renders in the starting,
   * started, stopped or failed state, for your API key.
   *
   * @param options {Object} An options parameter with three properties:
   *
   * <ul>
   *
   *   <li>
   *     <code>count</code> &mdash; The maximum number of renders to return. The default number of
   *     renders returned is 50 (or fewer, if there are fewer than 50 renders). The method returns
   *     a maximum of 1000 renders.
   *   </li>
   *
   *   <li>
   *     <code>offset</code> &mdash; The offset for the first render to list (starting with the
   *     first render recorded as offset 0). 1 is the offset of the render that started prior
   *     to the most recent render. This property is optional; the default is 0.
   *   </li>
   *
   *   <li>
   *     <code>sessionId</code> &mdash; Specify the ID of a session in order to retrieve renders
   *     specifically for that session. This property is optional. When no session ID is specified,
   *     then the method will return renders from any session created with your API key.
   *   </li>
   *
   * </ul>
   *
   * <p>If you don't pass in an <code>options</code> argument,
   * the method returns up to 1000 renders, starting with the first render recorded.
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
   *       <code>renders</code> &mdash; An array of {@link Render} objects.
   *   </li>
   *
   * </ul>
   *
   * @method #listRenders
   * @memberof OpenTok
   */
  this.listRenders = render.listRenders.bind(null, apiConfig);

  /**
   * Gets a {@link Render} object for the given render ID.
   *
   * @param renderId {String} The render ID.
   *
   * @param callback {Function} The function to call upon completing the operation. Two arguments
   * are passed to the function:
   * <ul>
   *   <li><code>error</code> &mdash; An error object (if the call to the method fails). </li>
   *   <li><code>render</code> &mdash; The {@link Render} object.</li>
   * </ul>
   *
   * @method #getRender
   * @memberof OpenTok
   */
  this.getRender = render.getRender.bind(null, apiConfig);

  /**
  * Starts an Experience Composer for an OpenTok session. The Experience Composer
  * instance is represented as a Render object.
  * For more information, see the
  * <a href="https://tokbox.com/developer/guides/experience-composer/">Experience Composer developer guide</a>.
  * <p>
  * Clients must be actively connected to the OpenTok session for you to successfully start
  * rendering a session.
  * <p>
  *
  * @param options {Object} An optional options object with the following properties (each
  * of which is optional):
  * <p>
  * <ul>
  *   <li>
  *     <code>sessionId</code> (String) &mdash; The ID of a session (generated with the same
  *    `APIKEY`as specified in the URL) which you wish to start rendering into
  *   </li>
  *   <li>
  *     <code>token</code> (String) &mdash; A valid OpenTok token with a Publisher role and
  *     (optionally) connection data to be associated with the output stream.
  *   </li>
  *
  *   <li>
  *     <code>url</code> (String) &mdash; A publically reachable URL controlled by the
  *     customer and capable of generating the content to be rendered without user intervention.
  *   </li>
  *
  *   <li>
  *     <code>properties</code> (Object) &mdash; Initial configuration of Publisher properties for
  *     the composed output stream.
  *   </li>
  *
  *   <li>
  *     <code>maxDuration</code> (Number) &mdash; The maximum time allowed for the Render, in
  *     seconds. After this time, the Render will be stopped automatically, if it is still running.
  *   </li>
  *
  *   <li>
  *     <code>resolution</code> (String) &mdash; Resolution of the display area for the composition.
  *   </li>
  *
  * </ul>
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
  *       <code>render</code> &mdash; The {@link Render} object. This object includes properties
  *       defining the render, including the render ID.
  *   </li>
  *
  * </ul>
  *
  * @method #startRender
  * @memberof OpenTok
  */
  this.startRender = render.startRender.bind(null, apiConfig);

  /**
   * Stops an Experience Composer that is being rendered.
   *
   * @param renderId {String} The ID of the render you want to stop rendering.
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
   *       <code>render</code> &mdash; The {@link Render} object.
   *   </li>
   *
   * </ul>
   *
   * @method #stopRender
   * @memberof OpenTok
   */
  this.stopRender = render.stopRender.bind(null, apiConfig);

  /**
   * Starts a live streaming broadcast. See the
   * <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/">live
   * streaming broadcast</a> developer guide.
   *
   * @param {String} sessionId The ID of the session to broadcast.
   *
   * @param {Object} options An object with the following form:
   *
   * <pre><code>{
   *    outputs: {
   *      hls: {
   *        dvr: false,
   *        lowLatency: false,
   *      },
   *      rtmp: [{
   *        id: "foo",
   *        serverUrl: "rtmp://myfooserver/myfooapp",
   *        streamName: "myfoostream"
   *      },
   *      {
   *        id: "bar",
   *        serverUrl: "rtmp://mybarserver/mybarapp",
   *        streamName: "mybarstream"
   *      }]
   *    },
   *    maxDuration: 5400,
   *    resolution: "640x480",
   *    layout: {
   *      type: "custom",
   *      stylesheet: "the layout stylesheet (only used with type == custom)",
   *      screenshareType: "the layout type to use when there is a screen-sharing stream (optional)"
   *    },
   *    streamMode: "manual"
   *  }
   * </code></pre>
   *
   * <p>
   * The <code>options</code> object includes the following properties:
   *
   * <ul>
   *   <li>
   *      <p>
   *      <code>outputs</code> (required) &mdash; This object defines the types of
   *      broadcast streams you want to start. You can include HLS, RTMP, or both
   *      as broadcast streams. If you include RTMP streaming, you can specify up to five
   *      target RTMP streams (or just one).
   *      </p>
   *      <p>
   *      For HLS, include a single <code>hls</code> property in the outputs object. This object
   *      includes the following optional properties:
   *      <ul>
   *       <li>
   *        <code>dvr</code> (Boolean) — Whether to enable <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/#dvr">DVR functionality</a> — rewinding, pausing,
   *        and resuming — in players that support it (<code>true</code>), or not
   *        (<code>false</code>, the default). With DVR enabled, the HLS URL will include a
   *        <code>?DVR</code> query string appended to the end.
   *       </li>
   *       <li>
   *        <code>lowLatency</code> (Boolean) — Whether to enable <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/#low-latency">low-latency mode</a> for the HLS
   *        stream. Some HLS players do not support low-latency mode. This feature is incompatible
   *        with DVR mode HLS broadcasts.
   *       </li>
   *      </ul>
   *      The HLS URL is returned in the <code>broadcastUrls</code> as the <code>hls</code>
   *      property in the {@link Broadcast} object passed into the callback methods of the
   *      {@link OpenTok#getBroadcast} and {@link OpenTok#listBroadcast} methods.
   *      </p>
   *      <p>
   *      For each RTMP stream, specify <code>serverUrl</code> (the RTMP server URL),
   *      <code>streamName</code> (the stream name, such as the YouTube Live stream name or
   *      the Facebook stream key), and (optionally) <code>id</code> (a unique ID for the stream).
   *      If you specify an ID, it will be included as the <code>id</code> property of the
   *      {@link Broadcast} object passed into the callback methods of the
   *      <code>startBroadcast()</code> method and the
   *      {@link OpenTok#getBroadcast OpenTok.getBroadcast()} method. OpenTok streams
   *      the session to each RTMP URL you specify. Note that OpenTok live streaming
   *      supports RTMP and RTMPS.
   *      </p>
   *   </li>
   *   <li>
   *      <code>maxDuration</code> (optional) &mdash; The maximum duration for the broadcast, in
   *      seconds. The broadcast will automatically stop when the maximum duration is reached.
   *      You can set the maximum duration to a value from 60 (60 seconds) to 36000 (10 hours).
   *      The default maximum duration is 4 hours (14,400 seconds).
   *   </li>
   *   <li>
   *      <code>resolution</code> (optional) &mdash; The resolution of the broadcast: either
   *      <code>"640x480"</code> (SD, the default), <code>"1280x720"</code> (HD) or
   *      <code>"1920x1080"</code> (FHD).
   *   </li>
   *   </li>
   *      <code>layout</code> (optional) &mdash; Specify this to assign the initial layout type for
   *     the broadcast. This object has three properties: <code>type</code>,
   *     <code>stylesheet</code>, and <code>screenshareType</code>, which are each strings.
   *     Valid values for the <code>type</code> property are  <code>"bestFit"</code>
   *     (best fit),  <code>"custom"</code> (custom),  <code>"horizontalPresentation"</code>
   *     (horizontal presentation),  <code>"pip"</code> (picture-in-picture), and
   *     <code>"verticalPresentation"</code> (vertical presentation)). If you specify
   *     a <code>"custom"</code> layout type, set the <code>stylesheet</code> property of
   *     the <code>layout</code> object to the stylesheet. (For other layout types, do not set
   *     a <code>stylesheet</code> property.) If you do not specify an initial layout type,
   *     the broadcast stream uses the Best Fit layout type. Set the <code>screenshareType</code>
   *     property to the layout type to use when there is a screen-sharing stream in the session.
   *     (This property is optional.) Note if you set the <code>screenshareType</code> property,
   *     you must set the <code>type</code> property to "bestFit" and leave the
   *     <code>stylesheet</code> property unset. For more information, see
   *     <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/#configuring-video-layout-for-opentok-live-streaming-broadcasts)">Configuring
   *     video layout for OpenTok live streaming broadcasts</a>.
   *   </li>
   *   <li>
   *      <code>streamMode</code> (optional) &mdash; The stream mode for the broadcast. This can be
   *      set to one of the the following:
   *
   *        <ul>
   *          <li> "auto" &mdash; Streams included in the broadcast are selected automatically
   *          (the default).</li>
   *
   *          <li> "manual" &mdash; Specify streams to be included based on calls to the
   *          {@link OpenTok#addBroadcastStream OpenTok.addBroadcastStream()} and
   *          {@link OpenTok#removeBroadcastStream OpenTok.removeBroadcastStream()} methods.</li>
   *       </ul>
   *   </li>
   *   <li>
   *        <code>multiBroadcastTag</code> (optional) &mdash; Set this to support multiple
   *        broadcasts for the same session simultaneously. Set this to a unique string for
   *        each simultaneous broadcast of an ongoing session.
   *        Note that the <code>multiBroadcastTag</code> value is not included in the response
   *        for the methods to list live streaming broadcasts and get information about a live
   *        streaming broadcast.
   *   </li>
   * </ul>
   *
   * @param {Function} callback A callback method that takes two parameters:
   * <code>error</code>, which is set to an Error object on error, and
   * <code>broadcast</code>, which is set to a {@link Broadcast} object on success.
   *
   * @method #startBroadcast
   * @memberof OpenTok
   */
  OpenTok.prototype.startBroadcast = function (sessionId, options, callback) {
    var client = this.client;

    if (typeof callback !== 'function') {
      throw new errors.ArgumentError('No callback given to startBroadcast');
    }

    if (sessionId == null || sessionId.length === 0) {
      callback(new errors.ArgumentError('No sessionId given to startBroadcast'));
    }
    else if (!options || typeof options !== 'object') {
      callback(new errors.ArgumentError('No options given to startBroadcast'));
    }
    else {
      options.sessionId = sessionId;
      if (!options.streamMode) {
        options.streamMode = 'auto';
      }
      if (options.outputs && options.outputs.hls) {
        if (options.outputs.hls.dvr && options.outputs.hls.lowLatency) {
          callback(new errors.ArgumentError('Cannot set both dvr and lowLatency on HLS'));
          return;
        }
      }
      client.startBroadcast(options, function (err, json) {
        if (err) {
          return callback(new Error('Failed to start broadcast. ' + err));
        }
        return callback(null, new Broadcast(client, json));
      });
    }
  };

  /**
  * Adds a stream to a broadcast that has the streamMode set to manual.
  * You can call the method repeatedly with the same stream ID, to toggle
  * the stream's audio or video in the broadcast.
  *
  * @param broadcastId {String} The broadcast ID.
  *
  * @param streamId {String} The stream ID to add to broadcast.
  *
  * @param broadcastOptions {Object} An object that has these properties:
  *
  * <ul>
  *
  *   <li>
  *     <code>hasAudio</code> &mdash; Whether the broadcast should include the stream's audio
  *    (true, the default) or not (false).
  *   </li>
  *
  *   <li>
  *     <code>hasVideo</code> &mdash; Whether the broadcast should include the stream's video
  *    (true, the default) or not (false).
  *   </li>
  *
  * </ul>
  *
  * @param {Function} callback A callback method that takes two parameters:
  * <code>error</code>, which is set to an Error object on error, and
  * <code>broadcast</code>, which is set to a {@link Broadcast} object on success.
  *
  * @method #addBroadcastStream
  * @memberof OpenTok
  */
  this.addBroadcastStream = function addBroadcastStream(
    broadcastId,
    streamId,
    broadcastOptions,
    callback
  ) {
    var client = this.client;
    if (typeof broadcastOptions === 'function') {
      callback = broadcastOptions;
      broadcastOptions = {};
    }
    if (typeof callback !== 'function') {
      throw (new errors.ArgumentError('No callback given to addBroadcastStream'));
    }

    if (broadcastId == null || broadcastId.length === 0) {
      callback(new errors.ArgumentError('No broadcastId given to addBroadcastStream'));
    }

    if (streamId == null || streamId.length === 0) {
      callback(new errors.ArgumentError('No streamId given to addBroadcastStream'));
    }

    broadcastOptions = {
      addStream: streamId,
      hasAudio: broadcastOptions.hasAudio || true,
      hasVideo: broadcastOptions.hasVideo || true
    };

    client.patchBroadcast(broadcastId, broadcastOptions, callback);
  };

  /**
  * Removes a stream from a broadcast that has the streamMode set to manual.
  *
  * @param broadcastId {String} The broadcast ID.
  *
  * @param streamId {String} The stream ID to remove from the broadcast.
  *
  * @param callback {Function} The function to call upon completing the operation. An error is
  * passed into the function if the call fails.
  *
  * @method #removeBroadcastStream
  * @memberof OpenTok
  */
  this.removeBroadcastStream = function removeBroadcastStream(broadcastId, streamId, callback) {
    var client = this.client;

    if (typeof callback !== 'function') {
      throw new errors.ArgumentError('No callback given to removeBroadcastStream');
    }
    if (broadcastId == null || broadcastId.length === 0) {
      callback(new errors.ArgumentError('No archiveId provided'));
      return;
    }
    if (streamId == null || streamId.length === 0) {
      callback(new errors.ArgumentError('No streamId provided'));
      return;
    }

    client.patchBroadcast(broadcastId, { removeStream: streamId }, callback);
  };

  /**
   * Stops a live streaming broadcast.
   *
   * @param {String} broadcastId The ID of the broadcast.
   *
   * @param {Function} callback A callback method that takes two parameters:
   * <code>error</code>, which is set to an Error object on error, and
   * <code>broadcast</code>, which is set to a {@link Broadcast} object on success.
   *
   * @method #stopBroadcast
   * @memberof OpenTok
   */
  this.stopBroadcast = function stopBroadcast(broadcastId, callback) {
    var client = this.client;
    if (broadcastId === null || broadcastId.length === 0) {
      callback(new errors.ArgumentError('No broadcast ID given'));
      return;
    }

    if (typeof callback !== 'function') {
      throw new errors.ArgumentError('No callback given to stopBroadcast');
    }

    client.stopBroadcast(broadcastId, function (err, json) {
      if (err) return callback(new Error('Failed to stop broadcast. ' + err));
      return callback(null, new Broadcast(client, json));
    });
  };

  /**
   * Returns information about a live streaming broadcast.
   *
   * @param {String} broadcastId The ID of the broadcast.
   *
   * @param {Function} callback A callback method that takes two parameters:
   * <code>error</code>, which is set to an Error object on error, and
   * <code>broadcast</code>, which is set to a {@link Broadcast} object on success.
   *
   * @method #getBroadcast
   * @memberof OpenTok
   */
  this.getBroadcast = function getBroadcast(broadcastId, callback) {
    var client = this.client;

    if (broadcastId === null || broadcastId.length === 0) {
      callback(new errors.ArgumentError('No broadcast ID given'));
      return;
    }

    if (typeof callback !== 'function') {
      throw new errors.ArgumentError('No callback given to getBroadcast');
    }

    client.getBroadcast(broadcastId, function (err, json) {
      if (err) return callback(new Error('Failed to get broadcast. ' + err));
      return callback(null, new Broadcast(client, json));
    });
  };

  /**
   * Retrieves a List of {@link Broadcast} objects, representing broadcasts that are both
   * completed and in-progress, for your API key.
   *
   * @param options {Object} An options parameter with three properties:
   *
   * <ul>
   *
   *   <li>
   *     <code>count</code> &mdash; The maximum number of broadcasts to return.
   *     The default number of
   *     broadcasts returned is 50 (or fewer, if there are fewer than 50 broadcasts).
   *     The method returns a maximum of 1000 broadcasts.
   *   </li>
   *
   *   <li>
   *     <code>offset</code> &mdash; The offset for the first broadcast to list (starting with the
   *     first broadcast recorded as offset 0). 1 is the offset of the broadcast that started prior
   *     to the most recent broadcast. This property is optional; the default is 0.
   *   </li>
   *
   *   <li>
   *     <code>sessionId</code> &mdash; Specify the ID of a session in order to retrieve broadcasts
   *     specifically for that session. This property is optional. When no session ID is specified,
   *     then the method will return broadcasts from any session created with your API key.
   *   </li>
   *
   * </ul>
   *
   * <p>If you don't pass in an <code>options</code> argument,
   * the method returns up to 1000 broadcasts starting with the first broadcast recorded.
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
   *       <code>broadcasts</code> &mdash; An array of {@link Broadcast} objects.
   *   </li>
   *
   * </ul>
   *
   * @method #listBroadcasts
   * @memberof OpenTok
   */
  this.listBroadcasts = function listBroadcasts(options, callback) {
    var query = [];
    var queryString = null;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (typeof callback !== 'function') {
      throw new errors.ArgumentError('No callback given to listBroadcasts');
    }
    if (options.offset) {
      query.push('offset=' + parseInt(options.offset, 10));
    }
    if (options.count) {
      query.push('count=' + parseInt(options.count, 10));
    }
    if (options.sessionId) {
      query.push('sessionId=' + options.sessionId);
    }
    queryString = query.join('&');
    return this.client.listBroadcasts(
      queryString,
      function cb(err, json, totalCount) {
        if (err) {
          return callback(err);
        }
        return callback(null, json, totalCount);
      }
    );
  };

  /**
   * Sets (or updates) the layout of the broadcast. See
   * <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/#configuring-video-layout-for-opentok-live-streaming-broadcasts">
   * Configuring video layout for OpenTok live streaming broadcasts</a>.
   *
   * @param {String} broadcastId The ID of the broadcast.
   *
   * @param type {String} The layout type. Set this to "bestFit", "pip", "verticalPresentation",
   * "horizontalPresentation", "focus", or "custom". For a description of these layout types, see
   * <a href=https://tokbox.com/developer/guides/broadcast/live-streaming/#configuring-video-layout-for-opentok-live-streaming-broadcasts> Configuring
   * layout for OpenTok live streaming broadcasts</a>.
   *
   * @param stylesheet {String} (Optional) The stylesheet for a custom layout. Set this
   * parameter if you set <code>type</code> to "custom". Otherwise, leave it undefined or
   * set to <code>null</code>.
   *
   * @param screenshareType {String} (Optional) The layout type to use when there is
   * a screen-sharing stream in the session. Note that to use this parameter, you must set
   * the <code>type</code> parameter to "bestFit" and set the <code>stylesheet</code>
   * parameter to <code>null</code>.
   *
   * @param callback {Function} The function to call upon completing the operation. Upon error,
   * an Error object is passed into the function. Upon success, the function is called
   * with no Error object passed in.
   *
   * @method #setBroadcastLayout
   * @memberof OpenTok
   */
  this.setBroadcastLayout = function setBroadcastLayout(
    broadcastId,
    type,
    stylesheet,
    screenshareType,
    callback
  ) {
    if (typeof broadcastId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide an broadcastId string.'));
    }
    if (typeof type !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a type string.'));
    }
    if (typeof stylesheet === 'function') {
      if (callback) {
        return callback(new Error('Invalid arguments -- stylesheet cannot be a function.'));
      }
      callback = stylesheet; // eslint-disable-line no-param-reassign
    }
    else if (stylesheet && typeof stylesheet !== 'string') {
      return callback(new Error('Invalid arguments -- stylesheet must be a string.'));
    }
    if (typeof screenshareType === 'function') {
      if (callback) {
        return callback(new Error('Invalid arguments -- screenshareType cannot be a function.'));
      }
      callback = screenshareType; // eslint-disable-line no-param-reassign
    }
    else if (screenshareType && typeof screenshareType !== 'string') {
      return callback(new Error('Invalid arguments -- screenshareType must be a string.'));
    }
    else if (screenshareType && type !== 'bestFit') {
      return callback(new Error('Invalid arguments -- type must be set to "bestFit" if you set screenshareType.'));
    }
    if (typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }
    return this.client.setBroadcastLayout(
      {
        broadcastId: broadcastId,
        type: type,
        stylesheet: stylesheet,
        screenshareType: screenshareType
      },
      callback
    );
  };

  /**
  * Sends audio from a Vonage Video API session to a WebSocket.
  * See the <a href="https://tokbox.com/developer/guides/audio-connector/">Audio Connector</a>
  * developer guide.
  *
  * @param sessionId {String} (required) The OpenTok session ID that includes the OpenTok streams you want to
  * include in the WebSocket stream
  *
  * @param token {String} (required) The OpenTok token to be used for the Audio Streamer connection to the.
  * OpenTok session. You can add token data to identify that the connection is the Audio Streamer
  * endpoint or for other identifying data
  *
  * @param websocketUri {String} (required) A publicly reachable WebSocket URI to be used for the destination
  * of the audio stream (such as "wss://service.com/ws-endpoint").
  *
  * @param options {Object} An optional options object with the following properties
  * (all of which are optional):
  * <p>
  * <ul>
  *   <li>
  *     <code>streams</code> (Array) &mdash; An array of stream IDs for the OpenTok streams
  *     you want to include in the WebSocket stream. If you omit this property, all streams
  *     in the session will be included.
  *   </li>
  *   <li>
  *     <code>headers</code> (Object) &mdash; An object of key-value pairs of headers to be
  *     sent to your WebSocket server with each message, with a maximum length of 512 bytes.
  *   </li>
  * </ul>
  *
  * @param callback {Function} The function to call upon completing the operation. Upon error,
  * an <code>error</code> object is passed in as the first parameter of the function.
  * Upon success, the function is called with no error object passed in (as the first parameter)
  * and the second parameter is an object with the following properties:
  *
  *   <ul>
  *     <li>
  *       <code>id</code> -- A unique ID identifying the Audio Streamer WebSocket connection.
  *     </li>
  *     <li>
  *       <code>connectionId</code> -- The OpenTok connection ID for the Audio Streamer
  *       WebSocket connection in the OpenTok session.
  *     </li>
  *   </ul>
  *
  * @method #websocketConnect
  * @memberof OpenTok
  */
  this.websocketConnect = function websocketConnect(
    sessionId,
    token,
    websocketUri,
    options,
    callback
  ) {
    var body;

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};

    if (typeof callback !== 'function') {
      throw new errors.ArgumentError('No callback given to websocketConnect');
    }

    if (sessionId == null || sessionId.length === 0) {
      callback(new Error('No sessionId given to websocketConnect'));
      return;
    }

    if (token == null || token.length === 0) {
      callback(new Error('No token given to websocketConnect'));
      return;
    }

    if (websocketUri == null || websocketUri.length === 0) {
      callback(new Error('No websocketUri given to websocketConnect'));
      return;
    }

    body = {
      sessionId: sessionId,
      token: token,
      websocket: {
        uri: websocketUri
      }
    };

    if (_.isArray(options.streams)) {
      body.websocket.streams = options.streams;
    }

    if (_.isObject(options.headers)) {
      body.websocket.headers = options.headers;
    }

    this.client.websocketConnect(body, function (err, json) {
      if (err) return callback(new Error('Error connecting to websocket: ' + err.message));
      return callback(null, json);
    });
  };

  /**
   * Sets the layout class list for streams in a session. Layout classes are used in
   * the layout for composed archives and live streaming broadcasts. For more information, see
   * <a href="https://tokbox.com/developer/guides/archiving/layout-control.html">Customizing
   * the video layout for composed archives</a> and
   * <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/#configuring-video-layout-for-opentok-live-streaming-broadcasts">Configuring
   * video layout for OpenTok live streaming broadcasts</a>.
   *
   * <p>
   * You can set the initial layout class list for streams published by a client when you generate
   * used by the client. See the {@link OpenTok#generateToken OpenTok.generateToken()} method.
   *
   * @param sessionId {String} The session ID of the session the streams belong to.
   *
   * @param classListArray {Array} (Optional) An array defining the class lists to apply to
   * streams. Each element in the array is an object with two properties: <code>id</code> and
   * <code>layoutClassList</code>. The <code>id</code> property is the stream ID (a String),
   * and the <code>layoutClassList</code> is an array of class names (Strings) to apply to the
   * stream. Set <code>layoutClassList</code> to an empty array to clear the layout class list for
   * a stream. For example, this <code>streamClassArray</code> array sets the layout class list for
   * three streams:
   * <p>
   * <pre>
   * const classListArray = [
   *   { id: '7b09ec3c-26f9-43d7-8197-f608f13d4fb6', layoutClassList: ['focus'] },
   *   { id: '567bc941-6ea0-4c69-97fc-70a740b68976', layoutClassList: ['top'] },
   *   { id: '307dc941-0450-4c09-975c-705740d08970', layoutClassList: ['bottom'] }
   * ];
   * </pre>
   *
   * @param callback {Function} The function to call upon completing the operation. Upon error,
   * an <code>error</code> object is passed into the function. Upon success, the function is called
   * with no error object passed in.
   *
   * @method #setStreamClassLists
   * @memberof OpenTok
   */
  this.setStreamClassLists = function setStreamClassLists(
    sessionId,
    classListArray,
    callback
  ) {
    var i;
    var j;
    var layoutObj;

    if (typeof sessionId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide an sessionId string.'));
    }
    if (!Array.isArray(classListArray)) {
      return callback(new Error('Invalid arguments -- must provide a streamClassArray array.'));
    }

    for (i = 0; i < classListArray.length; i += 1) {
      layoutObj = classListArray[i];
      if (typeof layoutObj.id !== 'string') {
        return callback(new Error('Invalid arguments -- each element in the streamClassArray '
              + 'must have an id string.'));
      }
      if (!Array.isArray(layoutObj.layoutClassList)) {
        return callback(new Error('Invalid arguments -- each element in the streamClassArray '
              + 'must have a layoutClassList array.'));
      }
      for (j = 0; j < layoutObj.layoutClassList.length; j += 1) {
        if (typeof layoutObj.layoutClassList[j] !== 'string') {
          return callback(new Error('Invalid arguments -- each element in the layoutClassList '
                + 'array must be a string (defining class names).'));
        }
      }
    }

    if (typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }

    return this.client.setStreamClassLists(sessionId, classListArray, callback);
  };

  /**
   * Sends a signal to all the connections in a session or to a specific one.
   * <p>
   * Clients must be actively connected to the OpenTok session for you to successfully send
   * a signal to them.
   * <p>
   * For more information, see the
   * <a href="https://www.tokbox.com/developer/guides/signaling">OpenTok signaling</a>
   * programming guide.
   *
   * @param sessionId The session ID of the OpenTok session where you want to send the signal.
   *
   * @param connectionId The connection ID of a client connected to the session. Leave
   * this empty if you want to send a signal to all connections in the session.
   *
   * @param payload An object with optional <code>data</code> and <code>type</code> properties:
   *
   * <p>
   *
   * <ul>
   *   <li>
   *      <code>data</code> &mdash; The data to send. The limit to the length of data string
   *      is 8kB. Do not set the data string to null or undefined.
   *   </li>
   *
   *   <li>
   *      <code>type</code> &mdash; The type of the signal. Clients can use the type to filter
   *      signals. The maximum length of the type string is 128 characters.
   *   </li>
   * </ul>
   *
   * @param callback {Function} The callback function invoked when the call to the method
   * succeeds or fails. If the call fails, an error object is passed into the callback function.
   *
   * @method #signal
   * @memberof OpenTok
   */
  this.signal = signaling.signal.bind(null, apiConfig);

  /**
   * Disconnects a participant from an OpenTok session.
   *
   * This is the server-side equivalent to the
   * <a href="https://www.tokbox.com/developer/guides/moderation/js/#force_disconnect">
   * forceDisconnect() method in OpenTok.js</a>
   *
   * @param sessionId The session ID for the OpenTok session that the client you want
   * to disconnect is connected to.
   *
   * @param connectionId The connection ID of the client you want to disconnect.
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
   * </ul>
   *
   * @method #forceDisconnect
   * @memberof OpenTok
   */
  this.forceDisconnect = moderation.forceDisconnect.bind(null, apiConfig);

  /**
   * Gets info about a stream. The stream must be an active stream in an OpenTok session.
   *
   * @param sessionId {String} The session ID of the OpenTok session containing the stream.
   *
   * @param options {String} The stream ID.
   *
   * @param callback {Function} The function to call upon completing the operation. Two arguments
   * are passed to the function:
   *
   * <ul>
   *
   *   <li>
   *      <code>error</code> &mdash; An error object (if the call to the method fails). This is
   *      set to null if there is no error. Calling this method results in an error if you pass in
   *      an invalid stream ID or an invalid session ID.
   *   </li>
   *
   *   <li>
   *       <code>stream</code> &mdash; The {@link Stream} object. This object includes properties
   *       defining the stream. This is undefined if there is an error.
   *   </li>
   *
   * </ul>
   *
   * @method #getStream
   * @memberof OpenTok
   */
  this.getStream = function getStream(sessionId, streamId, callback) {
    if (!sessionId || typeof sessionId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a sessionId string.'));
    }
    if (!streamId || typeof streamId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a streamId string.'));
    }
    if (!callback || typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }
    return this.client.getStream(sessionId, streamId, function cb(err, json) {
      if (err) {
        return callback(err);
      }
      return callback(null, new Stream(json));
    });
  };

  /**
   * Send DTMF digits to all participants in an active OpenTok session or to a specific client
   * connected to that session.
   *
   * @param sessionId The session ID corresponding to the session that will receive the DTMF string.
   *
   * @param connectionId The connection connection ID of the client you are sending the DTMF
   * signal to. Leave this empty to send a DTMF signal to all clients connected to the session.
   *
   * @param digits This is the string of DTMF digits to send. This can include 0-9, '*', '#', and
   * 'p'. A p indicates a pause of 500ms (if you need to add a delay in sending the digits).
   *
   * @param callback {Function} The function to call upon completing the operation. One argument
   * is passed to the function:
   *
   * <ul>
   *
   *   <li>
   *      <code>error</code> &mdash; An error object (if the call to the method fails). This is
   *      set to null if there is no error.
   *   </li>
   *
   * </ul>
   *
   * @method #playDTMF
   * @memberof OpenTok
   */

  this.playDTMF = function playDTMF(sessionId, connectionId, digits, callback) {
    if (!sessionId || typeof sessionId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a sessionId string.'));
    }
    if (!!connectionId && typeof connectionId !== 'string') {
      return callback(new Error('Invalid arguments -- connectionId must be a string.'));
    }
    if (!callback || typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }
    return this.client.playDTMF(
      {
        sessionId: sessionId,
        connectionId: connectionId,
        digits: digits
      },
      function cb(err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      }
    );
  };

  /**
   * Retrieves a List of {@link Stream} objects, representing current streams in a session.
   *
   * @param sessionId {String} The session ID of the OpenTok session containing the streams.
   *
   * @param callback {Function} The function to call upon completing the operation. Two arguments
   * are passed to the function:
   *
   * <ul>
   *
   *   <li>
   *      <code>error</code> &mdash; An error object (if the call to the method fails). This is
   *      set to null if there is no error. Calling this method results in an error if you pass in
   *      an invalid session ID.
   *   </li>
   *
   *   <li>
   *       <code>streams</code> &mdash; An array of {@link Stream} objects. Each Stream object
   *       includes properties defining the stream. This is undefined if there is an error.
   *   </li>
   *
   * </ul>
   *
   * @method #listStreams
   * @memberof OpenTok
   */
  this.listStreams = function listStreams(sessionId, callback) {
    if (!sessionId || typeof sessionId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a sessionId string.'));
    }
    if (!callback || typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }
    return this.client.listStreams(sessionId, function cb(err, json) {
      if (err) {
        return callback(err);
      }
      return callback(null, json);
    });
  };

  /**
   * Force a specific stream in a session to mute audio.
   *
   * @param sessionId {String} The session ID.
   *
   * @param streamId {String} The stream ID.
   *
   * @param callback {Function} The function to call upon completing the operation.
   * One argument is passed to the function <code>error</code> &mdash; an error
   * indicating the call failed. This is set to null if the call succeeds.
   *
   * @see {@link OpenTok#forceMuteAll OpenTok.forceMuteAll()}
   *
   * @method #forceMuteStream
   * @memberof OpenTok
   */

  this.forceMuteStream = function forceMuteStream(
    sessionId,
    streamId,
    callback
  ) {
    if (!sessionId || typeof sessionId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a sessionId string.'));
    }
    if (!!streamId && typeof streamId !== 'string') {
      return callback(new Error('Invalid arguments -- streamId must be a string.'));
    }
    if (!callback || typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }
    return this.client.forceMuteStream(
      {
        sessionId: sessionId,
        streamId: streamId
      },
      function cb(err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      }
    );
  };

  /**
   * Forces all streams (except for an optional array of streams) in a session
   * to mute published audio.
   * <p>
   * In addition to existing streams, any streams that are published after the call
   * to this method are published with audio muted. You can remove the mute state of
   * a session by calling the {@link OpenTok#disableForceMute OpenTok.disableForceMute()} method.
   *
   * @param sessionId The session ID.
   *
   * @param opts An object that contains the following properties:
   *
   * <ul>
   *   <li>
   *     <code>excudedStreamIds</code> (Array of strings) &mdash; An array of
   *     stream IDs to exlude from being muted. This is optional. If you do not
   *     set this property, all arrays in the session will be muted.
   *   </li>
   * </ul>
   *
   * @param callback {Function} The function to call upon completing the operation.
   * One argument is passed to the function <code>error</code> &mdash; an error
   * indicating the call failed. This is set to null if the call succeeds.
   *
   * @see {@link OpenTok#disableForceMute OpenTok.disableForceMute()}
   * @see {@link OpenTok#forceMuteStream OpenTok.forceMuteStream()}
   *
   * @method #forceMuteAll
   * @memberof OpenTok
   */

  this.forceMuteAll = function forceMuteAll(sessionId, options, callback) {
    if (!sessionId || typeof sessionId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a sessionId string.'));
    }

    if (_.isFunction(options)) {
      // shift arguments if the opts is left out
      callback = options;
      options = {};
    }

    if (options.excudedStreamIds && !_.isArray(options.excudedStreamIds)) {
      return callback(new Error('Invalid arguments -- excudedStreamIds must be array.'));
    }

    if (!callback || typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }

    return this.client.forceMuteAll(
      {
        sessionId: sessionId,
        options: options
      },
      function cb(err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      }
    );
  };

  /**
   * Disables the active mute state of the session. After you call this method, new streams
   * published to the session will no longer have audio muted.
   * <p>
   * After you call the {@link OpenTok#forceMuteAll OpenTok.forceMuteAll()} method,
   * any streams published after the call are published with audio muted. When you call the
   * <code>OpenTok.disableForceMute()</code> method, future streams published to the session
   * are not muted (but any existing muted streams remain muted).
   *
   * @param sessionId The session ID.
   *
   * @param callback {Function} The function to call upon completing the operation.
   * One argument is passed to the function <code>error</code> &mdash; an error
   * indicating the call failed. This is set to null if the call succeeds.
   *
   * @method #disableForceMute
   * @memberof OpenTok
   */

  this.disableForceMute = function disableForceMute(sessionId, callback) {
    if (!sessionId || typeof sessionId !== 'string') {
      return callback(new Error('Invalid arguments -- must provide a sessionId string.'));
    }

    if (!callback || typeof callback !== 'function') {
      return callback(new Error('Invalid arguments -- must provide a callback function.'));
    }

    return this.client.disableForceMute(
      {
        sessionId: sessionId
      },
      function cb(err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      }
    );
  };

  this.registerCallback = callbacks.registerCallback.bind(null, apiConfig);

  this.unregisterCallback = callbacks.unregisterCallback.bind(null, apiConfig);

  this.listCallbacks = callbacks.listCallbacks.bind(null, apiConfig);
};

/**
  * Dials a SIP gateway to input an audio-only stream into your OpenTok Session. Part of the SIP
  * feature.
  *
  * @param sessionId The session ID corresponding to the session to which the user will connect.
  *
  * @param token The token for the session ID with which the SIP user will use to connect.
  *
  * @param sipUri The sip URI the SIP Interconnect feature will dial.
  *
  * @param options {Object} An optional options object with the following properties
  * (all of which are optional):
  * <p>
  * <ul>
  *   <li>
  *     <code>headers</code> (Object) &mdash; Custom headers to be added to the SIP INVITE
  *     request iniated from OpenTok to the third-party SIP platform.
  *   </li>
  *   <li>
  *     <code>auth</code> (Object) &mdash; The credentials to be used for HTTP Digest authentication
  *     in case this is required by the third-party SIP platform.
  *   <ul>
  *     <li> "username" -- The username to be used in the SIP INVITE.
  *     <li> "password" -- The password to be used in the SIP INVITE.
  *   </ul>
  *   </li>
  *   <li>
  *     <code>secure</code> (Boolean) &mdash; Whether the SIP media streams should be transmitted
  *     encrypted or not.
  *   </li>
  *   <li>
  *     <code>from</code> (String) &mdash; The number or string that will be sent
  *     to the final SIP number as the caller. It must be a string in the form of
  *     <code>from@example.com</code>, where <code>from</code> can be a string or a number.
  *     If <code>from</code> is set to a number (for example,
  *     <code>"14155550101@example.com"</code>),
  *     it will show up as the incoming number on PSTN phones.
  *     If <code>from</code> is undefined or set to a string (for example,
  *     <code>"joe@example.com"</code>),
  *     <code>+00000000</code> will show up as the incoming number on PSTN phones.
  *   </li>
  *   <li>
  *     <code>video</code> (Boolean) &mdash;  A Boolean flag that indicates whether the SIP call
  *     will include video (<code>true</code>) or not (<code>false</code>, the default). With video
  *     included, the SIP client's video is included in the OpenTok stream that is sent to
  *     the OpenTok session. The SIP client will receive a dynamic composed video stream
  *     of the published streams in the OpenTok session. This is a beta feature.
  *   </li>
  *   <li>
  *     <code>observeForceMute</code> (optional) Whether the SIP end point observes
  *     force mute action by other clients like moderators (<code>true</code>)
  *     or not (<code>false</code>, the default). See
  *     <a href="https://tokbox.com/developer/guides/moderation/#force_mute">Muting
  *     the audio of streams in a session</a>.
  *   </li>
  *   <li>
  *     <code>streams</code> (optional) The stream IDs of the participants'
  *     which will be subscribed by the SIP participant. If not provided, all
  *     streams in session will be selected.
  *   </li>
  * </ul>
  *
  * @return A {@link SipInterconnect} object with the following properties:
  *   <ul>
  *     <li> <code>id</code> -- The unique conference ID of the SIP call</li>
  *     <li> <code>connectionId</code> -- The connection ID of the audio-only stream
  *       representing the SIP call</li>
  *     <li> <code>streamId</code> -- The stream ID of the audio-only stream representing
  *       the SIP call</li>
  *   </ul>
  */
OpenTok.prototype.dial = function (sessionId, token, sipUri, options, callback) {
  var self = this;
  var body;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to dial');
  }
  if (sessionId == null || sessionId.length === 0) {
    callback(new errors.ArgumentError('No session ID given'));
    return;
  }
  if (token == null || token.length === 0) {
    callback(new errors.ArgumentError('No token given'));
    return;
  }
  if (sipUri == null || sipUri.length === 0) {
    callback(new errors.ArgumentError('No SIP URI given'));
    return;
  }
  body = {
    sessionId: sessionId,
    token: token,
    sip: {
      uri: sipUri
    }
  };
  if (_.isObject(options.headers) && !_.isArray(options.headers)) {
    body.sip.headers = options.headers;
  }
  if (_.isObject(options.auth) && !_.isArray(options.auth)) {
    body.sip.auth = options.auth;
  }
  if (options.secure) {
    body.sip.secure = !!options.secure;
  }

  if (options.from) {
    body.sip.from = String(options.from);
  }

  if (options.video) {
    body.sip.video = !!options.video;
  }

  if (options.observeForceMute) {
    body.sip.observeForceMute = !!options.observeForceMute;
  }

  this.client.dial(body, function (err, json) {
    if (err) return callback(new Error('Failed to dial endpoint. ' + err));
    return callback(null, new SipInterconnect(self, json));
  });
};

/**
 * Creates a new OpenTok session. The session is passed as {@link Session} object into the callback
 * function. The <code>sessionId</code> property is the session ID, which uniquely identifies
 * the session. On error, an Error object is passed into the callback function.
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
 * or by logging in to your <a href="https://tokbox.com/account">TokBox account</a>.
 *
 * @param   {Object} options
 * This object defines options for the session, including the following properties (both of which
 * are optional):
 *
 * <ul>
 *     <li><code>location</code> (String) &mdash;
 * An IP address that the OpenTok servers will use to situate the session in the global
 * OpenTok network. If you do not set a location hint, the OpenTok servers will be based on
 * the first client connecting to the session.
 * </li>
 *
 *     <li><code>e2ee</code> (Boolean) &mdash;
 * Determines whether to enable <a href="https://tokbox.com/developer/guides/end-to-end-encryption/">
`end-to-end encryption</a>
for the OpenTok session. Set to <code>"true"</code> or <code>"false"</code>.
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
 *     <li><code>archiveName</code> (String) &mdash; The name of the archives to be used in
 *     auto-archived sessions. The length of the archive name can be up to 80 chars.
 *     Due to encoding limitations the following special characters are translated to
 *     a colon (:) character: ~, -, _.</li>
 *
 *     <li><code>archiveResolution</code> (Enum) &mdash; The resolution of archives in an auto-archived session.
 *     Valid values are "480x640", "640x480", "720x1280", "1280x720", "1080x1920", and "1920x1080".
 *     </li>
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
 * </li>
 * </ul>
 *
 * @param   {Function}   callback
 * The function that is called when the operation completes. This function is passed two arguments:
 *
 * <ul>
 *   <li>
 *      <code>error</code> &mdash; On failiure, this parameter is set to an Error object.
 *      Check the error message for details. On success, this is set to null.
 *   </li>
 *   <li>
 *      <code>session</code> &mdash; On sucess, this parameter is set to a {@link Session} object.
 *      The sessionId property of this object is session ID of the session. On error, this parameter
 *      is not set.
 *   </li>
 * </ul>
 */
OpenTok.prototype.createSession = function (opts, callback) {
  var backupOpts;
  var self = this;
  var mediaModeToParam;

  if (_.isFunction(opts)) {
    // shift arguments if the opts is left out
    callback = opts;
    opts = {};
  }
  else if (!_.isFunction(callback)) {
    // one of the args has to be a function, or we bail
    throw new Error('Invalid arguments when calling createSession, must provide a callback');
  }

  // whitelist the keys allowed
  _.pick(
    _.defaults(opts, { mediaMode: 'relayed', archiveMode: 'manual' }),
    'mediaMode',
    'archiveMode',
    'location'
  );
  if (opts.mediaMode !== 'routed' && opts.mediaMode !== 'relayed') {
    opts.mediaMode = 'relayed';
  }
  if (opts.archiveMode !== 'manual' && opts.archiveMode !== 'always') {
    opts.archiveMode = 'manual';
  }

  if (opts.archiveMode === 'always' && opts.mediaMode !== 'routed') {
    return process.nextTick(function () {
      callback(new Error('A session with always archive mode must also have the routed media mode.'));
    });
  }
  if ('location' in opts && !net.isIPv4(opts.location)) {
    return process.nextTick(function () {
      callback(new Error('Invalid arguments when calling createSession, location must be an '
            + 'IPv4 address'));
    });
  }

  // rename mediaMode -> p2p.preference
  // store backup for use in constucting Session
  backupOpts = _.clone(opts);
  // avoid mutating passed in options
  opts = _.clone(opts);
  mediaModeToParam = {
    routed: 'disabled',
    relayed: 'enabled'
  };
  opts['p2p.preference'] = mediaModeToParam[opts.mediaMode];
  delete opts.mediaMode;

  return this.client.createSession(
    opts,
    function createSessionCallback(err, json) {
      if (err) {
        callback(new Error('Failed to createSession. ' + err));
      }
      else {
        callback(null, new Session(self, json[0].session_id, backupOpts));
      }
    }
  );
};

/**
* Creates a token for connecting to an OpenTok session. In order to authenticate a user
* connecting to an OpenTok session, the client passes a token when connecting to the session.
* <p>
* For testing, you can also generate a token by logging into your
* <a href="https://tokbox.com/account">TokBox account</a>.
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
*           <li> <code> 'publisheronly'</code> &mdash; A publisheronly can publish streams, but
               cannot subscribe to streams.</li>
*           <li> <code>'moderator'</code> &mdash; In addition to the privileges granted to a
*              publisher, a moderator can perform moderation functions, such as forcing clients
*              to disconnect, to stop publishing streams, or to mute audio in published streams.
*              See the
*              <a href="https://tokbox.com/developer/guides/moderation/">Moderation developer guide</a>.</li>
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
*
*    <li><code>initialLayoutClassList</code> (Array) &mdash; An array of class names (strings)
*      to be used as the initial layout classes for streams published by the client. Layout
*      classes are used in customizing the layout of videos in
*      <a href="https://tokbox.com/developer/guides/broadcast/live-streaming/">live streaming
*      broadcasts</a> and
*      <a href="https://tokbox.com/developer/guides/archiving/layout-control.html">composed
*      archives</a>.
*    </li>
*
* </ul>
*
* @param generateT1Token Connection tokens are now SHA-256 signed JWTs. Set this to <code>true</code> to create a token using the legacy T1 format. 
*
* @return The token string.
*/

OpenTok.prototype.generateToken = function (sessionId, opts, generateT1Token = false) {
  if (this.client?.c?.callVonage) {
    const now = Math.round(new Date().getTime() / 1000);
    const claims = {
      scope: 'session.connect',
      session_id: sessionId,
      role: 'publisher',
      initial_layout_class_list: '',
      exp: opts?.expire_time || now + 86400,
      sub: 'video',
      acl: {
        paths: {
          '/session/**': {},
        },
      },
    };

    if (opts?.role) {
      claims.role = opts.role;
    }
    if (opts?.data) {
      claims.connection_data = opts.data;
    }
    if (opts?.initialLayoutClassList) {
      claims.initial_layout_class_list
        = opts.initialLayoutClassList.join(' ');
    }

    return tokenGenerate(
      this.client.c.apiKey,
      this.client.c.apiSecret,
      claims,
    )
  }
  var decoded;
  var tokenData;
  var now = Math.round(new Date().getTime() / 1000);

  if (!opts) opts = {};
  // avoid mutating passed in options
  opts = _.clone(opts);

  if (!_.isString(sessionId)) {
    throw new Error('Token cannot be generated without a sessionId parameter');
  }

  // validate the sessionId belongs to the apiKey of this OpenTok instance
  decoded = decodeSessionId(sessionId);
  if (!decoded || decoded.apiKey !== this.apiKey) {
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
  if (_.isArray(opts.initialLayoutClassList)) {
    opts.initial_layout_class_list = opts.initialLayoutClassList.join(' ');
  }
  else if (_.isString(opts.initialLayoutClassList)) {
    opts.initial_layout_class_list = opts.initialLayoutClassList;
  }
  tokenData = _.pick(
    _.defaults(opts, {
      session_id: sessionId,
      create_time: now,
      expire_time: now + (60 * 60 * 24), // 1 day
      nonce: Math.random(),
      role: 'publisher',
      initial_layout_class_list: '',
      scope: 'session.connect'
    }),
    'session_id',
    'create_time',
    'nonce',
    'role',
    'expire_time',
    'connection_data',
    'initial_layout_class_list',
    'scope'
  );

  // validate tokenData
  if (!_.includes(['publisher', 'publisheronly', 'subscriber', 'moderator'], tokenData.role)) {
    throw new Error('Invalid role for token generation: ' + tokenData.role);
  }
  if (!_.isNumber(tokenData.expire_time)) {
    throw new Error('Invalid expireTime for token generation: ' + tokenData.expire_time);
  }
  if (tokenData.expire_time < now) {
    throw new Error('Invalid expireTime for token generation, time cannot be in the past: '
        + tokenData.expire_time
        + ' < '
        + now);
  }
  if (
    tokenData.connection_data
    && (tokenData.connection_data.length > 1024
      || !_.isString(tokenData.connection_data))
  ) {
    throw new Error('Invalid data for token generation, must be a string with maximum length 1024');
  }
  if (
    tokenData.initial_layout_class_list
    && tokenData.initial_layout_class_list.length > 1024
  ) {
    throw new Error('Invalid initial layout class list for token generation, must have '
        + 'concatenated length of less than 1024');
  }

  if (generateT1Token) {
    return encodeToken(tokenData, this.apiKey, this.apiSecret);
  }

  return generateJwt(this.client.c, tokenData);
};

/*
 * decodes a sessionId into the metadata that it contains
 * @param     none
 * @returns   {string}    JWT
 */
OpenTok.prototype.generateJwt = function () {
  return generateJwt(this.client.c);
};

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

/*
 *  @typedef SessionInfo
 *  @type {Object}
 *  @property {string} apiKey       The API Key that created the session
 *  @property {number} location     The location hint used when creating the session
 *  @property {Date}   create_time  The time at which the session was created
 */

/*
 * External Interface
 */

module.exports = OpenTok;

for (key in errors) {
  if (Object.prototype.hasOwnProperty.call(errors, key)) {
    OpenTok[key] = errors[key];
  }
}
