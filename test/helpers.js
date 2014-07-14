// Test Helpers
var qs = require('querystring'),
    crypto = require('crypto'),
    _ = require('lodash');

exports.decodeToken = function(token) {
  var parsed = {};
  var encoded = token.substring(4);   // remove 'T1=='
  var decoded = new Buffer(encoded, "base64").toString("ascii");
  var tokenParts = decoded.split(':');
  tokenParts.forEach(function(part) {
    _.merge(parsed, qs.parse(part));
  });
  return parsed;
};

exports.verifyTokenSignature = function(token, apiSecret) {
  var encoded = token.substring(4);   // remove 'T1=='
  var decoded = new Buffer(encoded, "base64").toString("ascii");
  var tokenParts = decoded.split(':');
  var sig = qs.parse(tokenParts[0]).sig;
  return signString(tokenParts[1], apiSecret) === sig;
};

function signString(unsigned, key) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.update(unsigned);
  return hmac.digest('hex');
}

