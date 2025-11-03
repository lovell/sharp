/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fixtures = require('../fixtures');

describe('Test fixtures', () => {
  describe('assertMaxColourDistance', () => {
    it('should throw an Error when images have a different number of channels', () => {
      assert.throws(() => {
        fixtures.assertMaxColourDistance(fixtures.inputPngOverlayLayer1, fixtures.inputJpg);
      });
    });
    it('should throw an Error when images have different dimensions', () => {
      assert.throws(() => {
        fixtures.assertMaxColourDistance(fixtures.inputJpg, fixtures.inputJpgWithExif);
      });
    });
    it('should accept a zero threshold when comparing an image to itself', () => {
      const image = fixtures.inputPngOverlayLayer0;
      fixtures.assertMaxColourDistance(image, image, 0);
    });
    it('should accept a numeric threshold for two different images', () => {
      fixtures.assertMaxColourDistance(fixtures.inputPngOverlayLayer0, fixtures.inputPngOverlayLayer1, 100);
    });
  });
});
