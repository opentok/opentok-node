

var Session = function(ot, sessionId, properties) {
  this.ot = ot;
  this.sessionId = sessionId;
  for (prop in properties) {
    this[prop] = properties[prop];
  }
}

Session.prototype.generateToken = function(opts) {
  this.ot.generateToken(this.sessionId, opts);
}

module.exports = Session;
