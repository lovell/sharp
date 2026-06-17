const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Erode', () => {
  test('erode 1 png', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngDotAndLines)
      .erode(1)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(100, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('erode-1.png'), data));
  });

  test('erode 1 png - default width', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngDotAndLines)
      .erode()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(100, info.width);
    t.assert.strictEqual(100, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('erode-1.png'), data));
  });

  test('invalid erosion width', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).erode(-1);
    });
  });

  test('oversized erosion width is rejected', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).erode(2147483648);
    });
  });
});
