/**
* Represents an OpenTok session. Use the {@link OpenTok#createSession OpenTok.createSession()}
* method to create an OpenTok session. The <code>sessionId</code> property of the Session object
* is the session ID.
*
* @property {String} sessionId The session ID.
*
* @class Session
*/
var Session = function Session(ot, sessionId, properties) {
  var prop;
  this.ot = ot;
  this.sessionId = sessionId;
  for (prop in properties) {
    if ({}.hasOwnProperty.call(properties, prop)) {
      this[prop] = properties[prop];
    }
  }
};

/**
* Gets info about a stream. The stream must be an active stream in the OpenTok session.
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
Session.prototype.getStream = function getStream(streamId, callback) {
  return this.ot.getStream(this.sessionId, streamId, callback);
};

Session.prototype.generateToken = function generateToken(opts) {
  return this.ot.generateToken(this.sessionId, opts);
};

module.exports = Session;
