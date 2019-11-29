'use strict';

const fs = require('fs');
const assert = require('assert');
const exifReader = require('exif-reader');
const icc = require('icc');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Image metadata', function () {
  it('JPEG', function (done) {
    sharp(fixtures.inputJpg).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('4:2:0', metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('JPEG with EXIF/ICC', function (done) {
    sharp(fixtures.inputJpgWithExif).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(450, metadata.width);
      assert.strictEqual(600, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual(72, metadata.density);
      assert.strictEqual('4:2:0', metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(true, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual(8, metadata.orientation);
      // EXIF
      assert.strictEqual('object', typeof metadata.exif);
      assert.strictEqual(true, metadata.exif instanceof Buffer);
      const exif = exifReader(metadata.exif);
      assert.strictEqual('object', typeof exif);
      assert.strictEqual('object', typeof exif.image);
      assert.strictEqual('number', typeof exif.image.XResolution);
      // ICC
      assert.strictEqual('object', typeof metadata.icc);
      assert.strictEqual(true, metadata.icc instanceof Buffer);
      const profile = icc.parse(metadata.icc);
      assert.strictEqual('object', typeof profile);
      assert.strictEqual('Generic RGB Profile', profile.description);
      done();
    });
  });

  it('JPEG with IPTC/XMP', function (done) {
    sharp(fixtures.inputJpgWithIptcAndXmp).metadata(function (err, metadata) {
      if (err) throw err;
      // IPTC
      assert.strictEqual('object', typeof metadata.iptc);
      assert.strictEqual(true, metadata.iptc instanceof Buffer);
      assert.strictEqual(18250, metadata.iptc.byteLength);
      assert.strictEqual(metadata.iptc.indexOf(Buffer.from('Photoshop')), 0);
      // XMP
      assert.strictEqual('object', typeof metadata.xmp);
      assert.strictEqual(true, metadata.xmp instanceof Buffer);
      assert.strictEqual(12466, metadata.xmp.byteLength);
      assert.strictEqual(metadata.xmp.indexOf(Buffer.from('<?xpacket begin="')), 0);
      done();
    });
  });

  it('TIFF', function (done) {
    sharp(fixtures.inputTiff).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('tiff', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2464, metadata.width);
      assert.strictEqual(3248, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual(300, metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual(1, metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('Multipage TIFF', function (done) {
    sharp(fixtures.inputTiffMultipage).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('tiff', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2464, metadata.width);
      assert.strictEqual(3248, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual(300, metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(2, metadata.pages);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual(1, metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('PNG', function (done) {
    sharp(fixtures.inputPng).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2809, metadata.width);
      assert.strictEqual(2074, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual(300, metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('Transparent PNG', function (done) {
    sharp(fixtures.inputPngWithTransparency).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2048, metadata.width);
      assert.strictEqual(1536, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(4, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual(72, metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(true, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('WebP', function (done) {
    sharp(fixtures.inputWebP).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('webp', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(1024, metadata.width);
      assert.strictEqual(772, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('GIF via giflib', function (done) {
    sharp(fixtures.inputGif).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('gif', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(800, metadata.width);
      assert.strictEqual(533, metadata.height);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });
  it('GIF grey+alpha via giflib', function (done) {
    sharp(fixtures.inputGifGreyPlusAlpha).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('gif', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2, metadata.width);
      assert.strictEqual(1, metadata.height);
      assert.strictEqual(2, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(true, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });
  it('vips', () =>
    sharp(fixtures.inputV)
      .metadata()
      .then(metadata => {
        assert.strictEqual('vips', metadata.format);
        assert.strictEqual('undefined', typeof metadata.size);
        assert.strictEqual(70, metadata.width);
        assert.strictEqual(60, metadata.height);
        assert.strictEqual(3, metadata.channels);
        assert.strictEqual('uchar', metadata.depth);
        assert.strictEqual(72, metadata.density);
        assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
        assert.strictEqual(false, metadata.isProgressive);
        assert.strictEqual(false, metadata.hasProfile);
        assert.strictEqual(false, metadata.hasAlpha);
        assert.strictEqual('undefined', typeof metadata.orientation);
        assert.strictEqual('undefined', typeof metadata.exif);
        assert.strictEqual('undefined', typeof metadata.icc);
      })
  );

  it('File in, Promise out', function (done) {
    sharp(fixtures.inputJpg).metadata().then(function (metadata) {
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('4:2:0', metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('Non-existent file in, Promise out', function (done) {
    sharp('fail').metadata().then(function (metadata) {
      throw new Error('Non-existent file');
    }, function (err) {
      assert.ok(!!err);
      done();
    });
  });

  it('Stream in, Promise out', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp();
    pipeline.metadata().then(function (metadata) {
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(829183, metadata.size);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('4:2:0', metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    }).catch(done);
    readable.pipe(pipeline);
  });

  it('Stream in, rejected Promise out', () => {
    const pipeline = sharp();
    fs
      .createReadStream(__filename)
      .pipe(pipeline);

    return pipeline
      .metadata()
      .then(
        () => Promise.reject(new Error('Expected metadata to reject')),
        err => assert.strictEqual(err.message, 'Input buffer contains unsupported image format')
      );
  });

  it('Stream', function (done) {
    const readable = fs.createReadStream(fixtures.inputJpg);
    const pipeline = sharp().metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(829183, metadata.size);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('4:2:0', metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
    readable.pipe(pipeline);
  });

  it('Resize to half width using metadata', function (done) {
    const image = sharp(fixtures.inputJpg);
    image.metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('4:2:0', metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      image.resize(Math.floor(metadata.width / 2)).toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(1362, info.width);
        assert.strictEqual(1112, info.height);
        done();
      });
    });
  });

  it('Keep EXIF metadata and add sRGB profile after a resize', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .withMetadata()
      .toBuffer(function (err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(true, metadata.hasProfile);
          assert.strictEqual(8, metadata.orientation);
          assert.strictEqual('object', typeof metadata.exif);
          assert.strictEqual(true, metadata.exif instanceof Buffer);
          // EXIF
          const exif = exifReader(metadata.exif);
          assert.strictEqual('object', typeof exif);
          assert.strictEqual('object', typeof exif.image);
          assert.strictEqual('number', typeof exif.image.XResolution);
          // ICC
          assert.strictEqual('object', typeof metadata.icc);
          assert.strictEqual(true, metadata.icc instanceof Buffer);
          const profile = icc.parse(metadata.icc);
          assert.strictEqual('object', typeof profile);
          assert.strictEqual('RGB', profile.colorSpace);
          assert.strictEqual('Perceptual', profile.intent);
          assert.strictEqual('Monitor', profile.deviceClass);
          done();
        });
      });
  });

  it('Include metadata in output, enabled via empty object', () =>
    sharp(fixtures.inputJpgWithExif)
      .withMetadata({})
      .toBuffer()
      .then((buffer) => sharp(buffer)
        .metadata()
        .then(metadata => {
          assert.strictEqual(true, metadata.hasProfile);
          assert.strictEqual(8, metadata.orientation);
          assert.strictEqual('object', typeof metadata.exif);
          assert.strictEqual(true, metadata.exif instanceof Buffer);
          // EXIF
          const exif = exifReader(metadata.exif);
          assert.strictEqual('object', typeof exif);
          assert.strictEqual('object', typeof exif.image);
          assert.strictEqual('number', typeof exif.image.XResolution);
          // ICC
          assert.strictEqual('object', typeof metadata.icc);
          assert.strictEqual(true, metadata.icc instanceof Buffer);
          const profile = icc.parse(metadata.icc);
          assert.strictEqual('object', typeof profile);
          assert.strictEqual('RGB', profile.colorSpace);
          assert.strictEqual('Perceptual', profile.intent);
          assert.strictEqual('Monitor', profile.deviceClass);
        })
      )
  );

  it('Remove EXIF metadata after a resize', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .withMetadata(false)
      .toBuffer(function (err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(false, metadata.hasProfile);
          assert.strictEqual('undefined', typeof metadata.orientation);
          assert.strictEqual('undefined', typeof metadata.exif);
          assert.strictEqual('undefined', typeof metadata.icc);
          done();
        });
      });
  });

  it('Remove metadata from PNG output', function (done) {
    sharp(fixtures.inputJpgWithExif)
      .png()
      .toBuffer(function (err, buffer) {
        if (err) throw err;
        sharp(buffer).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(false, metadata.hasProfile);
          assert.strictEqual('undefined', typeof metadata.orientation);
          assert.strictEqual('undefined', typeof metadata.exif);
          assert.strictEqual('undefined', typeof metadata.icc);
          done();
        });
      });
  });

  it('chromaSubsampling 4:4:4:4 CMYK JPEG', function () {
    return sharp(fixtures.inputJpgWithCmykProfile)
      .metadata()
      .then(function (metadata) {
        assert.strictEqual('4:4:4:4', metadata.chromaSubsampling);
      });
  });

  it('chromaSubsampling 4:4:4 RGB JPEG', function () {
    return sharp(fixtures.inputJpg)
      .resize(10, 10)
      .jpeg({ chromaSubsampling: '4:4:4' })
      .toBuffer()
      .then(function (data) {
        return sharp(data)
          .metadata()
          .then(function (metadata) {
            assert.strictEqual('4:4:4', metadata.chromaSubsampling);
          });
      });
  });

  it('isProgressive JPEG', function () {
    return sharp(fixtures.inputJpg)
      .resize(10, 10)
      .jpeg({ progressive: true })
      .toBuffer()
      .then(function (data) {
        return sharp(data)
          .metadata()
          .then(function (metadata) {
            assert.strictEqual(true, metadata.isProgressive);
          });
      });
  });

  it('isProgressive PNG', function () {
    return sharp(fixtures.inputJpg)
      .resize(10, 10)
      .png({ progressive: true })
      .toBuffer()
      .then(function (data) {
        return sharp(data)
          .metadata()
          .then(function (metadata) {
            assert.strictEqual(true, metadata.isProgressive);
          });
      });
  });

  it('16-bit TIFF with TIFFTAG_PHOTOSHOP metadata', () =>
    sharp(fixtures.inputTifftagPhotoshop)
      .metadata()
      .then(metadata => {
        assert.strictEqual(metadata.format, 'tiff');
        assert.strictEqual(metadata.width, 317);
        assert.strictEqual(metadata.height, 211);
        assert.strictEqual(metadata.space, 'rgb16');
        assert.strictEqual(metadata.channels, 3);
        assert.strictEqual(typeof metadata.tifftagPhotoshop, 'object');
        assert.strictEqual(metadata.tifftagPhotoshop instanceof Buffer, true);
        assert.strictEqual(metadata.tifftagPhotoshop.length, 6634);
      })
  );

  it('File input with corrupt header fails gracefully', function (done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .metadata(function (err) {
        assert.strictEqual(true, !!err);
        assert.strictEqual(true, /Input file has corrupt header: VipsJpeg: Premature end of JPEG file/.test(err.message));
        done();
      });
  });

  it('Buffer input with corrupt header fails gracefully', function (done) {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .metadata(function (err) {
        assert.strictEqual(true, !!err);
        assert.strictEqual(true, /Input buffer has corrupt header: VipsJpeg: Premature end of JPEG file/.test(err.message));
        done();
      });
  });

  it('Unsupported lossless JPEG passes underlying error message', function (done) {
    sharp(fixtures.inputJpgLossless)
      .metadata(function (err) {
        assert.strictEqual(true, !!err);
        assert.strictEqual(true, /Input file has corrupt header: VipsJpeg: Unsupported JPEG process: SOF type 0xc3/.test(err.message));
        done();
      });
  });

  describe('Invalid withMetadata parameters', function () {
    it('String orientation', function () {
      assert.throws(function () {
        sharp().withMetadata({ orientation: 'zoinks' });
      });
    });
    it('Negative orientation', function () {
      assert.throws(function () {
        sharp().withMetadata({ orientation: -1 });
      });
    });
    it('Zero orientation', function () {
      assert.throws(function () {
        sharp().withMetadata({ orientation: 0 });
      });
    });
    it('Too large orientation', function () {
      assert.throws(function () {
        sharp().withMetadata({ orientation: 9 });
      });
    });
  });
});
