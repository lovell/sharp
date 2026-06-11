/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { afterEach, beforeEach, suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Clone', () => {
  beforeEach(() => {
    sharp.cache(false);
  });
  afterEach(() => {
    sharp.cache(true);
  });

  test('Read from Stream and write to multiple Streams', (t, done) => {
    t.plan(10);
    let finishEventsExpected = 2;
    // Output stream 1
    const output1 = fixtures.path('output.multi-stream.1.jpg');
    const writable1 = createWriteStream(output1);
    writable1.on('finish', async () => {
      const { data, info } = await sharp(output1).toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, data.length > 0);
      t.assert.strictEqual(data.length, info.size);
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(240, info.height);
      await fs.unlink(output1);
      finishEventsExpected--;
      if (finishEventsExpected === 0) {
        done();
      }
    });
    // Output stream 2
    const output2 = fixtures.path('output.multi-stream.2.jpg');
    const writable2 = createWriteStream(output2);
    writable2.on('finish', async () => {
      const { data, info } = await sharp(output2).toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, data.length > 0);
      t.assert.strictEqual(data.length, info.size);
      t.assert.strictEqual('jpeg', info.format);
      t.assert.strictEqual(100, info.width);
      t.assert.strictEqual(122, info.height);
      await fs.unlink(output2);
      finishEventsExpected--;
      if (finishEventsExpected === 0) {
        done();
      }
    });
    // Create parent instance
    const rotator = sharp().rotate(90);
    // Cloned instances with differing dimensions
    rotator.clone().resize(320, 240).pipe(writable1);
    rotator.clone().resize(100, 122).pipe(writable2);
    // Go
    createReadStream(fixtures.inputJpg).pipe(rotator);
  });

  test('Stream-based input attaches finish event listener to original', (t) => {
    t.plan(2);
    const original = sharp();
    const clone = original.clone();
    t.assert.strictEqual(1, original.listenerCount('finish'));
    t.assert.strictEqual(0, clone.listenerCount('finish'));
  });

  test('Non Stream-based input does not attach finish event listeners', (t) => {
    t.plan(2);
    const original = sharp(fixtures.inputJpg);
    const clone = original.clone();
    t.assert.strictEqual(0, original.listenerCount('finish'));
    t.assert.strictEqual(0, clone.listenerCount('finish'));
  });

  test('Ensure deep clone of properties, including arrays', async (t) => {
    t.plan(4);
    const alpha = await sharp({
      create: { width: 320, height: 240, channels: 3, background: 'red' }
    }).toColourspace('b-w').png().toBuffer();

    const original = sharp();
    const joiner = original.clone().joinChannel(alpha);
    const negater = original.clone().negate();

    const fd = await fs.open(fixtures.inputJpg320x240);
    fd.createReadStream().pipe(original);
    const joined = await joiner.png({ effort: 1 }).toBuffer();
    const negated = await negater.png({ effort: 1 }).toBuffer();

    const joinedMetadata = await sharp(joined).metadata();
    t.assert.strictEqual(joinedMetadata.channels, 4);
    t.assert.strictEqual(joinedMetadata.hasAlpha, true);

    const negatedMetadata = await sharp(negated).metadata();
    t.assert.strictEqual(negatedMetadata.channels, 3);
    t.assert.strictEqual(negatedMetadata.hasAlpha, false);
  });
});
