const errors = require('./errors');
const { api } = require('./api');

exports.startCaptions = (
  config,
  sessionId,
  token,
  {
    languageCode = 'en-US',
    maxDuration = 14400,
    partialCaptions = true
  },
  callback,
  ) => {

  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to startCaptions');
  }

  const captionsUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/captions`);

  const captionsCallback = (err, body, response ) => {
    if (response.status === 409) {
      callback(new errors.CaptionsError());
      return;
    }

    if (err) {
      callback(err);
      return;
    }

    const { captionsId } = body
    callback(null, captionsId);
  }

  api({
    config: config,
    method: 'POST',
    url: captionsUrl.toString(),
    body: {
      sessionId: sessionId,
      token: token,
      languageCode: languageCode,
      maxDuration: maxDuration,
      partialCaptions: partialCaptions,
    },
    callback: captionsCallback,
  });
};

exports.stopCaptions = (
  config,
  captionsId,
  callback,
) => {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to stopArchive');
  }

  const captionsUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/captions/${captionsId}/stop`);
  const stopCallback = (err) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, true);
  }

  api({
    config: config,
    method: 'POST',
    url: captionsUrl.toString(),
    callback: stopCallback,
  });
};
