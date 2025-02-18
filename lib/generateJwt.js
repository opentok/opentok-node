const jwt = require('jsonwebtoken');
const { v4 } = require('uuid')
const debug = require('debug');

const log = debug('@opentok');

module.exports = function (config, additionalClaims) {
  const currentTime = Math.floor(new Date() / 1000);
  const initialClaims = {
    iss: config.apiKey,
    ist: 'project',
    iat: currentTime,
    exp: additionalClaims?.expire_time || currentTime + config.auth.expire,
  };

  const vonageClaims = {
    application_id: config.apiKey,
    jti: v4(),
  }

  const claims = {
    ...initialClaims,
    ...additionalClaims,
    ...(config.callVonage ? vonageClaims : {}),
  };

  log('JWT Claims', claims);

  const token = jwt.sign(
    claims,
    config.apiSecret,
    config.callVonage
      ? {
       algorithm: 'RS256',
        header: {
          typ: 'JWT',
          alg: 'RS256'
        },
      }
      : {},
  );

  return token;
};
