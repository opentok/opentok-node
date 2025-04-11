var expect = require('chai').expect;
var nock = require('nock');
var OpenTok = require('../lib/opentok.js');

describe('Captions',  () => {
  const opentok = new OpenTok('123456', 'APISECRET');
  const sessionId = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  const token = 'my awesome token';
  const testCaptionId = 'my-caption-id';

  afterEach( () => {
    nock.cleanAll();
  });

  describe('start Captions',  () => {
    afterEach( () => {
      nock.cleanAll();
    });

    it('Starts Captions', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "en-US",
            "maxDuration": 14400,
            "partialCaptions": true,
          },
        )
        .reply(
          200,
          {captionsId: testCaptionId},
          { 'Content-Type': 'application/json' }
        );

      opentok.startCaptions(sessionId, token, {}, (err, captionId) => {
        expect(err).to.be.null;
        expect(captionId).to.equal(testCaptionId)
        done();
      });
    });

    it('Starts Captions with options', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "hi-IN",
            "maxDuration": 42,
            "partialCaptions": false,
          },
        )
        .reply(
          200,
          {captionsId: testCaptionId},
          { 'Content-Type': 'application/json' }
        );

      opentok.startCaptions(
        sessionId,
        token,
        {
          languageCode: "hi-IN",
          maxDuration: 42,
          partialCaptions: false,
        },
        (err, captionId) => {
          expect(err).to.be.null;
          expect(captionId).to.equal(testCaptionId)
          done();
        });
    });

    it('Fails to Start Captions with invalid data', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "en-US",
            "maxDuration": 14400,
            "partialCaptions": true,
          },
        )
        .reply(
          400
        );

      opentok.startCaptions(
        sessionId,
        token,
        {},
        (err, captionId) => {
          expect(err).not.to.be.null;
          expect(captionId).to.be.undefined;
          done();
        });
    });


    it('Fails to Start Captions when captions have started', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "en-US",
            "maxDuration": 14400,
            "partialCaptions": true,
          },
        )
        .reply(
          409
        );

      opentok.startCaptions(
        sessionId,
        token,
        {},
        (err, captionId) => {
          expect(err).not.to.be.null;
          expect(err.message).to.equal('Live captions have already started for this OpenTok Session');
          expect(captionId).to.be.undefined;
          done();
        });
    });

    it('Stops Captions', (done) => {
      nock('https://api.opentok.com')
        .post(
          `/v2/project/123456/captions/${testCaptionId}/stop`,
        )
        .reply(
          202
        );

      opentok.stopCaptions(testCaptionId, (err, status) => {
        expect(err).to.be.null;
        expect(status).to.be.true;
        done();
      });
    });

    it('Fails to Stop Captions with invalid id', (done) => {
      nock('https://api.opentok.com')
        .post(
          `/v2/project/123456/captions/${testCaptionId}/stop`,
        )
        .reply(
          404
        );

      opentok.stopCaptions(testCaptionId, (err, status) => {
        expect(err).not.to.be.null;
        expect(err.message).contain('Not Found');
        expect(status).to.be.undefined;
        done();
      });
    });
  });
});
describe('Captions',  () => {
  const opentok = new OpenTok('123456', 'APISECRET');
  const sessionId = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  const token = 'my awesome token';
  const testCaptionId = 'my-caption-id';

  afterEach( () => {
    nock.cleanAll();
  });

  describe('start Captions',  () => {
    afterEach( () => {
      nock.cleanAll();
    });

    it('Starts Captions', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "en-US",
            "maxDuration": 14400,
            "partialCaptions": true,
          },
        )
        .reply(
          200,
          {captionsId: testCaptionId},
          { 'Content-Type': 'application/json' }
        );

      opentok.startCaptions(sessionId, token, {}, (err, captionId) => {
        expect(err).to.be.null;
        expect(captionId).to.equal(testCaptionId)
        done();
      });
    });

    it('Starts Captions with options', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "hi-IN",
            "maxDuration": 42,
            "partialCaptions": false,
          },
        )
        .reply(
          200,
          {captionsId: testCaptionId},
          { 'Content-Type': 'application/json' }
        );

      opentok.startCaptions(
        sessionId,
        token,
        {
          languageCode: "hi-IN",
          maxDuration: 42,
          partialCaptions: false,
        },
        (err, captionId) => {
          expect(err).to.be.null;
          expect(captionId).to.equal(testCaptionId)
          done();
        });
    });

    it('Fails to Start Captions with invalid data', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "en-US",
            "maxDuration": 14400,
            "partialCaptions": true,
          },
        )
        .reply(
          400
        );

      opentok.startCaptions(
        sessionId,
        token,
        {},
        (err, captionId) => {
          expect(err).not.to.be.null;
          expect(captionId).to.be.undefined;
          done();
        });
    });


    it('Fails to Start Captions when captions have started', (done) => {
      nock('https://api.opentok.com')
        .post(
          '/v2/project/123456/captions',
          {
            "sessionId": sessionId,
            "token": token,
            "languageCode": "en-US",
            "maxDuration": 14400,
            "partialCaptions": true,
          },
        )
        .reply(
          409
        );

      opentok.startCaptions(
        sessionId,
        token,
        {},
        (err, captionId) => {
          expect(err).not.to.be.null;
          expect(err.message).to.equal('Live captions have already started for this OpenTok Session');
          expect(captionId).to.be.undefined;
          done();
        });
    });

    it('Stops Captions', (done) => {
      nock('https://api.opentok.com')
        .post(
          `/v2/project/123456/captions/${testCaptionId}/stop`,
        )
        .reply(
          202
        );

      opentok.stopCaptions(testCaptionId, (err, status) => {
        expect(err).to.be.null;
        expect(status).to.be.true;
        done();
      });
    });

    it('Fails to Stop Captions with invalid id', (done) => {
      nock('https://api.opentok.com')
        .post(
          `/v2/project/123456/captions/${testCaptionId}/stop`,
        )
        .reply(
          404
        );

      opentok.stopCaptions(testCaptionId, (err, status) => {
        expect(err).not.to.be.null;
        expect(err.message).contain('Not Found');
        expect(status).to.be.undefined;
        done();
      });
    });
  });
});
