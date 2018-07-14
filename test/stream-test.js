var expect = require('chai').expect;
var nock = require('nock');
var OpenTok = require('../lib/opentok.js');

describe('Stream', function() {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var STREAMID = '4072fe0f-d499-4f2f-8237-64f5a9d936f5';
  var TYPE = 'type';
  var DATA = 'data';

  afterEach(function() {
    nock.cleanAll();
  });

  describe('getStream', function() {
    function mockRequest() {
      var url = '/v2/project/APIKEY/session/' + SESSIONID + '/stream/' + STREAMID;
      nock('https://api.opentok.com')
        .get(url)
        .reply(200, JSON.stringify({
          id: 'fooId',
          name: 'fooName',
          layoutClassList: ['fooClass'],
          videoType: 'screen'
        }));
    }

    describe('valid responses', function() {
      beforeEach(function() {
        mockRequest();
      });

      it('should not get an error and get valid stream data given valid parameters', function (done) {
        opentok.getStream(SESSIONID, STREAMID, function(err, stream) {
          expect(err).to.be.null;
          expect(stream.id).to.equal('fooId');
          expect(stream.name).to.equal('fooName');
          expect(stream.layoutClassList.length).to.equal(1);
          expect(stream.layoutClassList[0]).to.equal('fooClass');
          expect(stream.videoType).to.equal('screen');
          done();
        });
      });

      it('should return an error if streamId is null', function(done) {
        opentok.getStream(null, STREAMID, function(err) {
          expect(err).to.not.be.null;
          done();
        });
      });

      it('should return an error if sessionId is null', function(done) {
        opentok.getStream(SESSIONID, null, function(err) {
          expect(err).to.not.be.null;
          done();
        });
      });
    });
  });
});