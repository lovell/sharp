/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import fixtures from '../fixtures/index.js';
import sharp from '../../lib/index.js';

suite('Bandbool per-channel boolean operations', () => {
  [
    sharp.bool.and,
    sharp.bool.or,
    sharp.bool.eor
  ]
    .forEach((op) => {
      test(`${op} operation`, async (t) => {
        t.plan(4);
        const { data, info } = await sharp(fixtures.inputPngBooleanNoAlpha)
          .bandbool(op)
          .toColourspace('b-w')
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual(200, info.width);
        t.assert.strictEqual(200, info.height);
        t.assert.strictEqual(1, info.channels);
        await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`bandbool_${op}_result.png`), data));
      });
    });

  test('sRGB image retains 3 channels', async (t) => {
    t.plan(1);
    const { info } = await sharp(fixtures.inputJpg)
      .bandbool('and')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(3, info.channels);
  });

  test('Invalid operation', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().bandbool('fail');
    });
  });

  test('Missing operation', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().bandbool();
    });
  });
});
