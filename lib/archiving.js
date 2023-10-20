var errors = require('./errors');
var pkg = require('../package.json');
var _ = require('lodash');
var generateJwt = require('./generateJwt');
var fetch = require('node-fetch');

// functions
var api;

var generateHeaders = function generateHeaders(config) {
  return {
    'User-Agent': 'OpenTok-Node-SDK/' + pkg.version,
    'X-OPENTOK-AUTH': generateJwt(config),
    Accept: 'application/json',
  };
};

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
*   The duration of the archive, in seconds.
*
* @property {Boolean} hasAudio
*   Whether the archive has an audio track (<code>true</code>) or not (<code>false</code>).
*   You can prevent audio from being recorded by setting
*   <code>hasAudio</code> to <code>false</code>
*   in the <code>options</code> parameter you pass into the
*   {@link OpenTok#startArchive OpenTok.startArchive()} method.
*
* @property {Boolean} hasVideo
*   Whether the archive has an video track (<code>true</code>) or not (<code>false</code>).
*   You can prevent video from being recorded by setting
*   <code>hasVideo</code> to <code>false</code>
*   in the <code>options</code> parameter you pass into the
*   {@link OpenTok#startArchive OpenTok.startArchive()} method.
*
* @property {String} id
*   The archive ID.
*
* @property {String} name
*   The name of the archive. If no name was provided when the archive was created, this is set
*   to null.
*
* @property {String} streamMode
*   The stream mode for the archive. This can be set to one of the the following:
*
*   <ul>
*     <li> "auto" &mdash; streams included in the archive are selected automatically
*     (the default).</li>
*
*     <li> "manual" &mdash; Specify streams to be included based on calls to the
*    {@link OpenTok#addArchiveStream OpenTok.addArchiveStream()} and
*    {@link OpenTok#removeArchiveStream OpenTok.removeArchiveStream()} methods.</li>
*   </ul>
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
* @property {String} projectId
*   The API key associated with the archive.
*
* @property {String} reason
* For archives with the status "stopped" or "failed", this string describes the reason
* the archive stopped (such as "maximum duration exceeded") or failed.
*
* @property {String} resolution The resolution of the archive (either "640x480" or "1280x720").
*   This property is only set for composed archives.
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
*          Amazon S3 bucket or Windows Azure container you set up for your
*          <a href="https://tokbox.com/account">OpenTok project</a>.
*   </ul>
*
* @property {String} url
*   The download URL of the available MP4 file. This is only set for an archive with the status set
*   to "available"; for other archives, (including archives with the status "uploaded") this
*   property is set to null. The download URL is obfuscated, and the file is only available from
*   the URL for 10 minutes. To generate a new URL, call the
*   {@link OpenTok#getArchive OpenTok.getArchive()} or
*   {@link OpenTok#listArchives OpenTok.listArchives()} method.
*
* @property {String} multiArchiveTag
*  Set this to support recording multiple archives for the same session simultaneously. Set
*  this to a unique string for each simultaneous archive of an ongoing session. You must also
*  set this option when manually starting an archive that is automatically archived. Note that
*  the multiArchiveTag value is not included in the response for the methods to list archives
*  and retrieve archive information. If you do not specify a unique multiArchiveTag, you can
*  only record one archive at a time for a given session.
*  See <a href="https://tokbox.com/developer/guides/archiving/#simultaneous-archives">
*  Simultaneous archives</a>.
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
  var hasProp = {}.hasOwnProperty;
  var id = properties.id;
  var key;

  for (key in properties) {
    if (hasProp.call(properties, key)) {
      this[key] = properties[key];
    }
  }

  /**
   * Stops the recording of the archive.
   * <p>
   * Archives automatically stop recording after 120 minutes or when all clients have disconnected
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
  this.stop = function (callback) {
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
  this.delete = function (callback) {
    exports.deleteArchive(config, id, callback);
  };
}

api = function (config, method, path, body, callback) {
  var rurl = config.apiEndpoint + '/v2/project/' + config.apiKey + path;

  const headers = generateHeaders(config);

  if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
   headers['Content-Type'] = 'application/json';
  }

  Promise.resolve(fetch(
    rurl,
    {
      method: method,
      body: body ? JSON.stringify(body) : null,
      headers: headers,
    }
  ))
    .then(async (response) => {
      const otResponse = {
        statusCode: response.status,
      }
      let body = await response.text();

      callback(null, otResponse, body)
    })
    .catch(async (error) => {
    callback(error);
  });
};


exports.listArchives = function (config, options, callback) {
  var qs = [];

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to listArchives');
  }
  if (options.offset) {
    qs.push('offset=' + parseInt(options.offset, 10));
  }
  if (options.count) {
    qs.push('count=' + parseInt(options.count, 10));
  }
  if (options.sessionId) {
    qs.push('sessionId=' + options.sessionId);
  }
  api(
    config,
    'GET',
    '/archive?' + qs.join('&'),
    null,
    function (err, response, body) {
      if (!err && body) {
        try {
          body = JSON.parse(body);
        }
        catch (_err) {
          err = _err;
        }
      }
      if (err || response.statusCode !== 200) {
        if (response && response.statusCode === 403) {
          callback(new errors.AuthError('Invalid API key or secret'));
        }
        else {
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
        }
      }
      else {
        callback(
          null,
          body.items.map(function (item) {
            return new Archive(config, item);
          }),
          body.count
        );
      }
    }
  );
};

exports.startArchive = function (ot, config, sessionId, options, callback) {
  this.ot = ot;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to startArchive');
  }
  if (sessionId == null || sessionId.length === 0) {
    callback(new errors.ArgumentError('No session ID given'));
    return;
  }
  api(
    config,
    'POST',
    '/archive',
    {
      sessionId: sessionId,
      name: options.name,
      hasAudio: options.hasAudio,
      hasVideo: options.hasVideo,
      outputMode: options.outputMode,
      layout: options.layout,
      resolution: options.resolution,
      streamMode: options.streamMode,
      multiArchiveTag: options.multiArchiveTag
    },
    function startArchiveCallback(err, response, body) {
      if (err) {
        callback(err);
        return;
      }
      try {
        body = JSON.parse(body);
      } catch {}

      switch (response.statusCode) {
        case 404:
          callback(new errors.ArchiveError('Session not found'));
          return;
        case 403:
          callback(new errors.AuthError('Invalid API key or secret'));
          return;
        case 409:
          callback(new errors.ArchiveError('Recording already in progress or session not using OpenTok Media Router'));
          return;
        case 200:
          if (body.status !== 'started') {
            callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
            return;
          }

          callback(null, new Archive(config, body));
          return;
        default:
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
      }
    }
  );
};

exports.stopArchive = function (config, archiveId, callback) {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to stopArchive');
  }
  if (archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archive ID given'));
    return;
  }
  api(
    config,
    'POST',
    '/archive/' + encodeURIComponent(archiveId) + '/stop',
    {},
    function stopArchiveCallback(err, response, body) {
      if (err) {
        callback(err);
        return;
      }

      let responseJson = {};
      try {
        responseJson = JSON.parse(body);
      } catch {

      }
      switch (response?.statusCode) {
        case 200:
          callback(null, new Archive(config, responseJson));
          break;
        case 404:
          callback(new errors.ArchiveError('Archive not found'));
          break;
        case 409:
          callback(new errors.ArchiveError(responseJson.message));
          break;
        case 403:
          callback(new errors.AuthError('Invalid API key or secret'));
          break;
        default:
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify({ statusCode: response.statusCode, statusMessage: response.statusMessage })));
      }
    }
  );
};

exports.getArchive = function (config, archiveId, callback) {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to getArchive');
  }
  if (archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archive ID given'));
    return;
  }
  api(
    config,
    'GET',
    '/archive/' + archiveId,
    null,
    function getArchiveCallback(err, response, body) {
      if (!err && body) {
        try {
          body = JSON.parse(body);
        }
        catch (_err) {
          err = _err;
        }
      }

      switch(response.statusCode) {
        case 200:
          callback(null, new Archive(config, body));
          return;
        case 404:
          callback(new errors.ArchiveError('Archive not found'));
          return;
        case 403:
          callback(new errors.AuthError('Invalid API key or secret'));
          return;
        default:
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
      }

    }
  );
};

function patchArchive(config, archiveId, options, callback) {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to deleteArchive');
  }
  if (archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No Archive ID given'));
    return;
  }

  if (options.addStream && options.addStream.length > 0) {
    options = {
      hasAudio: options.hasAudio != null ? options.hasAudio : true,
      hasVideo: options.hasVideo != null ? options.hasVideo : true,
      addStream: options.addStream
    };
  }
  else if (options.removeStream && options.removeStream.length > 0) {
    options = {
      removeStream: options.removeStream
    };
  }
  else {
    callback(new errors.ArgumentError('Need one of addStream or removeStream'));
  }

  api(
    config,
    'PATCH',
    '/archive/' + encodeURIComponent(archiveId) + '/streams',
    options,
    function patchArchiveCallback(err, response, body) {
      if (err || response.statusCode !== 204) {
        if (response && response.statusCode === 400) {
          callback(new errors.ArgumentError('Invalid request: ' + JSON.stringify(body)));
        }
        else if (response && response.statusCode === 403) {
          callback(new errors.AuthError('Invalid API key or secret'));
        }
        else if (response && response.statusCode === 404) {
          callback(new errors.ArchiveError('Archive or stream not found'));
        }
        else if (response && response.statusCode === 405) {
          callback(new errors.ArchiveError('Unsupported Stream Mode'));
        }
        else {
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
        }
      }
      else {
        callback(null);
      }
    }
  );
}

exports.addArchiveStream = function (config, archiveId, streamId, archiveOptions, callback) {
  if (typeof archiveOptions === 'function') {
    callback = archiveOptions;
    archiveOptions = {};
  }
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to addArchiveStream');
  }
  if (archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archiveId provided'));
    return;
  }
  if (streamId == null || streamId.length === 0) {
    callback(new errors.ArgumentError('No streamId provided'));
    return;
  }

  archiveOptions = {
    addStream: streamId,
    hasAudio: archiveOptions.hasAudio != null ? archiveOptions.hasAudio : true,
    hasVideo: archiveOptions.hasVideo != null ? archiveOptions.hasVideo : true
  };

  patchArchive(config, archiveId, archiveOptions, callback);
};

exports.removeArchiveStream = function (config, archiveId, streamId, callback) {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to removeArchiveStream');
  }
  if (archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archiveId provided'));
    return;
  }
  if (streamId == null || streamId.length === 0) {
    callback(new errors.ArgumentError('No streamId provided'));
    return;
  }

  patchArchive(config, archiveId, { removeStream: streamId }, callback);
};

exports.deleteArchive = function (config, archiveId, callback) {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to deleteArchive');
  }
  if (archiveId == null || archiveId.length === 0) {
    callback(new errors.ArgumentError('No archive ID given'));
    return;
  }
  api(
    config,
    'DELETE',
    '/archive/' + encodeURIComponent(archiveId),
    null,
    function deleteArchiveCallback(err, response, body) {
      switch (response.statusCode) {
        case 204:
          callback(null);
          return;
        case 404:
          callback(new errors.ArchiveError('Archive not found'));
          return
        case 403:
          callback(new errors.AuthError('Invalid API key or secret'));
          return;
        default:
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify(body || { statusCode: response.statusCode, statusMessage: response.statusMessage })));
          return;
      }
    }
  );
};
