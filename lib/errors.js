
exports.ArgumentError = function(message) {
  this.message = message;
}

exports.ArgumentError.prototype = Object.create(Error.prototype);


exports.AuthError = function(message) {
  this.message = message;
}

exports.AuthError.prototype = Object.create(Error.prototype);


exports.ArchiveError = function(message) {
  this.message = message;
}

exports.ArchiveError.prototype = Object.create(Error.prototype);


exports.RequestError = function(message) {
  this.message = message;
}

exports.RequestError.prototype = Object.create(Error.prototype);
