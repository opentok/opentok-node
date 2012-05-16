OpenTok = require('../lib/opentok')

describe "Staging Environment", ->
  stagingKey = '14971292'
  stagingSecret = 'ecbe2b25afec7887bd72fe4763b87add8ce02658'
  opentok = new OpenTok.OpenTokSDK(stagingKey, stagingSecret, {API_URL:'staging.tokbox.com'})

  it "should pass in apikey, secret, and api_url", ->
    expect(opentok.partnerId).toEqual(stagingKey)
    expect(opentok.partnerSecret).toEqual(stagingSecret)
    expect(opentok.api_url).toEqual('staging.tokbox.com')

  it "should auto set api_url defaults", ->
    opentok = new OpenTok.OpenTokSDK(stagingKey, stagingSecret)
    expect(opentok.partnerId).toEqual(stagingKey)
    expect(opentok.partnerSecret).toEqual(stagingSecret)
    expect(opentok.api_url).toEqual('staging.tokbox.com')

  it "should create session", ->
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

  it "should be able to set p2p to enabled", ->
    result = null
    queryFinished = false

    waitsFor ->
      return queryFinished
    runs ->
      expect(result).not.toBeNull()

    opentok._doRequest {'p2p.preference':'enabled'}, (chunks) ->
      start = chunks.match('<p2p>')
      end = chunks.match('</p2p>')
      p2p = chunks.substr(start.index + 5, (end.index - start.index - 5))
      result = p2p.match('enabled')
      queryFinished = true


  it "should create session with p2p enabled", ->
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

  describe "Generating Tokens", ->
    sessionId = '1_MX4xNDk3MTI5Mn5-MjAxMi0wNS0xNiAyMzoyMjozNC44NzQ0ODcrMDA6MDB-MC41MDI4NTI2OTA1MzR-'

    it "should be backwards compatible with previous version of NodeJS module", ->
      token = opentok.generateToken({session_id:undefined})
      expect(token).not.toBeNull()
      expect(token.length).toBeGreaterThan(5)

      token = opentok.generateToken({sessionId:undefined})
      expect(token).not.toBeNull()
      expect(token.length).toBeGreaterThan(5)

    it "should generate a valid input given sessionId", ->
      token = opentok.generateToken({sessionId:sessionId})
      expect(token).not.toBeNull()
      expect(token.length).toBeGreaterThan(5)

describe "Production Environment", ->
  stagingKey = '11421872'
  stagingSecret = '296cebc2fc4104cd348016667ffa2a3909ec636f'
  opentok = new OpenTok.OpenTokSDK(stagingKey, stagingSecret, {API_URL:'https://api.opentok.com/hl'})

  it "should pass in apikey, secret, and api_url", ->
    expect(opentok.partnerId).toEqual(stagingKey)
    expect(opentok.partnerSecret).toEqual(stagingSecret)
    expect(opentok.api_url).toEqual('api.opentok.com')

  it "should create session", ->
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

  it "should be able to set p2p to enabled", ->
    result = null
    queryFinished = false

    waitsFor ->
      return queryFinished
    runs ->
      expect(result).not.toBeNull()

    opentok._doRequest {'p2p.preference':'enabled'}, (chunks) ->
      start = chunks.match('<p2p>')
      end = chunks.match('</p2p>')
      p2p = chunks.substr(start.index + 5, (end.index - start.index - 5))
      result = p2p.match('enabled')
      queryFinished = true
