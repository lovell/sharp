/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Gain maps', () => {
  it('Metadata contains gainMap', async (t) => {
    t.plan(4);

    const { format, gainMap } = await sharp(
      fixtures.inputJpgWithGainMap,
    ).metadata();
    t.assert.strictEqual(format, 'jpeg');
    t.assert.strictEqual(typeof gainMap, 'object');
    t.assert.ok(Buffer.isBuffer(gainMap.image));
    t.assert.strictEqual(gainMap.image.length, 31738);
  });

  it('Can be regenerated', async (t) => {
    t.plan(4);

    const data = await sharp(fixtures.inputJpgWithGainMap)
      .withGainMap()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'jpeg');
    t.assert.strictEqual(typeof metadata.gainMap, 'object');
    t.assert.ok(Buffer.isBuffer(metadata.gainMap.image));

    const {
      format,
      width,
      height,
      channels,
      depth,
      space,
      hasProfile,
      chromaSubsampling,
    } = await sharp(metadata.gainMap.image).metadata();

    t.assert.deepEqual(
      {
        format,
        width,
        height,
        channels,
        depth,
        space,
        hasProfile,
        chromaSubsampling,
      },
      {
        format: 'jpeg',
        width: 1920,
        height: 1080,
        channels: 1,
        depth: 'uchar',
        space: 'b-w',
        hasProfile: true,
        chromaSubsampling: '4:4:4',
      },
    );
  });
});
