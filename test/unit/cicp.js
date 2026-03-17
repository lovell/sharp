/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

// Reference PQ ushort values from hdr-pq-bt2020.avif (BT.2020 PQ, 12-bit)
const PQ = {
  greyBg: { x: 256, y: 10, rgb: [33296, 33296, 33296] },
  whiteBox: { x: 256, y: 80, rgb: [48112, 48112, 48112] },
  text100nit: { x: 170, y: 270, rgb: [31840, 31840, 31840] },
  red: { x: 85, y: 430, rgb: [30272, 17776, 11568] },
  redP3text: { x: 60, y: 415, rgb: [31232, 16272, 5744] },
  green: { x: 256, y: 430, rgb: [26288, 32736, 18960] },
  blue: { x: 427, y: 430, rgb: [15728, 10368, 32768] }
};

function readUshortPixel (buf, width, x, y) {
  const off = (y * width + x) * 6;
  return [buf.readUInt16LE(off), buf.readUInt16LE(off + 2), buf.readUInt16LE(off + 4)];
}

function readUcharPixel (buf, width, x, y) {
  const off = (y * width + x) * 3;
  return [buf[off], buf[off + 1], buf[off + 2]];
}

function assertPixelNear (actual, expected, tolerance, label) {
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(actual[i] - expected[i]) <= tolerance,
      `${label} channel ${i}: got ${actual[i]}, expected ${expected[i]} ±${tolerance}`);
  }
}

describe('CICP handling', () => {
  describe('metadata', () => {
    it('should extract CICP metadata from HDR AVIF', async () => {
      const meta = await sharp(fixtures.inputAvifHdr).metadata();
      assert.strictEqual(meta.cicpColourPrimaries, 9);
      assert.strictEqual(meta.cicpTransferCharacteristics, 16);
      assert.strictEqual(meta.cicpMatrixCoefficients, 9);
      assert.strictEqual(meta.cicpFullRangeFlag, 1);
      assert.strictEqual(meta.bitsPerSample, 12);
    });

    it('should not have CICP metadata on SDR images', async () => {
      const meta = await sharp(fixtures.inputJpg).metadata();
      assert.strictEqual(meta.cicpColourPrimaries, undefined);
      assert.strictEqual(meta.cicpTransferCharacteristics, undefined);
    });
  });

  describe('passthrough', () => {
    it('should preserve PQ pixel values exactly', async () => {
      const { data, info } = await sharp(fixtures.inputAvifHdr)
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });
      assert.strictEqual(info.depth, 'ushort');
      assert.strictEqual(info.width, 512);
      assert.strictEqual(info.height, 512);
      const buf = Buffer.from(data);
      assertPixelNear(readUshortPixel(buf, 512, PQ.greyBg.x, PQ.greyBg.y), PQ.greyBg.rgb, 0, 'grey bg');
      assertPixelNear(readUshortPixel(buf, 512, PQ.whiteBox.x, PQ.whiteBox.y), PQ.whiteBox.rgb, 0, 'white box');
      assertPixelNear(readUshortPixel(buf, 512, PQ.red.x, PQ.red.y), PQ.red.rgb, 0, 'red patch');
    });

    it('should preserve PQ values after resize', async () => {
      const { data, info } = await sharp(fixtures.inputAvifHdr)
        .resize(256, 256, { fit: 'inside' })
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });
      assert.strictEqual(info.depth, 'ushort');
      assert.strictEqual(info.width, 256);
      const buf = Buffer.from(data);
      // Flat-colour areas are unchanged by resize; coordinates scaled from 512
      assertPixelNear(readUshortPixel(buf, 256, 128, 5), [33296, 33296, 33296], 100, 'grey bg');
      assertPixelNear(readUshortPixel(buf, 256, 43, 215), [30272, 17776, 11568], 100, 'red patch');
      assertPixelNear(readUshortPixel(buf, 256, 128, 215), [26288, 32736, 18960], 100, 'green patch');
      assertPixelNear(readUshortPixel(buf, 256, 214, 215), [15848, 10470, 32944], 200, 'blue patch');
    });

    it('should preserve CICP metadata in raw output info', async () => {
      const { info } = await sharp(fixtures.inputAvifHdr)
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });
      assert.strictEqual(info.cicpColourPrimaries, 9);
      assert.strictEqual(info.cicpTransferCharacteristics, 16);
      assert.strictEqual(info.cicpMatrixCoefficients, 9);
      assert.strictEqual(info.cicpFullRangeFlag, 1);
    });

    it('should preserve 100-nit text and background values', async () => {
      const { data } = await sharp(fixtures.inputAvifHdr)
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });
      const buf = Buffer.from(data);
      assertPixelNear(readUshortPixel(buf, 512, PQ.greyBg.x, PQ.greyBg.y), PQ.greyBg.rgb, 0, 'grey bg');
      assertPixelNear(readUshortPixel(buf, 512, PQ.text100nit.x, PQ.text100nit.y), PQ.text100nit.rgb, 0, '100nit text');
    });

    it('should preserve P3 text and colour patch values', async () => {
      const { data } = await sharp(fixtures.inputAvifHdr)
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });
      const buf = Buffer.from(data);
      assertPixelNear(readUshortPixel(buf, 512, PQ.red.x, PQ.red.y), PQ.red.rgb, 0, 'red patch');
      assertPixelNear(readUshortPixel(buf, 512, PQ.redP3text.x, PQ.redP3text.y), PQ.redP3text.rgb, 0, 'P3 text on red');
    });

    it('should produce correct JXL with PQ colour patches', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .jxl({ effort: 3 })
        .toBuffer();
      const { data } = await sharp(buf).raw({ depth: 'ushort' }).toBuffer({ resolveWithObject: true });
      const rbuf = Buffer.from(data);
      // Default JXL passthrough — lossy noise but close to original PQ values
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.greyBg.x, PQ.greyBg.y), [33337, 33339, 33345], 500, 'grey bg');
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.red.x, PQ.red.y), [28517, 18293, 12665], 2000, 'red patch');
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.green.x, PQ.green.y), [27560, 32597, 20250], 2000, 'green patch');
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.blue.x, PQ.blue.y), [14676, 10494, 31570], 2000, 'blue patch');
    });
  });

  describe('keepCicp', () => {
    it('should preserve CICP metadata in JXL', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .jxl({ effort: 3 })
        .toBuffer();
      const meta = await sharp(buf).metadata();
      assert.strictEqual(meta.cicpColourPrimaries, 9);
      assert.strictEqual(meta.cicpTransferCharacteristics, 16);
    });

    it('should preserve CICP metadata in AVIF', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .avif({ quality: 80 })
        .toBuffer();
      const meta = await sharp(buf).metadata();
      assert.strictEqual(meta.cicpColourPrimaries, 9);
      assert.strictEqual(meta.cicpTransferCharacteristics, 16);
    });

    it('should preserve PQ colour values in lossy JXL', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .jxl({ effort: 3 })
        .toBuffer();
      const { data } = await sharp(buf).raw({ depth: 'ushort' }).toBuffer({ resolveWithObject: true });
      const rbuf = Buffer.from(data);
      // JXL colour management shifts values from the original PQ encoding.
      // These reference values are from keepCicp lossy JXL round-trip.
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.greyBg.x, PQ.greyBg.y), [40004, 40006, 40005], 500, 'grey bg');
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.red.x, PQ.red.y), [40609, 7937, 4010], 500, 'red patch');
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.green.x, PQ.green.y), [18954, 41217, 11503], 500, 'green patch');
      assertPixelNear(readUshortPixel(rbuf, 512, PQ.blue.x, PQ.blue.y), [0, 0, 42025], 500, 'blue patch');
    });

    it('should produce UHDR JPEG with gainmap', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .resize(64, 64, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();
      const meta = await sharp(buf).metadata();
      assert.ok(meta.gainMap, 'expected gainmap in UHDR JPEG');
    });

    it('should override pipelineColorspace', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .pipelineColorspace('scrgb')
        .jxl({ effort: 3 })
        .toBuffer();
      const meta = await sharp(buf).metadata();
      assert.strictEqual(meta.cicpTransferCharacteristics, 16);
    });

    it('should override withIccProfile', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .withIccProfile('p3')
        .avif({ quality: 80 })
        .toBuffer();
      const meta = await sharp(buf).metadata();
      assert.strictEqual(meta.cicpTransferCharacteristics, 16);
      assert.strictEqual(meta.hasProfile, false);
    });

    it('should have no effect on non-CICP images', async () => {
      const { data: with_ } = await sharp(fixtures.inputJpg)
        .keepCicp()
        .resize(64, 64)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const { data: without } = await sharp(fixtures.inputJpg)
        .resize(64, 64)
        .raw()
        .toBuffer({ resolveWithObject: true });
      assert.deepStrictEqual(with_, without);
    });
  });

  describe('raw round-trip', () => {
    it('should carry CICP metadata through raw decode and re-encode', async () => {
      const { data, info } = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });

      assert.strictEqual(info.cicpColourPrimaries, 9);
      assert.strictEqual(info.cicpTransferCharacteristics, 16);

      const buf = await sharp(data, { raw: info })
        .keepCicp()
        .jxl({ effort: 3 })
        .toBuffer();
      const meta = await sharp(buf).metadata();
      assert.strictEqual(meta.cicpColourPrimaries, 9);
      assert.strictEqual(meta.cicpTransferCharacteristics, 16);
    });

    it('should preserve pixel values through raw round-trip', async () => {
      const { data: orig, info } = await sharp(fixtures.inputAvifHdr)
        .keepCicp()
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });

      assert.strictEqual(info.depth, 'ushort');

      const ushortBuf = new Uint16Array(orig.buffer, orig.byteOffset, orig.byteLength / 2);
      const { data: roundtrip, info: info2 } = await sharp(ushortBuf, { raw: info })
        .keepCicp()
        .raw({ depth: 'ushort' })
        .toBuffer({ resolveWithObject: true });

      assert.strictEqual(info2.depth, 'ushort');
      assert.strictEqual(roundtrip.length, orig.length);

      const obuf = Buffer.from(orig);
      const rbuf = Buffer.from(roundtrip);
      assertPixelNear(
        readUshortPixel(rbuf, 512, PQ.greyBg.x, PQ.greyBg.y),
        readUshortPixel(obuf, 512, PQ.greyBg.x, PQ.greyBg.y), 0, 'grey bg');
      assertPixelNear(
        readUshortPixel(rbuf, 512, PQ.red.x, PQ.red.y),
        readUshortPixel(obuf, 512, PQ.red.x, PQ.red.y), 0, 'red patch');
      assertPixelNear(
        readUshortPixel(rbuf, 512, PQ.blue.x, PQ.blue.y),
        readUshortPixel(obuf, 512, PQ.blue.x, PQ.blue.y), 0, 'blue patch');
    });
  });

  describe('pipelineColorspace', () => {
    it('should strip CICP metadata after linearization', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .pipelineColorspace('scrgb')
        .png()
        .toBuffer();
      const meta = await sharp(buf).metadata();
      assert.strictEqual(meta.cicpColourPrimaries, undefined);
      assert.strictEqual(meta.space, 'srgb');
    });

    it('should produce clipped SDR from HDR content', async () => {
      const { data } = await sharp(fixtures.inputAvifHdr)
        .pipelineColorspace('scrgb')
        .raw()
        .toBuffer({ resolveWithObject: true });
      // CICP2scRGB + sRGB conversion clips without tone mapping.
      assertPixelNear(readUcharPixel(data, 512, PQ.greyBg.x, PQ.greyBg.y), [255, 255, 255], 0, 'grey bg');
      assertPixelNear(readUcharPixel(data, 512, PQ.red.x, PQ.red.y), [255, 0, 0], 0, 'red patch');
      assertPixelNear(readUcharPixel(data, 512, PQ.green.x, PQ.green.y), [0, 255, 0], 0, 'green patch');
      assertPixelNear(readUcharPixel(data, 512, PQ.blue.x, PQ.blue.y), [0, 0, 255], 0, 'blue patch');
    });

    it('should produce wider-gamut colours with P3 profile', async () => {
      const { data } = await sharp(fixtures.inputAvifHdr)
        .pipelineColorspace('scrgb')
        .withIccProfile('p3')
        .raw()
        .toBuffer({ resolveWithObject: true });
      // P3 has a wider gamut than sRGB, so colour patches retain more detail
      const red = readUcharPixel(data, 512, PQ.red.x, PQ.red.y);
      const green = readUcharPixel(data, 512, PQ.green.x, PQ.green.y);
      const blue = readUcharPixel(data, 512, PQ.blue.x, PQ.blue.y);
      assertPixelNear(red, [234, 51, 34], 5, 'red patch in P3');
      assertPixelNear(green, [117, 251, 76], 5, 'green patch in P3');
      assertPixelNear(blue, [0, 0, 245], 5, 'blue patch in P3');
    });

    it('should produce clipped SDR colours in JXL', async () => {
      const buf = await sharp(fixtures.inputAvifHdr)
        .pipelineColorspace('scrgb')
        .jxl({ effort: 3 })
        .toBuffer();
      const { data } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
      // Same clipping as raw SDR, with minor lossy JXL noise.
      assertPixelNear(readUcharPixel(data, 512, PQ.red.x, PQ.red.y), [255, 0, 0], 5, 'red patch');
      assertPixelNear(readUcharPixel(data, 512, PQ.green.x, PQ.green.y), [0, 255, 0], 5, 'green patch');
      assertPixelNear(readUcharPixel(data, 512, PQ.blue.x, PQ.blue.y), [0, 0, 255], 5, 'blue patch');
    });
  });
});
