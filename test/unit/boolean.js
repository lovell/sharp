'use strict';

var fs = require('fs');
var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');

describe('Boolean operation between two images', function() {

  var inputJpgBooleanTestBuffer = fs.readFileSync(fixtures.inputJpgBooleanTest);

  [
    sharp.bool.and,
    sharp.bool.or,
    sharp.bool.eor
  ]
  .forEach(function(op) {

    it(op + ' operation, file', function(done) {
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .boolean(fixtures.inputJpgBooleanTest, op)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          fixtures.assertSimilar(fixtures.expected('boolean_' + op + '_result.jpg'), data, done);
        });
    });

    it(op + ' operation, buffer', function(done) {
      sharp(fixtures.inputJpg)
        .resize(320, 240)
        .boolean(inputJpgBooleanTestBuffer, op)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          fixtures.assertSimilar(fixtures.expected('boolean_' + op + '_result.jpg'), data, done);
        });
    });
  });

  it('Raw buffer input', function(done) {
    sharp(fixtures.inputJpgBooleanTest).raw().toBuffer(
      function(err, buf, info) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .boolean(buf, 'and', {raw: info})
          .toBuffer(function(err, data, info) {
            if (err) throw err;
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            fixtures.assertSimilar(fixtures.expected('boolean_and_result.jpg'), data, done);
          });
      });
  });

  it('Invalid operation', function() {
    assert.throws(function() {
      sharp().boolean(fixtures.inputJpgBooleanTest, 'fail');
    });
  });

  it('Invalid operation, non-string', function() {
    assert.throws(function() {
      sharp().boolean(fixtures.inputJpgBooleanTest, null);
    });
  });

  it('Missing input', function() {
    assert.throws(function() {
      sharp().boolean();
    });
  });

  it('Invalid raw buffer description', function() {
    assert.throws(function() {
      sharp().boolean(fs.readFileSync(fixtures.inputJpg),{raw:{}});
    });
  });

});
