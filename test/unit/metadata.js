'use strict';

var fs = require('fs');
var assert = require('assert');
var exifReader = require('exif-reader');
var icc = require('icc');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Image metadata', function() {

  it('JPEG', function(done) {
    sharp(fixtures.inputJpg).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('JPEG with EXIF/ICC', function(done) {
    sharp(fixtures.inputJpgWithExif).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(450, metadata.width);
      assert.strictEqual(600, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(72, metadata.density);
      assert.strictEqual(true, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual(8, metadata.orientation);
      // EXIF
      assert.strictEqual('object', typeof metadata.exif);
      assert.strictEqual(true, metadata.exif instanceof Buffer);
      var exif = exifReader(metadata.exif);
      assert.strictEqual('object', typeof exif);
      assert.strictEqual('object', typeof exif.image);
      assert.strictEqual('number', typeof exif.image.XResolution);
      // ICC
      assert.strictEqual('object', typeof metadata.icc);
      assert.strictEqual(true, metadata.icc instanceof Buffer);
      var profile = icc.parse(metadata.icc);
      assert.strictEqual('object', typeof profile);
      assert.strictEqual('Generic RGB Profile', profile.description);
      done();
    });
  });

  if (sharp.format.tiff.input.file) {
    it('TIFF', function(done) {
      sharp(fixtures.inputTiff).metadata(function(err, metadata) {
        if (err) throw err;
        assert.strictEqual('tiff', metadata.format);
        assert.strictEqual(2464, metadata.width);
        assert.strictEqual(3248, metadata.height);
        assert.strictEqual('b-w', metadata.space);
        assert.strictEqual(1, metadata.channels);
        assert.strictEqual(300, metadata.density);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(false, metadata.hasAlpha);
        assert.strictEqual('undefined', typeof metadata.orientation);
        assert.strictEqual('undefined', typeof metadata.exif);
        assert.strictEqual('undefined', typeof metadata.icc);
        done();
      });
    });
  }

  it('PNG', function(done) {
    sharp(fixtures.inputPng).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual(2809, metadata.width);
      assert.strictEqual(2074, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual(300, metadata.density);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('Transparent PNG', function(done) {
    sharp(fixtures.inputPngWithTransparency).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual(2048, metadata.width);
      assert.strictEqual(1536, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(4, metadata.channels);
      assert.strictEqual(72, metadata.density);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(true, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  if (sharp.format.webp.input.file) {
    it('WebP', function(done) {
      sharp(fixtures.inputWebP).metadata(function(err, metadata) {
        if (err) throw err;
        assert.strictEqual('webp', metadata.format);
        assert.strictEqual(1024, metadata.width);
        assert.strictEqual(772, metadata.height);
        assert.strictEqual('srgb', metadata.space);
        assert.strictEqual(3, metadata.channels);
        assert.strictEqual('undefined', typeof metadata.density);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(false, metadata.hasAlpha);
        assert.strictEqual('undefined', typeof metadata.orientation);
        assert.strictEqual('undefined', typeof metadata.exif);
        assert.strictEqual('undefined', typeof metadata.icc);
        done();
      });
    });
  }

  if (sharp.format.gif.input.file) {
    it('GIF via giflib', function(done) {
      sharp(fixtures.inputGif).metadata(function(err, metadata) {
        if (err) throw err;
        assert.strictEqual('gif', metadata.format);
        assert.strictEqual(800, metadata.width);
        assert.strictEqual(533, metadata.height);
        assert.strictEqual(4, metadata.channels);
        assert.strictEqual('undefined', typeof metadata.density);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(true, metadata.hasAlpha);
        assert.strictEqual('undefined', typeof metadata.orientation);
        assert.strictEqual('undefined', typeof metadata.exif);
        assert.strictEqual('undefined', typeof metadata.icc);
        done();
      });
    });
    it('GIF grey+alpha via giflib', function(done) {
      sharp(fixtures.inputGifGreyPlusAlpha).metadata(function(err, metadata) {
        if (err) throw err;
        assert.strictEqual('gif', metadata.format);
        assert.strictEqual(2, metadata.width);
        assert.strictEqual(1, metadata.height);
        assert.strictEqual(4, metadata.channels);
        assert.strictEqual('undefined', typeof metadata.density);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(true, metadata.hasAlpha);
        assert.strictEqual('undefined', typeof metadata.orientation);
        assert.strictEqual('undefined', typeof metadata.exif);
        assert.strictEqual('undefined', typeof metadata.icc);
        done();
      });
    });
  }

  if (sharp.format.openslide.input.file) {
    it('Aperio SVS via openslide', function(done) {
      sharp(fixtures.inputSvs).metadata(function(err, metadata) {
        if (err) throw err;
        assert.strictEqual('openslide', metadata.format);
        assert.strictEqual(2220, metadata.width);
        assert.strictEqual(2967, metadata.height);
        assert.strictEqual(4, metadata.channels);
        assert.strictEqual('undefined', typeof metadata.density);
        assert.strictEqual('rgb', metadata.space);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(true, metadata.hasAlpha);
        assert.strictEqual('undefined', typeof metadata.orientation);
        assert.strictEqual('undefined', typeof metadata.exif);
        assert.strictEqual('undefined', typeof metadata.icc);
        done();
      });
    });
  }

  it('File in, Promise out', function(done) {
    sharp(fixtures.inputJpg).metadata().then(function(metadata) {
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('Non-existent file in, Promise out', function(done) {
    sharp('fail').metadata().then(function(metadata) {
      throw new Error('Non-existent file');
    }, function (err) {
      assert.ok(!!err);
      done();
    });
  });

  it('Stream in, Promise out', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp();
    pipeline.metadata().then(function(metadata) {
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    }).catch(function(err) {
      throw err;
    });
    readable.pipe(pipeline);
  });

  it('Stream', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
    readable.pipe(pipeline);
  });

  it('Resize to half width using metadata', function(done) {
    var image = sharp(fixtures.inputJpg);
    image.metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      image.resize(Math.floor(metadata.width / 2)).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(1362, info.width);
        assert.strictEqual(1112, info.height);
        done();
      });
    });
  });

  it('Keep EXIF metadata and add sRGB profile after a resize', function(done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .withMetadata()
      .toBuffer(function(err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(true, metadata.hasProfile);
          assert.strictEqual(8, metadata.orientation);
          assert.strictEqual('object', typeof metadata.exif);
          assert.strictEqual(true, metadata.exif instanceof Buffer);
          // EXIF
          var exif = exifReader(metadata.exif);
          assert.strictEqual('object', typeof exif);
          assert.strictEqual('object', typeof exif.image);
          assert.strictEqual('number', typeof exif.image.XResolution);
          // ICC
          assert.strictEqual('object', typeof metadata.icc);
          assert.strictEqual(true, metadata.icc instanceof Buffer);
          var profile = icc.parse(metadata.icc);
          assert.strictEqual('object', typeof profile);
          assert.strictEqual('RGB', profile.colorSpace);
          assert.strictEqual('Perceptual', profile.intent);
          assert.strictEqual('Monitor', profile.deviceClass);
          done();
        });
      });
  });

  it('Remove EXIF metadata after a resize', function(done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .withMetadata(false)
      .toBuffer(function(err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(false, metadata.hasProfile);
          assert.strictEqual('undefined', typeof metadata.orientation);
          assert.strictEqual('undefined', typeof metadata.exif);
          assert.strictEqual('undefined', typeof metadata.icc);
          done();
        });
      });
  });

  it('Remove metadata from PNG output', function(done) {
    sharp(fixtures.inputJpgWithExif)
      .png()
      .toBuffer(function(err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(false, metadata.hasProfile);
          assert.strictEqual('undefined', typeof metadata.orientation);
          assert.strictEqual('undefined', typeof metadata.exif);
          assert.strictEqual('undefined', typeof metadata.icc);
          done();
        });
      });
  });

  it('File input with corrupt header fails gracefully', function(done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .metadata(function(err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  it('Buffer input with corrupt header fails gracefully', function(done) {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .metadata(function(err) {
        assert.strictEqual(true, !!err);
        done();
      });
  });

  describe('Invalid withMetadata parameters', function() {
    it('String orientation', function() {
      assert.throws(function() {
        sharp().withMetadata({orientation: 'zoinks'});
      });
    });
    it('Negative orientation', function() {
      assert.throws(function() {
        sharp().withMetadata({orientation: -1});
      });
    });
    it('Zero orientation', function () {
      assert.throws(function () {
        sharp().withMetadata({ orientation: 0 });
      });
    });
    it('Too large orientation', function() {
      assert.throws(function() {
        sharp().withMetadata({orientation: 9});
      });
    });
  });
});
