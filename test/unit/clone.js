'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Clone', function () {
  beforeEach(function () {
    sharp.cache(false);
  });
  afterEach(function () {
    sharp.cache(true);
  });

  it('Read from Stream and write to multiple Streams', function (done) {
    let finishEventsExpected = 2;
    // Output stream 1
    const output1 = fixtures.path('output.multi-stream.1.jpg');
    const writable1 = fs.createWriteStream(output1);
    writable1.on('finish', function () {
      sharp(output1).toBuffer(function (err, data, info) {
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
    writable2.on('finish', function () {
      sharp(output2).toBuffer(function (err, data, info) {
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

  it('Stream-based input attaches finish event listener to original', function () {
    const original = sharp();
    const clone = original.clone();
    assert.strictEqual(1, original.listenerCount('finish'));
    assert.strictEqual(0, clone.listenerCount('finish'));
  });

  it('Non Stream-based input does not attach finish event listeners', function () {
    const original = sharp(fixtures.inputJpg);
    const clone = original.clone();
    assert.strictEqual(0, original.listenerCount('finish'));
    assert.strictEqual(0, clone.listenerCount('finish'));
  });
});
