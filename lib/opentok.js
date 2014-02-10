/*jshint strict:false, node:true */

var crypto = require('crypto'),
    https = require('https'),
    querystring = require('querystring'),

    pkg = require('../package.json'),
    archiving = require('./archiving'),
    errors = require('./errors'),

  // tokbox constants:
    TOKEN_SENTINEL = 'T1==',
    API_HOST = 'api.opentok.com',
    SESSION_API_ENDPOINT = '/hl/session/create';

var RoleConstants = exports.RoleConstants = {
    SUBSCRIBER: 'subscriber',
    PUBLISHER: 'publisher',
    MODERATOR: 'moderator'
};

for(var key in errors) {
  if(errors.hasOwnProperty(key)) {
    exports[key] = errors[key];
  }
}

// OpenTokSDK constructor
var OpenTokSDK = exports.OpenTokSDK = function(partnerId, partnerSecret){
  if(partnerId && partnerSecret){
    this.partnerId = partnerId;
    this.partnerSecret = partnerSecret;
    this.api_url = API_HOST;

    var archiveConfig = {
      apiEndpoint: 'https://' + API_HOST,
      apiKey: partnerId,
      apiSecret: partnerSecret
    };

    this.startArchive = archiving.startArchive.bind(null, archiveConfig);
    this.stopArchive = archiving.stopArchive.bind(null, archiveConfig);
    this.getArchive = archiving.getArchive.bind(null, archiveConfig);
    this.deleteArchive = archiving.deleteArchive.bind(null, archiveConfig);
    this.listArchives = archiving.listArchives.bind(null, archiveConfig);
  }else{
    return new Error('Invalid Key or Secret');
  }
};

exports.version = pkg.version;

OpenTokSDK.prototype.generate_token = function(ops){
  ops = ops || {};

  // At some point in this packages existence, three different forms of Session ID were used
  // Fallback to default (last session created using this OpenTokSDK instance)
  var sessionId = ops.session_id || ops.sessionId || ops.session || this.sessionId;

  if( !sessionId ){
    throw new Error('Null or empty session ID is not valid');
  }

  // validate partner id
  var subSessionId = sessionId.substring(2);
  subSessionId = subSessionId.replace(/-/g, '+').replace(/_/g, '/');
  var decodedSessionId = new Buffer(subSessionId, 'base64').toString('ascii').split('~');
  for(var i = 0; i < decodedSessionId.length; i++){
    if (decodedSessionId && decodedSessionId.length > 1){
      break;
    }
    subSessionId = subSessionId + '=';
  }
  if (decodedSessionId[1] != this.partnerId){
    throw new Error('An invalid session ID was passed');
  }


  var createTime = OpenTokSDK.prototype._getUTCDate(),
      sig,
      tokenParams,
      tokenBuffer,
      dataString,
      dataParams = {
        session_id: sessionId,
        create_time: createTime,
        nonce: Math.floor(Math.random()*999999),
        role: RoleConstants.PUBLISHER // will be overriden below if passed in
      };

  // pass through any other tokbox parameters:
  for(var op in ops){
    if(ops.hasOwnProperty(op)){
      dataParams[op] = ops[op];
    }
  }

  dataString = querystring.stringify(dataParams);
  sig = this._signString(dataString, this.partnerSecret);
  tokenParams = ['partner_id=',this.partnerId,'&sig=',sig,':',dataString].join('');
  tokenBuffer = new Buffer(tokenParams,'utf8');
  return TOKEN_SENTINEL + tokenBuffer.toString('base64');
};


OpenTokSDK.prototype.generateToken = function(ops) {
  return this.generate_token(ops);
};

OpenTokSDK.prototype.create_session = function(ipPassthru, properties, callback) {
  var sessionId,
      params = {
        partner_id: this.partnerId,
      };

  // No user specified parameter
  if( typeof(ipPassthru) == 'function' ){
    callback = ipPassthru;
    ipPassthru = null;
    properties = null;
  }
  // location is passed in only
  if( typeof(ipPassthru) == 'string' && typeof(properties) == 'function' ){
    callback = properties;
    properties = null;
  }
  // property is passed in only
  if( typeof(ipPassthru) == 'object' && typeof(properties) == 'function' ){
    callback = properties;
    properties = ipPassthru;
    ipPassthru = null;
  }
  // property and location passed in, do nothing
  
  for(var p in properties){
    params[p] = properties[p];
  }

  var self = this;
  sessionId = this._doRequest(params, function(err, chunks){
    if (err) return this._handleError({ action: 'createSession', location: ipPassthru, props: params, cause: err}, callback);

    var start = chunks.match('<session_id>'),
        end = chunks.match('</session_id>');

    if(start && end){
      self.sessionId = chunks.substr(start.index + 12, (end.index - start.index - 12));
    }
    callback(null, self.sessionId);
  });
};

OpenTokSDK.prototype.createSession = function(ipPassthru, properties, callback){
  this.create_session(ipPassthru, properties, callback);
};

OpenTokSDK.prototype._signString = function(string, secret){
  var hmac = crypto.createHmac('sha1',secret);
  hmac.update(string);
  return hmac.digest('hex');
};

OpenTokSDK.prototype._doRequest = function(params, callback){
  var dataString = querystring.stringify(params);

  var options = {
    host: this.api_url,
    path: SESSION_API_ENDPOINT,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': dataString.length,
      'X-TB-PARTNER-AUTH': this.partnerId + ':' + this.partnerSecret,
      'User-Agent': 'OpenTok-Node-SDK/' + pkg.version
    }
  };

  var req = https.request(options, function(res){
    var chunks = '';

    res.setEncoding('utf8');

    res.on('data', function(chunk){
      chunks += chunk;
    });

    res.on('end', function(){
      callback(null, chunks);
    });
  });
  req.write(dataString);
  req.on('error', function(e) {
    callback(e);
  });
  req.end();

};

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
    D.getUTCMinutes(), D.getUTCSeconds()).toString().substr(0,10);
};

