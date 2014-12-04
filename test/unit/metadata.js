'use strict';

var fs = require('fs');
var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Image metadata', function() {

  it('JPEG', function(done) {
    sharp(fixtures.inputJpg).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      done();
    });
  });

  it('JPEG with EXIF', function(done) {
    sharp(fixtures.inputJpgWithExif).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(450, metadata.width);
      assert.strictEqual(600, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(true, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual(8, metadata.orientation);
      done();
    });
  });

  it('TIFF', function(done) {
    sharp(fixtures.inputTiff).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('tiff', metadata.format);
      assert.strictEqual(2464, metadata.width);
      assert.strictEqual(3248, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  });

  it('PNG', function(done) {
    sharp(fixtures.inputPng).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual(2809, metadata.width);
      assert.strictEqual(2074, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  });

  it('Transparent PNG', function(done) {
    sharp(fixtures.inputPngWithTransparency).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual(2048, metadata.width);
      assert.strictEqual(1536, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(4, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(true, metadata.hasAlpha);
      done();
    });
  });

  it('WebP', function(done) {
    sharp(fixtures.inputWebP).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('webp', metadata.format);
      assert.strictEqual(1024, metadata.width);
      assert.strictEqual(772, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  });

  it('GIF via libmagick', function(done) {
    sharp(fixtures.inputGif).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('magick', metadata.format);
      assert.strictEqual(800, metadata.width);
      assert.strictEqual(533, metadata.height);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  });

  it('File in, Promise out', function(done) {
    sharp(fixtures.inputJpg).metadata().then(function(metadata) {
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  });

  it('Non-existent file in, Promise out', function(done) {
    sharp('fail').metadata().then(function(metadata) {
      throw new Error('Non-existent file');
    }, function (err) {
      assert.ok(!!err);
      done();
    });
  });

  it('Stream in, Promise out', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp();
    pipeline.metadata().then(function(metadata) {
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    }).catch(function(err) {
      throw err;
    });
    readable.pipe(pipeline);
  });

  it('Stream', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
    readable.pipe(pipeline);
  });

  it('Resize to half width using metadata', function(done) {
    var image = sharp(fixtures.inputJpg);
    image.metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      image.resize(metadata.width / 2).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(1362, info.width);
        assert.strictEqual(1112, info.height);
        done();
      });
    });
  });

  it('Keep EXIF metadata after a resize', function(done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .withMetadata()
      .toBuffer(function(err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(true, metadata.hasProfile);
          assert.strictEqual(8, metadata.orientation);
          done();
        });
      });
  });

  it('Remove EXIF metadata after a resize', function(done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .withMetadata(false)
      .toBuffer(function(err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(false, metadata.hasProfile);
          assert.strictEqual('undefined', typeof metadata.orientation);
          done();
        });
      });
  });

});
