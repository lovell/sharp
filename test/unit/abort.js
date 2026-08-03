/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('AbortSignal', () => {
  test('Will abort when signal is triggered during processing', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    const promise = sharp(fixtures.inputJpg)
      .blur(300)
      .toBuffer({ signal: controller.signal });

    setTimeout(() => controller.abort(), 100);

    await t.assert.rejects(promise, /abort/);
  });

  test('Will reject immediately if signal already aborted', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    controller.abort();

    await t.assert.rejects(
      () => sharp(fixtures.inputJpg).toBuffer({ signal: controller.signal }),
      { name: 'AbortError' }
    );
  });

  test('Will complete normally if signal is not aborted', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    const data = await sharp(fixtures.inputJpg)
      .resize(100)
      .toBuffer({ signal: controller.signal });

    t.assert.ok(data.length > 0);
  });

  test('Will complete normally without signal', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(100)
      .toBuffer();

    t.assert.ok(data.length > 0);
  });

  test('invalid signal type', async (t) => {
    t.plan(1);
    await t.assert.throws(
      () => sharp(fixtures.inputJpg, { signal: 'not-a-signal' }),
      /Expected AbortSignal/
    );
  });

  test('signal option in constructor', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    const promise = sharp(fixtures.inputJpg, { signal: controller.signal })
      .blur(300)
      .toBuffer();

    setTimeout(() => controller.abort(), 100);

    await t.assert.rejects(promise, /abort/);
  });

  test('signal with toFile', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    const promise = sharp(fixtures.inputJpg)
      .blur(300)
      .toFile(fixtures.path('output.abort.jpg'), { signal: controller.signal });

    setTimeout(() => controller.abort(), 100);

    await t.assert.rejects(promise, /abort/);
  });

  test('signal with stream output', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    const stream = sharp(fixtures.inputJpg, { signal: controller.signal })
      .blur(300);

    setTimeout(() => controller.abort(), 100);

    await t.assert.rejects(
      () => new Promise((resolve, reject) => {
        stream
          .on('data', () => {})
          .on('end', resolve)
          .on('error', reject);
      }),
      /abort/
    );
  });

  test('toBuffer with signal rejects resolveWithObject: true', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    await t.assert.throws(
      () => sharp(fixtures.inputJpg).toBuffer({ signal: controller.signal, resolveWithObject: true }),
      /resolveWithObject/
    );
  });

  test('toBuffer with signal rejects resolveWithObject: false', async (t) => {
    t.plan(1);
    const controller = new AbortController();
    await t.assert.throws(
      () => sharp(fixtures.inputJpg).toBuffer({ signal: controller.signal, resolveWithObject: false }),
      /resolveWithObject/
    );
  });

  test('toBuffer without signal allows resolveWithObject: true', async (t) => {
    t.plan(2);
    const result = await sharp(fixtures.inputJpg)
      .resize(100)
      .toBuffer({ resolveWithObject: true });

    t.assert.ok(result.data.length > 0);
    t.assert.ok(result.info.width === 100);
  });

  test('toBuffer without signal allows resolveWithObject: false', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(100)
      .toBuffer({ resolveWithObject: false });

    t.assert.ok(data.length > 0);
  });
});
