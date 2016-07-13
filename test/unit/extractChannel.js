'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Image channel extraction', function() {

  it('Red channel', function(done) {
    sharp(fixtures.inputJpg)
      .extractChannel('red')
      .resize(320,240)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-red.jpg'), data, done);
      });
  });

  it('Green channel', function(done) {
    sharp(fixtures.inputJpg)
      .extractChannel('green')
      .resize(320,240)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-green.jpg'), data, done);
      });
  });

  it('Blue channel', function(done) {
    sharp(fixtures.inputJpg)
      .extractChannel('blue')
      .resize(320,240)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-blue.jpg'), data, done);
      });
  });

  it('Blue channel by number', function(done) {
    sharp(fixtures.inputJpg)
      .extractChannel(2)
      .resize(320,240)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-blue.jpg'), data, done);
      });
  });

  it('Invalid channel number', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg)
        .extractChannel(-1);
    });
  });

  it('No arguments', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg)
        .extractChannel();
    });
  });

  it('Non-existant channel', function(done) {
    sharp(fixtures.inputPng)
      .extractChannel(1)
      .toBuffer(function(err) {
        assert(err instanceof Error);
        done();
      });
  });

});
