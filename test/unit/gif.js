'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('GIF input', () => {
  it('GIF Buffer to JPEG Buffer', () =>
    sharp(fs.readFileSync(fixtures.inputGif))
      .resize(8, 4)
      .jpeg()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(8, info.width);
        assert.strictEqual(4, info.height);
      })
  );

  it('2 channel GIF file to PNG Buffer', () =>
    sharp(fixtures.inputGifGreyPlusAlpha)
      .resize(8, 4)
      .png()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('png', info.format);
        assert.strictEqual(8, info.width);
        assert.strictEqual(4, info.height);
        assert.strictEqual(4, info.channels);
      })
  );

  it('Animated GIF first page to PNG', () =>
    sharp(fixtures.inputGifAnimated)
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual(sharp.format.magick.input.buffer ? 'gif' : 'png', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(80, info.height);
        assert.strictEqual(4, info.channels);
      })
  );

  it('Animated GIF all pages to PNG "toilet roll"', () =>
    sharp(fixtures.inputGifAnimated, { pages: -1 })
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual(sharp.format.magick.input.buffer ? 'gif' : 'png', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(2400, info.height);
        assert.strictEqual(4, info.channels);
      })
  );

  if (!sharp.format.magick.output.buffer) {
    it('GIF buffer output should fail due to missing ImageMagick', () => {
      assert.throws(
        () => sharp().gif(),
        /GIF output requires libvips with support for ImageMagick/
      );
    });

    it('GIF file output should fail due to missing ImageMagick', () => {
      assert.rejects(
        async () => await sharp().toFile('test.gif'),
        /GIF output requires libvips with support for ImageMagick/
      );
    });
  }

  it('invalid pageHeight throws', () => {
    assert.throws(() => {
      sharp().gif({ pageHeight: 0 });
    });
  });

  it('invalid loop throws', () => {
    assert.throws(() => {
      sharp().gif({ loop: -1 });
    });

    assert.throws(() => {
      sharp().gif({ loop: 65536 });
    });
  });

  it('invalid delay throws', () => {
    assert.throws(() => {
      sharp().gif({ delay: [-1] });
    });

    assert.throws(() => {
      sharp().gif({ delay: [65536] });
    });
  });

  it('should work with streams when only animated is set', function (done) {
    if (sharp.format.magick.output.buffer) {
      fs.createReadStream(fixtures.inputGifAnimated)
        .pipe(sharp({ animated: true }))
        .gif()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('gif', info.format);
          fixtures.assertSimilar(fixtures.inputGifAnimated, data, done);
        });
    } else {
      done();
    }
  });

  it('should work with streams when only pages is set', function (done) {
    if (sharp.format.magick.output.buffer) {
      fs.createReadStream(fixtures.inputGifAnimated)
        .pipe(sharp({ pages: -1 }))
        .gif()
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('gif', info.format);
          fixtures.assertSimilar(fixtures.inputGifAnimated, data, done);
        });
    } else {
      done();
    }
  });
});
