'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('JPEG', function () {
  it('JPEG quality', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ quality: 70 })
      .toBuffer(function (err, buffer70) {
        if (err) throw err;
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .toBuffer(function (err, buffer80) {
            if (err) throw err;
            sharp(fixtures.inputJpg)
              .resize(320, 240)
              .jpeg({ quality: 90 })
              .toBuffer(function (err, buffer90) {
                if (err) throw err;
                assert(buffer70.length < buffer80.length);
                assert(buffer80.length < buffer90.length);
                done();
              });
          });
      });
  });

  describe('Invalid JPEG quality', function () {
    [-1, 88.2, 'test'].forEach(function (quality) {
      it(quality.toString(), function () {
        assert.throws(function () {
          sharp().jpeg({ quality: quality });
        });
      });
    });
  });

  describe('Invalid JPEG quantisation table', function () {
    [-1, 88.2, 'test'].forEach(function (table) {
      it(table.toString(), function () {
        assert.throws(function () {
          sharp().jpeg({ quantisationTable: table });
        });
      });
    });
  });

  it('Progressive JPEG image', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ progressive: false })
      .toBuffer(function (err, nonProgressiveData, nonProgressiveInfo) {
        if (err) throw err;
        assert.strictEqual(true, nonProgressiveData.length > 0);
        assert.strictEqual(nonProgressiveData.length, nonProgressiveInfo.size);
        assert.strictEqual('jpeg', nonProgressiveInfo.format);
        assert.strictEqual(320, nonProgressiveInfo.width);
        assert.strictEqual(240, nonProgressiveInfo.height);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ progressive: true })
          .toBuffer(function (err, progressiveData, progressiveInfo) {
            if (err) throw err;
            assert.strictEqual(true, progressiveData.length > 0);
            assert.strictEqual(progressiveData.length, progressiveInfo.size);
            assert.strictEqual(false, progressiveData.length === nonProgressiveData.length);
            assert.strictEqual('jpeg', progressiveInfo.format);
            assert.strictEqual(320, progressiveInfo.width);
            assert.strictEqual(240, progressiveInfo.height);
            done();
          });
      });
  });

  it('Without chroma subsampling generates larger file', function (done) {
    // First generate with chroma subsampling (default)
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ chromaSubsampling: '4:2:0' })
      .toBuffer(function (err, withChromaSubsamplingData, withChromaSubsamplingInfo) {
        if (err) throw err;
        assert.strictEqual(true, withChromaSubsamplingData.length > 0);
        assert.strictEqual(withChromaSubsamplingData.length, withChromaSubsamplingInfo.size);
        assert.strictEqual('jpeg', withChromaSubsamplingInfo.format);
        assert.strictEqual(320, withChromaSubsamplingInfo.width);
        assert.strictEqual(240, withChromaSubsamplingInfo.height);
        // Then generate without
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ chromaSubsampling: '4:4:4' })
          .toBuffer(function (err, withoutChromaSubsamplingData, withoutChromaSubsamplingInfo) {
            if (err) throw err;
            assert.strictEqual(true, withoutChromaSubsamplingData.length > 0);
            assert.strictEqual(withoutChromaSubsamplingData.length, withoutChromaSubsamplingInfo.size);
            assert.strictEqual('jpeg', withoutChromaSubsamplingInfo.format);
            assert.strictEqual(320, withoutChromaSubsamplingInfo.width);
            assert.strictEqual(240, withoutChromaSubsamplingInfo.height);
            assert.strictEqual(true, withChromaSubsamplingData.length < withoutChromaSubsamplingData.length);
            done();
          });
      });
  });

  it('Invalid JPEG chromaSubsampling value throws error', function () {
    assert.throws(function () {
      sharp().jpeg({ chromaSubsampling: '4:2:2' });
    });
  });

  it('Trellis quantisation', function (done) {
    // First generate without
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ trellisQuantisation: false })
      .toBuffer(function (err, withoutData, withoutInfo) {
        if (err) throw err;
        assert.strictEqual(true, withoutData.length > 0);
        assert.strictEqual(withoutData.length, withoutInfo.size);
        assert.strictEqual('jpeg', withoutInfo.format);
        assert.strictEqual(320, withoutInfo.width);
        assert.strictEqual(240, withoutInfo.height);
        // Then generate with
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ trellisQuantization: true })
          .toBuffer(function (err, withData, withInfo) {
            if (err) throw err;
            assert.strictEqual(true, withData.length > 0);
            assert.strictEqual(withData.length, withInfo.size);
            assert.strictEqual('jpeg', withInfo.format);
            assert.strictEqual(320, withInfo.width);
            assert.strictEqual(240, withInfo.height);
            // Verify image is same (as mozjpeg may not be present) size or less
            assert.strictEqual(true, withData.length <= withoutData.length);
            done();
          });
      });
  });

  it('Overshoot deringing', function (done) {
    // First generate without
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ overshootDeringing: false })
      .toBuffer(function (err, withoutData, withoutInfo) {
        if (err) throw err;
        assert.strictEqual(true, withoutData.length > 0);
        assert.strictEqual(withoutData.length, withoutInfo.size);
        assert.strictEqual('jpeg', withoutInfo.format);
        assert.strictEqual(320, withoutInfo.width);
        assert.strictEqual(240, withoutInfo.height);
        // Then generate with
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ overshootDeringing: true })
          .toBuffer(function (err, withData, withInfo) {
            if (err) throw err;
            assert.strictEqual(true, withData.length > 0);
            assert.strictEqual(withData.length, withInfo.size);
            assert.strictEqual('jpeg', withInfo.format);
            assert.strictEqual(320, withInfo.width);
            assert.strictEqual(240, withInfo.height);
            done();
          });
      });
  });

  it('Optimise scans generates different output length', function (done) {
    // First generate without
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseScans: false })
      .toBuffer(function (err, withoutData, withoutInfo) {
        if (err) throw err;
        assert.strictEqual(true, withoutData.length > 0);
        assert.strictEqual(withoutData.length, withoutInfo.size);
        assert.strictEqual('jpeg', withoutInfo.format);
        assert.strictEqual(320, withoutInfo.width);
        assert.strictEqual(240, withoutInfo.height);
        // Then generate with
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ optimizeScans: true })
          .toBuffer(function (err, withData, withInfo) {
            if (err) throw err;
            assert.strictEqual(true, withData.length > 0);
            assert.strictEqual(withData.length, withInfo.size);
            assert.strictEqual('jpeg', withInfo.format);
            assert.strictEqual(320, withInfo.width);
            assert.strictEqual(240, withInfo.height);
            // Verify image is of a different size (progressive output even without mozjpeg)
            assert.notStrictEqual(withData.length, withoutData.length);
            done();
          });
      });
  });

  it('Optimise coding generates smaller output length', function (done) {
    // First generate with optimize coding enabled (default)
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg()
      .toBuffer(function (err, withOptimiseCoding, withInfo) {
        if (err) throw err;
        assert.strictEqual(true, withOptimiseCoding.length > 0);
        assert.strictEqual(withOptimiseCoding.length, withInfo.size);
        assert.strictEqual('jpeg', withInfo.format);
        assert.strictEqual(320, withInfo.width);
        assert.strictEqual(240, withInfo.height);
        // Then generate with coding disabled
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ optimizeCoding: false })
          .toBuffer(function (err, withoutOptimiseCoding, withoutInfo) {
            if (err) throw err;
            assert.strictEqual(true, withoutOptimiseCoding.length > 0);
            assert.strictEqual(withoutOptimiseCoding.length, withoutInfo.size);
            assert.strictEqual('jpeg', withoutInfo.format);
            assert.strictEqual(320, withoutInfo.width);
            assert.strictEqual(240, withoutInfo.height);
            // Verify optimised image is of a smaller size
            assert.strictEqual(true, withOptimiseCoding.length < withoutOptimiseCoding.length);
            done();
          });
      });
  });

  it('Specifying quantisation table provides different JPEG', function (done) {
    // First generate with default quantisation table
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseCoding: false })
      .toBuffer(function (err, withDefaultQuantisationTable, withInfo) {
        if (err) throw err;
        assert.strictEqual(true, withDefaultQuantisationTable.length > 0);
        assert.strictEqual(withDefaultQuantisationTable.length, withInfo.size);
        assert.strictEqual('jpeg', withInfo.format);
        assert.strictEqual(320, withInfo.width);
        assert.strictEqual(240, withInfo.height);
        // Then generate with different quantisation table
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ optimiseCoding: false, quantisationTable: 3 })
          .toBuffer(function (err, withQuantTable3, withoutInfo) {
            if (err) throw err;
            assert.strictEqual(true, withQuantTable3.length > 0);
            assert.strictEqual(withQuantTable3.length, withoutInfo.size);
            assert.strictEqual('jpeg', withoutInfo.format);
            assert.strictEqual(320, withoutInfo.width);
            assert.strictEqual(240, withoutInfo.height);

            // Verify image is same (as mozjpeg may not be present) size or less
            assert.strictEqual(true, withQuantTable3.length <= withDefaultQuantisationTable.length);
            done();
          });
      });
  });

  it('Specifying quantization table provides different JPEG', function (done) {
    // First generate with default quantization table
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseCoding: false })
      .toBuffer(function (err, withDefaultQuantizationTable, withInfo) {
        if (err) throw err;
        assert.strictEqual(true, withDefaultQuantizationTable.length > 0);
        assert.strictEqual(withDefaultQuantizationTable.length, withInfo.size);
        assert.strictEqual('jpeg', withInfo.format);
        assert.strictEqual(320, withInfo.width);
        assert.strictEqual(240, withInfo.height);
        // Then generate with different quantization table
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .jpeg({ optimiseCoding: false, quantizationTable: 3 })
          .toBuffer(function (err, withQuantTable3, withoutInfo) {
            if (err) throw err;
            assert.strictEqual(true, withQuantTable3.length > 0);
            assert.strictEqual(withQuantTable3.length, withoutInfo.size);
            assert.strictEqual('jpeg', withoutInfo.format);
            assert.strictEqual(320, withoutInfo.width);
            assert.strictEqual(240, withoutInfo.height);

            // Verify image is same (as mozjpeg may not be present) size or less
            assert.strictEqual(true, withQuantTable3.length <= withDefaultQuantizationTable.length);
            done();
          });
      });
  });
});
