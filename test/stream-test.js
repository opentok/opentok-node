var expect = require('chai').expect;
var nock = require('nock');
var OpenTok = require('../lib/opentok.js');

describe('Stream', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var STREAMID = '4072fe0f-d499-4f2f-8237-64f5a9d936f5';

  afterEach(function () {
    nock.cleanAll();
  });

  describe('getStream', function () {
    function mockRequest(status) {
      var body;
      if (!status) {
        body = JSON.stringify({
          id: 'fooId',
          name: 'fooName',
          layoutClassList: ['fooClass'],
          videoType: 'screen'
        });
      }
      nock('https://api.opentok.com')
        .get('/v2/project/APIKEY/session/' + SESSIONID + '/stream/' + STREAMID)
        .reply(status || 200, body);
    }

    describe('valid responses', function () {
      it('should not get an error and get valid stream data given valid parameters', function (done) {
        mockRequest();
        opentok.getStream(SESSIONID, STREAMID, function (err, stream) {
          expect(err).to.be.null;
          expect(stream.id).to.equal('fooId');
          expect(stream.name).to.equal('fooName');
          expect(stream.layoutClassList.length).to.equal(1);
          expect(stream.layoutClassList[0]).to.equal('fooClass');
          expect(stream.videoType).to.equal('screen');
          done();
        });
      });

      it('should return an error if streamId is null', function (done) {
        mockRequest();
        opentok.getStream(null, STREAMID, function (err, stream) {
          expect(err).to.not.be.null;
          expect(stream).to.be.undefined;
          done();
        });
      });

      it('should return an error if sessionId is null', function (done) {
        mockRequest();
        opentok.getStream(SESSIONID, null, function (err, stream) {
          expect(err).to.not.be.null;
          expect(stream).to.be.undefined;
          done();
        });
      });

      it('should return an error if the REST method returns a 404 response code', function (done) {
        mockRequest(400);
        opentok.getStream(SESSIONID, STREAMID, function (err, stream) {
          expect(err).to.not.be.null;
          expect(stream).to.be.undefined;
          done();
        });
      });
    });
  });
});
