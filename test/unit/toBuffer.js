'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('toBuffer', () => {
  it('reusing same sharp object does not reset previously passed parameters to toBuffer', (done) => {
    const image = sharp(fixtures.inputJpg);
    image.toBuffer({ resolveWithObject: true }).then((obj) => {
      image.toBuffer().then((buff) => {
        assert.strictEqual(Buffer.isBuffer(buff), true);
        assert.strictEqual(typeof obj, 'object');
        done();
      });
    });
  });
});
