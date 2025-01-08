var expect = require('chai').expect;
var nock = require('nock');

// Subject
var OpenTok = require('../lib/opentok.js');

describe('Archive Tests', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var CONNECTIONID = '4072fe0f-d499-4f2f-8237-64f5a9d936f5';

  afterEach(function () {
    nock.cleanAll();
  });

  describe('archiving tests', function () {
    describe('error thrown when adding streams receives a non-2xx reponse', function () {
      it('should not return an error', function (done) {
        const streamId = '12312312-3811-4726-b508-e41a0f96c68f';
        const archiveId = '54070066-dd9c-4e2c-94d1-c1d82a81cfc9';
        const body = {
            "code": 500,
            "message": "System error"
         }

        nock('https://api.opentok.com:443')
            .patch(`/v2/project/APIKEY/archive/${archiveId}/streams`, { hasAudio: true, hasVideo: true, addStream: streamId })
            .reply(500, body, {
                server: 'nginx',
                date: 'Fri, 31 Jan 2014 06:32:16 GMT',
                connection: 'keep-alive'
            });

        try {
            console.log('Starting test');
            opentok.addArchiveStream(archiveId, streamId, { hasAudio: true, hasVideo: true }, function (err) {
              expect(err).to.not.be.null;
              done();
            });
            console.log('finished test')
        } catch (err) {
            console.log('In catch block');
            console.log(err)
            done();
        }
      });
    });
  });
});
