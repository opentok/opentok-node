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

Session.prototype.generateToken = function generateToken(opts) {
  return this.ot.generateToken(this.sessionId, opts);
};

module.exports = Session;
