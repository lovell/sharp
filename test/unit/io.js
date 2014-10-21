'use strict';

var fs = require('fs');
var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Input/output', function() {

  it('Read from File and write to Stream', function(done) {
    var writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function() {
      sharp(fixtures.outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(fixtures.outputJpg);
        done();
      });
    });
    sharp(fixtures.inputJpg).resize(320, 240).pipe(writable);
  });

  it('Read from Buffer and write to Stream', function(done) {
    var inputJpgBuffer = fs.readFileSync(fixtures.inputJpg);
    var writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function() {
      sharp(fixtures.outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(fixtures.outputJpg);
        done();
      });
    });
    sharp(inputJpgBuffer).resize(320, 240).pipe(writable);
  });

  it('Read from Stream and write to File', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().resize(320, 240).toFile(fixtures.outputJpg, function(err, info) {
      if (err) throw err;
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    readable.pipe(pipeline);
  });

  it('Read from Stream and write to Buffer', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
    readable.pipe(pipeline);
  });

  it('Read from Stream and write to Buffer via Promise', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var pipeline = sharp().resize(1, 1);
    pipeline.toBuffer().then(function(data) {
      assert.strictEqual(true, data.length > 0);
      done();
    }).catch(function(err) {
      throw err;
    });
    readable.pipe(pipeline);
  });

  it('Read from Stream and write to Stream', function(done) {
    var readable = fs.createReadStream(fixtures.inputJpg);
    var writable = fs.createWriteStream(fixtures.outputJpg);
    writable.on('finish', function() {
      sharp(fixtures.outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(fixtures.outputJpg);
        done();
      });
    });
    var pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline).pipe(writable);
  });

  it('Handle Stream to Stream error ', function(done) {
    var pipeline = sharp().resize(320, 240);
    var anErrorWasEmitted = false;
    pipeline.on('error', function(err) {
      anErrorWasEmitted = !!err;
    }).on('end', function() {
      assert(anErrorWasEmitted);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    var readableButNotAnImage = fs.createReadStream(__filename);
    var writable = fs.createWriteStream(fixtures.outputJpg);
    readableButNotAnImage.pipe(pipeline).pipe(writable);
  });

  it('Handle File to Stream error', function(done) {
    var readableButNotAnImage = sharp(__filename).resize(320, 240);
    var anErrorWasEmitted = false;
    readableButNotAnImage.on('error', function(err) {
      anErrorWasEmitted = !!err;
    }).on('end', function() {
      assert(anErrorWasEmitted);
      fs.unlinkSync(fixtures.outputJpg);
      done();
    });
    var writable = fs.createWriteStream(fixtures.outputJpg);
    readableButNotAnImage.pipe(writable);
  });

  it('Sequential read', function(done) {
    sharp(fixtures.inputJpg)
      .sequentialRead()
      .resize(320, 240)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Not sequential read', function(done) {
    sharp(fixtures.inputJpg)
      .sequentialRead(false)
      .resize(320, 240)
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Fail when output File is input File', function(done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg, function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is input File via Promise', function(done) {
    sharp(fixtures.inputJpg).toFile(fixtures.inputJpg).then(function(data) {
      assert(false);
      done();
    }).catch(function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is empty', function(done) {
    sharp(fixtures.inputJpg).toFile('', function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when output File is empty via Promise', function(done) {
    sharp(fixtures.inputJpg).toFile('').then(function(data) {
      assert(false);
      done();
    }).catch(function(err) {
      assert(!!err);
      done();
    });
  });

  it('Fail when input is empty Buffer', function(done) {
    var fail = false;
    try {
      sharp(new Buffer(0));
      fail = true;
    } catch (e) {}
    assert(!fail);
    done();
  });

  it('Promises/A+', function(done) {
    sharp(fixtures.inputJpg).resize(320, 240).toBuffer().then(function(data) {
      sharp(data).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
    }).catch(function(err) {
      throw err;
    });
  });

  it('JPEG quality', function(done) {
    sharp(fixtures.inputJpg).resize(320, 240).quality(70).toBuffer(function(err, buffer70) {
      if (err) throw err;
      sharp(fixtures.inputJpg).resize(320, 240).toBuffer(function(err, buffer80) {
        if (err) throw err;
        sharp(fixtures.inputJpg).resize(320, 240).quality(90).toBuffer(function(err, buffer90) {
          if (err) throw err;
          assert(buffer70.length < buffer80.length);
          assert(buffer80.length < buffer90.length);
          done();
        });
      });
    });
  });

  it('Invalid quality', function(done) {
    var isValid = true;
    try {
      sharp(fixtures.inputJpg).quality(-1);
    } catch (err) {
      isValid = false;
    }
    assert.strictEqual(false, isValid);
    done();
  });

  it('Progressive image', function(done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png()
      .progressive(false)
      .toBuffer(function(err, nonProgressive, info) {
        if (err) throw err;
        assert.strictEqual(true, nonProgressive.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(nonProgressive)
          .progressive()
          .toBuffer(function(err, progressive, info) {
            if (err) throw err;
            assert.strictEqual(true, progressive.length > 0);
            assert.strictEqual(true, progressive.length > nonProgressive.length);
            assert.strictEqual('png', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            done();
          });
      });
  });

  describe('Output filename without extension uses input format', function() {

    it('JPEG', function(done) {
      sharp(fixtures.inputJpg).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fs.unlinkSync(fixtures.outputZoinks);
        done();
      });
    });

    it('PNG', function(done) {
      sharp(fixtures.inputPng).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fs.unlinkSync(fixtures.outputZoinks);
        done();
      });
    });

    it('Transparent PNG', function(done) {
      sharp(fixtures.inputPngWithTransparency).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        done();
      });
    });

    it('WebP', function(done) {
      sharp(fixtures.inputWebP).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fs.unlinkSync(fixtures.outputZoinks);
        done();
      });
    });

    it('TIFF', function(done) {
      sharp(fixtures.inputTiff).resize(320, 80).toFile(fixtures.outputZoinks, function(err, info) {
        if (err) throw err;
        assert.strictEqual('tiff', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(80, info.height);
        fs.unlinkSync(fixtures.outputZoinks);
        done();
      });
    });

    it('Fail with GIF', function(done) {
      sharp(fixtures.inputGif).resize(320, 80).toFile(fixtures.outputZoinks, function(err) {
        assert(!!err);
        done();
      });
    });

  });

  describe('PNG compression level', function() {

    it('valid', function(done) {
      var isValid = false;
      try {
        sharp().compressionLevel(0);
        isValid = true;
      } catch (e) {}
      assert(isValid);
      done();
    });

    it('invalid', function(done) {
      var isValid = false;
      try {
        sharp().compressionLevel(-1);
        isValid = true;
      } catch (e) {}
      assert(!isValid);
      done();
    });

  });

});
