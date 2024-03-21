// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');

describe('HEIF', () => {
  it('called without options throws an error', () => {
    assert.throws(() => {
      sharp().heif();
    });
  });
  it('valid quality does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', quality: 80 });
    });
  });
  it('invalid quality should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'av1', quality: 101 });
    });
  });
  it('non-numeric quality should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'av1', quality: 'fail' });
    });
  });
  it('valid lossless does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', lossless: true });
    });
  });
  it('non-boolean lossless should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'av1', lossless: 'fail' });
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
      sharp().heif({ compression: 'av1', effort: 6 });
    });
  });
  it('out of range effort should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'av1', effort: 10 });
    });
  });
  it('invalid effort should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'av1', effort: 'fail' });
    });
  });
  it('invalid chromaSubsampling should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'av1', chromaSubsampling: 'fail' });
    });
  });
  it('valid chromaSubsampling does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', chromaSubsampling: '4:4:4' });
    });
  });
  it('valid bitdepth value does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', bitdepth: 12 });
    });
  });
  it('invalid bitdepth value should throw an error', () => {
    assert.throws(() => {
      sharp().heif({ compression: 'av1', bitdepth: 11 });
    }, /Error: Expected 8, 10 or 12 for bitdepth but received 11 of type number/);
  });
});
