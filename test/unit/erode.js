const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Erode', function () {
  it('erode 1 png', function (done) {
    sharp(fixtures.inputPngDotAndLines)
      .erode(1)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('erode-1.png'), data, done);
      });
  });

  it('erode 1 png - default width', function (done) {
    sharp(fixtures.inputPngDotAndLines)
      .erode()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('erode-1.png'), data, done);
      });
  });

  it('invalid erosion width', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).erode(-1);
    });
  });
});
