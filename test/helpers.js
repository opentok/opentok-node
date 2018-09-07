// Test Helpers
var qs = require('querystring');
var crypto = require('crypto');
var _ = require('lodash');

function signString(unsigned, key) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.update(unsigned);
  return hmac.digest('hex');
}

exports.decodeToken = function (token) {
  var parsed = {};
  var encoded = token.substring(4); // remove 'T1=='
  var decoded = Buffer.from(encoded, 'base64').toString('ascii');
  var tokenParts = decoded.split(':');
  tokenParts.forEach(function (part) {
    _.merge(parsed, qs.parse(part));
  });
  return parsed;
};

exports.verifyTokenSignature = function (token, apiSecret) {
  var encoded = token.substring(4); // remove 'T1=='
  var decoded = Buffer.from(encoded, 'base64').toString('ascii');
  var tokenParts = decoded.split(':');
  var sig = qs.parse(tokenParts[0]).sig;
  return signString(tokenParts[1], apiSecret) === sig;
};
