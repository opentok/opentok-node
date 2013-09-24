var https = require('https')
  , querystring = require('querystring')
  , crypto = require('crypto')

  // tokbox constants:
  , TOKEN_SENTINEL = "T1=="
  , API_HOST = "api.opentok.com"
  , SESSION_API_ENDPOINT = "/hl/session/create"
  , GET_MANIFEST = "/archive/getmanifest/"
  , GET_URL = "/hl/archive/url/";

var RoleConstants = exports.RoleConstants = {
    SUBSCRIBER: "subscriber",
    PUBLISHER: "publisher",
    MODERATOR: "moderator"
}

// JS constants
var JSObject = "object"
  , JSFunction = "function"
  , JSString = "string"
  , JSNumber = "number"

// OpenTokSession constructor (only used internally)
var OpenTokSession = function(sessionId){
  this.sessionId = sessionId
}

// OpenTokSDK constructor
var OpenTokSDK = exports.OpenTokSDK = function(partnerId, partnerSecret){
  if(partnerId && partnerSecret){
    this.partnerId = partnerId;
    this.partnerSecret = partnerSecret;
    this.api_url = API_HOST;
  }else{
    return new Error("Invalid Key or Secret");
  }
}

OpenTokSDK.OpenTokArchive = function(sdkObject){
  var self = this;
  this.resources = [];
  this.addVideoResource = function(res){
    self.resources.push(res);
  };
  this.downloadArchiveURL=function(vid, callback){
    var options = {
      host: sdkObject.api_url,
      path: GET_URL+sdkObject.archiveId+"/"+vid,
      method: 'GET',
      headers: {
        'x-tb-token-auth':sdkObject.token
      }
    };
    var req = https.request(options, function(res){
      var chunks = '';
      res.setEncoding('utf8')
      res.on('data', function(chunk){
        chunks += chunk
      })
      res.on('end', function(){
        callback(chunks);
      })
    })
    req.end()
  };
};
OpenTokSDK.OpenTokArchiveVideoResource = function(vid,length,name){
  this.vid = vid;
  this.length = length;
  this.name = name;
  this.getId = function(){
    return vid;
  };
};
OpenTokSDK.prototype.getArchiveManifest = function(archiveId, token, callback){
  this.get_archive_manifest( archiveId, token, callback );
}

OpenTokSDK.prototype.get_archive_manifest = function(archiveId, token, callback){
  this.token = token;
  this.archiveId = archiveId;
  var self = this;
  var parseResponse = function(chunks){
    var response = new OpenTokSDK.OpenTokArchive(self);
    var start = chunks.match('<resources>')
      , end = chunks.match('</resources>')
    var videoTags = null
    if(start && end){
      videoTags = chunks.substr(start.index + 12, (end.index - start.index - 12))
      attr = videoTags.split('"');
      if(attr.length>5){
        vid = attr[1]
        length = attr[3]
        name = attr[5]
        resource = new OpenTokSDK.OpenTokArchiveVideoResource(vid, length, name);
        response.addVideoResource(resource);
      }
    }
    callback(response);
  };

  var options = {
    host: this.api_url,
    path: GET_MANIFEST+archiveId,
    method: 'GET',
    headers: {
      'x-tb-token-auth':token
    }
  }
  var req = https.request(options, function(res){
    var chunks = '';
    res.setEncoding('utf8')
    res.on('data', function(chunk){
      chunks += chunk
    })
    res.on('end', function(){
      parseResponse(chunks);
    })
  })
  req.end()
}

OpenTokSDK.prototype.generate_token = function(ops){
  ops = ops || {};

  // At some point in this packages existence, three different forms of Session ID were used
  // Fallback to default (last session created using this OpenTokSDK instance)
  var sessionId = ops.session_id || ops.sessionId || ops.session || this.sessionId;

  if( !sessionId || sessionId == "" ){
    throw new Error("Null or empty session ID is not valid");
  }

  // validate partner id
  var subSessionId = sessionId.substring(2);
  subSessionId = subSessionId.replace(/-/g, "+").replace(/_/g, "/");
  var decodedSessionId = new Buffer(subSessionId, "base64").toString("ascii").split("~");
  for(var i = 0; i < decodedSessionId.length; i++){
    if (decodedSessionId && decodedSessionId.length > 1){
      break
    }
    subSessionId = subSessionId + "=";
  }
  if (decodedSessionId[1] != this.partnerId){
    throw new Error("An invalid session ID was passed");
  }


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
  tokenParams = ["partner_id=",this.partnerId,"&sig=",sig,":",dataString].join("")
  tokenBuffer = new Buffer(tokenParams,"utf8");
  return TOKEN_SENTINEL + tokenBuffer.toString('base64');
}


OpenTokSDK.prototype.generateToken = function(ops){
  return this.generate_token(ops);
}

OpenTokSDK.prototype.create_session = function(ipPassthru, properties, callback){
  var sessionId
    , params = {
        partner_id: this.partnerId,
      };

  // No user specified parameter
  if( typeof(ipPassthru) == JSFunction ){
    callback = ipPassthru;
    ipPassthru = null;
    properties = null;
  }
  // location is passed in only
  if( typeof(ipPassthru) == JSString && typeof(properties) == JSFunction ){
    callback = properties;
    properties = null;
  }
  // property is passed in only
  if( typeof(ipPassthru) == JSObject && typeof(properties) == JSFunction ){
    callback = properties;
    properties = ipPassthru;
    ipPassthru = null;
  }
  // property and location passed in, do nothing
  
  for(var p in properties){
    params[p] = properties[p]
  }

  var self = this;
  sessionId = this._doRequest(params, function(err, chunks){
    if (err) return this._handleError({ action: 'createSession', location: ipPassthru, props: params, cause: err}, callback);

    var start = chunks.match('<session_id>')
      , end = chunks.match('</session_id>')
      , sessionId;

    if(start && end){
      self.sessionId = chunks.substr(start.index + 12, (end.index - start.index - 12))
    }
    callback(null, self.sessionId)
  });
}

OpenTokSDK.prototype.createSession = function(ipPassthru, properties, callback){
  this.create_session(ipPassthru, properties, callback);
}

OpenTokSDK.prototype._signString = function(string, secret){
  var hmac = crypto.createHmac('sha1',secret)
  hmac.update(string)
  return hmac.digest('hex')
}

OpenTokSDK.prototype._doRequest = function(params, callback){
  var dataString = querystring.stringify(params);

  var options = {
    host: this.api_url,
    path: SESSION_API_ENDPOINT,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': dataString.length,
      'X-TB-PARTNER-AUTH': this.partnerId + ":" + this.partnerSecret
    }
  }

  var req = https.request(options, function(res){
    var chunks = '';

    res.setEncoding('utf8')

    res.on('data', function(chunk){
      chunks += chunk
    })

    res.on('end', function(){
      callback(null, chunks);
    })
  })
  req.write(dataString)
  req.on('error', function(e) {
    callback(e);
  });
  req.end()

}

/*
 * Sends errors to callback functions in pretty, readable messages
 */
OpenTokSDK.prototype._handleError = function(details, cb) {
  var message;

  // Construct message according the the action (or method) that is triggering the error
  if (details.action === 'createSession') {
    message = 'Failed to create new OpenTok Session using location: ' + details.location + ', properties: ' + JSON.stringify(details.props) + '.';
  }

  // When there is an underlying error that caused this one, give some details about it
  if (details.cause) {
    message += 'This error was caused by another error: "' + details.cause.message + '".';
  }

  return cb(new Error(message));
};

OpenTokSDK.prototype._getUTCDate = function(){
  var D= new Date();
  return Date.UTC(D.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate(), D.getUTCHours(),
    D.getUTCMinutes(), D.getUTCSeconds()).toString().substr(0,10)
}

