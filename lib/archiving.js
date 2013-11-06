/*
 * OpenTokArchive
 */

// Dependencies
var util = require('util'),
    to_json = require('xmljson').to_json,
    helpers = require('./helpers'),
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
  this.sdk = sdk;
  this.archiveId = archiveId;
  this.resources = [];
  this.timeline = [];
};

OpenTokArchive.prototype.loadManifest = function(cb) {
  var self = this, endpoint;

  // construct endpoint from template
  endpoint = {
    path: EndpointTemplates.MANIFEST.path.replace('ARCHIVE_ID', this.archiveId),
    method: EndpointTemplates.MANIFEST.method
  };

  this.sdk._doRequest(endpoint, this.sdk.constructor._AuthScheme.TOKEN, null, function(err, xml) {
    if (err) return helpers.handleError({ action: 'loadManifest', archiveId: self.archiveId , cause: err }, cb);
    to_json(xml, function(err, json) {
      if (err) return helpers.handleError({ action: 'loadManifest', archiveId: self.archiveId , cause: err }, cb);
      self.resources = arrayFromJsonEntity(json.manifest.resources.video);
      self.timeline = arrayFromJsonEntity(json.manifest.timeline.event);
      cb(null);
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
  archive.loadManifest(function(err) {
    if (err) return cb(err);
    cb(null, archive);
  });
}

// External Interface
module.exports = getArchive;
