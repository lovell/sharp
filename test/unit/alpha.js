'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Alpha transparency', function() {

  it('Flatten to black', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .resize(400, 300)
      .toFile(fixtures.path('output.flatten-black.jpg'), done);
  });

  it('Flatten to RGB orange', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .background({r: 255, g: 102, b: 0})
      .resize(400, 300)
      .toFile(fixtures.path('output.flatten-rgb-orange.jpg'), done);
  });

  it('Flatten to CSS/hex orange', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .background('#ff6600')
      .resize(400, 300)
      .toFile(fixtures.path('output.flatten-hex-orange.jpg'), done);
  });

  it('Do not flatten', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten(false)
      .toBuffer(function(err, data) {
        if (err) throw err;
        sharp(data).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual('png', metadata.format);
          assert.strictEqual(4, metadata.channels);
          done();
        });
      });
  });

  it('Ignored for JPEG', function(done) {
    sharp(fixtures.inputJpg)
      .background('#ff0000')
      .flatten()
      .toBuffer(function(err, data) {
        if (err) throw err;
        sharp(data).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual('jpeg', metadata.format);
          assert.strictEqual(3, metadata.channels);
          done();
        });
      });
  });

});
