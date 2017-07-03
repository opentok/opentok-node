var jwt = require('jsonwebtoken');

module.exports = function (config) {
  var currentTime = Math.floor(new Date() / 1000);
  var token = jwt.sign({
    iss: config.apiKey,
    ist: 'project',
    iat: currentTime,
    exp: currentTime + config.auth.expire
  }, config.apiSecret);

  return token;
};
