var errors = require('./errors');
const { api } = require('./api');

exports.forceDisconnect = function (config, sessionId, connectionId, callback) {
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to forceDisconnect'));
  }

  if (sessionId == null || connectionId == null) {
    return callback(new errors.ArgumentError('No sessionId or connectionId given to forceDisconnect'));
  }

  const moderationUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/session/${sessionId}`);

  if (connectionId) {
    moderationUrl.pathname = `${moderationUrl.pathname}/connection/${connectionId}`
  }

  const moderationHandler = (err, body, response) => {
    if (response.status === 404) {
      callback(new errors.ForceDisconnectError('Session or Connection not found'));
      return;
    }

    callback(err);
  };

  api({
    config: config,
    method: 'DELETE',
    url: moderationUrl.toString(),
    callback: moderationHandler,
  });
};
