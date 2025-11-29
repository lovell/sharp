/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('UHDR output', () => {

  it('UHDR Buffer to PNG Buffer', async () => {
    const { data, info } = await sharp(fs.readFileSync(fixtures.inputUhdr))
      .resize(8, 15)
      .png()
      .toBuffer({ resolveWithObject: true });
    assert.strictEqual(true, data.length > 0);
    assert.strictEqual(data.length, info.size);
    assert.strictEqual('png', info.format);
    assert.strictEqual(8, info.width);
    assert.strictEqual(15, info.height);
    assert.strictEqual(3, info.channels);
  });

  it('UHDR quality', (_t, done) => {
    sharp(fixtures.inputUhdr)
      .resize(320, 240)
      .uhdr({ quality: 70 })
      .toBuffer((err, buffer70) => {
        if (err) throw err;
        sharp(fixtures.inputUhdr)
          .resize(320, 240)
          .toBuffer((err, buffer80) => {
            if (err) throw err;
            assert(buffer70.length < buffer80.length);
            done();
          });
      });
  });

  it('UHDR File Remove Gainmap', async () => {
    const { data, info } = await sharp(fixtures.inputUhdr)
      .noGainmap()
      .resize(8, 15)
      .toBuffer({ resolveWithObject: true });
    assert.strictEqual(true, data.length > 0);
    assert.strictEqual(data.length, info.size);
    assert.strictEqual('jpeg', info.format);
    assert.strictEqual(8, info.width);
    assert.strictEqual(15, info.height);
    assert.strictEqual(3, info.channels);
  });

  it('quality is invalid', () => {
    assert.throws(() => {
      sharp().uhdr({ quality: -1 });
    });
  });
});
