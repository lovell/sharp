'use strict';

const assert = require('assert');
const fixtures = require('../fixtures');
const sharp = require('../../');

describe('Bandbool per-channel boolean operations', function () {
  [
    sharp.bool.and,
    sharp.bool.or,
    sharp.bool.eor
  ]
    .forEach(function (op) {
      it(op + ' operation', function (done) {
        sharp(fixtures.inputPngBooleanNoAlpha)
          .bandbool(op)
          .toColourspace('b-w')
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(200, info.width);
            assert.strictEqual(200, info.height);
            assert.strictEqual(1, info.channels);
            fixtures.assertSimilar(fixtures.expected('bandbool_' + op + '_result.png'), data, done);
          });
      });
    });

  it('sRGB image retains 3 channels', function (done) {
    sharp(fixtures.inputJpg)
      .bandbool('and')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(3, info.channels);
        done();
      });
  });

  it('Invalid operation', function () {
    assert.throws(function () {
      sharp().bandbool('fail');
    });
  });

  it('Missing operation', function () {
    assert.throws(function () {
      sharp().bandbool();
    });
  });
});
