'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Erode', function () {
  it('erode 1 png', function (done) {
    sharp(fixtures.inputPngDotAndLines)
      .erode(3)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(100, info.height);
        fixtures.assertSimilar(fixtures.expected('erode-1.png'), data, done);
      });
  });
});
