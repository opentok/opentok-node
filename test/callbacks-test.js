var expect = require('chai').expect;
var nock = require('nock');

// Subject
var OpenTok = require('../lib/opentok.js');

describe('Callbacks', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var CALLBACK_ID = 'ID';
  var GROUP = 'connection';
  var EVENT = 'created';
  var URL = 'https://';
  var CREATED_AT = 1391149936527;
  var CALLBACK = {
    id: CALLBACK_ID, group: GROUP, event: EVENT, url: URL, createdAt: CREATED_AT
  };

  afterEach(function () {
    nock.cleanAll();
  });

  describe('registerCallback', function () {
    function mockRequest(status, body) {
      nock('https://api.opentok.com:443')
        .post('/v2/project/APIKEY/callback', { group: GROUP, event: EVENT, url: URL })
        .reply(status, body, {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:32:16 GMT',
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'keep-alive'
        });
    }

    describe('valid responses', function () {
      beforeEach(function () {
        mockRequest(200, JSON.stringify(CALLBACK));
      });

      it('should return a Callback', function (done) {
        opentok.registerCallback(
          { group: GROUP, event: EVENT, url: URL },
          function (err, callback) {
            expect(err).to.be.null;
            expect(callback).to.not.be.null;
            if (callback) {
              expect(callback.id).to.equal(CALLBACK_ID);
              expect(callback.group).to.equal(GROUP);
              expect(callback.event).to.equal(EVENT);
              expect(callback.createdAt).to.equal(CREATED_AT);
              expect(callback.url).to.equal(URL);
            }
            done();
          }
        );
      });

      it('should fail for missing group', function (done) {
        opentok.registerCallback({ event: EVENT, url: URL }, function (err) {
          expect(err).to.not.be.null;
          done();
        });
      });

      it('should fail for missing event', function (done) {
        opentok.registerCallback({ group: GROUP, url: URL }, function (err) {
          expect(err).to.not.be.null;
          done();
        });
      });

      it('should fail for missing url', function (done) {
        opentok.registerCallback({ group: GROUP, event: EVENT }, function (err) {
          expect(err).to.not.be.null;
          done();
        });
      });
    });

    describe('invalid responses', function () {
      var errors = [400, 403, 500];
      var i;
      function test(error) {
        it('should fail for status ' + error, function (done) {
          mockRequest(error, '');

          opentok.registerCallback({ group: GROUP, event: EVENT, url: URL }, function (err) {
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

  describe('unregisterCallback', function () {
    function mockRequest(status, body) {
      nock('https://api.opentok.com:443')
        .delete('/v2/project/APIKEY/callback/' + CALLBACK_ID)
        .reply(status, body, {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:32:16 GMT',
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'keep-alive'
        });
    }

    describe('valid responses', function () {
      beforeEach(function () {
        mockRequest(204, '');
      });

      it('should not return an error', function (done) {
        opentok.unregisterCallback(CALLBACK_ID, function (err) {
          expect(err).to.be.null;
          done();
        });
      });

      it('should return an error for missing id', function (done) {
        opentok.unregisterCallback(null, function (err) {
          expect(err).to.not.be.null;
          done();
        });
      });
    });

    describe('invalid responses', function () {
      var errors = [400, 403, 500];
      var i;
      function test(error) {
        it('should fail for status ' + error, function (done) {
          mockRequest(error, '');

          opentok.registerCallback(
            { group: GROUP, event: EVENT, url: URL },
            function (err) {
              expect(err).to.not.be.null;
              done();
            }
          );
        });
      }
      for (i = 0; i < errors.length; i++) {
        test(errors[i]);
      }
    });
  });


  describe('listCallbacks', function () {
    function mockRequest(status, body) {
      nock('https://api.opentok.com:443')
        .get('/v2/project/APIKEY/callback')
        .reply(status, body, {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:32:16 GMT',
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'keep-alive'
        });
    }

    describe('valid responses', function () {
      it('should return a callback list', function (done) {
        mockRequest(200, JSON.stringify([CALLBACK, CALLBACK]));

        opentok.listCallbacks(function (err, callbacks) {
          expect(err).to.be.null;
          expect(callbacks).to.not.be.null;
          if (callbacks) {
            expect(callbacks.length).to.equal(2);
          }
          done();
        });
      });
    });

    describe('invalid responses', function () {
      var errors = [400, 403, 500];
      var i;
      function test(error) {
        it('should fail for status ' + error, function (done) {
          mockRequest(error, '');

          opentok.registerCallback({ group: GROUP, event: EVENT, url: URL }, function (err) {
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
