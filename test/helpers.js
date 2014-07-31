// Test Helpers
var qs = require('querystring'),
    crypto = require('crypto'),
    _ = require('lodash');


function decodeSessionId(sessionId) {
  var fields, sessionInfo;
  // remove sentinal (e.g. '1_', '2_')
  sessionId = sessionId.substring(2);
  // replace invalid base64 chars
  sessionId = sessionId.replace(/-/g, '+').replace(/_/g, '/');
  // base64 decode
  sessionId = new Buffer(sessionId, 'base64').toString('ascii');
  // separate fields
  fields = sessionId.split('~');
  return {
    apiKey: fields[1],
    location: fields[2],
    create_time: new Date(fields[3])
  };
}

exports.validateSession = function(session, properties) {
  
  var decoded;
  
  if (!session || !session.sessionId) {
    return false;
  }
  
  decoded = decodeSessionId(session.sessionId);

  if (!decoded) {
    return false;
  }

  for (var property in properties) {
    if (session.hasOwnProperty(property)) {
      if (properties[property] !== session[property]) {
        return false;
      }
    }
  }

  return true;
};

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

