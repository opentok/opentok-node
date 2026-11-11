var errors = require('./errors');
const { api } = require('./api');

exports.listConnections = function (config, sessionId, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to listConnections');
  }

  if (!sessionId) {
    callback(new errors.ArgumentError('No sessionId given to listConnections'));
    return;
  }

  const connectionsUrl = new URL(
    `${config.apiEndpoint}/v2/project/${config.apiKey}/session/${sessionId}/connection`
  );

  if (options.count) {
    connectionsUrl.searchParams.set('count', options.count);
  }

  const listConnectionsCallback = (err, body) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, body);
  };

  api({
    config: config,
    method: 'GET',
    url: connectionsUrl.toString(),
    callback: listConnectionsCallback,
  });
};
