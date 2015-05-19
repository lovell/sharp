'use strict';

var assert = require('assert');
var fixtures = require('../fixtures');

describe('Test fixtures', function() {
  describe('assertMaxColourDistance', function() {
    it('should throw an Error when images have a different number of channels', function() {
      assert.throws(function() {
        fixtures.assertMaxColourDistance(fixtures.inputPngOverlayLayer1, fixtures.inputJpg);
      });
    });
    it('should throw an Error when images have different dimensions', function() {
      assert.throws(function() {
        fixtures.assertMaxColourDistance(fixtures.inputJpg, fixtures.inputJpgWithExif);
      });
    });
    it('should accept a zero threshold when comparing an image to itself', function() {
      var image = fixtures.inputPngOverlayLayer0;
      fixtures.assertMaxColourDistance(image, image, 0);
    });
    it('should accept a numeric threshold for two different images', function() {
      fixtures.assertMaxColourDistance(fixtures.inputPngOverlayLayer0, fixtures.inputPngOverlayLayer1, 100);
    });
  });
});
