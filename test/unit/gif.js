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
    it('GIF output should fail due to missing ImageMagick', () => {
      assert.throws(
        () => {
          sharp().gif();
        },
        /The gif operation requires libvips to have been installed with support for ImageMagick/
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
});
