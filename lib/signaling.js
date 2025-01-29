var errors = require('./errors');
const {api} = require('./api');

exports.signal = function (config, sessionId, connectionId, payload, callback) {
  if (typeof callback !== 'function') {
    throw (new errors.ArgumentError('No callback given to signal'));
  }

  if (sessionId == null || payload == null) {
    return callback(new errors.ArgumentError('No sessionId or payload given to signal'));
  }

  const signalUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/session/${sessionId}`);
  if (connectionId) {
    signalUrl.pathname = `${signalUrl.pathname}/connection/${connectionId}`;
  }

  signalUrl.pathname = `${signalUrl.pathname}/signal`;

  const signalHandler = (err, body, response) => {
    if (response.status === 404) {
      callback(new errors.SignalError('Session or Connection not found'));
      return;
    }

    callback(err);
  };

  return api({
    config: config,
    method: 'POST',
    url: signalUrl.toString(),
    body: payload,
    callback: signalHandler,
  });
};
