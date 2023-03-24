// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');

describe('JXL', () => {
  it('called without options does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().jxl();
    });
  });
  it('valid distance does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().jxl({ distance: 2.3 });
    });
  });
  it('invalid distance should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ distance: 15.1 });
    });
  });
  it('non-numeric distance should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ distance: 'fail' });
    });
  });
  it('valid quality > 30 does not throw an error', () => {
    const s = sharp();
    assert.doesNotThrow(() => {
      s.jxl({ quality: 80 });
    });
    assert.strictEqual(s.options.jxlDistance, 1.9);
  });
  it('valid quality < 30 does not throw an error', () => {
    const s = sharp();
    assert.doesNotThrow(() => {
      s.jxl({ quality: 20 });
    });
    assert.strictEqual(s.options.jxlDistance, 9.066666666666666);
  });
  it('valid quality does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().jxl({ quality: 80 });
    });
  });
  it('invalid quality should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ quality: 101 });
    });
  });
  it('non-numeric quality should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ quality: 'fail' });
    });
  });
  it('valid decodingTier does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().jxl({ decodingTier: 2 });
    });
  });
  it('invalid decodingTier should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ decodingTier: 5 });
    });
  });
  it('non-numeric decodingTier should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ decodingTier: 'fail' });
    });
  });
  it('valid lossless does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().jxl({ lossless: true });
    });
  });
  it('non-boolean lossless should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ lossless: 'fail' });
    });
  });
  it('valid effort does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().jxl({ effort: 6 });
    });
  });
  it('out of range effort should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ effort: 10 });
    });
  });
  it('invalid effort should throw an error', () => {
    assert.throws(() => {
      sharp().jxl({ effort: 'fail' });
    });
  });
});
