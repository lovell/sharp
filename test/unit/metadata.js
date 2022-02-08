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
      assert.strictEqual(true, ['undefined', 'number'].includes(typeof metadata.density));
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
      assert.strictEqual('inch', metadata.resolutionUnit);
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

  it('Animated WebP', () =>
    sharp(fixtures.inputWebPAnimated)
      .metadata()
      .then(({
        format, width, height, space, channels, depth,
        isProgressive, pages, loop, delay, hasProfile,
        hasAlpha
      }) => {
        assert.strictEqual(format, 'webp');
        assert.strictEqual(width, 80);
        assert.strictEqual(height, 80);
        assert.strictEqual(space, 'srgb');
        assert.strictEqual(channels, 4);
        assert.strictEqual(depth, 'uchar');
        assert.strictEqual(isProgressive, false);
        assert.strictEqual(pages, 9);
        assert.strictEqual(loop, 0);
        assert.deepStrictEqual(delay, [120, 120, 90, 120, 120, 90, 120, 90, 30]);
        assert.strictEqual(hasProfile, false);
        assert.strictEqual(hasAlpha, true);
      })
  );

  it('Animated WebP with all pages', () =>
    sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .metadata()
      .then(({
        format, width, height, space, channels, depth,
        isProgressive, pages, pageHeight, loop, delay,
        hasProfile, hasAlpha
      }) => {
        assert.strictEqual(format, 'webp');
        assert.strictEqual(width, 80);
        assert.strictEqual(height, 720);
        assert.strictEqual(space, 'srgb');
        assert.strictEqual(channels, 4);
        assert.strictEqual(depth, 'uchar');
        assert.strictEqual(isProgressive, false);
        assert.strictEqual(pages, 9);
        assert.strictEqual(pageHeight, 80);
        assert.strictEqual(loop, 0);
        assert.deepStrictEqual(delay, [120, 120, 90, 120, 120, 90, 120, 90, 30]);
        assert.strictEqual(hasProfile, false);
        assert.strictEqual(hasAlpha, true);
      })
  );

  it('Animated WebP with limited looping', () =>
    sharp(fixtures.inputWebPAnimatedLoop3)
      .metadata()
      .then(({
        format, width, height, space, channels, depth,
        isProgressive, pages, loop, delay, hasProfile,
        hasAlpha
      }) => {
        assert.strictEqual(format, 'webp');
        assert.strictEqual(width, 370);
        assert.strictEqual(height, 285);
        assert.strictEqual(space, 'srgb');
        assert.strictEqual(channels, 4);
        assert.strictEqual(depth, 'uchar');
        assert.strictEqual(isProgressive, false);
        assert.strictEqual(pages, 10);
        assert.strictEqual(loop, 3);
        assert.deepStrictEqual(delay, [...Array(9).fill(3000), 15000]);
        assert.strictEqual(hasProfile, false);
        assert.strictEqual(hasAlpha, true);
      })
  );

  it('GIF', function (done) {
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
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      assert.deepStrictEqual(metadata.background, { r: 138, g: 148, b: 102 });
      done();
    });
  });
  it('GIF grey+alpha', function (done) {
    sharp(fixtures.inputGifGreyPlusAlpha).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('gif', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(2, metadata.width);
      assert.strictEqual(1, metadata.height);
      assert.strictEqual(4, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual('undefined', typeof metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('Animated GIF', () =>
    sharp(fixtures.inputGifAnimated)
      .metadata()
      .then(({
        format, width, height, space, channels, depth,
        isProgressive, pages, loop, delay, background,
        hasProfile, hasAlpha
      }) => {
        assert.strictEqual(format, 'gif');
        assert.strictEqual(width, 80);
        assert.strictEqual(height, 80);
        assert.strictEqual(space, 'srgb');
        assert.strictEqual(channels, 4);
        assert.strictEqual(depth, 'uchar');
        assert.strictEqual(isProgressive, false);
        assert.strictEqual(pages, 30);
        assert.strictEqual(loop, 0);
        assert.deepStrictEqual(delay, Array(30).fill(30));
        assert.deepStrictEqual(background, { r: 0, g: 0, b: 0 });
        assert.strictEqual(hasProfile, false);
        assert.strictEqual(hasAlpha, true);
      })
  );

  it('Animated GIF with limited looping', () =>
    sharp(fixtures.inputGifAnimatedLoop3)
      .metadata()
      .then(({
        format, width, height, space, channels, depth,
        isProgressive, pages, loop, delay, hasProfile,
        hasAlpha
      }) => {
        assert.strictEqual(format, 'gif');
        assert.strictEqual(width, 370);
        assert.strictEqual(height, 285);
        assert.strictEqual(space, 'srgb');
        assert.strictEqual(channels, 4);
        assert.strictEqual(depth, 'uchar');
        assert.strictEqual(isProgressive, false);
        assert.strictEqual(pages, 10);
        assert.strictEqual(loop, 2);
        assert.deepStrictEqual(delay, [...Array(9).fill(3000), 15000]);
        assert.strictEqual(hasProfile, false);
        assert.strictEqual(hasAlpha, true);
      })
  );

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
      assert.strictEqual(true, ['undefined', 'number'].includes(typeof metadata.density));
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
      assert.strictEqual(true, ['undefined', 'number'].includes(typeof metadata.density));
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
      assert.strictEqual(true, ['undefined', 'number'].includes(typeof metadata.density));
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
      assert.strictEqual(true, ['undefined', 'number'].includes(typeof metadata.density));
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

  it('Apply CMYK output ICC profile', function (done) {
    const output = fixtures.path('output.icc-cmyk.jpg');
    sharp(fixtures.inputJpg)
      .resize(64)
      .withMetadata({ icc: 'cmyk' })
      .toFile(output, function (err) {
        if (err) throw err;
        sharp(output).metadata(function (err, metadata) {
          if (err) throw err;
          assert.strictEqual(true, metadata.hasProfile);
          assert.strictEqual('cmyk', metadata.space);
          assert.strictEqual(4, metadata.channels);
          // ICC
          assert.strictEqual('object', typeof metadata.icc);
          assert.strictEqual(true, metadata.icc instanceof Buffer);
          const profile = icc.parse(metadata.icc);
          assert.strictEqual('object', typeof profile);
          assert.strictEqual('CMYK', profile.colorSpace);
          assert.strictEqual('Relative', profile.intent);
          assert.strictEqual('Printer', profile.deviceClass);
        });
        fixtures.assertSimilar(output, fixtures.expected('icc-cmyk.jpg'), { threshold: 1 }, done);
      });
  });

  it('Apply custom output ICC profile', function (done) {
    const output = fixtures.path('output.hilutite.jpg');
    sharp(fixtures.inputJpg)
      .resize(64)
      .withMetadata({ icc: fixtures.path('hilutite.icm') })
      .toFile(output, function (err, info) {
        if (err) throw err;
        fixtures.assertMaxColourDistance(output, fixtures.expected('hilutite.jpg'), 9);
        done();
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

  it('Add EXIF metadata to JPEG', async () => {
    const data = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: 'red'
      }
    })
      .jpeg()
      .withMetadata({
        exif: {
          IFD0: { Software: 'sharp' },
          IFD2: { ExposureTime: '0.2' }
        }
      })
      .toBuffer();

    const { exif } = await sharp(data).metadata();
    const parsedExif = exifReader(exif);
    assert.strictEqual(parsedExif.image.Software, 'sharp');
    assert.strictEqual(parsedExif.exif.ExposureTime, 0.2);
  });

  it('Set density of JPEG', async () => {
    const data = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: 'red'
      }
    })
      .withMetadata({
        density: 300
      })
      .jpeg()
      .toBuffer();

    const { density } = await sharp(data).metadata();
    assert.strictEqual(density, 300);
  });

  it('Set density of PNG', async () => {
    const data = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: 'red'
      }
    })
      .withMetadata({
        density: 96
      })
      .png()
      .toBuffer();

    const { density } = await sharp(data).metadata();
    assert.strictEqual(density, 96);
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

  it('AVIF', async () => {
    const metadata = await sharp(fixtures.inputAvif).metadata();
    assert.deepStrictEqual(metadata, {
      format: 'heif',
      width: 2048,
      height: 858,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      isProgressive: false,
      pages: 1,
      pagePrimary: 0,
      compression: 'av1',
      hasProfile: false,
      hasAlpha: false
    });
  });

  it('File input with corrupt header fails gracefully', function (done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .metadata(function (err) {
        assert.strictEqual(true, !!err);
        assert.ok(err.message.includes('Input file has corrupt header: VipsJpeg: Premature end of'), err);
        done();
      });
  });

  it('Buffer input with corrupt header fails gracefully', function (done) {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .metadata(function (err) {
        assert.strictEqual(true, !!err);
        assert.ok(err.message.includes('Input buffer has corrupt header: VipsJpeg: Premature end of'), err);
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
    it('Non-numeric density', function () {
      assert.throws(function () {
        sharp().withMetadata({ density: '1' });
      });
    });
    it('Negative density', function () {
      assert.throws(function () {
        sharp().withMetadata({ density: -1 });
      });
    });
    it('Non string icc', function () {
      assert.throws(function () {
        sharp().withMetadata({ icc: true });
      });
    });
    it('Non object exif', function () {
      assert.throws(function () {
        sharp().withMetadata({ exif: false });
      });
    });
    it('Non string value in object exif', function () {
      assert.throws(function () {
        sharp().withMetadata({ exif: { ifd0: false } });
      });
    });
    it('Non string value in nested object exif', function () {
      assert.throws(function () {
        sharp().withMetadata({ exif: { ifd0: { fail: false } } });
      });
    });
  });
});
