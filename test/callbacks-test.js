var expect = require('chai').expect,
    nock = require('nock'),
    _ = require('lodash');

// Subject
var OpenTok = require('../lib/opentok.js'),
    Callbacks = require('../lib/callbacks.js'),
    pkg = require('../package.json');
