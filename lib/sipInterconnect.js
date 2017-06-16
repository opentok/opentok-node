/* global require, exports */
/* jshint strict:false, eqnull:true */

/**
* An object representing an OpenTok SIP call.
* <p>
* Do not call the <code>new()</code> constructor. To start a SIP call, call the
* {@link OpenTok#dial OpenTok.dial()} method.
*
* @property {String} id
*   The unique ID of the SIP conference.
*
* @property {String} connectionId
*   The connection ID of the audio-only stream that is put into an OpenTok Session.
*
* @property {String} streamId
*   The stream ID of the audio-only stream that is put into an OpenTok Session.
*
*
* @see {@link OpenTok#dial OpenTok.dial()}
*
* @class SipInterconnect
*/
function SipInterconnect(config, properties) {
  var hasProp = {}.hasOwnProperty;
  var key;

  for (key in properties) {
    if (hasProp.call(properties, key)) {
      this[key] = properties[key];
    }
  }

  /**
  * Starts a SIP call.
  * <p>
  * To disconnect the call use the moderation API from a client SDK or the cloud API.
  *
  * @param sessionId The session ID corresponding to the session to which the user will connect.
  *
  * @param token The token for the session ID with which the SIP user will use to connect.
  *
  * @param sipUri The sip URI the SIP Interconnect feature will dial.
  *
  * @param options {Object} An optional options object with the following properties:
  * <p>
  * <ul>
  *   <li>
  *     <code>headers</code> (Object) &mdash; Custom headers to be added to the SIP INVITE
  *     request iniated from OpenTok to the Third Party SIP Platform. All headers must start
  *     with the "X-" prefix, or a Bad Request (400) will be thrown.
  *   </li>
  *   <li>
  *     <code>auth</code> (Object) &mdash; The credentials to be used for HTTP Digest authentication
  *     in case this is required by the Third Party SIP Platform.
  *   <ul>
  *     <li> "username" -- The username to be used in the SIP INVITE.
  *     <li> "password" -- The password to be used in the SIP INVITE.
  *   </ul>
  *   </li>
  *   <li>
  *     <code>secure</code> (Boolean) &mdash; Whether the SIP call should be transmitted
  *     encrypted or not.
  *   </li>
  * </ul>
  */
}

module.exports = SipInterconnect;
