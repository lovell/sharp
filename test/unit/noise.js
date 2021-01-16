'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Gaussian noise', function () {
  it('generate single-channel gaussian noise', function (done) {
    const output = fixtures.path('output.noise-1-channel.png');
    const noise = sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 1, // b-w
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
      assert.strictEqual(1, info.channels);
      sharp(output).metadata(function (err, metadata) {
        if (err) throw err;
        assert.strictEqual('b-w', metadata.space);
        assert.strictEqual('uchar', metadata.depth);
        done();
      });
    });
  });

  it('generate 3-channels gaussian noise', function (done) {
    const output = fixtures.path('output.noise-3-channels.png');
    const noise = sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 3, // sRGB
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
      sharp(output).metadata(function (err, metadata) {
        if (err) throw err;
        assert.strictEqual('srgb', metadata.space);
        assert.strictEqual('uchar', metadata.depth);
        done();
      });
    });
  });

  it('overlay 3-channels gaussian noise over image', function (done) {
    const output = fixtures.path('output.noise-image.jpg');
    const noise = sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
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
    const width = 320;
    const height = 240;
    const rawData = {
      width,
      height,
      channels: 1
    };
    const noise = sharp({
      create: {
        width,
        height,
        channels: 1,
        noise: {
          type: 'gaussian',
          mean: 200,
          sigma: 30
        }
      }
    });
    noise
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(1, info.channels);
        sharp(data, { raw: rawData })
          .joinChannel(data, { raw: rawData }) // r channel
          .joinChannel(data, { raw: rawData }) // b channel
          .joinChannel(Buffer.alloc(width * height, 64), { raw: rawData }) // alpha channel
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(4, info.channels);
            sharp(fixtures.inputPngRGBWithAlpha)
              .resize(width, height)
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
                assert.strictEqual(width, info.width);
                assert.strictEqual(height, info.height);
                assert.strictEqual(4, info.channels);
                fixtures.assertSimilar(output, fixtures.inputPngRGBWithAlpha, { threshold: 10 }, function (err) {
                  if (err) throw err;
                  done();
                });
              });
          });
      });
  });

  it('no create object properties specified', function () {
    assert.throws(function () {
      sharp({
        create: {}
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
