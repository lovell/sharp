// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const fs = require('fs');
const assert = require('assert');
const exifReader = require('exif-reader');
const icc = require('icc');

const sharp = require('../../');
const fixtures = require('../fixtures');

const create = { width: 1, height: 1, channels: 3, background: 'red' };

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
      assert.strictEqual('object', typeof exif.Image);
      assert.strictEqual('number', typeof exif.Image.XResolution);
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
      assert.strictEqual(2464, metadata.autoOrient.width);
      assert.strictEqual(3248, metadata.autoOrient.height);
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
      assert.strictEqual(2809, metadata.autoOrient.width);
      assert.strictEqual(2074, metadata.autoOrient.height);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      done();
    });
  });

  it('PNG with comment', function (done) {
    sharp(fixtures.inputPngTestJoinChannel).metadata(function (err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual('undefined', typeof metadata.size);
      assert.strictEqual(320, metadata.width);
      assert.strictEqual(240, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual('uchar', metadata.depth);
      assert.strictEqual(72, metadata.density);
      assert.strictEqual('undefined', typeof metadata.chromaSubsampling);
      assert.strictEqual(false, metadata.isProgressive);
      assert.strictEqual(false, metadata.hasProfile);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual('undefined', typeof metadata.orientation);
      assert.strictEqual('undefined', typeof metadata.exif);
      assert.strictEqual('undefined', typeof metadata.icc);
      assert.strictEqual(1, metadata.comments.length);
      assert.strictEqual('Comment', metadata.comments[0].keyword);
      assert.strictEqual('Created with GIMP', metadata.comments[0].text);
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

  it('PNG with greyscale bKGD chunk - 8 bit', async () => {
    const data = await sharp(fixtures.inputPng8BitGreyBackground).metadata();
    assert.deepStrictEqual(data, {
      background: {
        gray: 0
      },
      bitsPerSample: 8,
      channels: 2,
      density: 72,
      depth: 'uchar',
      format: 'png',
      hasAlpha: true,
      hasProfile: false,
      height: 32,
      isPalette: false,
      isProgressive: false,
      space: 'b-w',
      width: 32,
      autoOrient: {
        width: 32,
        height: 32
      }
    });
  });

  it('PNG with greyscale bKGD chunk - 16 bit', async () => {
    const data = await sharp(fixtures.inputPng16BitGreyBackground).metadata();
    assert.deepStrictEqual(data, {
      background: {
        gray: 67
      },
      bitsPerSample: 16,
      channels: 2,
      density: 72,
      depth: 'ushort',
      format: 'png',
      hasAlpha: true,
      hasProfile: false,
      height: 32,
      isPalette: false,
      isProgressive: false,
      space: 'grey16',
      width: 32,
      autoOrient: {
        width: 32,
        height: 32
      }
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
        assert.strictEqual(loop, 3);
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

  it('Non-existent file in, Promise out', async () =>
    assert.rejects(
      () => sharp('fail').metadata(),
      (err) => {
        assert.strictEqual(err.message, 'Input file is missing: fail');
        assert(err.stack.includes('at Sharp.metadata'));
        assert(err.stack.includes(__filename));
        return true;
      }
    )
  );

  it('Invalid stream in, callback out', (done) => {
    fs.createReadStream(__filename).pipe(
      sharp().metadata((err) => {
        assert.strictEqual(err.message, 'Input buffer contains unsupported image format');
        assert(err.stack.includes('at Sharp.metadata'));
        assert(err.stack.includes(__filename));
        done();
      })
    );
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

  it('Stream in, finish event fires before metadata is requested', (done) => {
    const create = { width: 1, height: 1, channels: 3, background: 'red' };
    const image1 = sharp({ create }).png().pipe(sharp());
    const image2 = sharp({ create }).png().pipe(sharp());
    setTimeout(async () => {
      const data1 = await image1.metadata();
      assert.strictEqual('png', data1.format);
      const data2 = await image2.metadata();
      assert.strictEqual('png', data2.format);
      done();
    }, 500);
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
          assert.strictEqual(320, metadata.width);
          assert.strictEqual(240, metadata.height);
          assert.strictEqual(240, metadata.autoOrient.width);
          assert.strictEqual(320, metadata.autoOrient.height);
          assert.strictEqual('object', typeof metadata.exif);
          assert.strictEqual(true, metadata.exif instanceof Buffer);
          // EXIF
          const exif = exifReader(metadata.exif);
          assert.strictEqual('object', typeof exif);
          assert.strictEqual('object', typeof exif.Image);
          assert.strictEqual('number', typeof exif.Image.XResolution);
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

  it('keep existing ICC profile', async () => {
    const data = await sharp(fixtures.inputJpgWithExif)
      .keepIccProfile()
      .toBuffer();

    const metadata = await sharp(data).metadata();
    const { description } = icc.parse(metadata.icc);
    assert.strictEqual(description, 'Generic RGB Profile');
  });

  it('keep existing ICC profile, ignore colourspace conversion', async () => {
    const data = await sharp(fixtures.inputJpgWithExif)
      .keepIccProfile()
      .toColourspace('cmyk')
      .toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(metadata.channels, 3);
    const { description } = icc.parse(metadata.icc);
    assert.strictEqual(description, 'Generic RGB Profile');
  });

  it('keep existing ICC profile, avoid colour transform', async () => {
    const [r, g, b] = await sharp(fixtures.inputPngWithProPhotoProfile)
      .keepIccProfile()
      .raw()
      .toBuffer();

    assert.strictEqual(r, 131);
    assert.strictEqual(g, 141);
    assert.strictEqual(b, 192);
  });

  it('keep existing CMYK ICC profile', async () => {
    const data = await sharp(fixtures.inputJpgWithCmykProfile)
      .pipelineColourspace('cmyk')
      .toColourspace('cmyk')
      .keepIccProfile()
      .toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(metadata.channels, 4);
    const { description } = icc.parse(metadata.icc);
    assert.strictEqual(description, 'U.S. Web Coated (SWOP) v2');
  });

  it('transform to ICC profile and attach', async () => {
    const data = await sharp({ create })
      .png()
      .withIccProfile('p3', { attach: true })
      .toBuffer();

    const metadata = await sharp(data).metadata();
    const { description } = icc.parse(metadata.icc);
    assert.strictEqual(description, 'sP3C');
  });

  it('transform to ICC profile but do not attach', async () => {
    const data = await sharp({ create })
      .png()
      .withIccProfile('p3', { attach: false })
      .toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(3, metadata.channels);
    assert.strictEqual(undefined, metadata.icc);
  });

  it('transform to invalid ICC profile emits warning', async () => {
    const img = sharp({ create })
      .png()
      .withIccProfile(fixtures.path('invalid-illuminant.icc'));

    const warningsEmitted = [];
    img.on('warning', (warning) => {
      warningsEmitted.push(warning);
    });

    const data = await img.toBuffer();
    assert.strict(warningsEmitted.includes('Invalid profile'));

    const metadata = await sharp(data).metadata();
    assert.strictEqual(3, metadata.channels);
    assert.strictEqual(undefined, metadata.icc);
  });

  it('Apply CMYK output ICC profile', function (done) {
    const output = fixtures.path('output.icc-cmyk.jpg');
    sharp(fixtures.inputJpg)
      .resize(64)
      .withIccProfile('cmyk')
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
      .withIccProfile(fixtures.path('hilutite.icm'))
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
          assert.strictEqual('object', typeof exif.Image);
          assert.strictEqual('number', typeof exif.Image.XResolution);
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
    const data = await sharp({ create })
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
    assert.strictEqual(parsedExif.Image.Software, 'sharp');
    assert.strictEqual(parsedExif.Photo.ExposureTime, 0.2);
  });

  it('Set density of JPEG', async () => {
    const data = await sharp({ create })
      .withMetadata({
        density: 300
      })
      .jpeg()
      .toBuffer();

    const { density } = await sharp(data).metadata();
    assert.strictEqual(density, 300);
  });

  it('Set density of PNG', async () => {
    const data = await sharp({ create })
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
      isPalette: false,
      bitsPerSample: 8,
      pages: 1,
      pagePrimary: 0,
      compression: 'av1',
      hasProfile: false,
      hasAlpha: false,
      autoOrient: {
        width: 2048,
        height: 858
      }
    });
  });

  it('withMetadata adds default sRGB profile', async () => {
    const data = await sharp(fixtures.inputJpg)
      .resize(32, 24)
      .withMetadata()
      .toBuffer();

    const metadata = await sharp(data).metadata();
    const { colorSpace, deviceClass, intent } = icc.parse(metadata.icc);
    assert.strictEqual(colorSpace, 'RGB');
    assert.strictEqual(deviceClass, 'Monitor');
    assert.strictEqual(intent, 'Perceptual');
  });

  it('withMetadata adds default sRGB profile to RGB16', async () => {
    const data = await sharp({ create })
      .toColorspace('rgb16')
      .png()
      .withMetadata()
      .toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(metadata.depth, 'ushort');

    const { description } = icc.parse(metadata.icc);
    assert.strictEqual(description, 'sRGB');
  });

  it('withMetadata adds P3 profile to 16-bit PNG', async () => {
    const data = await sharp({ create })
      .toColorspace('rgb16')
      .png()
      .withMetadata({ icc: 'p3' })
      .toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(metadata.depth, 'ushort');

    const { description } = icc.parse(metadata.icc);
    assert.strictEqual(description, 'sP3C');
  });

  it('File input with corrupt header fails gracefully', function (done) {
    sharp(fixtures.inputJpgWithCorruptHeader)
      .metadata(function (err) {
        assert.strictEqual(true, !!err);
        assert.ok(err.message.includes('Input file has corrupt header: VipsJpeg: premature end of'), err);
        done();
      });
  });

  it('Buffer input with corrupt header fails gracefully', function (done) {
    sharp(fs.readFileSync(fixtures.inputJpgWithCorruptHeader))
      .metadata(function (err) {
        assert.strictEqual(true, !!err);
        assert.ok(err.message.includes('Input buffer has corrupt header: VipsJpeg: premature end of'), err);
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

  it('keepExif maintains all EXIF metadata', async () => {
    const data1 = await sharp({ create })
      .withExif({
        IFD0: {
          Copyright: 'Test 1',
          Software: 'sharp'
        }
      })
      .jpeg()
      .toBuffer();

    const data2 = await sharp(data1)
      .keepExif()
      .toBuffer();

    const md2 = await sharp(data2).metadata();
    const exif2 = exifReader(md2.exif);
    assert.strictEqual(exif2.Image.Copyright, 'Test 1');
    assert.strictEqual(exif2.Image.Software, 'sharp');
  });

  it('withExif replaces all EXIF metadata', async () => {
    const data1 = await sharp({ create })
      .withExif({
        IFD0: {
          Copyright: 'Test 1',
          Software: 'sharp'
        }
      })
      .jpeg()
      .toBuffer();

    const md1 = await sharp(data1).metadata();
    const exif1 = exifReader(md1.exif);
    assert.strictEqual(exif1.Image.Copyright, 'Test 1');
    assert.strictEqual(exif1.Image.Software, 'sharp');

    const data2 = await sharp(data1)
      .withExif({
        IFD0: {
          Copyright: 'Test 2'
        }
      })
      .toBuffer();

    const md2 = await sharp(data2).metadata();
    const exif2 = exifReader(md2.exif);
    assert.strictEqual(exif2.Image.Copyright, 'Test 2');
    assert.strictEqual(exif2.Image.Software, undefined);
  });

  it('withExifMerge merges all EXIF metadata', async () => {
    const data1 = await sharp({ create })
      .withExif({
        IFD0: {
          Copyright: 'Test 1'
        }
      })
      .jpeg()
      .toBuffer();

    const md1 = await sharp(data1).metadata();
    const exif1 = exifReader(md1.exif);
    assert.strictEqual(exif1.Image.Copyright, 'Test 1');
    assert.strictEqual(exif1.Image.Software, undefined);

    const data2 = await sharp(data1)
      .withExifMerge({
        IFD0: {
          Copyright: 'Test 2',
          Software: 'sharp'

        }
      })
      .toBuffer();

    const md2 = await sharp(data2).metadata();
    const exif2 = exifReader(md2.exif);
    assert.strictEqual(exif2.Image.Copyright, 'Test 2');
    assert.strictEqual(exif2.Image.Software, 'sharp');
  });

  describe('Invalid parameters', function () {
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
    it('withIccProfile invalid profile', () => {
      assert.throws(
        () => sharp().withIccProfile(false),
        /Expected string for icc but received false of type boolean/
      );
    });
    it('withIccProfile missing attach', () => {
      assert.doesNotThrow(
        () => sharp().withIccProfile('test', {})
      );
    });
    it('withIccProfile invalid attach', () => {
      assert.throws(
        () => sharp().withIccProfile('test', { attach: 1 }),
        /Expected boolean for attach but received 1 of type number/
      );
    });
  });
});
