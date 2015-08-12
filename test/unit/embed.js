'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Embed', function() {

  it('JPEG within PNG, no alpha channel', function(done) {
    sharp(fixtures.inputJpg)
      .embed()
      .resize(320, 240)
      .png()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(3, metadata.channels);
          done();
        });
      });
  });

  if (sharp.format.webp.output.buffer) {
    it('JPEG within WebP, to include alpha channel', function(done) {
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .background({r: 0, g: 0, b: 0, a: 0})
        .embed()
        .webp()
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('webp', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          sharp(data).metadata(function(err, metadata) {
            if (err) throw err;
            assert.strictEqual(4, metadata.channels);
            done();
          });
        });
    });
  }

  it('PNG with alpha channel', function(done) {
    sharp(fixtures.inputPngWithTransparency)
      .resize(50, 50)
      .embed()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(50, info.width);
        assert.strictEqual(50, info.height);
        sharp(data).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(4, metadata.channels);
          done();
        });
      });
  });

  it('Enlarge and embed', function(done) {
    sharp(fixtures.inputPngWithOneColor)
      .embed()
      .resize(320, 240)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('embed-enlarge.png'), data, done);
      });
  });

});
