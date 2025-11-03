/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs');
const { afterEach, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Clone', () => {
  beforeEach(() => {
    sharp.cache(false);
  });
  afterEach(() => {
    sharp.cache(true);
  });

  it('Read from Stream and write to multiple Streams', (_t, done) => {
    let finishEventsExpected = 2;
    // Output stream 1
    const output1 = fixtures.path('output.multi-stream.1.jpg');
    const writable1 = fs.createWriteStream(output1);
    writable1.on('finish', () => {
      sharp(output1).toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(output1);
        finishEventsExpected--;
        if (finishEventsExpected === 0) {
          done();
        }
      });
    });
    // Output stream 2
    const output2 = fixtures.path('output.multi-stream.2.jpg');
    const writable2 = fs.createWriteStream(output2);
    writable2.on('finish', () => {
      sharp(output2).toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(100, info.width);
        assert.strictEqual(122, info.height);
        fs.unlinkSync(output2);
        finishEventsExpected--;
        if (finishEventsExpected === 0) {
          done();
        }
      });
    });
    // Create parent instance
    const rotator = sharp().rotate(90);
    // Cloned instances with differing dimensions
    rotator.clone().resize(320, 240).pipe(writable1);
    rotator.clone().resize(100, 122).pipe(writable2);
    // Go
    fs.createReadStream(fixtures.inputJpg).pipe(rotator);
  });

  it('Stream-based input attaches finish event listener to original', () => {
    const original = sharp();
    const clone = original.clone();
    assert.strictEqual(1, original.listenerCount('finish'));
    assert.strictEqual(0, clone.listenerCount('finish'));
  });

  it('Non Stream-based input does not attach finish event listeners', () => {
    const original = sharp(fixtures.inputJpg);
    const clone = original.clone();
    assert.strictEqual(0, original.listenerCount('finish'));
    assert.strictEqual(0, clone.listenerCount('finish'));
  });

  it('Ensure deep clone of properties, including arrays', async () => {
    const alpha = await sharp({
      create: { width: 320, height: 240, channels: 3, background: 'red' }
    }).toColourspace('b-w').png().toBuffer();

    const original = sharp();
    const joiner = original.clone().joinChannel(alpha);
    const negater = original.clone().negate();

    fs.createReadStream(fixtures.inputJpg320x240).pipe(original);
    const joined = await joiner.png({ effort: 1 }).toBuffer();
    const negated = await negater.png({ effort: 1 }).toBuffer();

    const joinedMetadata = await sharp(joined).metadata();
    assert.strictEqual(joinedMetadata.channels, 4);
    assert.strictEqual(joinedMetadata.hasAlpha, true);

    const negatedMetadata = await sharp(negated).metadata();
    assert.strictEqual(negatedMetadata.channels, 3);
    assert.strictEqual(negatedMetadata.hasAlpha, false);
  });
});
