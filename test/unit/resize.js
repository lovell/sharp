'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

sharp.cache(0);

describe('Resize dimensions', function() {

  it('Exact crop', function(done) {
    sharp(fixtures.inputJpg).resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  });

  it('Fixed width', function(done) {
    sharp(fixtures.inputJpg).resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  });

  it('Fixed height', function(done) {
    sharp(fixtures.inputJpg).resize(null, 320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(391, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Identity transform', function(done) {
    sharp(fixtures.inputJpg).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  });

  it('Upscale', function(done) {
    sharp(fixtures.inputJpg).resize(3000).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(2449, info.height);
      done();
    });
  });

  it('Invalid width - NaN', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize('spoons', 240);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Invalid height - NaN', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize(320, 'spoons');
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Invalid width - float', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize(1.5, 240);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Invalid height - float', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize(320, 1.5);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Invalid width - too large', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize(0x4000, 240);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Invalid height - too large', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize(320, 0x4000);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('TIFF embed known to cause rounding errors', function(done) {
    sharp(fixtures.inputTiff).resize(240, 320).embed().jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(240, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('TIFF known to cause rounding errors', function(done) {
    sharp(fixtures.inputTiff).resize(240, 320).jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(240, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Max width or height considering ratio (landscape)', function(done) {
    sharp(fixtures.inputJpg).resize(320, 320).max().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  });

  it('Max width or height considering ratio (portrait)', function(done) {
    sharp(fixtures.inputTiff).resize(320, 320).max().jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(243, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Provide only one dimension with max, should default to crop', function(done) {
    sharp(fixtures.inputJpg).resize(320).max().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  });

  it('Min width or height considering ratio (landscape)', function(done) {
    sharp(fixtures.inputJpg).resize(320, 320).min().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(392, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Min width or height considering ratio (portrait)', function(done) {
    sharp(fixtures.inputTiff).resize(320, 320).min().jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(422, info.height);
      done();
    });
  });

  it('Provide only one dimension with min, should default to crop', function(done) {
    sharp(fixtures.inputJpg).resize(320).min().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  });

  it('Do not enlarge when input width is already less than output width', function(done) {
    sharp(fixtures.inputJpg)
      .resize(2800)
      .withoutEnlargement()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do not enlarge when input height is already less than output height', function(done) {
    sharp(fixtures.inputJpg)
      .resize(null, 2300)
      .withoutEnlargement()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2725, info.width);
        assert.strictEqual(2225, info.height);
        done();
      });
  });

  it('Do enlarge when input width is less than output width', function(done) {
    sharp(fixtures.inputJpg)
      .resize(2800)
      .withoutEnlargement(false)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(2800, info.width);
        assert.strictEqual(2286, info.height);
        done();
      });
  });

  it('Downscale width and height, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(320, 320).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Large reduction of transparent image with Gaussian blur', function(done) {
    sharp(fixtures.inputPngWithFineBrightDetails).resize(1024, 768).interpolateWith('bicubic').toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(1024, info.width);
      assert.strictEqual(768, info.height);
      fixtures.assertSimilar(fixtures.expected('alpha-resizing-bicubic-gaussian-blur-1024x768.png'), data, {threshold: 0}, done);
    });
  });

  it('Large reduction of transparent image without Gaussian blur', function(done) {
    sharp(fixtures.inputPngWithFineBrightDetails).resize(1024, 768).interpolateWith('bicubic').withoutGaussianBlur().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(1024, info.width);
      assert.strictEqual(768, info.height);
      fixtures.assertSimilar(fixtures.expected('alpha-resizing-bicubic-no-gaussian-blur-1024x768.png'), data, {threshold: 0}, done);
    });
  });

  it('Downscale width, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(320).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  });

  it('Downscale height, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(null, 320).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Upscale width and height, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(3000, 3000).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(3000, info.height);
      done();
    });
  });

  it('Upscale width, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(3000).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  });

  it('Upscale height, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(null, 3000).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(3000, info.height);
      done();
    });
  });

  it('Downscale width, upscale height, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(320, 3000).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(3000, info.height);
      done();
    });
  });

  it('Upscale width, downscale height, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).resize(3000, 320).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  });

  it('Identity transform, ignoring aspect ratio', function(done) {
    sharp(fixtures.inputJpg).ignoreAspectRatio().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  });

});
