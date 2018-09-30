'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Deprecated resize-related functions', function () {
  it('Max width or height considering ratio (portrait)', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 320)
      .max()
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(243, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('Min width or height considering ratio (portrait)', function (done) {
    sharp(fixtures.inputTiff)
      .resize(320, 320)
      .min()
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(422, info.height);
        done();
      });
  });

  it('Max width or height considering ratio (landscape)', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320)
      .max()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('Provide only one dimension with max, should default to crop', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .max()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('Min width or height considering ratio (landscape)', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320)
      .min()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(392, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('Provide only one dimension with min, should default to crop', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .min()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(261, info.height);
        done();
      });
  });

  it('Do not enlarge when input width is already less than output width', function (done) {
    sharp(fixtures.inputJpg)
      .resize(2800)
      .withoutEnlargement()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do not enlarge when input height is already less than output height', function (done) {
    sharp(fixtures.inputJpg)
      .resize(null, 2300)
      .withoutEnlargement()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do enlarge when input width is less than output width', function (done) {
    sharp(fixtures.inputJpg)
      .resize(2800)
      .withoutEnlargement(false)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2800, info.width);
        assert.strictEqual(2286, info.height);
        done();
      });
  });

  it('Downscale width and height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 320)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('Downscale width, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Downscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(null, 320)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('Upscale width and height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000, 3000)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3000, info.width);
        assert.strictEqual(3000, info.height);
        done();
      });
  });

  it('Upscale width, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3000, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Upscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(null, 3000)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(3000, info.height);
        done();
      });
  });

  it('Downscale width, upscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 3000)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(3000, info.height);
        done();
      });
  });

  it('Upscale width, downscale height, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .resize(3000, 320)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3000, info.width);
        assert.strictEqual(320, info.height);
        done();
      });
  });

  it('Identity transform, ignoring aspect ratio', function (done) {
    sharp(fixtures.inputJpg)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });
});
