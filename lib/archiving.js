/*global require, exports*/
/*jshint strict:false, eqnull:true */

var request = require('request'),
    errors  = require('./errors'),
    pkg     = require('../package.json'),
    _       = require('underscore');

/**
* An object representing an OpenTok archive.
* <p>
* Do not call the <code>new()</code> constructor. To start recording an archive, call the
* {@link OpenTok#startArchive OpenTok.startArchive()} method.
*
* @property {Number} createdAt
*   The time at which the archive was created, in milliseconds since the UNIX epoch.
*
* @property {String} duration
*   The duration of the archive, in milliseconds.
*
* @property {String} id
*   The archive ID.
*
* @property {String} name
*   The name of the archive. If no name was provided when the archive was created, this is set
*   to null.
*
* @property {String} partnerId
*   The API key associated with the archive.
*
* @property {String} reason
*   For archives with the status "stopped", this can be set to "90 mins exceeded", "failure",
*   "session ended", or "user initiated". For archives with the status "failed", this can be set
*   to "system failure".
*
* @property {String} sessionId
*   The session ID of the OpenTok session associated with this archive.
*
* @property {Number} size
*   The size of the MP4 file. For archives that have not been generated, this value is set to 0.
*
* @property {String} status
*   The status of the archive, which can be one of the following:
*   <ul>
*     <li> "available" -- The archive is available for download from the OpenTok cloud.
*     <li> "expired" -- The archive is no longer available for download from the OpenTok cloud.
*     <li> "failed" -- The archive recording failed.
*     <li> "paused" -- The archive is in progress and no clients are publishing streams to
*        the session. When an archive is in progress and any client publishes a stream,
*        the status is "started". When an archive is "paused", nothing is recorded. When
*        a client starts publishing a stream, the recording starts (or resumes). If all clients
*        disconnect from a session that is being archived, the status changes to "paused", and
*        after 60 seconds the archive recording stops (and the status changes to "stopped").</li>
*     <li> "started" -- The archive started and is in the process of being recorded.
*     <li> "stopped" -- The archive stopped recording.
*     <li> "uploaded" -- The archive is available for download from the the upload target
*          Amazon S3 bucket or Windows Azure container you set up at the
*          <a href="https://dashboard.tokbox.com">OpenTok dashboard</a>.
*   </ul>
*
* @property {Boolean} hasAudio
*   Whether the archive has an audio track (<code>true</code>) or not (<code>false</code>).
*   You can prevent audio from being recorded by setting <code>hasAudio</code> to <code>false</code>
*   in the <code>options</code> parameter you pass into the
*   {@link OpenTok#startArchive OpenTok.startArchive()} method.
*
* @property {Boolean} hasAudio
*   Whether the archive has an video track (<code>true</code>) or not (<code>false</code>).
*   You can prevent video from being recorded by setting <code>hasVideo</code> to <code>false</code>
*   in the <code>options</code> parameter you pass into the
*   {@link OpenTok#startArchive OpenTok.startArchive()} method.
*
* @property {String} outputMode
*   The output mode to be generated for this archive, which can be one of the following:
*   <ul>
*     <li> "composed" -- All streams in the archive are recorded to a single (composed) file.
*     <li> "individual" -- Each stream in the archive is recorded to its own individual file.
*   </ul>
*
*   See the {@link OpenTok#startArchive OpenTok.startArchive()} method.
*
* @property {String} url
*   The download URL of the available MP4 file. This is only set for an archive with the status set to
*   "available"; for other archives, (including archives with the status "uploaded") this property is
*   set to null. The download URL is obfuscated, and the file is only available from the URL for
*   10 minutes. To generate a new URL, call the {@link OpenTok#getArchive OpenTok.getArchive()} or
*   {@link OpenTok#listArchives OpenTok.listArchives()} method.
*
* @see {@link OpenTok#deleteArchive OpenTok.deleteArchive()}
* @see {@link OpenTok#getArchive OpenTok.getArchive()}
* @see {@link OpenTok#startArchive OpenTok.startArchive()}
* @see {@link OpenTok#stopArchive OpenTok.stopArchive()}
* @see {@link OpenTok#listArchives OpenTok.listArchives()}
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

  /**
  * Stops the recording of the archive.
  * <p>
  * Archives automatically stop recording after 90 minutes or when all clients have disconnected
  * from the session being archived.
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
  *       <code>archive</code> &mdash; The Archive object.
  *   </li>
  *
  * </ul>
  *
  * @method #stop
  * @memberof Archive
  */
  this.stop = function(callback) {
    exports.stopArchive(config, id, callback);
  };

  /**
  * Deletes the OpenTok archive.
  * <p>
  * You can only delete an archive which has a status of "available" or "uploaded". Deleting an
  * archive removes its record from the list of archives. For an "available" archive, it also
  * removes the archive file, making it unavailable for download.
  *
  * @param callback {Function} The function to call upon completing the operation. On successfully
  * deleting the archive, the function is called with no arguments passed in. On failure, an error
  * object is passed into the function.
  *
  * @method #delete
  * @memberof Archive
  */
  this.delete = function(callback) {
    exports.deleteArchive(config, id, callback);
  };
}

var api = function(config, method, path, body, callback) {
  var rurl = config.apiEndpoint + '/v2/partner/' + config.apiKey + path;
  if ("defaults" in request) {
    request = request.defaults(_.pick(config, 'proxy', 'timeout'));
  }
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
    name: options.name,
    hasAudio: options.hasAudio,
    hasVideo: options.hasVideo,
    outputMode: options.outputMode
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
