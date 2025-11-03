/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fixtures = require('../fixtures');
const sharp = require('../../');

describe('Bandbool per-channel boolean operations', () => {
  [
    sharp.bool.and,
    sharp.bool.or,
    sharp.bool.eor
  ]
    .forEach((op) => {
      it(`${op} operation`, (_t, done) => {
        sharp(fixtures.inputPngBooleanNoAlpha)
          .bandbool(op)
          .toColourspace('b-w')
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual(200, info.width);
            assert.strictEqual(200, info.height);
            assert.strictEqual(1, info.channels);
            fixtures.assertSimilar(fixtures.expected(`bandbool_${op}_result.png`), data, done);
          });
      });
    });

  it('sRGB image retains 3 channels', (_t, done) => {
    sharp(fixtures.inputJpg)
      .bandbool('and')
      .toBuffer((err, _data, info) => {
        if (err) throw err;
        assert.strictEqual(3, info.channels);
        done();
      });
  });

  it('Invalid operation', () => {
    assert.throws(() => {
      sharp().bandbool('fail');
    });
  });

  it('Missing operation', () => {
    assert.throws(() => {
      sharp().bandbool();
    });
  });
});
