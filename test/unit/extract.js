'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Partial image extraction', function() {

  it('JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .extract(2, 2, 20, 20)
      .toFile(fixtures.path('output.extract.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(20, info.width);
        assert.strictEqual(20, info.height);
        done();
      });
  });

  it('PNG', function(done) {
    sharp(fixtures.inputPng)
      .extract(300, 200, 400, 200)
      .toFile(fixtures.path('output.extract.png'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(200, info.height);
        done();
      });
  });

  it('WebP', function(done) {
    sharp(fixtures.inputWebP)
      .extract(50, 100, 125, 200)
      .toFile(fixtures.path('output.extract.webp'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(125, info.width);
        assert.strictEqual(200, info.height);
        done();
      });
  });

  it('TIFF', function(done) {
    sharp(fixtures.inputTiff)
      .extract(63, 34, 341, 529)
      .toFile(fixtures.path('output.extract.tiff'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(341, info.width);
        assert.strictEqual(529, info.height);
        done();
      });
  });

  it('Before resize', function(done) {
    sharp(fixtures.inputJpg)
      .extract(10, 10, 10, 500, 500)
      .resize(100, 100)
      .toFile(fixtures.path('output.extract.resize.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        done();
      });
  });

  it('After resize and crop', function(done) {
    sharp(fixtures.inputJpg)
      .resize(500, 500)
      .crop(sharp.gravity.north)
      .extract(10, 10, 100, 100)
      .toFile(fixtures.path('output.resize.crop.extract.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        done();
      });
  });

  it('Before and after resize and crop', function(done) {
    sharp(fixtures.inputJpg)
      .extract(0, 0, 700, 700)
      .resize(500, 500)
      .crop(sharp.gravity.north)
      .extract(10, 10, 100, 100)
      .toFile(fixtures.path('output.extract.resize.crop.extract.jpg'), function(err, info) {
        if (err) throw err;
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        done();
      });
  });

});
