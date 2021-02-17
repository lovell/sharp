'use strict';

const assert = require('assert');
const sharp = require('../../');
const fixtures = require('../fixtures');

describe('toFormat', () => {
  it('accepts upper case characters as format parameter (string)', function (done) {
    sharp(fixtures.inputJpg)
      .toFormat('PNG')
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        done();
      });
  });
  it('accepts upper case characters as format parameter (object)', function (done) {
    sharp(fixtures.inputJpg)
      .toFormat({ id: 'PNG' })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        done();
      });
  });
});
