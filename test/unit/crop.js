'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Crop gravities', function() {

  it('North', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 80)
      .crop(sharp.gravity.north)
      .toFile(fixtures.path('output.gravity-north.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        done();
      });
  });

  it('East', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop(sharp.gravity.east)
      .toFile(fixtures.path('output.gravity-east.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('South', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 80)
      .crop(sharp.gravity.south)
      .toFile(fixtures.path('output.gravity-south.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        done();
      });
  });

  it('West', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop(sharp.gravity.west)
      .toFile(fixtures.path('output.gravity-west.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('Center', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 80)
      .crop(sharp.gravity.center)
      .toFile(fixtures.path('output.gravity-center.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        done();
      });
  });

  it('Centre', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop(sharp.gravity.centre)
      .toFile(fixtures.path('output.gravity-centre.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

});
