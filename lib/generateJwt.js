var jwt = require('jsonwebtoken');

module.exports = function (config, additionalClaims) {
  var currentTime = Math.floor(new Date() / 1000);
  const initialClaims = {
    iss: config.apiKey,
    ist: 'project',
    iat: currentTime,
    exp: additionalClaims?.expire_time || currentTime + config.auth.expire
  };

  const claims = {...initialClaims, ...additionalClaims};
  const token = jwt.sign(claims, config.apiSecret);

  return token;
};
