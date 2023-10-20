/* eslint-env es2018 */
const errors = require('./errors');
const fetch = require('node-fetch');
const { version } = require('../package.json');
const _ = require('lodash');
const generateJwt = require('./generateJwt.js');

/**
* An object representing an Experience Composer renderer.
*
* @property {String} id
*   The ID of the render instance
*
* @property {String} projectId
*   The ID of the project for the render.
*
* @property {String} sessionId
*   The ID of the session being rendered into.
*
* @property {Number} createdAt
*   The time at which the render was created, in milliseconds since the UNIX epoch.
*
* @property {Number} upddatedAt
*   The time at which the render was created, in milliseconds since the UNIX epoch.
*
* @property {String} url
*   A publically reachable URL controlled by the customer and capable of generating
*   the content to be rendered without user intervention.
*
* @proerpty {String} status
*   Current status of for the render. Will be one of `starting`, `started`, `stopped`
*   or `failed`
*
* @property {String} reason
*   Gives a short textual reason for why the Render failed or stopped.
*
* @property {String} callbackUrl
*   URL of the customer service where the callbacks will be received.
*
* @property {String} event
*   Last sent event of for the render
*
* @property {String} resoultion
*   Resolution of the display area for the composition.
*
* @see {@link OpenTok#getRender OpenTok.getRender()}
* @see {@link OpenTok#startRender OpenTok.startRender()}
* @see {@link OpenTok#stopRender OpenTok.stopRender()}
* @see {@link OpenTok#listRenders OpenTok.listRenders()}
*
* @class Render
*/

const generateHeaders = (config, additionalHeaders = {}) => ({
  'User-Agent': 'OpenTok-Node-SDK/' + version,
  'X-OPENTOK-AUTH': generateJwt(config),
  Accept: 'application/json',
  ...additionalHeaders
});

const api = (
  {
    method,
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

  const requestHeaders = generateHeaders(config, headers)
  if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  Promise.resolve(fetch(
    rurl,
    {
      method: method,
      body: body ? JSON.stringify(body) : null,
      headers: requestHeaders,
    }
  ))
    .then(async (response) => {
      const otResponse = {
        statusCode: response.status,
      }
      callback(null, otResponse, await response.json())
    })
    .catch(async (error) => {
      callback(error);
    });
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

/**
 * Return a list of {@link Render} objects, representing Experience Composer in any status
 *
 * @param {Object} config - API configuration settings {@see OpenTok.listRenders}
 * @param {Object} options - Optional parameters for the API call {@see OpenTok.listRenders}
 * @param {Function} callback - Callback function
 *
 * @method #listRenders
 * @memberof Render
 */
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

/**
 * Gets a {@link Render} object for the given render ID.
 *
 * @param {Object} config - API config {@see OpenTok}
 * @param {String} renderId - The Render ID to fetch
 * @param {Function} callback - Callback function
 *
 * @method #getRender
 * @memberof Render
 */
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

/**
 * Starts an Experience Composer for an OpenTok session.
 *
 *
 * @param {Object} config - API configuration settings {@see OpenTok.startRender}
 * @param {Object} options - Optional parameters for the API call {@see OpenTok.startRender}
 * @param {Function} callback - Callback function
 *
 * @method #startRender
 * @memberof Render
 */
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

/**
 * Stops an OpenTok render that is being rendered.
 *
 * @param {Object} config - API configuration settings {@see OpenTok.stopRender}
 * @param {String} renderId - The Render ID to fetch
 * @param {Function} callback - Callback function
 *
 * @method #stopRender
 * @memberof Render
 */
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
