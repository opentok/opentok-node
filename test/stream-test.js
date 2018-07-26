var expect = require('chai').expect;
var nock = require('nock');
var OpenTok = require('../lib/opentok.js');
var Session = require('../lib/session.js');

function mockStreamRequest(sessionId, streamId, status) {
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
    .get('/v2/project/APIKEY/session/' + sessionId + '/stream/' + streamId)
    .reply(status || 200, body);
}

describe('Stream', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');
  var SESSIONID = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
  var STREAMID = '4072fe0f-d499-4f2f-8237-64f5a9d936f5';
  var session = new Session(opentok, SESSIONID);

  beforeEach(function () {
    var validReply = JSON.stringify([
      {
        session_id: SESSIONID,
        project_id: 'APIKEY',
        partner_id: 'APIKEY',
        create_dt: 'Fri Nov 18 15:50:36 PST 2016',
        media_server_url: ''
      }
    ]);
    nock('https://api.opentok.com:443')
      .filteringRequestBody(function () {
        return '*';
      })
      .post('/session/create', '*')
      .reply(200, validReply, {
        server: 'nginx',
        date: 'Thu, 20 Mar 2014 14:02:45 GMT',
        'content-type': 'text/xml',
        connection: 'keep-alive',
        'access-control-allow-origin': '*',
        'x-tb-host': 'oms506-nyc.tokbox.com',
        'content-length': '211'
      });
  });

  afterEach(function () {
    nock.cleanAll();
  });

  describe('getStream', function () {
    it('should not get an error and get valid stream data given valid parameters', function (done) {
      mockStreamRequest(SESSIONID, STREAMID);
      session.getStream(STREAMID, function (err, stream) {
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
      mockStreamRequest(SESSIONID, STREAMID);
      session.getStream(null, function (err, stream) {
        expect(err).to.not.be.null;
        expect(stream).to.be.undefined;
        done();
      });
    });

    it('should return an error if the REST method returns a 404 response code', function (done) {
      mockStreamRequest(SESSIONID, STREAMID, 400);
      session.getStream(STREAMID, function (err, stream) {
        expect(err).to.not.be.null;
        expect(stream).to.be.undefined;
        done();
      });
    });
  });
});

exports.mockStreamRequest = mockStreamRequest;
