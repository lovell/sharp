/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';

suite('HEIF', () => {
  test('called without options throws an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif();
    });
  });
  test('valid quality does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', quality: 80 });
    });
  });
  test('invalid quality should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'av1', quality: 101 });
    });
  });
  test('non-numeric quality should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'av1', quality: 'fail' });
    });
  });
  test('valid lossless does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', lossless: true });
    });
  });
  test('non-boolean lossless should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'av1', lossless: 'fail' });
    });
  });
  test('valid compression does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().heif({ compression: 'hevc' });
    });
  });
  test('unknown compression should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'fail' });
    });
  });
  test('invalid compression should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 1 });
    });
  });
  test('valid effort does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', effort: 6 });
    });
  });
  test('out of range effort should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'av1', effort: 10 });
    });
  });
  test('invalid effort should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'av1', effort: 'fail' });
    });
  });
  test('invalid chromaSubsampling should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'av1', chromaSubsampling: 'fail' });
    });
  });
  test('valid chromaSubsampling does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', chromaSubsampling: '4:4:4' });
    });
  });
  test('valid bitdepth value does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().heif({ compression: 'av1', bitdepth: 12 });
    });
  });
  test('invalid bitdepth value should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'av1', bitdepth: 11 });
    }, /Error: Expected 8, 10 or 12 for bitdepth but received 11 of type number/);
  });
  test('valid tune does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().heif({ compression: 'hevc', tune: 'psnr' });
    });
  });
  test('invalid tune should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().heif({ compression: 'hevc', tune: 'fail' });
    }, /Error: Expected one of: auto, iq, psnr, ssim for tune but received fail of type string/);
  });
});
