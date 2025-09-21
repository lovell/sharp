const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Dilate', function () {
  it('dilate 1 png', function (_t, done) {
    sharp(fixtures.inputPngDotAndLines)
      .dilate(1)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('dilate-1.png'), data, done);
      });
  });

  it('dilate 1 png - default width', function (_t, done) {
    sharp(fixtures.inputPngDotAndLines)
      .dilate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('dilate-1.png'), data, done);
      });
  });

  it('invalid dilation width', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).dilate(-1);
    });
  });
});
