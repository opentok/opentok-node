module.exports = {
  apiKey: process.env.apiKey,
  apiSecret: process.env.apiSecret,
  sipUri: process.env.sipUri,
  sipHeaders: process.env.sipHeaders ? JSON.parse(process.env.sipHeaders) : null,
  sipUsername: process.env.sipUsername,
  sipPassword: process.env.sipPassword
};
