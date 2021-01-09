'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

// Noise is randomized. Generated image should not be compared with an expected image.
describe('Noise', function () {
  it('generate noise, specific mean 200 and sigma 50', function (done) {
    const output = fixtures.path('output.noise.png');
    const noise = sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    });
    noise
      .toColourspace('multiband')
      .noise(200, 50)
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(1024, info.width);
        assert.strictEqual(768, info.height);
        assert.strictEqual(1, info.channels);
        done();
      });
  });

  it('overlay noise over image, specific mean 0 and sigma 5', function (done) {
    const output = fixtures.path('output.noise-image.png');
    const noise = sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    });
    noise
      .toColourspace('multiband')
      .noise(0, 5)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(1, info.channels);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .composite([
            {
              input: data,
              blend: 'exclusion',
              raw: {
                width: info.width,
                height: info.height,
                channels: info.channels
              }
            }
          ])
          .toFile(output, function (err, info) {
            if (err) throw err;
            assert.strictEqual('png', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            done();
          });
      });
  });

  it('overlay noise over image with alpha channel, specific mean 0 and sigma 5', function (done) {
    const output = fixtures.path('output.noise-image-transparent.png');
    const noise = sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    });
    noise
      .toColourspace('multiband')
      .noise(0, 5)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(1, info.channels);
        sharp(fixtures.inputPngRGBWithAlpha)
          .resize(320, 240)
          .composite([
            {
              input: data,
              blend: 'exclusion',
              raw: {
                width: info.width,
                height: info.height,
                channels: info.channels
              }
            }
          ])
          .toFile(output, function (err, info) {
            if (err) throw err;
            assert.strictEqual('png', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            assert.strictEqual(4, info.channels);
            done();
          });
      });
  });

  it('invalid mean', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).noise(-1.5, 0);
    });
  });

  it('invalid sigma', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).noise(0, -1.5);
    });
  });
});