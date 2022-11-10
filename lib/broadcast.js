/**
* An object representing an OpenTok live streaming broadcast.
* <p>
* Do not call the <code>new()</code> constructor. To start a live streaming broadcast, call the
* {@link OpenTok#startBroadcast OpenTok.startBroadcast()} method.
*
* @property {String} id
*   The broadcast ID.
* @property {String} sessionId
*   The session ID of the OpenTok session associated with this broadcast.
* @property {String} projectId
*   The API key associated with the broadcast.
* @property {Number} createdAt
*   The time at which the broadcast was created, in milliseconds since the UNIX epoch.
* @property {String} resolution
*   The resolution of the broadcast: one of the following:
*   <ul>
*     <li>"640x480"</li>
*     <li>"1280x720"</li>
*     <li>"1920x1080"</li>
*     <li>"480x640"</li>
*     <li>"720x1280"</li>
*     <li>"1080x1920"</li>
*   </ul>
*   You may want to use a portrait aspect ratio for broadcasts that include video streams from
*   mobile devices (which often use the portrait aspect ratio). This property is optional.
* @property {Object} broadcastUrls
*   An object containing details about the HLS and RTMP broadcasts.
*   <p>
*   <ul>
*     <li>
*       <code>hls</code> (String) &mdash; If you specified an HLS endpoint, the object includes
*       an hls property, which is set to the URL for the HLS broadcast. Note this HLS broadcast
*       URL points to an index file, an .M3U8-formatted playlist that contains a list of URLs to
*       .ts media segment files (MPEG-2 transport stream files). While the URLs of both the
*       playlist index file and media segment files are provided as soon as the HTTP response
*       is returned, these URLs should not be accessed until 15 – 20 seconds later, after the
*       initiation of the HLS broadcast, due to the delay between the HLS broadcast and the live
*       streams in the OpenTok session.
*       See https://developer.apple.com/library/ios/technotes/tn2288/_index.html for more
*       information about the playlist index file and media segment files for HLS.
*     </li>
*     <li>
*       <code>rtmp</code> (Object Array) &mdash; If you specified RTMP stream endpoints,
*       the object includes an rtmp property. This is an array of objects that include
*       information on each of the RTMP streams.
*       Each of these objects has the following properties:
*       <ul>
*         <li><code>id</code> The ID you assigned to the RTMP stream</li>
*         <li><code>serverUrl</code> The server URL</li>
*         <li><code>streamName</code> The stream name</li>
*         <li><code>status</code> The status of the stream</li>
*       </ul>
*     </li>
*   </ul>
* @property {Number} maxDuration
*   The maximum time allowed for the broadcast, in seconds.
*   After this time, the broadcast will be stopped automatically, if it is still started.
*
* @property {String} streamMode
*   The stream mode for the broadcast. This can be set to one of the the following:
*
*   <ul>
*     <li> "auto" &mdash; Streams included in the broadcast are selected automatically
*     (the default).</li>
*
*     <li> "manual" &mdash; Specify streams to be included based on calls to the
*    {@link OpenTok#addBroadcastStream OpenTok.addBroadcastStream()} and
*    {@link OpenTok#removeBroadcastStream OpenTok.removeBroadcastStream()} methods.</li>
*   </ul>
*
* @property {Array} streams
*   An array of objects corresponding to streams currently being broadcast.
*   This is only set for a broadcast with the status set to "started" and
*   the streamMode set to "manual". Each object in the array includes the following properties:
*   <ul>
*     <li><code>streamId</code> -- The stream ID of the stream included in the broadcast.
*     <li><code>hasAudio</code> -- Whether the stream's audio is included in the broadcast.
*     <li><code>hasVideo</code> -- Whether the stream's video is included in the broadcast.
*   </ul>
*
* @property {String} multiBroadcastTag
*    Set this to support multiple broadcasts for the same session simultaneously. Set this
*    to a unique string for each simultaneous broadcast of an ongoing session.
*    Note that the <code>multiBroadcastTag</code> value is not included in the response
*    for the methods to list live streaming broadcasts and get information about a live
*    streaming broadcast.
*
* @see {@link OpenTok#getBroadcast OpenTok.getBroadcast()}
* @see {@link OpenTok#startBroadcast OpenTok.startBroadcast()}
* @see {@link OpenTok#stopBroadcast OpenTok.stopBroadcast()}
*
* @class Broadcast
*/
var Broadcast = function Broadcast(client, json) {
  var properties = JSON.parse(json);
  var hasProp = {}.hasOwnProperty;
  var id = properties.id;
  var key;

  for (key in properties) {
    if (hasProp.call(properties, key) && key !== 'event' && key !== 'partnerId') {
      this[key] = properties[key];
    }
  }

  /**
  * Stops the live streaming broadcast.
  * <p>
  * Broadcasts automatically stop recording after 120 minutes or when all clients have disconnected
  * from the session being broadcast.
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
  *       <code>broadcast</code> &mdash; The Broadcast object.
  *   </li>
  *
  * </ul>
  *
  * @method #stop
  * @memberof Broadcast
  */
  this.stop = function (callback) {
    client.stopBroadcast(id, function (err, response) {
      if (err) {
        return callback(new Error('Failed to stop broadcast. ' + err));
      }
      return callback(null, new Broadcast(client, response));
    });
  };
};

module.exports = Broadcast;

