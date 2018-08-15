var expect = require('chai').expect;
var nock = require('nock');

// Subject
var OpenTok = require('../lib/opentok.js');

describe('Moderation', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var CONNECTIONID = '4072fe0f-d499-4f2f-8237-64f5a9d936f5';

  afterEach(function () {
    nock.cleanAll();
  });

  describe('forceDisconnect', function () {
    function mockRequest(status, body) {
      var url = '/v2/project/APIKEY/session/' + SESSIONID + '/connection/' + CONNECTIONID;
      nock('https://api.opentok.com:443')
        .delete(url)
        .reply(status, body, {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:32:16 GMT',
          connection: 'keep-alive'
        });
    }

    describe('valid responses', function () {
      beforeEach(function () {
        mockRequest(204, '');
      });

      it('should not return an error', function (done) {
        opentok.forceDisconnect(SESSIONID, CONNECTIONID, function (err) {
          expect(err).to.be.null;
          done();
        });
      });

      it('should return an error for empty connection', function (done) {
        opentok.forceDisconnect(SESSIONID, null, function (err) {
          expect(err).to.not.be.null;
          done();
        });
      });

      it('should return an error for empty session', function (done) {
        opentok.forceDisconnect(null, CONNECTIONID, function (err) {
          expect(err).to.not.be.null;
          done();
        });
      });
    });

    describe('invalid responses', function () {
      var errors = [400, 403, 404, 500];
      var i;
      function test(error) {
        it('should fail for status ' + error, function (done) {
          mockRequest(error, '');

          opentok.forceDisconnect(SESSIONID, CONNECTIONID, function (err) {
            expect(err).to.not.be.null;
            done();
          });
        });
      }
      for (i = 0; i < errors.length; i++) {
        test(errors[i]);
      }
    });
  });
});
