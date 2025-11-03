/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Gaussian noise', () => {
  it('generate single-channel gaussian noise', (_t, done) => {
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
    }).toColourspace('b-w');
    noise.toFile(output, (err, info) => {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(1024, info.width);
      assert.strictEqual(768, info.height);
      assert.strictEqual(1, info.channels);
      sharp(output).metadata((err, metadata) => {
        if (err) throw err;
        assert.strictEqual('b-w', metadata.space);
        assert.strictEqual('uchar', metadata.depth);
        done();
      });
    });
  });

  it('generate 3-channels gaussian noise', (_t, done) => {
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
    noise.toFile(output, (err, info) => {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(1024, info.width);
      assert.strictEqual(768, info.height);
      assert.strictEqual(3, info.channels);
      sharp(output).metadata((err, metadata) => {
        if (err) throw err;
        assert.strictEqual('srgb', metadata.space);
        assert.strictEqual('uchar', metadata.depth);
        done();
      });
    });
  });

  it('overlay 3-channels gaussian noise over image', (_t, done) => {
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
    noise.toBuffer((err, data, info) => {
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
        .toFile(output, (err, info) => {
          if (err) throw err;
          assert.strictEqual('jpeg', info.format);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          assert.strictEqual(3, info.channels);
          // perceptual hashing detects that images are the same (difference is <=1%)
          fixtures.assertSimilar(output, fixtures.inputJpg, (err) => {
            if (err) throw err;
            done();
          });
        });
    });
  });

  it('overlay strong single-channel (sRGB) gaussian noise with 25% transparency over transparent png image', (_t, done) => {
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
      .toColourspace('b-w')
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(1, info.channels);
        sharp(data, { raw: rawData })
          .joinChannel(data, { raw: rawData }) // r channel
          .joinChannel(data, { raw: rawData }) // b channel
          .joinChannel(Buffer.alloc(width * height, 64), { raw: rawData }) // alpha channel
          .toBuffer((err, data, info) => {
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
              .toFile(output, (err, info) => {
                if (err) throw err;
                assert.strictEqual('png', info.format);
                assert.strictEqual(width, info.width);
                assert.strictEqual(height, info.height);
                assert.strictEqual(4, info.channels);
                fixtures.assertSimilar(output, fixtures.inputPngRGBWithAlpha, { threshold: 10 }, (err) => {
                  if (err) throw err;
                  done();
                });
              });
          });
      });
  });

  it('animated noise', async () => {
    const gif = await sharp({
      create: {
        width: 16,
        height: 64,
        pageHeight: 16,
        channels: 3,
        noise: { type: 'gaussian' }
      }
    })
      .gif()
      .toBuffer();

    const { width, height, pages, delay } = await sharp(gif).metadata();
    assert.strictEqual(width, 16);
    assert.strictEqual(height, 16);
    assert.strictEqual(pages, 4);
    assert.strictEqual(delay.length, 4);
  });

  it('no create object properties specified', () => {
    assert.throws(() => {
      sharp({
        create: {}
      });
    });
  });

  it('invalid noise object', () => {
    assert.throws(() => {
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

  it('unknown type of noise', () => {
    assert.throws(() => {
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

  it('gaussian noise, invalid amount of channels', () => {
    assert.throws(() => {
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

  it('gaussian noise, invalid mean', () => {
    assert.throws(() => {
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

  it('gaussian noise, invalid sigma', () => {
    assert.throws(() => {
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

  it('Invalid pageHeight', () => {
    const create = {
      width: 8,
      height: 8,
      channels: 4,
      noise: { type: 'gaussian' }
    };
    assert.throws(
      () => sharp({ create: { ...create, pageHeight: 'zoinks' } }),
      /Expected positive integer for create\.pageHeight but received zoinks of type string/
    );
    assert.throws(
      () => sharp({ create: { ...create, pageHeight: -1 } }),
      /Expected positive integer for create\.pageHeight but received -1 of type number/
    );
    assert.throws(
      () => sharp({ create: { ...create, pageHeight: 9 } }),
      /Expected positive integer for create\.pageHeight but received 9 of type number/
    );
    assert.throws(
      () => sharp({ create: { ...create, pageHeight: 3 } }),
      /Expected create\.height 8 to be a multiple of create\.pageHeight 3/
    );
  });
});
