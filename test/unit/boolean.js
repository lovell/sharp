/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const fixtures = require('../fixtures');
const sharp = require('../../');

describe('Boolean operation between two images', () => {
  const inputJpgBooleanTestBuffer = fs.readFileSync(fixtures.inputJpgBooleanTest);

  [
    sharp.bool.and,
    sharp.bool.or,
    sharp.bool.eor
  ]
    .forEach((op) => {
      it(`${op} operation, file`, (_t, done) => {
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(fixtures.inputJpgBooleanTest, op)
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            fixtures.assertSimilar(fixtures.expected(`boolean_${op}_result.jpg`), data, done);
          });
      });

      it(`${op} operation, buffer`, (_t, done) => {
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(inputJpgBooleanTestBuffer, op)
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            fixtures.assertSimilar(fixtures.expected(`boolean_${op}_result.jpg`), data, done);
          });
      });

      it(`${op} operation, raw`, (_t, done) => {
        sharp(fixtures.inputJpgBooleanTest)
          .raw()
          .toBuffer((err, data, info) => {
            if (err) throw err;
            sharp(fixtures.inputJpg)
              .resize(320, 240)
              .boolean(data, op, { raw: info })
              .toBuffer((err, data, info) => {
                if (err) throw err;
                assert.strictEqual(320, info.width);
                assert.strictEqual(240, info.height);
                fixtures.assertSimilar(fixtures.expected(`boolean_${op}_result.jpg`), data, done);
              });
          });
      });
    });

  it('Invalid operation', () => {
    assert.throws(() => {
      sharp().boolean(fixtures.inputJpgBooleanTest, 'fail');
    });
  });

  it('Invalid operation, non-string', () => {
    assert.throws(() => {
      sharp().boolean(fixtures.inputJpgBooleanTest, null);
    });
  });

  it('Missing input', () => {
    assert.throws(() => {
      sharp().boolean();
    });
  });
});
