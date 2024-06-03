const fetch = require('node-fetch');
const errors = require('./errors');
const pkg = require('../package.json');
const generateJwt = require('./generateJwt');
const generateHeaders = (config) =>  {
  return {
    'User-Agent': 'OpenTok-Node-SDK/' + pkg.version,
    'X-OPENTOK-AUTH': generateJwt(config),
    Accept: 'application/json',
  };
};
const api = (config, method, path, body, callback) => {
  const rurl = config.apiEndpoint + '/v2/project/' + config.apiKey + path;

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

      const body = await response.text();

      callback(null, otResponse, body)
    })
    .catch(async (error) => {
      callback(error);
    });
};

exports.startCaptions = (
  config,
  sessionId,
  token,
  {
    languageCode = 'en-US',
    maxDuration = 1800,
    partialCaptions = true
  },
  callback,
  ) => {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to startCaptions');
  }

  api(
    config,
    'POST',
    '/captions',
    {
      sessionId: sessionId,
      token: token,
      languageCode: languageCode,
      maxDuration: maxDuration,
      partialCaptions: partialCaptions,
    },
    (err, response, body) => {
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
          const { captionsId } = responseJson
          callback(null, captionsId);
          break;
        case 400:
          callback(new errors.RequestError(body));
          break;
        case 409:
          callback(new errors.CaptionsError());
          break;
        default:
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify({ statusCode: response.statusCode, statusMessage: response.statusMessage })));
      }
    }
  );
};

exports.stopCaptions = (
  config,
  captionsId,
  callback,
) => {
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to stopArchive');
  }

  api(
    config,
    'POST',
    `/captions/${captionsId}/stop`,
    {},
    (err, response, body) => {
      if (err) {
        callback(err);
        return;
      }

      switch (response?.statusCode) {
        case 202:
          callback(null, true);
          break;
        case 400:
          callback(new errors.NotFoundError(`No matching captions found for ${captionsId}`));
          break;
        default:
          callback(new errors.RequestError('Unexpected response from OpenTok: ' + JSON.stringify({ statusCode: response.statusCode, statusMessage: response.statusMessage })));
      }
    }
  );
};
