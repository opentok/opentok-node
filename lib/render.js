/* eslint-env es2018 */
const errors = require('./errors');
const request = require('request');
const { version } = require('../package.json');
const _ = require('lodash');
const generateJwt = require('./generateJwt.js');

const generateHeaders = (config, additionalHeaders = {}) => ({
  'User-Agent': 'OpenTok-Node-SDK/' + version,
  'X-OPENTOK-AUTH': generateJwt(config),
  Accept: 'application/json',
  ...additionalHeaders
});

const api = (
  {
    method = 'GET',
    config,
    path,
    params = {},
    body = null,
    headers = {}
  },
  callback
) => {
  const rurl = new URL(config.apiEndpoint);
  rurl.pathname = Array.isArray(path)
    ? _.compact(path).join('/')
    : path;

  rurl.searchParams = params;

  // Increase the likely hood of cache hits
  rurl.searchParams.sort();

  request.defaults(_.pick(config, 'proxy', 'timeout'))(
    {
      url: rurl.href,
      method: method,
      headers: generateHeaders(config, headers),
      json: body
    },
    callback
  );
};

const guardParams = (method, options, callback) => {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options !== 'function' ? options : { count: 50 };

  if (typeof cb !== 'function') {
    throw new errors.ArgumentError('No callback given to ' + method);
  }

  return [cb, opts];
};

const handleResponse = (callback, err, response) => {
  if (err) {
    callback(err);
    return;
  }

  try {
    const { statusCode } = response;

    // TODO use the http-errors package
    switch (statusCode) {
      case 200:
        callback(null, JSON.parse(response.body), response);
        break;
      case 202:
        callback(null, response.body, response);
        break;
      case 401:
      case 403:
        callback(new errors.AuthError(), null, response);
        break;
      case 404:
        callback(new errors.NotFoundError(), null, response);
        break;
      case 500:
        callback(new errors.RequestError(), null, response);
        break;
      default:
        callback(
          new errors.RequestError('Unexpected response code: ' + statusCode),
          null,
          response
        );
    }
  }
  catch (exception) {
    // Most Likely from JSON.parse
    if (exception instanceof SyntaxError) {
      callback(new errors.RequestError('Cannot decode JSON response'));
      return;
    }

    callback(new Error('Uknown Error'));
  }
};

exports.listRenders = (config, options, callback) => {
  const [cb, opts] = guardParams('listRenders', options, callback);
  const { offset, count } = opts;

  if (count > 1000 || count < 1) {
    throw new errors.ArgumentError('Count is out of range');
  }

  const params = new URLSearchParams();

  if (offset) {
    params.append('offset', offset);
  }

  if (count) {
    params.append('count', count);
  }

  api(
    {
      path: 'v2/project/' + config.apiKey + '/render',
      config: config,
      params: params
    },
    _.partial(handleResponse, cb)
  );
};

exports.getRender = (config, renderId, callback) => {
  const [cb] = guardParams('getRender', {}, callback);

  api(
    {
      path: 'v2/project/' + config.apiKey + '/render/' + renderId,
      config: config
    },
    _.partial(handleResponse, cb)
  );
};

exports.startRender = (config, options, callback) => {
  const [cb, opts] = guardParams('startRender', options, callback);

  api(
    {
      method: 'POST',
      path: 'v2/project/' + config.apiKey + '/render',
      config: config,
      body: {
        sessionId: _.get(opts, 'sessionId'),
        token: _.get(opts, 'token'),
        url: _.get(opts, 'url'),
        maxDuration: _.get(opts, 'maxDuration', 1800),
        resolution: _.get(opts, 'resolution', '1280x720'),
        statusCallbackUrl: _.get(opts, 'statusCallbackUrl')
      }
    },
    _.partial(handleResponse, cb)
  );
};

exports.stopRender = (config, renderId, callback) => {
  const [cb] = guardParams('getRender', {}, callback);

  api(
    {
      method: 'DELETE',
      path: 'v2/project/' + config.apiKey + '/render/' + renderId,
      config: config
    },
    _.partial(handleResponse, cb)
  );
};
