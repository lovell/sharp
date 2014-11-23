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

  it('Invalid width', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize('spoons', 240);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Invalid height', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).resize(320, 'spoons');
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

});
