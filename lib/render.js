const errors = require('./errors');
const { api } = require('./api');
const _ = require('lodash');

const guardParams = (method, options, callback) => {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options !== 'function' ? options : { count: 50 };

  if (typeof cb !== 'function') {
    throw new errors.ArgumentError('No callback given to ' + method);
  }

  return [cb, opts];
};

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


const handleResponse = (callback) => (err, body, response) => {
  if (err) {
    callback(err);
    return;
  }

  callback(null, body, response);
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
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to listRenders');
  }

  const { offset, count } = options;

  if (count > 1000 || count < 1) {
    throw new errors.ArgumentError('Count is out of range');
  }

  const renderUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/render`);

  if (offset) {
    renderUrl.searchParams.set('offset', offset);
  }

  if (count) {
    renderUrl.searchParams.set('count', count);
  }

  api({
    config: config,
    url: renderUrl.toString(),
    callback: handleResponse(callback),
  });
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
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to getRender');
  }

  const renderUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/render/${renderId}`);

  api({
    method: 'GET',
    config: config,
    url: renderUrl.toString(),
    callback: handleResponse(callback)
  });
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
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to startRender');
  }

  const [cb, opts] = guardParams('startRender', options, callback);

  const renderUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/render`);

  api({
    url: renderUrl.toString(),
    config: config,
    method: 'POST',
    body: {
      sessionId: _.get(opts, 'sessionId'),
      token: _.get(opts, 'token'),
      url: _.get(opts, 'url'),
      maxDuration: _.get(opts, 'maxDuration', 1800),
      resolution: _.get(opts, 'resolution', '1280x720'),
      statusCallbackUrl: _.get(opts, 'statusCallbackUrl')
    },
    callback: handleResponse(cb),
  });
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
  if (typeof callback !== 'function') {
    throw new errors.ArgumentError('No callback given to stopRender');
  }

  const renderUrl = new URL(`${config.apiEndpoint}/v2/project/${config.apiKey}/render/${renderId}`);

  api({
    method: 'DELETE',
    config: config,
    url: renderUrl.toString(),
    callback: handleResponse(callback),
  });
};
