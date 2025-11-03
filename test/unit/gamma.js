/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Gamma correction', () => {
  it('value of 0.0 (disabled)', (_t, done) => {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-0.0.jpg'), data, { threshold: 9 }, done);
      });
  });

  it('value of 2.2 (default)', (_t, done) => {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-2.2.jpg'), data, done);
      });
  });

  it('value of 3.0', (_t, done) => {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma(3)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-3.0.jpg'), data, { threshold: 6 }, done);
      });
  });

  it('input value of 2.2, output value of 3.0', (_t, done) => {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma(2.2, 3.0)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-in-2.2-out-3.0.jpg'), data, { threshold: 6 }, done);
      });
  });

  it('alpha transparency', (_t, done) => {
    sharp(fixtures.inputPngOverlayLayer1)
      .resize(320)
      .gamma()
      .jpeg()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        fixtures.assertSimilar(fixtures.expected('gamma-alpha.jpg'), data, done);
      });
  });

  it('invalid first parameter value', () => {
    assert.throws(() => {
      sharp(fixtures.inputJpgWithGammaHoliness).gamma(4);
    });
  });

  it('invalid second parameter value', () => {
    assert.throws(() => {
      sharp(fixtures.inputJpgWithGammaHoliness).gamma(2.2, 4);
    });
  });
});
