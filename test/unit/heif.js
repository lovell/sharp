'use strict';

const assert = require('assert');

const sharp = require('../../');

const formatHeifOutputBuffer = sharp.format.heif.output.buffer;

describe('HEIF (experimental)', () => {
  describe('Stubbed without support for HEIF', () => {
    before(() => {
      sharp.format.heif.output.buffer = false;
    });
    after(() => {
      sharp.format.heif.output.buffer = formatHeifOutputBuffer;
    });

    it('should throw an error', () => {
      assert.throws(() => {
        sharp().heif();
      });
    });
  });

  describe('Stubbed with support for HEIF', () => {
    before(() => {
      sharp.format.heif.output.buffer = true;
    });
    after(() => {
      sharp.format.heif.output.buffer = formatHeifOutputBuffer;
    });

    it('called without options does not throw an error', () => {
      assert.doesNotThrow(() => {
        sharp().heif();
      });
    });
    it('valid quality does not throw an error', () => {
      assert.doesNotThrow(() => {
        sharp().heif({ quality: 50 });
      });
    });
    it('invalid quality should throw an error', () => {
      assert.throws(() => {
        sharp().heif({ quality: 101 });
      });
    });
    it('non-numeric quality should throw an error', () => {
      assert.throws(() => {
        sharp().heif({ quality: 'fail' });
      });
    });
    it('valid lossless does not throw an error', () => {
      assert.doesNotThrow(() => {
        sharp().heif({ lossless: true });
      });
    });
    it('non-boolean lossless should throw an error', () => {
      assert.throws(() => {
        sharp().heif({ lossless: 'fail' });
      });
    });
    it('valid compression does not throw an error', () => {
      assert.doesNotThrow(() => {
        sharp().heif({ compression: 'avc' });
      });
    });
    it('unknown compression should throw an error', () => {
      assert.throws(() => {
        sharp().heif({ compression: 'fail' });
      });
    });
    it('invalid compression should throw an error', () => {
      assert.throws(() => {
        sharp().heif({ compression: 1 });
      });
    });
  });
});
