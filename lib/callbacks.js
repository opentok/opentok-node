var errors = require('./errors');
const { api } = require('./api');

function Callback(config, properties) {
  var hasProp = {}.hasOwnProperty;
  var id = properties.id;
  var key;

  for (key in properties) {
    if (hasProp.call(properties, key)) this[key] = properties[key];
  }

  this.unregister = function (callback) {
    exports.unregister(config, id, callback);
  };
}

exports.listCallbacks = function (config, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to listCallbacks'));
  }

  const callbackUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/callback`);

  const listCallbackHandler = (err, body, response) => {
    if (err) {
      callback(err);
    }

    callback(null, body.map((item) => new Callback(config, item)));
  };

  api({
    config: config,
    method: 'GET',
    url: callbackUrl.toString(),
    callback: listCallbackHandler,
  });
};

exports.registerCallback = function (config, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to registerCallback'));
  }

  const apiCallback = (err, body, response) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, new Callback(config, body));
  };

  const callbackUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/callback`);

  api({
    config: config,
    method: 'POST',
    url: callbackUrl.toString(),
    body: {
      group: options.group,
      event: options.event,
      url: options.url
    },
    callback: apiCallback,
  });
};

exports.unregisterCallback = function (config, callbackId, callback) {
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to unregisterCallback'));
  }

  if (callbackId == null || callbackId.length === 0) {
    callback(new errors.ArgumentError('No callback ID given'));
    return;
  }

  const callbackUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/callback/${encodeURIComponent(callbackId)}`);

  const callbackHandler = (err) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null);
  }

  api({
    config: config,
    method: 'DELETE',
    url: callbackUrl.toString(),
    callback: callbackHandler,
  });
};
