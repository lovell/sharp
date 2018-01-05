'use strict';

const fs = require('fs');
const assert = require('assert');

const fixtures = require('../fixtures');
const sharp = require('../../');

describe('Boolean operation between two images', function () {
  const inputJpgBooleanTestBuffer = fs.readFileSync(fixtures.inputJpgBooleanTest);

  [
    sharp.bool.and,
    sharp.bool.or,
    sharp.bool.eor
  ]
    .forEach(function (op) {
      it(op + ' operation, file', function (done) {
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(fixtures.inputJpgBooleanTest, op)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            fixtures.assertSimilar(fixtures.expected('boolean_' + op + '_result.jpg'), data, done);
          });
      });

      it(op + ' operation, buffer', function (done) {
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(inputJpgBooleanTestBuffer, op)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            fixtures.assertSimilar(fixtures.expected('boolean_' + op + '_result.jpg'), data, done);
          });
      });

      it(op + ' operation, raw', function (done) {
        sharp(fixtures.inputJpgBooleanTest)
          .raw()
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            sharp(fixtures.inputJpg)
              .resize(320, 240)
              .boolean(data, op, { raw: info })
              .toBuffer(function (err, data, info) {
                if (err) throw err;
                assert.strictEqual(320, info.width);
                assert.strictEqual(240, info.height);
                fixtures.assertSimilar(fixtures.expected('boolean_' + op + '_result.jpg'), data, done);
              });
          });
      });
    });

  it('Invalid operation', function () {
    assert.throws(function () {
      sharp().boolean(fixtures.inputJpgBooleanTest, 'fail');
    });
  });

  it('Invalid operation, non-string', function () {
    assert.throws(function () {
      sharp().boolean(fixtures.inputJpgBooleanTest, null);
    });
  });

  it('Missing input', function () {
    assert.throws(function () {
      sharp().boolean();
    });
  });
});
