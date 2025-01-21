'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('RAD', function () {
  it('Load rad from file', function (done) {
    sharp(fixtures.inputHdr)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(1024, info.width);
        assert.strictEqual(512, info.height);
        done();
      });
  });

  it('Load rad from buffer', function (done) {
    const buffer = fs.readFileSync(fixtures.inputHdr);
    sharp(buffer)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(1024, info.width);
        assert.strictEqual(512, info.height);
        done();
      });
  });
});
