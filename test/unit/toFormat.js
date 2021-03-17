'use strict';

const assert = require('assert');
const sharp = require('../../');
const fixtures = require('../fixtures');

describe('toFormat', () => {
  it('accepts upper case characters as format parameter (string)', async () => {
    const data = await sharp(fixtures.inputJpg)
      .resize(8, 8)
      .toFormat('PNG')
      .toBuffer();

    const { format } = await sharp(data).metadata();
    assert.strictEqual(format, 'png');
  });

  it('accepts upper case characters as format parameter (object)', async () => {
    const data = await sharp(fixtures.inputJpg)
      .resize(8, 8)
      .toFormat({ id: 'PNG' })
      .toBuffer();

    const { format } = await sharp(data).metadata();
    assert.strictEqual(format, 'png');
  });
});
