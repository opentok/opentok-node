var https = require('https')
  , querystring = require('querystring')
  , crypto = require('crypto')

  // tokbox constants:
  , TOKEN_SENTINEL = "T1=="
  , SDK_VERSION = "tbjs-0.91.2011-03-16"
  , TOKBOX_HOST = "staging.tokbox.com"
  , SESSION_API_ENDPOINT = "/hl/session/create";

// Session Properties definition:
var SessionProperties = exports.SessionProperties = function(){
  return {
    'echoSuppression.enabled' : null,
    'multiplexer.numOutputStreams' : null,
    'multiplexer.switchType' : null,
    'multiplexer.switchTimeout' : null
  }
}

var RoleConstants = exports.Roles = function(){
  return {
    'SUBSCRIBER': "subscriber",
    'PUBLISHER': "publisher",
    'MODERATOR': "moderator"
  }
}

// Just the session
var OpenTokSession = function(sessionId){
  this.sessionId = sessionId
}

// The SDK
var OpenTokSDK = exports.OpenTokSDK = function(partnerId, partnerSecret){
  this.partnerId = partnerId
  this.partnerSecret = partnerSecret
}

OpenTokSDK.prototype.setEnvironment = function(host){
  TOKBOX_HOST = host
}

OpenTokSDK.prototype.generateToken = function(ops){
  ops = ops || {}

  // grab options or use defaults:
  var sessionId = (ops.session) ? ops.session.sessionId : this.sessionId;

  var createTime = OpenTokSDK.prototype._getUTCDate()
    , sig
    , tokenString
    , tokenParams
    , tokenBuffer
    , dataString
    , dataParams = {
        session_id: sessionId,
        create_time: createTime,
        nonce: Math.floor(Math.random()*999999),
        role: RoleConstants.PUBLISHER // will be overriden below if passed in
      };

  // pass through any other tokbox parameters:
  for(var op in ops){
    if(ops.hasOwnProperty(op)){
      dataParams[op] = ops[op]
    }
  }

  dataString = querystring.stringify(dataParams)
  sig = this._signString(dataString, this.partnerSecret)
  tokenParams = ["partner_id=",this.partnerId,"&sdk_version=",SDK_VERSION,"&sig=",sig,":",dataString].join("")
  tokenBuffer = new Buffer(tokenParams,"utf8");
  return TOKEN_SENTINEL + tokenBuffer.toString('base64');

}

OpenTokSDK.prototype.createSession = function(ipPassthru, properties, callback){
  var sessionId
    , params = {
        partner_id: this.partnerId,
        location_hint: ipPassthru
      };

  for(var p in properties){
    params[p] = properties[p]
  }

  sessionId = this._doRequest(params, function(sessionId){
    callback(new OpenTokSession(sessionId))
  })

}

OpenTokSDK.prototype._signString = function(string, secret){
  var hmac = crypto.createHmac('sha1',secret)
  hmac.update(string)
  return hmac.digest(encoding='hex')
}

OpenTokSDK.prototype._doRequest = function(params, callback){
  var dataString = querystring.stringify(params)
    , reqOptions;

  options = {
    host: TOKBOX_HOST,
    path: SESSION_API_ENDPOINT,
    method: 'POST',
    headers: {
      'Content-Type': 'application-xml',
      'Content-Length': dataString.length,
      'X-TB-PARTNER-AUTH': this.partnerId + ":" + this.partnerSecret
    }
  }

  req = https.request(options, function(res){
    var chunks = '';

    res.setEncoding('utf8')

    res.on('data', function(chunk){
      chunks += chunk
    })

    res.on('end', function(){
      var start = chunks.match('<session_id>')
        , end = chunks.match('</session_id>');

      if(start && end){
        var session = chunks.substr(start.index + 12, (end.index - start.index - 12))
        callback(session)
      } else {
        callback()
      }
    })
  })
  req.write(dataString)
  req.end()

}

OpenTokSDK.prototype._getUTCDate = function(){
  var D= new Date();
  return Date.UTC(D.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate(), D.getUTCHours(),
    D.getUTCMinutes(), D.getUTCSeconds()).toString().substr(0,10)
}

