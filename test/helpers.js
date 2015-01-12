// Test Helpers
var qs = require('querystring'),
    crypto = require('crypto'),
    _ = require('lodash');

exports.decodeSessionId = function(sessionId) {

  var fields;

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
    createTime: new Date(fields[3])
  };
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

exports.getAttachableNock = function(nock, networkAttached) {
  if (networkAttached) {
    var dummy = function() { return dummy; },
        methodNames = ['get',
                       'post',
                       'delete',
                       'put',
                       'merge',
                       'patch',
                       'head',
                       'intercept',
                       'reply',
                       'replyWithFile',
                       'discard',
                       'delay',
                       'delayConnection',
                       'match',
                       'matchIndependentOfBody',
                       'matchHeader',
                       'times',
                       'once',
                       'twice',
                       'thrice',
                       'done',
                       'isDone',
                       'cleanAll',
                       'activate',
                       'isActive',
                       'removeInterceptor',
                       'disableNetConnect',
                       'enableNetConnect',
                       'load',
                       'loadDefs',
                       'define',
                       'filteringPath',
                       'filteringRequestBody',
                       'defaultReplyHeaders',
                       'log',
                       'persist',
                       'shouldPersist',
                       'pendingMocks'];
    methodNames.forEach(function(methodName) {
      dummy[methodName] = dummy;
    });
    return dummy;
  } else {
    return nock;
  }
};

function signString(unsigned, key) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.update(unsigned);
  return hmac.digest('hex');
}

