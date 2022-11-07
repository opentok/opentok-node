
exports.ArgumentError = function (message) {
  this.message = message;
};

exports.ArgumentError.prototype = Object.create(Error.prototype);

exports.AuthError = function (message = 'Invalid API key or secret') {
  this.message = message;
};

exports.AuthError.prototype = Object.create(Error.prototype);


exports.ArchiveError = function (message) {
  this.message = message;
};

exports.ArchiveError.prototype = Object.create(Error.prototype);


exports.SipError = function (message) {
  this.message = message;
};

exports.SipError.prototype = Object.create(Error.prototype);


exports.SignalError = function (message) {
  this.message = message;
};

exports.SignalError.prototype = Object.create(Error.prototype);


exports.ForceDisconnectError = function (message) {
  this.message = message;
};

exports.ForceDisconnectError.prototype = Object.create(Error.prototype);


exports.CallbackError = function (message) {
  this.message = message;
};

exports.CallbackError.prototype = Object.create(Error.prototype);

exports.RequestError = function (message = 'Unexpected response from OpenTok') {
  this.message = message;
};

exports.RequestError.prototype = Object.create(Error.prototype);

exports.NotFoundError = function (message = 'Not Found') {
  this.message = message;
};

exports.NotFoundError.prototype = Object.create(Error.prototype);
