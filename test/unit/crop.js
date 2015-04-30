'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Crop gravities', function() {

  it('North', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 80)
      .crop(sharp.gravity.north)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-north.jpg'), data, done);
      });
  });

  it('East', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop(sharp.gravity.east)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-east.jpg'), data, done);
      });
  });

  it('South', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 80)
      .crop(sharp.gravity.south)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-south.jpg'), data, done);
      });
  });

  it('West', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop(sharp.gravity.west)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-west.jpg'), data, done);
      });
  });

  it('Center', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 80)
      .crop(sharp.gravity.center)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-center.jpg'), data, done);
      });
  });

  it('Centre', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop(sharp.gravity.centre)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-centre.jpg'), data, done);
      });
  });

  it('Invalid', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).crop(5);
    });
  });

});
