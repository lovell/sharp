'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('toBuffer', () => {
  it('reusing same sharp object does not reset previously passed parameters to toBuffer', async () => {
    const image = sharp(fixtures.inputJpg);
    const obj = await image.toBuffer({ resolveWithObject: true });
    assert.strictEqual(typeof obj, 'object');
    assert.strictEqual(typeof obj.info, 'object');
    assert.strictEqual(Buffer.isBuffer(obj.data), true);
    const data = await image.toBuffer();
    assert.strictEqual(Buffer.isBuffer(data), true);
  });

  it('correctly process animated webp with height > 16383', async () => {
    const data = await sharp(fixtures.inputWebPAnimatedBigHeight, { animated: true })
      .toBuffer();
    assert.strictEqual(Buffer.isBuffer(data), true);
  });
});
