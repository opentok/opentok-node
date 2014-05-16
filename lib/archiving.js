/*global require, exports*/
/*jshint strict:false, eqnull:true */

var request = require('request'),
    errors  = require('./errors'),
    pkg     = require('../package.json');

/**
* An object representing an OpenTok 2.0 archive.
*
* @param {Number} createdAt
*   The time at which the archive was created, in milliseconds since the UNIX epoch.
*
* @param {String} duration
*   The duration of the archive, in milliseconds.
*
* @param {String} id
*   The archive ID.
*
* @param {String} name
*   The name of the archive. If no name was provided when the archive was created, this is set
*   to null.
*
* @param {String} partnerId
*   The API key associated with the archive.
*
* @param {String} reason
*   For archives with the status "stopped", this can be set to "90 mins exceeded", "failure",
*   "session ended", or "user initiated". For archives with the status "failed", this can be set
*   to "system failure".
*
* @param {String} sessionId
*   The session ID of the OpenTok session associated with this archive.
*
* @param {Number} size
*   The size of the MP4 file. For archives that have not been generated, this value is set to 0.
*
* @param {String} status
*   The status of the archive, which can be one of the following:
*   <ul>
*     <li> "available" -- The archive is available for download from the OpenTok cloud.
*     <li> "failed" -- The archive recording failed.
*     <li> "started" -- The archive started and is in the process of being recorded.
*     <li> "stopped" -- The archive stopped recording.
*     <li> "uploaded" -- The archive is available for download from the the upload target
*          S3 bucket.
*   </ul>
*
* @param {String} url
*   The download URL of the available MP4 file. This is only set for an archive with the status set to
*   "available"; for other archives, (including archives with the status "uploaded") this property is
*   set to null. The download URL is obfuscated, and the file is only available from the URL for
*   10 minutes. To generate a new URL, call the Archive.listArchives() or OpenTok.getArchive()
*   method.
*
* @see {@link OpenTok#deleteArchive OpenTok.deleteArchive}
* @see {@link OpenTok#getArchive OpenTok.getArchive}
* @see {@link OpenTok#startArchive OpenTok.startArchive}
* @see {@link OpenTok#stopArchive OpenTok.stopArchive}
* @see {@link OpenTok#listArchives OpenTok.listArchives}
*
* @class Archive
*/
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

/**
* Retrieves a List of {@link Archive} objects, representing archives that are both
* both completed and in-progress, for your API key. 
*
* @param options {Object} An options parameter with two properties:
*
* <ul>
*
*   <li>
*     <code>count</code> &mdash; The index offset of the first archive. 0 is offset of the most 
*     recently started archive. 1 is the offset of the archive that started prior to the most recent 
*     archive. This limit is 1000 archives.
*   </li>
*
*   <li>
*     <code>offset</code> &mdash; The offset for the first archive to list (starting with the first
*     archive recorded as offset 0).
*   </li>
*
* </ul>
*
* <p>If you don't pass in an <code>options</code> argument, the method returns up to 1000 archives
* starting with the first archive recorded.
*
* @param callback {Function} The function to call upon completing the operation. Two arguments
* are passed to the function:
* 
* <ul>
*
*   <li>
*      <code>error</code> &mdash; An error object (if the call to the method fails).
*   </li>
*
*   <li>
*       <code>archives</code> &mdash; An array of Archive objects.
*   </li>
*
* </ul>
* 
* @method #listArchives
* @memberof OpenTok
*/
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

/**
* Starts archiving an OpenTok 2.0 session.
* <p>
* Clients must be actively connected to the OpenTok session for you to successfully start recording
* an archive.
* <p>
* You can only record one archive at a time for a given session. You can only record archives
* of sessions that uses the OpenTok Media Router; you cannot archive peer-to-peer sessions.
*
* @param sessionId The session ID of the OpenTok session to archive.
*
* @param options {Object} An optional options object with one property &mdash; <code>name</code>
* (a String). This is the name of the archive. You can use this name to identify the archive. It is
* a property of the Archive object, and it is a property of archive-related events in the OpenTok
* client libraries.
*
* @param callback {Function} The function to call upon completing the operation. Two arguments
* are passed to the function:
* 
* <ul>
*
*   <li>
*      <code>error</code> &mdash; An error object (if the call to the method fails).
*   </li>
*
*   <li>
*       <code>archives</code> &mdash; The Archive object. This object includes properties defining
*       the archive, including the archive ID.
*   </li>
*
* </ul>
*
* @method #startArchive
* @memberof OpenTok
*/
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

/**
* Stops an OpenTok archive that is being recorded.
* <p>
* Archives automatically stop recording after 90 minutes or when all clients have disconnected from
* the session being archived.
*
* @param archiveId {String} The archive ID of the archive you want to stop recording.
* @return The Archive object corresponding to the archive being STOPPED.
*
* @param callback {Function} The function to call upon completing the operation. Two arguments
* are passed to the function:
* 
* <ul>
*
*   <li>
*      <code>error</code> &mdash; An error object (if the call to the method fails).
*   </li>
*
*   <li>
*       <code>archives</code> &mdash; The Archive object.
*   </li>
*
* </ul>
*
* @method #stopArchive
* @memberof OpenTok
*/
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

/**
* Gets an {@link Archive} object for the given archive ID.
*
* @param archiveId The archive ID.
*
* @return The {@link Archive} object.
*
* @method #getArchive
* @memberof OpenTok
*/
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

/**
* Deletes an OpenTok archive.
* <p>
* You can only delete an archive which has a status of "available" or "uploaded". Deleting an
* archive removes its record from the list of archives. For an "available" archive, it also
* removes the archive file, making it unavailable for download.
*
* @param {String} archiveId The archive ID of the archive you want to delete.
*
* @param callback {Function} The function to call upon completing the operation. On successfully
* deleting the archive, the function is called with no arguments passed in. On failure, an error
* object is passed into the function.
*
* @method #deleteArchive
* @memberof OpenTok
*/
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
