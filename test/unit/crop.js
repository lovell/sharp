'use strict';

var assert = require('assert');

var sharp = require('../../index');
var fixtures = require('../fixtures');

describe('Crop gravities', function() {

  var testSettings = [
    {
      name: 'North',
      width: 320,
      height: 80,
      gravity: sharp.gravity.north,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'East',
      width: 80,
      height: 320,
      gravity: sharp.gravity.east,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'South',
      width: 320,
      height: 80,
      gravity: sharp.gravity.south,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'West',
      width: 80,
      height: 320,
      gravity: sharp.gravity.west,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Center',
      width: 320,
      height: 80,
      gravity: sharp.gravity.center,
      fixture: 'gravity-center.jpg'
    },
    {
      name: 'Centre',
      width: 80,
      height: 320,
      gravity: sharp.gravity.centre,
      fixture: 'gravity-centre.jpg'
    },
    {
      name: 'Northeast',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Northeast',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Southeast',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Southeast',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southeast,
      fixture: 'gravity-east.jpg'
    },
    {
      name: 'Southwest',
      width: 320,
      height: 80,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-south.jpg'
    },
    {
      name: 'Southwest',
      width: 80,
      height: 320,
      gravity: sharp.gravity.southwest,
      fixture: 'gravity-west.jpg'
    },
    {
      name: 'Northwest',
      width: 320,
      height: 80,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-north.jpg'
    },
    {
      name: 'Northwest',
      width: 80,
      height: 320,
      gravity: sharp.gravity.northwest,
      fixture: 'gravity-west.jpg'
    }
  ];

  testSettings.forEach(function(settings) {
    it(settings.name, function(done) {
      sharp(fixtures.inputJpg)
        .resize(settings.width, settings.height)
        .crop(settings.gravity)
        .toBuffer(function(err, data, info) {
          if (err) throw err;
          assert.strictEqual(settings.width, info.width);
          assert.strictEqual(settings.height, info.height);
          fixtures.assertSimilar(fixtures.expected(settings.fixture), data, done);
        });
    });
  });

  it('allows specifying the gravity as a string', function(done) {
    sharp(fixtures.inputJpg)
      .resize(80, 320)
      .crop('east')
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(80, info.width);
        assert.strictEqual(320, info.height);
        fixtures.assertSimilar(fixtures.expected('gravity-east.jpg'), data, done);
      });
  });

  it('Invalid number', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).crop(9);
    });
  });

  it('Invalid string', function() {
    assert.throws(function() {
      sharp(fixtures.inputJpg).crop('yadda');
    });
  });
});
