'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Gaussian noise', function () {
  it('generate single-channel gaussian noise (sRGB)', function (done) {
    const output = fixtures.path('output.noise-1-channel.png');
    const noise = sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 1,
        noise: {
          type: 'gaussian',
          mean: 128,
          sigma: 30
        }
      }
    });
    noise.toFile(output, function (err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(1024, info.width);
      assert.strictEqual(768, info.height);
      assert.strictEqual(3, info.channels);
      done();
    });
  });

  it('generate 3-channel gaussian noise (sRGB)', function (done) {
    const output = fixtures.path('output.noise-3-channels.png');
    const noise = sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 3,
        noise: {
          type: 'gaussian',
          mean: 128,
          sigma: 30
        }
      }
    });
    noise.toFile(output, function (err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(1024, info.width);
      assert.strictEqual(768, info.height);
      assert.strictEqual(3, info.channels);
      done();
    });
  });

  it('overlay 3-channel gaussian noise over image', function (done) {
    const output = fixtures.path('output.noise-image.jpg');
    const noise = sharp({
      create: {
        width: 320,
        height: 240,
        channels: 1,
        noise: {
          type: 'gaussian',
          mean: 0,
          sigma: 5
        }
      }
    });
    noise.toBuffer(function (err, data, info) {
      if (err) throw err;
      assert.strictEqual(3, info.channels);
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
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          assert.strictEqual(3, info.channels);
          // perceptual hashing detects that images are the same (difference is <=1%)
          fixtures.assertSimilar(output, fixtures.inputJpg, function (err) {
            if (err) throw err;
            done();
          });
        });
    });
  });

  it('overlay strong single-channel (sRGB) gaussian noise with 25% transparency over transparent png image', function (done) {
    const output = fixtures.path('output.noise-image-transparent.png');
    const noise = sharp({
      create: {
        width: 320,
        height: 240,
        channels: 1,
        noise: {
          type: 'gaussian',
          mean: 200,
          sigma: 30
        }
      }
    });
    noise
      .joinChannel(Buffer.alloc(320 * 240, 64), {
        raw: {
          width: 320,
          height: 240,
          channels: 1
        }
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(4, info.channels);
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

  it('invalid noise object', function () {
    assert.throws(function () {
      sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          noise: 'gaussian'
        }
      });
    });
  });

  it('unknown type of noise', function () {
    assert.throws(function () {
      sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          noise: {
            type: 'unknown'
          }
        }
      });
    });
  });

  it('gaussian noise, invalid amount of channels', function () {
    assert.throws(function () {
      sharp({
        create: {
          width: 100,
          height: 100,
          channels: 5,
          noise: {
            type: 'gaussian',
            mean: 5,
            sigma: 10
          }
        }
      });
    });
  });

  it('gaussian noise, invalid mean', function () {
    assert.throws(function () {
      sharp({
        create: {
          width: 100,
          height: 100,
          channels: 1,
          noise: {
            type: 'gaussian',
            mean: -1.5,
            sigma: 10
          }
        }
      });
    });
  });

  it('gaussian noise, invalid sigma', function () {
    assert.throws(function () {
      sharp({
        create: {
          width: 100,
          height: 100,
          channels: 1,
          noise: {
            type: 'gaussian',
            mean: 0,
            sigma: -1.5
          }
        }
      });
    });
  });
});
