'use strict';

const assert = require('assert');

const sharp = require('../../');

describe('HEIF', () => {
  it('called without options does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif();
    });
  });
  it('valid quality does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ quality: 80 });
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
      sharp().heif({ compression: 'hevc' });
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
  it('valid speed does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ speed: 6 });
    });
  });
  it('out of range speed should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ speed: 9 });
    });
  });
  it('invalid speed should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'fail' });
    });
  });
});
