'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Dilate', function () {
  it('dilate 1 png', function (done) {
    sharp(fixtures.inputPngDotAndLines)
      .dilate(3)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('dilate-1.png'), data, done);
      });
  });
});
