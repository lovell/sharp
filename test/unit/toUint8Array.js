'use strict';

const assert = require('assert');

const sharp = require('../../lib');
const fixtures = require('../fixtures');

describe('toUint8Array', () => {
  it('reusing same sharp object does not reset previously passed parameters to toUint8Array', (done) => {
    const image = sharp(fixtures.inputJpg);
    image.toUint8Array({ resolveWithObject: true }).then((obj) => {
      image.toUint8Array().then((buff) => {
        assert.strictEqual(buff.constructor === Uint8Array, true);
        assert.strictEqual(typeof obj, 'object');
        done();
      });
    });
  });
});
