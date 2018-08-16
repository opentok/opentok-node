var expect = require('chai').expect;
var nock = require('nock');

// Subject
var OpenTok = require('../lib/opentok.js');

describe('Signal', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var CONNECTIONID = '4072fe0f-d499-4f2f-8237-64f5a9d936f5';
  var TYPE = 'type';
  var DATA = 'data';

  afterEach(function () {
    nock.cleanAll();
  });

  describe('signalSession', function () {
    function mockRequest(status, body) {
      var url = '/v2/project/APIKEY/session/' + SESSIONID + '/signal';
      nock('https://api.opentok.com:443')
        .post(url, { type: TYPE, data: DATA })
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
        opentok.signal(SESSIONID, null, { type: TYPE, data: DATA }, function (err) {
          expect(err).to.be.null;
          done();
        });
      });

      it('should return an error if session is null', function (done) {
        opentok.signal(null, null, { type: TYPE, data: DATA }, function (err) {
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

          opentok.signal(SESSIONID, null, { type: TYPE, data: DATA }, function (err) {
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

  describe('signalConnection', function () {
    function mockRequest(status, body) {
      var url = '/v2/project/APIKEY/session/' + SESSIONID + '/connection/' + CONNECTIONID + '/signal';
      nock('https://api.opentok.com:443')
        .post(url, { type: TYPE, data: DATA })
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
        opentok.signal(SESSIONID, CONNECTIONID, { type: TYPE, data: DATA }, function (err) {
          expect(err).to.be.null;
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

          opentok.signal(SESSIONID, CONNECTIONID, { type: TYPE, data: DATA }, function (err) {
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
