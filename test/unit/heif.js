// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

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
  it('valid effort does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ effort: 6 });
    });
  });
  it('out of range effort should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ effort: 10 });
    });
  });
  it('invalid effort should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ effort: 'fail' });
    });
  });
  it('invalid chromaSubsampling should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ chromaSubsampling: 'fail' });
    });
  });
  it('valid chromaSubsampling does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ chromaSubsampling: '4:4:4' });
    });
  });
});
