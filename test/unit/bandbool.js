'use strict';

var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');

describe('Bandbool per-channel boolean operations', function() {

  it('\'and\' Operation', function(done) {
    sharp(fixtures.inputPngBooleanNoAlpha)
      .bandbool('and')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(1, info.channels);
        fixtures.assertSimilar(fixtures.expected('bandbool_and_result.png'), data, done);
      });
  });

  it('\'or\' Operation', function(done) {
    sharp(fixtures.inputPngBooleanNoAlpha)
      .bandbool('or')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(1, info.channels);
        fixtures.assertSimilar(fixtures.expected('bandbool_or_result.png'), data, done);
      });
  });

  it('\'eor\' Operation', function(done) {
    sharp(fixtures.inputPngBooleanNoAlpha)
      .bandbool('eor')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        assert.strictEqual(1, info.channels);
        fixtures.assertSimilar(fixtures.expected('bandbool_eor_result.png'), data, done);
      });
  });

  it('Invalid operation', function() {
    assert.throws(function() {
      sharp(fixtures.inputPngBooleanNoAlpha)
        .bandbool('fail');
    });
  });
});
