/*global require, describe, it, expect, waitsFor, runs, Buffer, jasmine */
/*jshint strict:false */
var OpenTok = require('../lib/opentok'),
    nock    = require('nock');

describe('Archiving', function() {
  var opentok = new OpenTok('APIKEY', 'APISECRET');

  describe('startArchive', function() {
    var session = '1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg';

    it('should return an Archive', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg','name':'Bob'})
        .reply(200, '{\n  \"createdAt\" : 1391149936527,\n  \"duration\" : 0,\n  \"id\" : \"4072fe0f-d499-4f2f-8237-64f5a9d936f5\",\n  \"name\" : \"Bob\",\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg\",\n  \"size\" : 0,\n  \"status\" : \"started\",\n  \"url\" : null\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:32:16 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive(session, { name: 'Bob' }, function(err, archive) {
        expect(err).toBeNull();
        expect(archive).not.toBeNull();
        if(archive) {
          expect(archive.name).toBe('Bob');
          expect(archive.status).toBe('started');
          expect(archive.stop).not.toBeNull();
          expect(archive.delete).not.toBeNull();
        }
        done();
      });

    });

    it('should work without the options', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg'})
        .reply(200, '{\n  \"createdAt\" : 1391149936527,\n  \"duration\" : 0,\n  \"id\" : \"4072fe0f-d499-4f2f-8237-64f5a9d936f5\",\n  \"name\" : null,\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg\",\n  \"size\" : 0,\n  \"status\" : \"started\",\n  \"url\" : null\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:32:16 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive(session, function(err, archive) {
        expect(err).toBeNull();
        expect(archive).not.toBeNull();
        if(archive) {
          expect(archive.name).toBe(null);
          expect(archive.status).toBe('started');
          expect(archive.stop).not.toBeNull();
          expect(archive.delete).not.toBeNull();
        }
        done();
      });

    });

    it('should return an error if session is null', function(done) {
      opentok.startArchive(null, {}, function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('No session ID given');
        done();
      });
    });

    it('should return an error if session ID is invalid', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'invalidSessionIDIam'})
        .reply(404, '{ \"message\" : \"responseString\" }', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:37:25 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive('invalidSessionIDIam', {}, function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Session not found');
        done();
      });

    });

    it('should return an error if session is p2p or has no connections', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg'})
        .reply(404, '{ \"message\" : \"responseString\" }', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:46:22 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive(session, {}, function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Session not found');
        done();
      });

    });

    it('should return an error if any other HTTP status is returned', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg'})
        .reply(500, '{ \"message\" : \"responseString\" }', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:46:22 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive(session, function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Unexpected response from OpenTok');
        done();
      });

    });

    it('should throw an error if no callback is provided', function() {

      expect(function() {
        opentok.startArchive(session);
      }).toThrow(new OpenTok.ArgumentError('No callback given to startArchive'));

    });

    it('should be able to archive with hasVideo to false', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg', 'hasAudio': true, hasVideo: false})
        .reply(200, '{\n  \"createdAt\" : 1391149936527,\n  \"duration\" : 0,\n  \"id\" : \"4072fe0f-d499-4f2f-8237-64f5a9d936f5\",\n  \"name\" : null,\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg\",\n  \"size\" : 0,\n  \"status\" : \"started\",\n \"hasAudio\" : true,\n \"hasVideo\" : false,\n \"url\" : null\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:32:16 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive(session, {hasAudio: true, hasVideo: false}, function(err, archive) {
        expect(err).toBeNull();
        expect(archive.hasAudio).toEqual(true);
        expect(archive.hasVideo).toEqual(false);
        done();
      });
    });

    it('should be able to archive if outputMode is individual', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg', 'outputMode': 'individual' })
        .reply(200, '{\n  \"createdAt\" : 1391149936527,\n  \"duration\" : 0,\n  \"id\" : \"4072fe0f-d499-4f2f-8237-64f5a9d936f5\",\n  \"name\" : null,\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg\",\n  \"size\" : 0,\n  \"status\" : \"started\",\n \"hasAudio\" : true,\n \"hasVideo\" : true,\n \"outputMode\" : \"individual\",\n \"url\" : null\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:32:16 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive(session, {outputMode: 'individual'}, function(err, archive) {
        expect(err).toBeNull();
        expect(archive.outputMode).toEqual('individual');
        done();
      });
    });

    it('should be able to archive if outputMode is composed', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive', {'sessionId':'1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg', 'outputMode': 'composed' })
        .reply(200, '{\n  \"createdAt\" : 1391149936527,\n  \"duration\" : 0,\n  \"id\" : \"4072fe0f-d499-4f2f-8237-64f5a9d936f5\",\n  \"name\" : null,\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg\",\n  \"size\" : 0,\n  \"status\" : \"started\",\n \"hasAudio\" : true,\n \"hasVideo\" : true,\n \"outputMode\" : \"composed\",\n \"url\" : null\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:32:16 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.startArchive(session, {outputMode: 'composed'}, function(err, archive) {
        expect(err).toBeNull();
        expect(archive.outputMode).toEqual('composed');
        done();
      });
    });
  });

  describe('getArchive', function() {
    var archiveID = 'd4c27726-d965-4456-8b07-0cca1a4f4802';

    it('should return an archive', function(done) {
      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive/d4c27726-d965-4456-8b07-0cca1a4f4802')
        .reply(200, '{\n  \"createdAt\" : 1389986091000,\n  \"duration\" : 300,\n  \"id\" : \"d4c27726-d965-4456-8b07-0cca1a4f4802\",\n  \"name\" : \"Bob\",\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-fkZyaSBKYW4gMTcgMTE6MTQ6NTAgUFNUIDIwMTR-MC4xNTM4NDExNH4\",\n  \"size\" : 331266,\n  \"status\" : \"available\",\n  \"url\" : \"http://tokbox.com.archive2.s3.amazonaws.com/APIKEY%2Fd4c27726-d965-4456-8b07-0cca1a4f4802%2Farchive.mp4?Expires=1391151552&AWSAccessKeyId=AKIAI6LQCPIXYVWCQV6Q&Signature=IiFhiMDUyvP6Q6EChXioePxvp6g%3D\"\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:49:12 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.getArchive(archiveID, function(err, archive) {
        expect(err).toBeNull();
        expect(archive).not.toBeNull();
        if(archive) {
          expect(archive.name).toBe('Bob');
          expect(archive.status).toBe('available');
          expect(archive.stop).not.toBeNull();
          expect(archive.delete).not.toBeNull();
        }
        done();
      });

    });

    it('should allow archives with paused status', function(done) {
      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive/d4c27726-d965-4456-8b07-0cca1a4f4802')
        .reply(200, '{\n  \"createdAt\" : 1389986091000,\n  \"duration\" : 300,\n  \"id\" : \"d4c27726-d965-4456-8b07-0cca1a4f4802\",\n  \"name\" : \"Bob\",\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-fkZyaSBKYW4gMTcgMTE6MTQ6NTAgUFNUIDIwMTR-MC4xNTM4NDExNH4\",\n  \"size\" : 331266,\n  \"status\" : \"paused\",\n  \"url\" : \"http://tokbox.com.archive2.s3.amazonaws.com/APIKEY%2Fd4c27726-d965-4456-8b07-0cca1a4f4802%2Farchive.mp4?Expires=1391151552&AWSAccessKeyId=AKIAI6LQCPIXYVWCQV6Q&Signature=IiFhiMDUyvP6Q6EChXioePxvp6g%3D\"\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:49:12 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.getArchive(archiveID, function(err, archive) {
        expect(err).toBeNull();
        expect(archive).not.toBeNull();
        if(archive) {
          expect(archive.status).toBe('paused');
        }
        done();
      });

    });

    it('should return an expired archive', function(done) {
      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive/d4c27726-d965-4456-8b07-0cca1a4f4802')
        .reply(200, '{\n  \"createdAt\" : 1389986091000,\n  \"duration\" : 300,\n  \"id\" : \"d4c27726-d965-4456-8b07-0cca1a4f4802\",\n  \"name\" : \"Bob\",\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-fkZyaSBKYW4gMTcgMTE6MTQ6NTAgUFNUIDIwMTR-MC4xNTM4NDExNH4\",\n  \"size\" : 331266,\n  \"status\" : \"expired\",\n  \"url\" : null\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:49:12 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.getArchive(archiveID, function(err, archive) {
        expect(err).toBeNull();
        expect(archive).not.toBeNull();
        if(archive) {
          expect(archive.status).toBe('expired');
        }
        done();
      });

    });

    it('should return archives with unknown properties', function(done) {
      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive/d4c27726-d965-4456-8b07-0cca1a4f4802')
        .reply(200, '{\n  \"createdAt\" : 1389986091000,\n  \"duration\" : 300,\n  \"id\" : \"d4c27726-d965-4456-8b07-0cca1a4f4802\",\n  \"name\" : \"Bob\",\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-fkZyaSBKYW4gMTcgMTE6MTQ6NTAgUFNUIDIwMTR-MC4xNTM4NDExNH4\",\n  \"size\" : 331266,\n  \"status\" : \"expired\",\n  \"url\" : null,\n \"notarealproperty\" : \"not a real value\"\n}', { server: 'nginx',
        date: 'Fri, 31 Jan 2014 06:49:12 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.getArchive(archiveID, function(err, archive) {
        expect(err).toBeNull();
        expect(archive).not.toBeNull();
        done();
      });

    });

    it('should return an error if archive ID is null', function(done) {

      opentok.getArchive(null, function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('No archive ID given');
        done();
      });

    });

    it('should return an error if archive ID is invalid', function(done) {

      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive/01614A9B-6BB3-4691-846E-F8A59555AD21')
        .reply(404, '{ \"message\" : \"null\" }', { server: 'nginx',
        date: 'Mon, 03 Feb 2014 23:30:54 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.getArchive('01614A9B-6BB3-4691-846E-F8A59555AD21', function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Archive not found');
        done();
      });

    });

    it('should return an error if any other HTTP status is returned', function(done) {
      // nock.recorder.rec();

      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive/01614A9B-6BB3-4691-846E-F8A59555AD21')
        .reply(500, '{ \"message\" : \"Something went wrong\" }', { server: 'nginx',
        date: 'Mon, 03 Feb 2014 23:30:54 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.getArchive('01614A9B-6BB3-4691-846E-F8A59555AD21', function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Unexpected response from OpenTok');
        done();
      });

    });

    it('should throw an error if no callback is provided', function() {

      expect(function() {
        opentok.getArchive(archiveID);
      }).toThrow(new OpenTok.ArgumentError('No callback given to getArchive'));

    });

  });

  describe('listArchives', function() {

    it('should return an array of archives and a total count', function(done) {

      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive?count=5')
        .reply(200, '{\n  "count" : 149,\n  "items" : [ {\n    "createdAt" : 1391457926000,\n    "duration" : 3,\n    "id" : "16231874-7ce7-4f5e-a30a-4513c4df480d",\n    "name" : "",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 6590,\n    "status" : "available",\n    "url" : "http://some/video1.mp4"\n  }, {\n    "createdAt" : 1391218315000,\n    "duration" : 0,\n    "id" : "0931d1d7-4198-4db2-bf8a-097924421eb2",\n    "name" : "Archive 3",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 3150,\n    "status" : "available",\n    "url" : "http://some/video2.mp4"\n  }, {\n    "createdAt" : 1391218274000,\n    "duration" : 9,\n    "id" : "e7198f93-d8fa-448d-b134-ac3355ce2eb7",\n    "name" : "Archive 4",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 12691,\n    "status" : "available",\n    "url" : "http://some/video3.mp4"\n  }, {\n    "createdAt" : 1391218252000,\n    "duration" : 17,\n    "id" : "ae531f74-218c-4abd-bbe4-1f6bd92e9449",\n    "name" : null,\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 21566,\n    "status" : "available",\n    "url" : "http://some/video4.mp4"\n  }, {\n    "createdAt" : 1391218139000,\n    "duration" : 73,\n    "id" : "cf2fd890-7ea0-4f43-a6a7-432ea9dc4c51",\n    "name" : "Archive 5",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 83158,\n    "status" : "available",\n    "url" : "http://some/video5.mp4"\n  } ]\n}', { server: 'nginx',
        date: 'Mon, 03 Feb 2014 23:38:53 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.listArchives({ count: 5 }, function(err, archives, total) {
        expect(err).toBeNull();
        expect(total).toBe(149);
        expect(archives).toEqual(jasmine.any(Array));
        expect(archives.length).toBe(5);
        expect(archives[0].duration).toBe(3);
        expect(archives[0].id).toBe('16231874-7ce7-4f5e-a30a-4513c4df480d');
        expect(archives[0].name).toBe('');
        expect(archives[0].reason).toBe('');
        expect(archives[0].sessionId).toBe('SESSION_ID');
        expect(archives[0].size).toBe(6590);
        expect(archives[0].status).toBe('available');
        expect(archives[0].url).toBe('http://some/video1.mp4');
        done();
      });

    });

    it('should allow options to be optional', function(done) {

      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive?')
        .reply(200, '{\n  "count" : 149,\n  "items" : [ {\n    "createdAt" : 1391457926000,\n    "duration" : 3,\n    "id" : "16231874-7ce7-4f5e-a30a-4513c4df480d",\n    "name" : "",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 6590,\n    "status" : "available",\n    "url" : "http://some/video1.mp4"\n  }, {\n    "createdAt" : 1391218315000,\n    "duration" : 0,\n    "id" : "0931d1d7-4198-4db2-bf8a-097924421eb2",\n    "name" : "Archive 3",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 3150,\n    "status" : "available",\n    "url" : "http://some/video2.mp4"\n  }, {\n    "createdAt" : 1391218274000,\n    "duration" : 9,\n    "id" : "e7198f93-d8fa-448d-b134-ac3355ce2eb7",\n    "name" : "Archive 4",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 12691,\n    "status" : "available",\n    "url" : "http://some/video3.mp4"\n  }, {\n    "createdAt" : 1391218252000,\n    "duration" : 17,\n    "id" : "ae531f74-218c-4abd-bbe4-1f6bd92e9449",\n    "name" : null,\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 21566,\n    "status" : "available",\n    "url" : "http://some/video4.mp4"\n  }, {\n    "createdAt" : 1391218139000,\n    "duration" : 73,\n    "id" : "cf2fd890-7ea0-4f43-a6a7-432ea9dc4c51",\n    "name" : "Archive 5",\n    "partnerId" : "APIKEY",\n    "reason" : "",\n    "sessionId" : "SESSION_ID",\n    "size" : 83158,\n    "status" : "available",\n    "url" : "http://some/video5.mp4"\n  } ]\n}', { server: 'nginx',
        date: 'Mon, 03 Feb 2014 23:38:53 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.listArchives(function(err, archives, total) {
        expect(err).toBeNull();
        expect(total).toBe(149);
        expect(archives).toEqual(jasmine.any(Array));
        expect(archives.length).toBe(5);
        expect(archives[0].duration).toBe(3);
        expect(archives[0].id).toBe('16231874-7ce7-4f5e-a30a-4513c4df480d');
        expect(archives[0].name).toBe('');
        expect(archives[0].reason).toBe('');
        expect(archives[0].sessionId).toBe('SESSION_ID');
        expect(archives[0].size).toBe(6590);
        expect(archives[0].status).toBe('available');
        expect(archives[0].url).toBe('http://some/video1.mp4');
        done();
      });

    });

    it('should return an error if any other HTTP status is returned', function(done) {
      nock('https://api.opentok.com:443')
        .get('/v2/partner/APIKEY/archive?count=5')
        .reply(500, '{\"message\":\"Some error\"}', { server: 'nginx',
        date: 'Mon, 03 Feb 2014 23:38:53 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.listArchives({ count: 5 }, function(err, archives, total) {
        expect(archives).toBeUndefined();
        expect(total).toBeUndefined();
        expect(err).not.toBeNull();
        expect(err.message).toBe('Unexpected response from OpenTok');
        done();
      });
    });

    it('should throw an error if no callback is provided', function() {

      expect(function() {
        opentok.listArchives();
      }).toThrow(new OpenTok.ArgumentError('No callback given to listArchives'));

    });

  });

  describe('stopArchive', function() {

    it('should return an archive', function(done) {
      var archiveId = 'ca138a6c-380f-4de9-b2b2-bc78b3a117e2';

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive/ca138a6c-380f-4de9-b2b2-bc78b3a117e2/stop', {})
        .reply(200, '{\n  \"createdAt\" : 1391471703000,\n  \"duration\" : 0,\n  \"id\" : \"ca138a6c-380f-4de9-b2b2-bc78b3a117e2\",\n  \"name\" : \"PHP Archiving Sample App\",\n  \"partnerId\" : \"APIKEY\",\n  \"reason\" : \"\",\n  \"sessionId\" : \"1_MX4xMDB-MTI3LjAuMC4xflR1ZSBKYW4gMjggMTU6NDg6NDAgUFNUIDIwMTR-MC43NjAyOTYyfg\",\n  \"size\" : 0,\n  \"status\" : \"stopped\",\n  \"url\" : null\n}', { server: 'nginx',
        date: 'Mon, 03 Feb 2014 23:56:29 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.stopArchive(archiveId, function(err, archive) {
        expect(err).toBeNull();
        expect(archive).not.toBeNull();
        expect(archive.status).toBe('stopped');
        done();
      });
    });

    it('should return an error if archive ID is null', function(done) {
      opentok.stopArchive(null, function(err, archive) {
        expect(archive).toBeUndefined();
        expect(err).not.toBeNull();
        expect(err.message).toBe('No archive ID given');
        done();
      });

    });

    it('should return an error if archive ID is invalid', function(done) {
      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive/AN-INVALID-ARCHIVE-ID/stop', {})
        .reply(404, '{ \"message\" : \"Not found. You passed in an invalid archive ID.\" }', { server: 'nginx',
        date: 'Tue, 04 Feb 2014 00:51:02 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.stopArchive('AN-INVALID-ARCHIVE-ID', function(err, archive) {
        expect(archive).toBeUndefined();
        expect(err).not.toBeNull();
        expect(err.message).toBe('Archive not found');
        done();
      });
    });

    it('should return an error if the archive is not currently started', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive/ca138a6c-380f-4de9-b2b2-bc78b3a117e2/stop', {})
        .reply(409, '{ \"message\" : \"Conflict. You are trying to stop an archive that is not recording.\" }', { server: 'nginx',
        date: 'Tue, 04 Feb 2014 00:52:38 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      var archiveId = 'ca138a6c-380f-4de9-b2b2-bc78b3a117e2';
      opentok.stopArchive(archiveId, function(err, archive) {
        expect(archive).toBeUndefined();
        expect(err).not.toBeNull();
        expect(err.message).toBe('Conflict. You are trying to stop an archive that is not recording.');
        done();
      });

    });

    it('should return an error if any other HTTP status is returned', function(done) {

      nock('https://api.opentok.com:443')
        .post('/v2/partner/APIKEY/archive/ca138a6c-380f-4de9-b2b2-bc78b3a117e2/stop', {})
        .reply(500, '{ \"message\" : \"Some other error.\" }', { server: 'nginx',
        date: 'Tue, 04 Feb 2014 00:52:38 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      var archiveId = 'ca138a6c-380f-4de9-b2b2-bc78b3a117e2';
      opentok.stopArchive(archiveId, function(err, archive) {
        expect(archive).toBeUndefined();
        expect(err).not.toBeNull();
        expect(err.message).toBe('Unexpected response from OpenTok');
        done();
      });

    });

    it('should throw an error if no callback is provided', function() {

      expect(function() {
        opentok.stopArchive('ca138a6c-380f-4de9-b2b2-bc78b3a117e2');
      }).toThrow(new OpenTok.ArgumentError('No callback given to stopArchive'));

    });

  });

  describe('deleteArchive', function() {

    it('should return no error on success', function(done) {

      nock('https://api.opentok.com:443')
        .delete('/v2/partner/APIKEY/archive/ca138a6c-380f-4de9-b2b2-bc78b3a117e2')
        .reply(204, '', { server: 'nginx',
        date: 'Tue, 04 Feb 2014 01:05:40 GMT',
        connection: 'keep-alive' });

      var archiveId = 'ca138a6c-380f-4de9-b2b2-bc78b3a117e2';
      opentok.deleteArchive(archiveId, function(err) {
        expect(err).toBeNull();
        done();
      });

    });

    it('should return an error if archive ID is null', function(done) {
      opentok.deleteArchive(null, function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('No archive ID given');
        done();
      });
    });

    it('should return an error if archive ID is invalid', function(done) {

      nock('https://api.opentok.com:443')
        .delete('/v2/partner/APIKEY/archive/AN-INVALID-ARCHIVE-ID')
        .reply(404, '{ \"message\" : \"Not found. You passed in an invalid archive ID.\" }', { server: 'nginx',
        date: 'Tue, 04 Feb 2014 01:10:39 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      opentok.deleteArchive('AN-INVALID-ARCHIVE-ID', function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Archive not found');
        done();
      });

    });

    it('should return an error if any other HTTP status is returned', function(done) {

      nock('https://api.opentok.com:443')
        .delete('/v2/partner/APIKEY/archive/ca138a6c-380f-4de9-b2b2-bc78b3a117e2')
        .reply(500, '{ \"message\" : \"Some other error.\" }', { server: 'nginx',
        date: 'Tue, 04 Feb 2014 00:52:38 GMT',
        'content-type': 'application/json',
        'transfer-encoding': 'chunked',
        connection: 'keep-alive' });

      var archiveId = 'ca138a6c-380f-4de9-b2b2-bc78b3a117e2';
      opentok.deleteArchive(archiveId, function(err) {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Unexpected response from OpenTok');
        done();
      });

    });

    it('should throw an error if no callback is provided', function() {

      expect(function() {
        opentok.deleteArchive('ca138a6c-380f-4de9-b2b2-bc78b3a117e2');
      }).toThrow(new OpenTok.ArgumentError('No callback given to deleteArchive'));

    });

  });

});
