const fetch = require('node-fetch');
const { version } = require('../package.json');
const _ = require('lodash');
const generateJwt = require('./generateJwt');
const errors = require('./errors');
const debug = require('debug')

const log = debug('@opentok');

const generateHeaders = (config) => ({
  'User-Agent': `OpenTok-Node-SDK/${version}`,
  Accept: 'application/json',
  ...(config.callVonage
    ? {'Authorization': `Bearer ${generateJwt(config)}`}
    : {'X-OPENTOK-AUTH': generateJwt(config)}
  ),
});

exports.api = ({
  method,
  url,
  callback,
  body,
  form,
  headers = {},
  config,
}) => {
  if (!config) {
    throw new Error('OT Config was not passed to API caller');
  }

  log(`Calling ${config.callVonage ? 'Vonage Video API' : 'OpenTok API'} `)

  let fetchRequest = {
    method: method,
    body: body,
    headers: {
      ...generateHeaders(config),
      headers,
    },
  }

  if (body && ['POST', 'PATCH', 'PUT'].includes(method)) {
    log('Have body for request')
    fetchRequest.body = JSON.stringify(body);
    fetchRequest.headers['Content-type'] = 'application/json';
  }

  if (form) {
    log('Have a form for request')
    fetchRequest.body =new URLSearchParams(form).toString()
    fetchRequest.headers['Content-type'] ='application/x-www-form-urlencoded';
  }

  log(`Request to ${url}`, fetchRequest);

  Promise.resolve(fetch(url, fetchRequest))
    .then(async (response) => {
      const bodyText = await response.text();
      log('Response headers:', response.headers);
      log(`Response Body: ${bodyText}`)
      let body = bodyText;

      const [contentType] = (response.headers.get('content-type') || '').split(';');

      switch (contentType) {
        case 'application/x-www-form-urlencoded':
          body = response.body
            ? new URLSearchParams(body)
            : '' ;
          break;
        case 'application/json':
          // It appears that sometimes, an empty body is sent with the Content-Type header set
          // to application/json. If that happens, just set the body to null
          body = body ? JSON.parse(bodyText) : null;
        // Assume response is just text which will be passed along no default needed
      }

      // If we try calling text again, it will fail since the Buffer has been cleared
      Object.assign(response, 'text', new Promise((resolve) => resolve(body)))

      switch (response.status) {
        case 401:
        case 403:
          callback(
            new errors.AuthError(),
            null,
            response,
          );
          return;
        case 404:
          callback(
            new errors.NotFoundError(),
            null,
            response,
          );
          return;
      }

      if (response.status >= 200 && response.status < 300) {
        callback(null, body, response);
        return;
      }

      callback(
        new errors.RequestError(`Unexpected response from OpenTok: "${JSON.stringify({"message": body.message || bodyText})}"`),
        body,
        response
      );
    })
    .catch(async (error) => {
      callback(error, null, null);
    });
};
