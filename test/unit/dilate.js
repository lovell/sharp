import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Dilate', () => {
  test('dilate 1 png', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngDotAndLines)
      .dilate(1)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(100, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('dilate-1.png'), data));
  });

  test('dilate 1 png - default width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngDotAndLines)
      .dilate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(100, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('dilate-1.png'), data));
  });

  test('invalid dilation width', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).dilate(-1);
    });
  });

  test('oversized dilation width is rejected', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).dilate(2147483648);
    });
  });
});
