OpenTok = require('../lib/opentok')

describe "Production Environment", ->
  apiKey = '14971292'
  apiSecret = 'ecbe2b25afec7887bd72fe4763b87add8ce02658'
  opentok = new OpenTok.OpenTokSDK(apiKey, apiSecret)

  it "should auto set api_url defaults", ->
    opentok = new OpenTok.OpenTokSDK(apiKey, apiSecret)
    expect(opentok.partnerId).toEqual(apiKey)
    expect(opentok.partnerSecret).toEqual(apiSecret)
    expect(opentok.api_url).toEqual('api.opentok.com')

# ***
# *** Different ways of creating sessions
# ***
  it "should create session", ->
    sessionId = null
    queryFinished = false

    waitsFor ->
      return queryFinished
    runs ->
      expect(sessionId).not.toBeNull()
      expect(sessionId.length).toBeGreaterThan(5)

    opentok.createSession (result) ->
      sessionId = result
      queryFinished = true

  it "should create session with IP specified only", ->
    sessionId = null
    queryFinished = false

    waitsFor ->
      return queryFinished
    runs ->
      expect(sessionId).not.toBeNull()
      expect(sessionId.length).toBeGreaterThan(5)

    opentok.createSession 'localhost', (result) ->
      sessionId = result
      queryFinished = true

  it "should create session with p2p enabled only", ->
    sessionId = null
    queryFinished = false

    waitsFor ->
      return queryFinished
    runs ->
      expect(sessionId).not.toBeNull()
      expect(sessionId.length).toBeGreaterThan(5)

    opentok.createSession {'p2p.preference':'enabled'}, (result) ->
      sessionId = result
      queryFinished = true

  it "should create session with ip and p2p enabled", ->
    sessionId = null
    queryFinished = false

    waitsFor ->
      return queryFinished
    runs ->
      expect(sessionId).not.toBeNull()
      expect(sessionId.length).toBeGreaterThan(5)

    opentok.createSession 'localhost', {'p2p.preference':'enabled'}, (result) ->
      sessionId = result
      queryFinished = true


# ***
# *** Different ways of generating Tokens
# ***
  describe "Generating Tokens", ->
    sessionId = '1_MX4xNDk3MTI5Mn5-MjAxMi0wNS0xNiAyMzoyMjozNC44NzQ0ODcrMDA6MDB-MC41MDI4NTI2OTA1MzR-'

    it "should generate a valid input given sessionId", ->
      token = opentok.generateToken({sessionId:sessionId})
      expect(token).not.toBeNull()
      expect(token.length).toBeGreaterThan(5)

    it "should generate token containing input Data", ->
      token = opentok.generateToken({sessionId:sessionId, role:OpenTok.RoleConstants.PUBLISHER, connection_data:"hello"})
      token = token.substr(4,token.length)
      tokenBuffer =  new Buffer(token,"base64").toString('ascii')
      expect(tokenBuffer.split(OpenTok.RoleConstants.PUBLISHER).length).toBeGreaterThan(1)
      expect(tokenBuffer.split('hello').length).toBeGreaterThan(1)
      expect(tokenBuffer.split(sessionId).length).toBeGreaterThan(1)

  describe 'Archiving', ->
    sessionId = '1_MX4xNDk3MTI5Mn5-MjAxMi0wNS0yMCAwMTowMzozMS41MDEzMDArMDA6MDB-MC40NjI0MjI4MjU1MDF-'
    token = opentok.generateToken({session_id:sessionId, role:OpenTok.RoleConstants.MODERATOR})
    archiveId = '5f74aee5-ab3f-421b-b124-ed2a698ee939'

    it "should get archive Manifest", ->
      otArchive = null
      queryFinished = false

      waitsFor ->
        return queryFinished

      runs ->
        expect(otArchive.resources).not.toBeNull()

      opentok.getArchiveManifest archiveId, token, (tbarchive) ->
        otArchive = tbarchive
        queryFinished = true

    it "should get video id", ->
      vid = null
      queryFinished = false
      waitsFor ->
        return queryFinished
      runs ->
        expect(vid.length>5)
      opentok.getArchiveManifest archiveId,token,(tbarchive)->
        otArchive = tbarchive
        vid = otArchive.resources[0].getId()
        queryFinished = true
    it "should get downloadURL", ->
      url = null
      queryFinished = false
      waitsFor ->
        return queryFinished
      runs ->
        expect(url.match('^http')).not.toBeNull()
      opentok.getArchiveManifest archiveId,token,(tbarchive)->
        otArchive = tbarchive
        vid = otArchive.resources[0].getId()
        otArchive.downloadArchiveURL vid, (resp)->
          url = resp
          queryFinished = true



