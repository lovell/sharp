'use strict';

const fs = require('fs');
const assert = require('assert');
const promisify = require('util').promisify;
const rimraf = require('rimraf');

const sharp = require('../../');
const fixtures = require('../fixtures');

const outputTiff = fixtures.path('output.tiff');

describe('TIFF', function () {
  it('Load TIFF from Buffer', function (done) {
    const inputTiffBuffer = fs.readFileSync(fixtures.inputTiff);
    sharp(inputTiffBuffer)
      .resize(320, 240)
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Load multi-page TIFF from file', function (done) {
    sharp(fixtures.inputTiffMultipage) // defaults to page 0
      .jpeg()
      .toBuffer(function (err, defaultData, defaultInfo) {
        if (err) throw err;
        assert.strictEqual(true, defaultData.length > 0);
        assert.strictEqual(defaultData.length, defaultInfo.size);
        assert.strictEqual('jpeg', defaultInfo.format);

        sharp(fixtures.inputTiffMultipage, { page: 1 }) // 50%-scale copy of page 0
          .jpeg()
          .toBuffer(function (err, scaledData, scaledInfo) {
            if (err) throw err;
            assert.strictEqual(true, scaledData.length > 0);
            assert.strictEqual(scaledData.length, scaledInfo.size);
            assert.strictEqual('jpeg', scaledInfo.format);
            assert.strictEqual(defaultInfo.width, scaledInfo.width * 2);
            assert.strictEqual(defaultInfo.height, scaledInfo.height * 2);
            done();
          });
      });
  });

  it('Load multi-page TIFF from Buffer', function (done) {
    const inputTiffBuffer = fs.readFileSync(fixtures.inputTiffMultipage);
    sharp(inputTiffBuffer) // defaults to page 0
      .jpeg()
      .toBuffer(function (err, defaultData, defaultInfo) {
        if (err) throw err;
        assert.strictEqual(true, defaultData.length > 0);
        assert.strictEqual(defaultData.length, defaultInfo.size);
        assert.strictEqual('jpeg', defaultInfo.format);

        sharp(inputTiffBuffer, { page: 1 }) // 50%-scale copy of page 0
          .jpeg()
          .toBuffer(function (err, scaledData, scaledInfo) {
            if (err) throw err;
            assert.strictEqual(true, scaledData.length > 0);
            assert.strictEqual(scaledData.length, scaledInfo.size);
            assert.strictEqual('jpeg', scaledInfo.format);
            assert.strictEqual(defaultInfo.width, scaledInfo.width * 2);
            assert.strictEqual(defaultInfo.height, scaledInfo.height * 2);
            done();
          });
      });
  });

  it('Save TIFF to Buffer', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('tiff', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Increasing TIFF quality increases file size', () =>
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .resize(320, 240)
      .tiff({ quality: 40 })
      .toBuffer()
      .then(tiff40 => sharp(fixtures.inputJpgWithLandscapeExif1)
        .resize(320, 240)
        .tiff({ quality: 90 })
        .toBuffer()
        .then(tiff90 =>
          assert.strictEqual(true, tiff40.length < tiff90.length)
        )
      )
  );

  it('Invalid TIFF quality throws error', function () {
    assert.throws(function () {
      sharp().tiff({ quality: 101 });
    });
  });

  it('Missing TIFF quality does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff();
    });
  });

  it('Not squashing TIFF to a bit depth of 1 should not change the file size', function (done) {
    const startSize = fs.statSync(fixtures.inputTiff8BitDepth).size;
    sharp(fixtures.inputTiff8BitDepth)
      .toColourspace('b-w') // can only squash 1 band uchar images
      .tiff({
        bitdepth: 8,
        compression: 'none',
        predictor: 'none'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert.strictEqual(startSize, info.size);
        rimraf(outputTiff, done);
      });
  });

  it('Squashing TIFF to a bit depth of 1 should significantly reduce file size', function (done) {
    const startSize = fs.statSync(fixtures.inputTiff8BitDepth).size;
    sharp(fixtures.inputTiff8BitDepth)
      .toColourspace('b-w') // can only squash 1 band uchar images
      .tiff({
        bitdepth: 1,
        compression: 'none',
        predictor: 'none'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < (startSize / 2));
        rimraf(outputTiff, done);
      });
  });

  it('Invalid TIFF bitdepth value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ bitdepth: 3 });
    }, /Error: Expected 1, 2, 4 or 8 for bitdepth but received 3 of type number/);
  });

  it('TIFF setting xres and yres on file', () =>
    sharp(fixtures.inputTiff)
      .resize(8, 8)
      .tiff({
        xres: 1000,
        yres: 1000
      })
      .toFile(outputTiff)
      .then(() => sharp(outputTiff)
        .metadata()
        .then(({ density }) => {
          assert.strictEqual(25400, density);
          return promisify(rimraf)(outputTiff);
        })
      )
  );

  it('TIFF setting xres and yres on buffer', () =>
    sharp(fixtures.inputTiff)
      .resize(8, 8)
      .tiff({
        xres: 1000,
        yres: 1000
      })
      .toBuffer()
      .then(data => sharp(data)
        .metadata()
        .then(({ density }) => {
          assert.strictEqual(25400, density);
        })
      )
  );

  it('TIFF invalid xres value should throw an error', function () {
    assert.throws(function () {
      sharp().tiff({ xres: '1000.0' });
    });
  });

  it('TIFF invalid yres value should throw an error', function () {
    assert.throws(function () {
      sharp().tiff({ yres: '1000.0' });
    });
  });

  it('TIFF lzw compression with horizontal predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'lzw',
        predictor: 'horizontal'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert.strictEqual(3, info.channels);
        assert(info.size < startSize);
        rimraf(outputTiff, done);
      });
  });

  it('TIFF LZW RGBA toFile', () =>
    sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: 'red'
      }
    })
      .tiff({
        compression: 'lzw'
      })
      .toFile(outputTiff)
      .then(info => {
        assert.strictEqual(4, info.channels);
      })
  );

  it('TIFF LZW RGBA toBuffer', () =>
    sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: 'red'
      }
    })
      .tiff({
        compression: 'lzw'
      })
      .toBuffer({ resolveWithObject: true })
      .then(({ info }) => {
        assert.strictEqual(4, info.channels);
      })
  );

  it('TIFF ccittfax4 compression shrinks b-w test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiff).size;
    sharp(fixtures.inputTiff)
      .toColourspace('b-w')
      .tiff({
        bitdepth: 1,
        compression: 'ccittfax4'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        rimraf(outputTiff, done);
      });
  });

  it('TIFF deflate compression with horizontal predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'horizontal'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        rimraf(outputTiff, done);
      });
  });

  it('TIFF deflate compression with float predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'float'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(startSize > info.size);
        rimraf(outputTiff, done);
      });
  });

  it('TIFF deflate compression without predictor shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'none'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        rimraf(outputTiff, done);
      });
  });

  it('TIFF jpeg compression shrinks test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'jpeg'
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size < startSize);
        rimraf(outputTiff, done);
      });
  });

  it('TIFF none compression does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ compression: 'none' });
    });
  });

  it('TIFF lzw compression does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ compression: 'lzw' });
    });
  });

  it('TIFF deflate compression does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ compression: 'deflate' });
    });
  });

  it('TIFF invalid compression option throws', function () {
    assert.throws(function () {
      sharp().tiff({ compression: 0 });
    });
  });

  it('TIFF invalid compression option throws', function () {
    assert.throws(function () {
      sharp().tiff({ compression: 'a' });
    });
  });

  it('TIFF invalid predictor option throws', function () {
    assert.throws(function () {
      sharp().tiff({ predictor: 'a' });
    });
  });

  it('TIFF horizontal predictor does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ predictor: 'horizontal' });
    });
  });

  it('TIFF float predictor does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ predictor: 'float' });
    });
  });

  it('TIFF none predictor does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ predictor: 'none' });
    });
  });

  it('TIFF tiled pyramid image without compression enlarges test file', function (done) {
    const startSize = fs.statSync(fixtures.inputTiffUncompressed).size;
    sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'none',
        pyramid: true,
        tile: true,
        tileHeight: 256,
        tileWidth: 256
      })
      .toFile(outputTiff, (err, info) => {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert(info.size > startSize);
        rimraf(outputTiff, done);
      });
  });

  it('TIFF pyramid true value does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ pyramid: true });
    });
  });

  it('Invalid TIFF pyramid value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ pyramid: 'true' });
    });
  });

  it('Invalid TIFF tile value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ tile: 'true' });
    });
  });

  it('TIFF tile true value does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ tile: true });
    });
  });

  it('Valid TIFF tileHeight value does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ tileHeight: 512 });
    });
  });

  it('Valid TIFF tileWidth value does not throw error', function () {
    assert.doesNotThrow(function () {
      sharp().tiff({ tileWidth: 512 });
    });
  });

  it('Invalid TIFF tileHeight value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ tileHeight: '256' });
    });
  });

  it('Invalid TIFF tileWidth value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ tileWidth: '256' });
    });
  });

  it('Invalid TIFF tileHeight value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ tileHeight: 0 });
    });
  });

  it('Invalid TIFF tileWidth value throws error', function () {
    assert.throws(function () {
      sharp().tiff({ tileWidth: 0 });
    });
  });

  it('TIFF file input with invalid page fails gracefully', function (done) {
    sharp(fixtures.inputTiffMultipage, { page: 2 })
      .toBuffer(function (err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('TIFF buffer input with invalid page fails gracefully', function (done) {
    sharp(fs.readFileSync(fixtures.inputTiffMultipage), { page: 2 })
      .toBuffer(function (err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });
});
