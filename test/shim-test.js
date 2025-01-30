const  expect = require('chai').expect;
const  nock = require('nock');
const  jwt = require('jsonwebtoken');
const  OpenTok = require('../lib/opentok.js');

// This is a test key and is not assigned to a real account
// However it can be used to generate JWT tokens
const testPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCuR/FU8YCqMYj/
UH/yhAJcu56T7RvN/DqGmR8pnp6AS5LqsUcGW8TB/0at2zxvEVlZ/ubr6X1fAUjm
R2tZcOsigCkw//unWBrS7YghO09eel0WlkzSMlWQavHrUIN6WAZk09F+Li/Mq09b
UvbLnSrtsMPPulWh8BDWEr/3AAM0CboX+kpjXJv/dEhDttbbkMo0leVHazrMhzl/
1dXj3RzWv0sNJGp7ALjKh0k94Q0JrFRnv06kI94Z36rlPC8J7rAXrcOJFnLh/OiN
fnWTmnnwNlvCxvG+CHP8O3rf5J42MY2JVSng73piBHCSzLDE9s1lsnMuqY6yqt5h
MUb1AssnAgMBAAECggEABFZ1EBSstk+3pbHRZW4EswiBGL8eNzZvwc7eLYaC/RV5
yXlHwnBBSZolc7P7tpX7dS0jfpFYAKfYXSbqP0EmERHt3zLX3CE/awA6KFLravdn
tBAMnG9f8tFpRl6WzyeRYoFlJZtXruPqpzloPBwkJ+NY6aWCdnPdBL8AY9DubiVE
kC1fez1cfhm88wu1Hdf6woUh+R6vnIFlAnayGPYkM2S9X4xnrVWfLTrDlRf2NB2o
K3P8q3FgWAh4o9Jnl/DpI5euOsorwooIqMmYhK9DYaMsDmWrZLMOciSZJKn3xMtH
+LzMVQgVoc0LZCNA8vAxqefH6jjxzZkRiVuqU8eB5QKBgQDwR+YLwWXVkaLCtPOs
RnW+U6KRaZYYexCx7K8cH/HIZ/ZhYP1m9J0LSuOF6sKlmDOooaOqS62tBfWDRUut
4NHbzHi3iDhjRH2Mz1h9uRURzPld5TZkMdDVAHxkd4b5tN9u7c+1Y0WQ7mvEJS//
kDDhwNwR1+JiUIDYlPJSadbj6wKBgQC5rrZrlEGTApBoorjIWrUzTC99eBUas92C
BozwLHVB1FzDcBP9ABqee0fgVEND4i2iNZCtCm19Gsv+nd21+E1+wmhREBtCzEXO
wfQQjeOJN0QnjJKm94WSmx1xmkhIZBG7NRmScP2W0BzXdEkbRPfWpnfFmUqim2qH
/lTR139ytQKBgF6tBdD1+EkppEcyA52K+dPvomvHfdPRked5ihn74EoF5MfD7rUF
h2eur23R7bZP/XLhldqBDULSyUVbJZGytx3zOFGgxA8hKpM0E/sd1VZ5PHyp1z+t
fUqgcWMo0a9MfIl5/NDM99k+iIn12S7KwugBFPWW6eWxMMOmFMEyYPDXAoGAW3Z+
EPvUWS/YJlKRJs/Xlc8fTXSLIL4cjGHhpqSfla+fif15OxSECDC9tPiMsbGFvPMZ
ssMCL6+1cFQe0/XdZmUosVV3uC2a7T+Ik2bw/7QjdD/ANVKTjyWtGTpgBJiWS1ra
n9HceB9HNbHoGPCeDDOvp7vckcBwd1CGQ18dPkkCgYBwm8eIPoW92dOBvnZrh4WT
UBEEJoSmV7iom93Wt6m6u0Ow54JrhJeDpRH301OMU0V0UD4cQ7S4SxvVsFEjyGiO
thaTVNUBxf1N62zIzUL7t6ItA4+PZVu6ehXyZ/rax7DfhmINjQ3fRGPPLHGd0L1O
8B7ZcGqNJg+6nRv+fTwCjw==
-----END PRIVATE KEY-----
`;

const validReply = JSON.stringify([
  {
    session_id: 'SESSIONID',
    create_dt: 'Fri Nov 18 15:50:36 PST 2016',
    media_server_url: ''
  }
]);

describe('when initialized with an applicationId and privatekey', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  it('sends its requests to the vonage',  (done) => {
    const apiKey = '00000000-0000-0000-0000-000000000000';
    const opentok = new OpenTok(apiKey, testPrivateKey);

    const scope = nock('https://video.api.vonage.com')
      .matchHeader('authorization', ([value]) => {
        const token = `${value}`.replace('Bearer ', '')
        try {
          const claims = jwt.verify(token, testPrivateKey)
          return claims.application_id === apiKey;
        } catch (_) {

        }
        return false;
      })
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200,
        validReply,
        {
          'content-type': 'application/json',
        }
      );

    opentok.createSession((err, session) => {
      expect(err).to.be.null
      scope.done();
      done(err);
    });
  });

  it('uses a custom proxy', function (done) {
    const apiKey = '00000000-0000-0000-0000-000000000000';
    const opentok = new OpenTok(apiKey, testPrivateKey, 'https://example.com');

    const scope = nock('https://example.com')
      .matchHeader('authorization', ([value]) => {
        const token = `${value}`.replace('Bearer ', '')
        try {
          const claims = jwt.verify(token, testPrivateKey)
          return claims.iss === apiKey;
        } catch (_) {

        }
        return false;
      })
      .post('/session/create', 'archiveMode=manual&p2p.preference=enabled')
      .reply(
        200,
        validReply,
        {
          'content-type': 'application/json',
        }
      );

    opentok.createSession((err, session) => {
      expect(err).to.be.null
      scope.done();
      done(err);
    });
  });
});
