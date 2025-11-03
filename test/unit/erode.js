const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Erode', () => {
  it('erode 1 png', (_t, done) => {
    sharp(fixtures.inputPngDotAndLines)
      .erode(1)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('erode-1.png'), data, done);
      });
  });

  it('erode 1 png - default width', (_t, done) => {
    sharp(fixtures.inputPngDotAndLines)
      .erode()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('erode-1.png'), data, done);
      });
  });

  it('invalid erosion width', () => {
    assert.throws(() => {
      sharp(fixtures.inputJpg).erode(-1);
    });
  });
});
