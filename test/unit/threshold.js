/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Threshold', () => {
  it('threshold 1 jpeg', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(1)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-1.jpg'), data, done);
      });
  });

  it('threshold 40 jpeg', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(40)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-40.jpg'), data, done);
      });
  });

  it('threshold 128', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });
  });

  it('threshold true (=128)', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(true)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });
  });

  it('threshold false (=0)', (_t, done) => {
    sharp(fixtures.inputJpg)
      .threshold(false)
      .toBuffer((err, data) => {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.inputJpg, data, done);
      });
  });

  it('threshold grayscale: true (=128)', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128, { grayscale: true })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });
  });

  it('threshold default jpeg', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data, done);
      });
  });

  it('threshold default png transparency', (_t, done) => {
    sharp(fixtures.inputPngWithTransparency)
      .resize(320, 240)
      .threshold()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128-transparency.png'), data, done);
      });
  });

  it('threshold default png alpha', (_t, done) => {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(320, 240)
      .threshold()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-128-alpha.png'), data, done);
      });
  });

  it('threshold default webp transparency', (_t, done) => {
    sharp(fixtures.inputWebPWithTransparency)
      .threshold()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        fixtures.assertSimilar(fixtures.expected('threshold-128-transparency.webp'), data, done);
      });
  });

  it('color threshold', (_t, done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128, { grayscale: false })
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('threshold-color-128.jpg'), data, done);
      });
  });

  it('invalid threshold -1', () => {
    assert.throws(() => {
      sharp().threshold(-1);
    });
  });

  it('invalid threshold 256', () => {
    assert.throws(() => {
      sharp().threshold(256);
    });
  });
});
