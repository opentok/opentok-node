var expect = require('chai').expect;
var nock = require('nock');
var OpenTok = require('../lib/opentok.js');

var apiKey = 'APIKEY';
var mockArchiveId = 'e85741ce-d280-4efa-a3ba-93379a68be06';
var mockSessionId = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';
var mockStreamId = '1_MX4xMDB-MC43NjAyOTYyfg';
var mockArchiveName = 'test_archive_name';
var mockS3Url = 'http://tokbox.com.archive2.s3.amazonaws.com/123456/09141e29-8770-439b-b180-337d7e637545/archive.mp4';

var archiveHostUrl = 'https://api.opentok.com';
var archiveResource = '/v2/project/APIKEY/archive';
var archiveResourceWithId = archiveResource + '/' + encodeURIComponent(mockArchiveId);
var archiveStopResource = archiveResourceWithId + '/stop';
var archivePatchResource = archiveResourceWithId + '/streams';

var mockStartArchiveResponseBody;
var mockStopArchiveResponseBody;
var mockGetUploadedArchiveResponseBody;

mockStartArchiveResponseBody = JSON.stringify({
  id: mockArchiveId,
  status: 'started',
  name: mockArchiveName,
  reason: '',
  sessionId: mockSessionId,
  projectId: apiKey,
  createdAt: 1480749999326,
  size: 0,
  duration: 0,
  outputMode: 'composed',
  hasAudio: true,
  hasVideo: true,
  sha256sum: '',
  password: '',
  updatedAt: 1480749999476,
  url: null,
  partnerId: apiKey
});

mockStopArchiveResponseBody = JSON.parse(mockStartArchiveResponseBody);
mockStopArchiveResponseBody.status = 'stopped';
mockStopArchiveResponseBody.reason = 'user initiated';
mockStopArchiveResponseBody.size = 347533;
mockStopArchiveResponseBody.duration = 27;
mockStopArchiveResponseBody = JSON.stringify(mockStopArchiveResponseBody);

mockGetUploadedArchiveResponseBody = JSON.parse(mockStopArchiveResponseBody);
mockGetUploadedArchiveResponseBody.status = 'available';
mockGetUploadedArchiveResponseBody.url = mockS3Url;
mockGetUploadedArchiveResponseBody = JSON.stringify(mockGetUploadedArchiveResponseBody);

describe('Archive Tests', function () {
  var opentok = new OpenTok('APIKEY', 'APISECRET');

  afterEach(function () {
    nock.cleanAll();
  });

  describe('deleteArchive', function () {
    it('should return no error on success', function (done) {
      nock(archiveHostUrl)
        .delete(archiveResourceWithId)
        .reply(204, '', {
          server: 'nginx',
          date: 'Tue, 04 Feb 2014 01:05:40 GMT',
          connection: 'keep-alive'
        });

      opentok.deleteArchive(mockArchiveId, function (err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return an error if archive ID is null', function (done) {
      opentok.deleteArchive(null, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('No archive ID given');
        done();
      });
    });

    it('should return an error if archive ID is invalid', function (done) {
      nock(archiveHostUrl)
        .delete(archiveResource + '/AN-INVALID-ARCHIVE-ID')
        .reply(
          404,
          '{ "message" : "Not found. You passed in an invalid archive ID." }',
          {
            server: 'nginx',
            date: 'Tue, 04 Feb 2014 01:10:39 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.deleteArchive('AN-INVALID-ARCHIVE-ID', function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Archive not found');
        done();
      });
    });

    it('should return an error if any other HTTP status is returned', function (done) {
      nock(archiveHostUrl)
        .delete(archiveResourceWithId)
        .reply(
          500,
          '{ "message" : "Some error." }',
          {
            server: 'nginx',
            date: 'Tue, 04 Feb 2014 00:52:38 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.deleteArchive(mockArchiveId, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Unexpected response from OpenTok: "{"message":"Some error."}"');
        done();
      });
    });

    it('should throw an error if no callback is provided', function () {
      expect(function () {
        opentok.deleteArchive(mockArchiveId);
      }).to.throw('No callback given to deleteArchive');
    });
  });

  describe('stopArchive', function () {
    it('should return an archive', function (done) {
      nock(archiveHostUrl)
        .post(archiveStopResource, {})
        .reply(
          200,
          mockStopArchiveResponseBody,
          {
            server: 'nginx',
            date: 'Mon, 03 Feb 2014 23:56:29 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.stopArchive(mockArchiveId, function (err, archive) {
        expect(err).to.be.null;
        expect(archive).not.to.be.null;
        expect(archive.status).to.equal('stopped');
        done();
      });
    });

    it('should return an error if archive ID is null', function (done) {
      opentok.stopArchive(null, function (err, archive) {
        expect(archive).to.be.undefined;
        expect(err).not.to.be.null;
        expect(err.message).to.equal('No archive ID given');
        done();
      });
    });

    it('should return an error if archive ID is invalid', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource + '/AN-INVALID-ARCHIVE-ID/stop', {})
        .reply(
          404,
          '{"code":-1,"message":"Not found. You passed in an invalid archive ID."}',
          {
            server: 'nginx',
            date: 'Tue, 04 Feb 2014 00:51:02 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.stopArchive('AN-INVALID-ARCHIVE-ID', function (err, archive) {
        expect(archive).to.be.undefined;
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Archive not found');
        done();
      });
    });

    it('should return an error if the archive is not currently started', function (done) {
      nock(archiveHostUrl)
        .post(archiveStopResource, {})
        .reply(
          409,
          '{ "message" : "Conflict. You are trying to stop an archive that is not recording." }',
          {
            server: 'nginx',
            date: 'Tue, 04 Feb 2014 00:52:38 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.stopArchive(mockArchiveId, function (err, archive) {
        expect(archive).to.be.undefined;
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Conflict. You are trying to stop an archive that is not recording.');
        done();
      });
    });

    it('should return an error if any other HTTP status is returned', function (done) {
      nock(archiveHostUrl)
        .post(archiveStopResource, {})
        .reply(
          500,
          '{ "message" : "Some error." }',
          {
            server: 'nginx',
            date: 'Tue, 04 Feb 2014 00:52:38 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.stopArchive(mockArchiveId, function (err, archive) {
        expect(archive).to.be.undefined;
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Unexpected response from OpenTok: "{"message":"Some error."}"');
        done();
      });
    });

    it('should throw an error if no callback is provided', function () {
      expect(function () {
        opentok.stopArchive(mockArchiveId);
      }).to.throw('No callback given to stopArchive')
    });
  });

  describe('patchArchive', function () {
    it('should patch an archive with addStream', function (done) {
      nock(archiveHostUrl)
        .patch(archivePatchResource, { addStream: mockStreamId, hasAudio: true, hasVideo: true })
        .reply(204);

      opentok.addArchiveStream(mockArchiveId, mockStreamId, {
        hasAudio: true,
        hasVideo: true
      }, function (err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should patch an archive with just addStream', function (done) {
      nock(archiveHostUrl)
        .patch(archivePatchResource, { addStream: mockStreamId, hasAudio: true, hasVideo: true })
        .reply(204);

      opentok.addArchiveStream(mockArchiveId, mockStreamId, function (err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should patch an archive with removeStream', function (done) {
      nock(archiveHostUrl)
        .patch(archivePatchResource, { removeStream: mockStreamId })
        .reply(204);

      opentok.removeArchiveStream(mockArchiveId, mockStreamId, function (err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should throw error on empty addArchiveStream', function () {
      expect(function () {
        opentok.addArchiveStream();
      }).to.throw('No callback given to addArchiveStream')
    });

    it('should throw error on empty removeArchiveStream', function () {
      expect(function () {
        opentok.removeArchiveStream();
      }).to.throw('No callback given to removeArchiveStream')
    });
  });
  describe('listArchives', function () {
    it('should return an array of archives and a total count', function (done) {
      nock(archiveHostUrl)
        .get(archiveResource + '?count=5')
        .reply(
          200,
          '{\n  "count" : 149,\n  "items" : [ {\n    "createdAt" : 1391457926000,\n    "duration" : 3,\n    "id" : "e85741ce-d280-4efa-a3ba-93379a68be06",\n    "name" : "",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 6590,\n    "status" : "available",\n    "url" : "http://some/video1.mp4"\n  }, {\n    "createdAt" : 1391218315000,\n    "duration" : 0,\n    "id" : "0931d1d7-4198-4db2-bf8a-097924421eb2",\n    "name" : "Archive 3",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 3150,\n    "status" : "available",\n    "url" : "http://some/video2.mp4"\n  }, {\n    "createdAt" : 1391218274000,\n    "duration" : 9,\n    "id" : "e7198f93-d8fa-448d-b134-ac3355ce2eb7",\n    "name" : "Archive 4",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 12691,\n    "status" : "available",\n    "url" : "http://some/video3.mp4"\n  }, {\n    "createdAt" : 1391218252000,\n    "duration" : 17,\n    "id" : "ae531f74-218c-4abd-bbe4-1f6bd92e9449",\n    "name" : null,\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 21566,\n    "status" : "available",\n    "url" : "http://some/video4.mp4"\n  }, {\n    "createdAt" : 1391218139000,\n    "duration" : 73,\n    "id" : "cf2fd890-7ea0-4f43-a6a7-432ea9dc4c51",\n    "name" : "Archive 5",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 83158,\n    "status" : "available",\n    "url" : "http://some/video5.mp4"\n  } ]\n}',
          {
            server: 'nginx',
            date: 'Mon, 03 Feb 2014 23:38:53 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.listArchives({ count: 5 }, function (err, archives, total) {
        expect(err).to.be.null;
        expect(total).to.equal(149);
        expect(archives).to.be.an('array');
        expect(archives.length).to.equal(5);
        expect(archives[0].duration).to.equal(3);
        expect(archives[0].id).to.equal(mockArchiveId);
        expect(archives[0].name).to.equal('');
        expect(archives[0].reason).to.equal('');
        expect(archives[0].sessionId).to.equal('SESSION_ID');
        expect(archives[0].size).to.equal(6590);
        expect(archives[0].status).to.equal('available');
        expect(archives[0].url).to.equal('http://some/video1.mp4');
        done();
      });
    });

    it('should allow options to be optional', function (done) {
      nock(archiveHostUrl)
        .get(archiveResource + '?')
        .reply(
          200,
          '{\n  "count" : 149,\n  "items" : [ {\n    "createdAt" : 1391457926000,\n    "duration" : 3,\n    "id" : "e85741ce-d280-4efa-a3ba-93379a68be06",\n    "name" : "",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 6590,\n    "status" : "available",\n    "url" : "http://some/video1.mp4"\n  }, {\n    "createdAt" : 1391218315000,\n    "duration" : 0,\n    "id" : "0931d1d7-4198-4db2-bf8a-097924421eb2",\n    "name" : "Archive 3",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 3150,\n    "status" : "available",\n    "url" : "http://some/video2.mp4"\n  }, {\n    "createdAt" : 1391218274000,\n    "duration" : 9,\n    "id" : "e7198f93-d8fa-448d-b134-ac3355ce2eb7",\n    "name" : "Archive 4",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 12691,\n    "status" : "available",\n    "url" : "http://some/video3.mp4"\n  }, {\n    "createdAt" : 1391218252000,\n    "duration" : 17,\n    "id" : "ae531f74-218c-4abd-bbe4-1f6bd92e9449",\n    "name" : null,\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 21566,\n    "status" : "available",\n    "url" : "http://some/video4.mp4"\n  }, {\n    "createdAt" : 1391218139000,\n    "duration" : 73,\n    "id" : "cf2fd890-7ea0-4f43-a6a7-432ea9dc4c51",\n    "name" : "Archive 5",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 83158,\n    "status" : "available",\n    "url" : "http://some/video5.mp4"\n  } ]\n}',
          {
            server: 'nginx',
            date: 'Mon, 03 Feb 2014 23:38:53 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.listArchives(function (err, archives, total) {
        expect(err).to.be.null;
        expect(total).to.equal(149);
        expect(archives).to.be.an('array');
        expect(archives.length).to.equal(5);
        expect(archives[0].duration).to.equal(3);
        expect(archives[0].id).to.equal(mockArchiveId);
        expect(archives[0].name).to.equal('');
        expect(archives[0].reason).to.equal('');
        expect(archives[0].sessionId).to.equal('SESSION_ID');
        expect(archives[0].size).to.equal(6590);
        expect(archives[0].status).to.equal('available');
        expect(archives[0].url).to.equal('http://some/video1.mp4');
        done();
      });
    });

    it('should return an error if any other HTTP status is returned', function (done) {
      nock(archiveHostUrl)
        .get(archiveResource + '?count=5')
        .reply(
          500,
          '{ "message" : "Some error." }',
          {
          server: 'nginx',
          date: 'Mon, 03 Feb 2014 23:38:53 GMT',
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'keep-alive'
        });

      opentok.listArchives({ count: 5 }, function (err, archives, total) {
        expect(archives).to.be.undefined;
        expect(total).to.be.undefined;
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Unexpected response from OpenTok: "{"message":"Some error."}"');

        done();
      });
    });

    it('should throw an error if no callback is provided', function () {
      expect(function () {
        opentok.listArchives();
      }).to.throw('No callback given to listArchives')
    });
  });

  describe('getArchive', function () {
    it('should return an archive', function (done) {
      nock('https://api.opentok.com')
        .get(archiveResourceWithId)
        .reply(
          200,
          mockGetUploadedArchiveResponseBody,
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:49:12 GMT',
            'content-type': 'application/json',
            'strict-transport-security': 'max-age=31536000; includeSubdomains',
            connection: 'keep-alive'
          }
        );

      opentok.getArchive(mockArchiveId, function (err, archive) {
        expect(err).to.be.null;
        expect(archive).not.to.be.null;
        if (archive) {
          expect(archive.name).to.equal(mockArchiveName);
          expect(archive.status).to.equal('available');
          expect(archive.stop).not.to.be.null;
          expect(archive.delete).not.to.be.null;
        }
        done();
      });
    });

    it('should allow archives with paused status', function (done) {
      var archiveResponseBodyForGetArchive = JSON.parse(mockGetUploadedArchiveResponseBody);
      archiveResponseBodyForGetArchive.status = 'paused';
      archiveResponseBodyForGetArchive = JSON.stringify(archiveResponseBodyForGetArchive);
      nock(archiveHostUrl)
        .get(archiveResourceWithId)
        .reply(
          200,
          archiveResponseBodyForGetArchive,
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:49:12 GMT',
            'content-type': 'application/json',
            'strict-transport-security': 'max-age=31536000; includeSubdomains',
            connection: 'keep-alive'
          }
        );

      opentok.getArchive(mockArchiveId, function (err, archive) {
        expect(err).to.be.null;
        expect(archive).not.to.be.null;
        if (archive) {
          expect(archive.status).to.equal('paused');
        }
        done();
      });
    });

    it('should return an expired archive', function (done) {
      var archiveResponseBodyForGetArchive = JSON.parse(mockGetUploadedArchiveResponseBody);
      archiveResponseBodyForGetArchive.status = 'expired';
      archiveResponseBodyForGetArchive = JSON.stringify(archiveResponseBodyForGetArchive);
      nock(archiveHostUrl)
        .get(archiveResource + '/' + mockArchiveId)
        .reply(200, archiveResponseBodyForGetArchive, {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:49:12 GMT',
          'content-type': 'application/json',
          'strict-transport-security': 'max-age=31536000; includeSubdomains',
          connection: 'keep-alive'
        });

      opentok.getArchive(mockArchiveId, function (err, archive) {
        expect(err).to.be.null;
        expect(archive).not.to.be.null;
        if (archive) {
          expect(archive.status).to.equal('expired');
        }
        done();
      });
    });

    it('should return archives with unknown properties', function (done) {
      nock(archiveHostUrl)
        .get(archiveResourceWithId)
        .reply(
          200,
          '{\n  "createdAt" : 1389986091000,\n  "duration" : 300,\n  "id" : "d4c27726-d965-4456-8b07-0cca1a4f4802",\n  "name" : "Bob",\n  "partnerId" : "APIKEY",\n  "reason" : "",\n  "sessionId" : "1_MX4xMDB-fkZyaSBKYW4gMTcgMTE6MTQ6NTAgUFNUIDIwMTR-MC4xNTM4NDExNH4",\n  "size" : 331266,\n  "status" : "expired",\n  "url" : null,\n "notarealproperty" : "not a real value"\n}',
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:49:12 GMT',
            'content-type': 'application/json',
            'strict-transport-security': 'max-age=31536000; includeSubdomains',
            connection: 'keep-alive'
          }
        );

      opentok.getArchive(mockArchiveId, function (err, archive) {
        expect(err).to.be.null;
        expect(archive).not.to.be.null;
        done();
      });
    });

    it('should return an error if archive ID is null', function (done) {
      opentok.getArchive(null, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('No archive ID given');
        done();
      });
    });

    it('should return an error if archive ID is invalid', function (done) {
      nock(archiveHostUrl)
        .get(archiveResourceWithId)
        .reply(
          404,
          '{ "message" : "null" }',
          {
            server: 'nginx',
            date: 'Mon, 03 Feb 2014 23:30:54 GMT',
            'content-type': 'application/json',
            'strict-transport-security': 'max-age=31536000; includeSubdomains',
            connection: 'keep-alive'
          }
        );

      opentok.getArchive(mockArchiveId, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Archive not found');
        done();
      });
    });

    it('should return an error if any other HTTP status is returned', function (done) {
      nock(archiveHostUrl)
        .get(archiveResourceWithId)
        .reply(
          500,
          '{ "message" : "Some error." }',
          {
            server: 'nginx',
            date: 'Mon, 03 Feb 2014 23:30:54 GMT',
            'content-type': 'application/json',
            'strict-transport-security': 'max-age=31536000; includeSubdomains',
            connection: 'keep-alive'
          }
        );

      opentok.getArchive(mockArchiveId, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Unexpected response from OpenTok: "{"message":"Some error."}"');
        done();
      });
    });

    it('should throw an error if no callback is provided', function () {
      expect(function () {
        opentok.getArchive(mockArchiveId);
      }).to.throw('No callback given to getArchive')
    });
  });
  describe('startArchive', function () {
    it('should return an Archive', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: mockSessionId, name: mockArchiveName })
        .reply(
          200,
          mockStartArchiveResponseBody,
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:32:16 GMT',
            'content-type': 'application/json',
            'strict-transport-security': 'max-age=31536000; includeSubdomains',
            'content-length': '402',
            connection: 'keep-alive'
          }
        );

      opentok.startArchive(mockSessionId, { name: mockArchiveName }, function (err, archive) {
        expect(err).to.be.null;
        expect(archive).not.to.be.null;
        if (archive) {
          expect(archive.name).to.equal(mockArchiveName);
          expect(archive.status).to.equal('started');
          expect(archive.stop).not.to.be.null;
          expect(archive.delete).not.to.be.null;
        }
        done();
      });
    });

    it('should work without the options', function (done) {
      var noOptionsArchiveResponseBody = JSON.parse(mockStartArchiveResponseBody);
      noOptionsArchiveResponseBody.name = null;
      noOptionsArchiveResponseBody = JSON.stringify(noOptionsArchiveResponseBody);
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: mockSessionId })
        .reply(
          200,
          noOptionsArchiveResponseBody,
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:32:16 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.startArchive(mockSessionId, function (err, archive) {
        expect(err).to.be.null;
        expect(archive).not.to.be.null;
        if (archive) {
          expect(archive.name).to.equal(null);
          expect(archive.status).to.equal('started');
          expect(archive.stop).not.to.be.null;
          expect(archive.delete).not.to.be.null;
        }
        done();
      });
    });

    it('should return an error if session is null', function (done) {
      opentok.startArchive(null, {}, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('No session ID given');
        done();
      });
    });

    it('should return an error if session ID is invalid', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: 'invalidSessionIDIam' })
        .reply(404, '{ "message" : "responseString" }', {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:37:25 GMT',
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'keep-alive'
        });

      opentok.startArchive('invalidSessionIDIam', {}, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Session not found');
        done();
      });
    });

    it('should return an error if session is p2p or has no connections', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: mockSessionId })
        .reply(404, '{ "message" : "responseString" }', {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:46:22 GMT',
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'keep-alive'
        });

      opentok.startArchive(mockSessionId, {}, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Session not found');
        done();
      });
    });

    it('should return an error if any other HTTP status is returned', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: mockSessionId })
        .reply(
          500,
          '{ "message" : "Some error." }',
          {
          server: 'nginx',
          date: 'Fri, 31 Jan 2014 06:46:22 GMT',
          'content-type': 'application/json',
          'transfer-encoding': 'chunked',
          connection: 'keep-alive'
        });

      opentok.startArchive(mockSessionId, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.equal('Unexpected response from OpenTok: "{"message":"Some error."}"');
        done();
      });
    });

    it('should throw an error if no callback is provided', function () {
      expect(function () {
        opentok.startArchive(mockSessionId);
      }).to.throw('No callback given to startArchive')
    });

    it('should be able to archive with hasVideo to false', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: mockSessionId, hasAudio: true, hasVideo: false })
        .reply(
          200,
          '{\n  "createdAt" : 1391149936527,\n  "duration" : 0,\n  "id" : "4072fe0f-d499-4f2f-8237-64f5a9d936f5",\n  "name" : null,\n  "partnerId" : "APIKEY",\n  "reason" : "",\n  "sessionId" : "1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg",\n  "size" : 0,\n  "status" : "started",\n "hasAudio" : true,\n "hasVideo" : false,\n "url" : null\n}',
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:32:16 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.startArchive(mockSessionId, { hasAudio: true, hasVideo: false }, function (err, archive) {
        expect(err).to.be.null;
        expect(archive.hasAudio).to.equal(true);
        expect(archive.hasVideo).to.equal(false);
        done();
      });
    });

    it('should be able to archive with maxBitrate set to 300000', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: mockSessionId, hasAudio: true, hasVideo: false, maxBitrate: 300000 })
        .reply(
          200,
          '{\n  "createdAt" : 1391149936527,\n  "duration" : 0,\n  "id" : "4072fe0f-d499-4f2f-8237-64f5a9d936f5",\n  "name" : null,\n  "partnerId" : "APIKEY",\n  "reason" : "",\n  "sessionId" : "1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg",\n  "size" : 0,\n  "status" : "started",\n  "maxBitrate" : 300000,\n "url" : null\n}',
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:32:16 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.startArchive(mockSessionId, { hasAudio: true, hasVideo: false, maxBitrate: 300000 }, function (err, archive) {
        expect(err).to.be.null;
        expect(archive.maxBitrate).to.equal(300000)
        done();
      });
    });

    it('should be able to archive if outputMode is individual', function (done) {
      nock(archiveHostUrl)
        .post(
          archiveResource,
          JSON.stringify({
            sessionId: mockSessionId,
            outputMode: 'individual'
          }),
        )
        .reply(
          200,
          {
            createdAt: 1391149936527,
            duration: 0,
            id: "4072fe0f-d499-4f2f-8237-64f5a9d936f5",
            name: null,
            partnerId: "APIKEY",
            reason: "",
            sessionId: "1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg",
            size: 0,
            status: "started",
            hasAudio: true,
            hasVideo: true,
            outputMode: "individual",
            url: null
          }
        );

      opentok.startArchive(mockSessionId, { outputMode: 'individual' }, function (err, archive) {
        expect(err).to.be.null;
        expect(archive.outputMode).to.equal('individual');
        done();
      });
    });

    it('should be able to archive if outputMode is composed', function (done) {
      nock(archiveHostUrl)
        .post(archiveResource, { sessionId: mockSessionId, outputMode: 'composed' })
        .reply(
          200,
          '{\n  "createdAt" : 1391149936527,\n  "duration" : 0,\n  "id" : "4072fe0f-d499-4f2f-8237-64f5a9d936f5",\n  "name" : null,\n  "partnerId" : "APIKEY",\n  "reason" : "",\n  "sessionId" : "1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg",\n  "size" : 0,\n  "status" : "started",\n "hasAudio" : true,\n "hasVideo" : true,\n "outputMode" : "composed",\n "url" : null\n}',
          {
            server: 'nginx',
            date: 'Fri, 31 Jan 2014 06:32:16 GMT',
            'content-type': 'application/json',
            'transfer-encoding': 'chunked',
            connection: 'keep-alive'
          }
        );

      opentok.startArchive(mockSessionId, { outputMode: 'composed' }, function (err, archive) {
        expect(err).to.be.null;
        expect(archive.outputMode).to.equal('composed');
        done();
      });
    });
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
