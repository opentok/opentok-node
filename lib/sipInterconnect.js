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
}

module.exports = SipInterconnect;
