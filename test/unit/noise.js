/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Gaussian noise', () => {
  test('generate single-channel gaussian noise', async (t) => {
    t.plan(6);
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
    const info = await noise.toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(1024, info.width);
    t.assert.strictEqual(768, info.height);
    t.assert.strictEqual(1, info.channels);
    const metadata = await sharp(output).metadata();
    t.assert.strictEqual('b-w', metadata.space);
    t.assert.strictEqual('uchar', metadata.depth);
  });

  test('generate 3-channels gaussian noise', async (t) => {
    t.plan(6);
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
    const info = await noise.toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(1024, info.width);
    t.assert.strictEqual(768, info.height);
    t.assert.strictEqual(3, info.channels);
    const metadata = await sharp(output).metadata();
    t.assert.strictEqual('srgb', metadata.space);
    t.assert.strictEqual('uchar', metadata.depth);
  });

  test('overlay 3-channels gaussian noise over image', async (t) => {
    t.plan(6);
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
    const { data, info } = await noise.toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(3, info.channels);
    const outputInfo = await sharp(fixtures.inputJpg)
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
      .toFile(output);
    t.assert.strictEqual('jpeg', outputInfo.format);
    t.assert.strictEqual(320, outputInfo.width);
    t.assert.strictEqual(240, outputInfo.height);
    t.assert.strictEqual(3, outputInfo.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(output, fixtures.inputJpg));
  });

  test('overlay strong single-channel (sRGB) gaussian noise with 25% transparency over transparent png image', async (t) => {
    t.plan(7);
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
    const { data, info } = await noise
      .toColourspace('b-w')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(1, info.channels);
    const joined = await sharp(data, { raw: rawData })
      .joinChannel(data, { raw: rawData }) // r channel
      .joinChannel(data, { raw: rawData }) // b channel
      .joinChannel(Buffer.alloc(width * height, 64), { raw: rawData }) // alpha channel
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(4, joined.info.channels);
    const outputInfo = await sharp(fixtures.inputPngRGBWithAlpha)
      .resize(width, height)
      .composite([
        {
          input: joined.data,
          blend: 'exclusion',
          raw: {
            width: joined.info.width,
            height: joined.info.height,
            channels: joined.info.channels
          }
        }
      ])
      .toFile(output);
    t.assert.strictEqual('png', outputInfo.format);
    t.assert.strictEqual(width, outputInfo.width);
    t.assert.strictEqual(height, outputInfo.height);
    t.assert.strictEqual(4, outputInfo.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(output, fixtures.inputPngRGBWithAlpha, { threshold: 10 }));
  });

  test('animated noise', async (t) => {
    t.plan(4);
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
    t.assert.strictEqual(width, 16);
    t.assert.strictEqual(height, 16);
    t.assert.strictEqual(pages, 4);
    t.assert.strictEqual(delay.length, 4);
  });

  test('no create object properties specified', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp({
        create: {}
      });
    });
  });

  test('invalid noise object', (t) => {
    t.plan(1);
    t.assert.throws(() => {
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

  test('unknown type of noise', (t) => {
    t.plan(1);
    t.assert.throws(() => {
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

  test('gaussian noise, invalid amount of channels', (t) => {
    t.plan(1);
    t.assert.throws(() => {
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

  test('gaussian noise, invalid mean', (t) => {
    t.plan(1);
    t.assert.throws(() => {
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

  test('gaussian noise, invalid sigma', (t) => {
    t.plan(1);
    t.assert.throws(() => {
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

  test('Invalid pageHeight', (t) => {
    t.plan(4);
    const create = {
      width: 8,
      height: 8,
      channels: 4,
      noise: { type: 'gaussian' }
    };
    t.assert.throws(
      () => sharp({ create: { ...create, pageHeight: 'zoinks' } }),
      /Expected positive integer for create\.pageHeight but received zoinks of type string/
    );
    t.assert.throws(
      () => sharp({ create: { ...create, pageHeight: -1 } }),
      /Expected positive integer for create\.pageHeight but received -1 of type number/
    );
    t.assert.throws(
      () => sharp({ create: { ...create, pageHeight: 9 } }),
      /Expected positive integer for create\.pageHeight but received 9 of type number/
    );
    t.assert.throws(
      () => sharp({ create: { ...create, pageHeight: 3 } }),
      /Expected create\.height 8 to be a multiple of create\.pageHeight 3/
    );
  });
});
