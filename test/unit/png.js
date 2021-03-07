'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('PNG', function () {
  it('compression level is valid', function () {
    assert.doesNotThrow(function () {
      sharp().png({ compressionLevel: 0 });
    });
  });

  it('compression level is invalid', function () {
    assert.throws(function () {
      sharp().png({ compressionLevel: -1 });
    });
  });

  it('default compressionLevel generates smaller file than compressionLevel=0', function (done) {
    // First generate with default compressionLevel
    sharp(fixtures.inputPng)
      .resize(320, 240)
      .png()
      .toBuffer(function (err, defaultData, defaultInfo) {
        if (err) throw err;
        assert.strictEqual(true, defaultData.length > 0);
        assert.strictEqual('png', defaultInfo.format);
        // Then generate with compressionLevel=6
        sharp(fixtures.inputPng)
          .resize(320, 240)
          .png({ compressionLevel: 0 })
          .toBuffer(function (err, largerData, largerInfo) {
            if (err) throw err;
            assert.strictEqual(true, largerData.length > 0);
            assert.strictEqual('png', largerInfo.format);
            assert.strictEqual(true, defaultData.length < largerData.length);
            done();
          });
      });
  });

  it('without adaptiveFiltering generates smaller file', function (done) {
    // First generate with adaptive filtering
    sharp(fixtures.inputPng)
      .resize(320, 240)
      .png({ adaptiveFiltering: true })
      .toBuffer(function (err, adaptiveData, adaptiveInfo) {
        if (err) throw err;
        assert.strictEqual(true, adaptiveData.length > 0);
        assert.strictEqual(adaptiveData.length, adaptiveInfo.size);
        assert.strictEqual('png', adaptiveInfo.format);
        assert.strictEqual(320, adaptiveInfo.width);
        assert.strictEqual(240, adaptiveInfo.height);
        // Then generate without
        sharp(fixtures.inputPng)
          .resize(320, 240)
          .png({ adaptiveFiltering: false })
          .toBuffer(function (err, withoutAdaptiveData, withoutAdaptiveInfo) {
            if (err) throw err;
            assert.strictEqual(true, withoutAdaptiveData.length > 0);
            assert.strictEqual(withoutAdaptiveData.length, withoutAdaptiveInfo.size);
            assert.strictEqual('png', withoutAdaptiveInfo.format);
            assert.strictEqual(320, withoutAdaptiveInfo.width);
            assert.strictEqual(240, withoutAdaptiveInfo.height);
            assert.strictEqual(true, withoutAdaptiveData.length < adaptiveData.length);
            done();
          });
      });
  });

  it('Invalid PNG adaptiveFiltering value throws error', function () {
    assert.throws(function () {
      sharp().png({ adaptiveFiltering: 1 });
    });
  });

  it('Progressive PNG image', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ progressive: false })
      .toBuffer(function (err, nonProgressiveData, nonProgressiveInfo) {
        if (err) throw err;
        assert.strictEqual(true, nonProgressiveData.length > 0);
        assert.strictEqual(nonProgressiveData.length, nonProgressiveInfo.size);
        assert.strictEqual('png', nonProgressiveInfo.format);
        assert.strictEqual(320, nonProgressiveInfo.width);
        assert.strictEqual(240, nonProgressiveInfo.height);
        sharp(nonProgressiveData)
          .png({ progressive: true })
          .toBuffer(function (err, progressiveData, progressiveInfo) {
            if (err) throw err;
            assert.strictEqual(true, progressiveData.length > 0);
            assert.strictEqual(progressiveData.length, progressiveInfo.size);
            assert.strictEqual(true, progressiveData.length > nonProgressiveData.length);
            assert.strictEqual('png', progressiveInfo.format);
            assert.strictEqual(320, progressiveInfo.width);
            assert.strictEqual(240, progressiveInfo.height);
            done();
          });
      });
  });

  it('16-bit grey+alpha PNG identity transform', function () {
    const actual = fixtures.path('output.16-bit-grey-alpha-identity.png');
    return sharp(fixtures.inputPng16BitGreyAlpha)
      .toFile(actual)
      .then(function () {
        fixtures.assertMaxColourDistance(actual, fixtures.expected('16-bit-grey-alpha-identity.png'));
      });
  });

  it('Valid PNG libimagequant palette value does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().png({ palette: false });
    });
  });

  it('Invalid PNG libimagequant palette value throws error', function () {
    assert.throws(function () {
      sharp().png({ palette: 'fail' });
    });
  });

  it('Valid PNG libimagequant quality value produces image of same size or smaller', function () {
    const inputPngBuffer = fs.readFileSync(fixtures.inputPng);
    return Promise.all([
      sharp(inputPngBuffer).resize(10).png({ quality: 80 }).toBuffer(),
      sharp(inputPngBuffer).resize(10).png({ quality: 100 }).toBuffer()
    ]).then(function (data) {
      assert.strictEqual(true, data[0].length <= data[1].length);
    });
  });

  it('Invalid PNG libimagequant quality value throws error', function () {
    assert.throws(function () {
      sharp().png({ quality: 101 });
    });
  });

  it('Valid PNG libimagequant colours value produces image of same size or smaller', function () {
    const inputPngBuffer = fs.readFileSync(fixtures.inputPng);
    return Promise.all([
      sharp(inputPngBuffer).resize(10).png({ colours: 100 }).toBuffer(),
      sharp(inputPngBuffer).resize(10).png({ colours: 200 }).toBuffer()
    ]).then(function (data) {
      assert.strictEqual(true, data[0].length <= data[1].length);
    });
  });

  it('Invalid PNG libimagequant colours value throws error', function () {
    assert.throws(function () {
      sharp().png({ colours: -1 });
    });
  });

  it('Invalid PNG libimagequant colors value throws error', function () {
    assert.throws(function () {
      sharp().png({ colors: 0.1 });
    });
  });

  it('Valid PNG libimagequant dither value produces image of same size or smaller', function () {
    const inputPngBuffer = fs.readFileSync(fixtures.inputPng);
    return Promise.all([
      sharp(inputPngBuffer).resize(10).png({ dither: 0.1 }).toBuffer(),
      sharp(inputPngBuffer).resize(10).png({ dither: 0.9 }).toBuffer()
    ]).then(function (data) {
      assert.strictEqual(true, data[0].length <= data[1].length);
    });
  });

  it('Invalid PNG libimagequant dither value throws error', function () {
    assert.throws(function () {
      sharp().png({ dither: 'fail' });
    });
  });
});
