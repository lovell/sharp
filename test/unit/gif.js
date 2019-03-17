'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('GIF input', () => {
  it('GIF Buffer to JPEG Buffer', () =>
    sharp(fs.readFileSync(fixtures.inputGif))
      .resize(8, 4)
      .jpeg()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(8, info.width);
        assert.strictEqual(4, info.height);
      })
  );

  it('2 channel GIF file to PNG Buffer', () =>
    sharp(fixtures.inputGifGreyPlusAlpha)
      .resize(8, 4)
      .png()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('png', info.format);
        assert.strictEqual(8, info.width);
        assert.strictEqual(4, info.height);
        assert.strictEqual(4, info.channels);
      })
  );

  it('Animated GIF first page to PNG', () =>
    sharp(fixtures.inputGifAnimated)
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('png', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(80, info.height);
        assert.strictEqual(4, info.channels);
      })
  );

  it('Animated GIF all pages to PNG "toilet roll"', () =>
    sharp(fixtures.inputGifAnimated, { pages: -1 })
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('png', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(2400, info.height);
        assert.strictEqual(4, info.channels);
      })
  );
});
