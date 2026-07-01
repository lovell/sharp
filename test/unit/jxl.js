/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';

suite('JXL', () => {
  test('called without options does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl();
    });
  });
  test('valid distance does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ distance: 2.3 });
    });
  });
  test('invalid distance should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ distance: 15.1 });
    });
  });
  test('non-numeric distance should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ distance: 'fail' });
    });
  });
  test('valid quality > 30 does not throw an error', (t) => {
    t.plan(2);
    const s = sharp();
    t.assert.doesNotThrow(() => {
      s.jxl({ quality: 80 });
    });
    t.assert.strictEqual(s.options.jxlDistance, 1.9);
  });
  test('valid quality < 30 does not throw an error', (t) => {
    t.plan(2);
    const s = sharp();
    t.assert.doesNotThrow(() => {
      s.jxl({ quality: 20 });
    });
    t.assert.strictEqual(s.options.jxlDistance, 9.066666666666666);
  });
  test('valid quality does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ quality: 80 });
    });
  });
  test('invalid quality should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ quality: 101 });
    });
  });
  test('non-numeric quality should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ quality: 'fail' });
    });
  });
  test('valid decodingTier does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ decodingTier: 2 });
    });
  });
  test('invalid decodingTier should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ decodingTier: 5 });
    });
  });
  test('non-numeric decodingTier should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ decodingTier: 'fail' });
    });
  });
  test('valid lossless does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ lossless: true });
    });
  });
  test('non-boolean lossless should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ lossless: 'fail' });
    });
  });
  test('valid effort does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ effort: 6 });
    });
  });
  test('out of range effort should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ effort: 10 });
    });
  });
  test('invalid effort should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ effort: 'fail' });
    });
  });
});
