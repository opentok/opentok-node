/*global require, exports*/
/*jshint strict:false, eqnull:true */

var request = require('request'),
    errors  = require('./errors'),
    pkg     = require('../package.json');

function Archive(config, properties) {
  var hasProp = {}.hasOwnProperty,
      id = properties.id,
      key;

  for (key in properties) {
    if (!hasProp.call(properties, key)) continue;
    this[key] = properties[key];
  }

  this.stop = function(callback) {
    exports.stopArchive(config, id, callback);
  };

  this.delete = function(callback) {
    exports.deleteArchive(config, id, callback);
  };
}

var api = function(config, method, path, body, callback) {
  var rurl = config.apiEndpoint + '/v2/partner/' + config.apiKey + path;
  request({
    url: rurl,
    method: method,
    headers: {
      'X-TB-PARTNER-AUTH': config.apiKey + ':' + config.apiSecret,
      'User-Agent': 'OpenTok-Node-SDK/' + pkg.version
    },
    json: body
  }, callback);
};


exports.listArchives = function(config, options, callback) {
  if(typeof options == 'function') {
    callback = options;
    options = {};
  }
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to listArchives'));
  }
  var qs = [];
  if(options.offset) {
    qs.push('offset=' + parseInt(options.offset, 10));
  }
  if(options.count) {
    qs.push('count=' + parseInt(options.count, 10));
  }
  api(config, 'GET', '/archive?' + qs.join('&'), null, function(err, response, body) {
    if(!err && body ) {
      try {
        body = JSON.parse(body);
      } catch (_err) {
        err = _err;
      }
    }
    if(err || response.statusCode != 200) {
      if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null, body.items.map(function(item){
        return new Archive(config, item);
      }), body.count);
    }
  });
};

exports.startArchive = function(config, sessionId, options, callback) {
  if(typeof options == 'function') {
    callback = options;
    options = {};
  }
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to startArchive'));
  }
  if(sessionId == null || sessionId.length === 0) {
    callback(new errors.ArgumentError('No session ID given'));
    return;
  }
  api(config, 'POST', '/archive', {
    sessionId: sessionId,
    name: options.name
  }, function(err, response, body) {
    if(err) {
      callback(err);
    } else if(response.statusCode != 200) {
      if(response && response.statusCode == 404) {
        callback(new errors.ArchiveError('Session not found'));
      } else if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else if(body.status != 'started') {
      callback(new errors.RequestError('Unexpected response from OpenTok'));
    } else {
      callback(null, new Archive(config, body));
    }
  });
};

exports.stopArchive = function(config, archiveId, callback) {
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to stopArchive'));
  }
  if(archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archive ID given'));
    return;
  }
  api(config, 'POST', '/archive/' + encodeURIComponent(archiveId) + '/stop', {},
    function(err, response, body) {
    if(err) {
      callback(err);
    } else if(response.statusCode != 200) {
      if(response && response.statusCode == 404) {
        callback(new errors.ArchiveError('Archive not found'));
      } else if(response && response.statusCode == 409) {
        callback(new errors.ArchiveError(body.message));
      } else if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {

        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null, new Archive(config, body));
    }
  });
};

exports.getArchive = function(config, archiveId, callback) {
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to getArchive'));
  }
  if(archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archive ID given'));
    return;
  }
  api(config, 'GET', '/archive/' + archiveId, null, function(err, response, body) {
    if(!err && body ) {
      try {
        body = JSON.parse(body);
      } catch (_err) {
        err = _err;
      }
    }
    if(err || response.statusCode != 200) {
      if(response && response.statusCode == 404) {
        callback(new errors.ArchiveError('Archive not found'));
      } else if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null, new Archive(config, body));
    }
  });
};

exports.deleteArchive = function(config, archiveId, callback) {
  if(typeof callback != 'function') {
    throw(new errors.ArgumentError('No callback given to deleteArchive'));
  }
  if(archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archive ID given'));
    return;
  }
  api(config, 'DELETE', '/archive/' + encodeURIComponent(archiveId), null,
    function(err, response) {
    if(err || response.statusCode != 204) {
      if(response && response.statusCode == 404) {
        callback(new errors.ArchiveError('Archive not found'));
      } else if(response && response.statusCode == 403) {
        callback(new errors.AuthError('Invalid API key or secret'));
      } else {
        callback(new errors.RequestError('Unexpected response from OpenTok'));
      }
    } else {
      callback(null);
    }
  });
};
