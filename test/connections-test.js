var expect = require('chai').expect;
var nock = require('nock');
var OpenTok = require('../lib/opentok.js');

describe('Connections', () => {
  const opentok = new OpenTok('123456', 'APISECRET');
  const sessionId = '2_MX40NzIwMzJ-flR1ZSBPY3QgMjkgMTI6MTM6MjMgUERUIDIwMTN-MC45NDQ2MzE2NH4';

  const mockResponse = {
    count: 2,
    projectId: '123456',
    sessionId: sessionId,
    items: [
      {
        connectionId: '527775e1-626e-42c3-b0e8-e2122d20661a',
        createdAt: 1747655658197,
        connectionState: 'Connected'
      },
      {
        connectionId: 'c6db93f0-8692-438c-944b-cfbaf577c878',
        createdAt: 1747655658227,
        connectionState: 'Connected'
      }
    ]
  };

  afterEach(() => {
    nock.cleanAll();
  });

  describe('#listConnections', () => {
    it('lists connections for a session', (done) => {
      nock('https://api.opentok.com')
        .get(`/v2/project/123456/session/${sessionId}/connection`)
        .reply(200, mockResponse, { 'Content-Type': 'application/json' });

      opentok.listConnections(sessionId, (err, result) => {
        expect(err).to.be.null;
        expect(result.count).to.equal(2);
        expect(result.projectId).to.equal('123456');
        expect(result.sessionId).to.equal(sessionId);
        expect(result.items).to.have.lengthOf(2);
        expect(result.items[0].connectionId).to.equal('527775e1-626e-42c3-b0e8-e2122d20661a');
        expect(result.items[0].connectionState).to.equal('Connected');
        done();
      });
    });

    it('lists connections with a count option', (done) => {
      nock('https://api.opentok.com')
        .get(`/v2/project/123456/session/${sessionId}/connection`)
        .query({ count: '1' })
        .reply(200, { ...mockResponse, count: 1, items: [mockResponse.items[0]] }, { 'Content-Type': 'application/json' });

      opentok.listConnections(sessionId, { count: 1 }, (err, result) => {
        expect(err).to.be.null;
        expect(result.count).to.equal(1);
        expect(result.items).to.have.lengthOf(1);
        done();
      });
    });

    it('returns an error for an invalid session ID', (done) => {
      nock('https://api.opentok.com')
        .get(`/v2/project/123456/session/invalid-session/connection`)
        .reply(404, {}, { 'Content-Type': 'application/json' });

      opentok.listConnections('invalid-session', (err) => {
        expect(err).not.to.be.null;
        expect(err.message).to.contain('Not Found');
        done();
      });
    });

    it('throws when no callback is given', () => {
      expect(() => {
        opentok.listConnections(sessionId);
      }).to.throw(Error);
    });

    it('calls back with an error when no sessionId is given', (done) => {
      opentok.listConnections(null, (err) => {
        expect(err).not.to.be.null;
        expect(err.message).to.contain('No sessionId');
        done();
      });
    });
  });
});
