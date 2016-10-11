'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Crop', function() {

  [
    {
      name: 'North',
      width: 320,
      height: 80,
      gravity: sharp.gravity.north,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'East',
      width: 80,
      height: 320,
      gravity: sharp.gravity.east,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'South',
      width: 320,
      height: 80,
      gravity: sharp.gravity.south,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'West',
      width: 80,
      height: 320,
      gravity: sharp.gravity.west,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Center',
      width: 320,
      height: 80,
      gravity: sharp.gravity.center,
      fixture: 'gravity-center.jpg'
    },
    {
      name: 'Centre',
      width: 80,
      height: 320,
      gravity: sharp.gravity.centre,
      fixture: 'gravity-centre.jpg'
    },
    {
      name: 'Default (centre)',
      width: 80,
      height: 320,
      gravity: undefined,
      fixture: 'gravity-centre.jpg'
    },
    {
      name: 'Northeast',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Northeast',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Southeast',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Southeast',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Southwest',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Southwest',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Northwest',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Northwest',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-west.jpg'
    }
  ].forEach(function(settings) {
    it(settings.name + ' gravity', function(done) {
      sharp(fixtures.inputJpg)
        .resize(settings.width, settings.height)
        .crop(settings.gravity)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(settings.width, info.width);
          assert.strictEqual(settings.height, info.height);
          fixtures.assertSimilar(fixtures.expected(settings.fixture), data, done);
        });
    });
  });

  it('Allows specifying the gravity as a string', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop('east')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-east.jpg'), data, done);
      });
  });

  it('Invalid values fail', function() {
    assert.throws(function() {
      sharp().crop(9);
    });
    assert.throws(function() {
      sharp().crop(1.1);
    });
    assert.throws(function() {
      sharp().crop(-1);
    });
    assert.throws(function() {
      sharp().crop('zoinks');
    });
  });

  it('Uses default value when none specified', function() {
    assert.doesNotThrow(function() {
      sharp().crop();
    });
  });

  describe('Entropy-based strategy', function() {

    it('JPEG', function(done) {
      sharp(fixtures.inputJpgWithCmykProfile)
        .resize(80, 320)
        .crop(sharp.strategy.entropy)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          assert.strictEqual(80, info.width);
          assert.strictEqual(320, info.height);
          assert.strictEqual(250, info.cropCalcLeft);
          assert.strictEqual(0, info.cropCalcTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.jpg'), data, done);
        });
    });

    it('PNG', function(done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80)
        .crop(sharp.strategy.entropy)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(4, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          assert.strictEqual(0, info.cropCalcLeft);
          assert.strictEqual(80, info.cropCalcTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data, done);
        });
    });

  });

  describe('Attention strategy', function() {

    it('JPEG', function(done) {
      sharp(fixtures.inputJpgWithCmykProfile)
        .resize(80, 320)
        .crop(sharp.strategy.attention)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(3, info.channels);
          assert.strictEqual(80, info.width);
          assert.strictEqual(320, info.height);
          assert.strictEqual(250, info.cropCalcLeft);
          assert.strictEqual(0, info.cropCalcTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.jpg'), data, done);
        });
    });

    it('PNG', function(done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 80)
        .crop(sharp.strategy.attention)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(4, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(80, info.height);
          assert.strictEqual(0, info.cropCalcLeft);
          assert.strictEqual(80, info.cropCalcTop);
          fixtures.assertSimilar(fixtures.expected('crop-strategy.png'), data, done);
        });
    });

  });
});
