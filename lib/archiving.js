/*
 * OpenTokArchive
 */

// Dependencies
var util = require('util'),
    events = require('events'),
    to_json = require('xmljson').to_json,
    _ = require('underscore');

// Internal Constants
var EndpointTemplates = {
      MANIFEST : {
        path: '/archive/getmanifest/ARCHIVE_ID',
        method: 'GET'
      },
      RESOURCE : {
        path: '/hl/archive/url/ARCHIVE_ID/RESOURCE_ID',
        method: 'GET'
      }
    };

var OpenTokArchive = function(sdk, archiveId) {
  events.EventEmitter.call(this);
  this.sdk = sdk;
  this.archiveId = archiveId;
  this.resources = [];
  this.timeline = [];
};
util.inherits(OpenTokArchive, events.EventEmitter);

OpenTokArchive.prototype.loadManifest = function() {
  var self = this, endpoint;

  // construct endpoint from template
  endpoint = {
    path: EndpointTemplates.MANIFEST.path.replace('ARCHIVE_ID', this.archiveId),
    method: EndpointTemplates.MANIFEST.method
  };

  this.sdk._doRequest(endpoint, this.sdk.constructor._AuthScheme.TOKEN, null, function(err, xml) {
    if (err) {
      // TODO: error handling
      return self.emit('error');
    }
    to_json(xml, function(err, json) {
      if (err) {
        // TODO: error handling
        return self.emit('error');
      }
      self.resources = arrayFromJsonEntity(json.manifest.resources.video);
      self.timeline = arrayFromJsonEntity(json.manifest.timeline.event);
      self.emit('manifest');
    });
  });
};

OpenTokArchive.prototype.getResourceUrl = function(resourceId, cb) {
  var endpoint;

  // make sure the resouceId is valid
  if (!_.any(this.resources, function(resource) {
    return resource.id === resourceId;
  })) {
    cb(new Error('The given resourceId was not found in the archive.'));
  }

  endpoint = {
    path: EndpointTemplates.RESOURCE.path.replace('ARCHIVE_ID', this.archiveId).replace('RESOURCE_ID', resourceId),
    method: EndpointTemplates.RESOURCE.method
  };

  this.sdk._doRequest(endpoint, this.sdk.constructor._AuthScheme.TOKEN, null, function(err, resourceUrl) {
    if (err) {
      // TODO: error handling
      return;
    }
    cb(null, resourceUrl);
  });
};

function arrayFromJsonEntity(entity) {
  var array = [];
  if (entity.$) {
    array.push(entity.$);
  } else {
    _.each(entity, function(item) {
      array.push(item);
    });
  }
  return array;
}


function getArchive(sdk, archiveId, cb) {
  var archive = new OpenTokArchive(sdk, archiveId);
  archive.on('error', function(err) {
    return cb(err);
  });
  archive.on('manifest', function() {
    return cb(null, this);
  });
  archive.loadManifest();
}

// External Interface
module.exports = getArchive;
