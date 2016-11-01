'use strict';

var assert = require('assert');
var fixtures = require('../fixtures');
var sharp = require('../../index');
var fs = require('fs');

var testImgPath = fixtures.path('bandbool.png');
var chineseImgPath = fixtures.path('中文名称.png');

function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

describe('File path with Chinese characters', function() {

    before(function ( done ) {
        if (fs.existsSync(chineseImgPath)) {
            fs.unlinkSync(chineseImgPath);
        }
        copyFile(testImgPath, chineseImgPath, function(err) {
            if (err) {
                throw err;
            }
            done();
        });
    });

    after( function ( done ) {
        if (fs.existsSync(chineseImgPath)) {
            fs.unlinkSync(chineseImgPath);
        }
        done();
    });

    it('File path without Chinese characters', function(done) {
        sharp(testImgPath)
            .raw()
            .toBuffer(function(err, data, info) {
                if (err) throw err;
                assert.strictEqual(200, info.width);
                assert.strictEqual(200, info.height);
                done();
            });
    });

    it('File path with Chinese characters', function(done) {
        sharp(chineseImgPath)
            .raw()
            .toBuffer(function(err, data, info) {
                if (err) throw err;
                assert.strictEqual(200, info.width);
                assert.strictEqual(200, info.height);
                done();
            });
    });
});
