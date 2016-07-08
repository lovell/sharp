'use strict';

var fs = require('fs');
var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');

describe('Boolean operation between two images', function() {

  it('\'and\' Operation, file', function(done) {
    sharp('/home/mhirsch/sharp/test/fixtures/2569067123_aca715a2ee_o.jpg') //fixtures.inputJpg
      .resize(320,240)
      .boolean(fixtures.inputJpgBooleanTest, sharp.bool.and)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('boolean_and_result.jpg'), data, done);
      });
  });

  it('\'or\' Operation, buffer', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320,240)
      .boolean(fs.readFileSync(fixtures.inputJpgBooleanTest), 'or')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        //fixtures.assertSimilar(fixtures.expected('boolean_or_result.jpg'), data, done);
        done();
      });
  });

  it('\'eor\' Operation, file', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320,240)
      .boolean(fixtures.inputJpgBooleanTest, 'eor')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('boolean_eor_result.jpg'), data, done);
      });
  });

  it('Invalid operation', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg)
        .boolean(fs.readFileSync(fixtures.inputJpgBooleanTest), 'fail');
    });
  });

  it('Invalid operation, non-string', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg)
        .boolean(fs.readFileSync(fixtures.inputJpgBooleanTest), null);
    });
  });

  if('Invalid buffer input', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg)
        .resize(320,240)
        .boolean([],'eor');
    });
  });
});
