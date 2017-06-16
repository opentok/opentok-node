module.exports = {
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  sipUri: process.env.SIP_URI,
  sipHeaders: process.env.SIP_HEADERS ? JSON.parse(process.env.SIP_HEADERS) : null,
  sipUsername: process.env.SIP_USERNAME,
  sipPassword: process.env.SIP_PASSWORD
};
