/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

// Rebuild docs/public/api-resize-kernels.png from a high-contrast diagonal.
// Rasterise the SVG at 1280x960 first, then downsize the same PNG to 160x120.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from '../../lib/index.mjs';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const input = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="960" viewBox="0 0 1280 960">
  <rect width="1280" height="960" fill="white"/>
  <path d="M0 760 L1000 0 H1280 L0 960Z" fill="#111"/>
  <path d="M0 250 L1280 900" fill="none" stroke="#111" stroke-width="24"/>
  <path d="M150 0 L1280 570" fill="none" stroke="#e84428" stroke-width="8"/>
</svg>`);
// Resizing SVG input directly rasterises at the output size and ignores the kernel.
const raster = await sharp(input).png().toBuffer();
const output = path.join(root, 'docs/public/api-resize-kernels.png');
const kernels = [
  'nearest', 'linear', 'cubic', 'mitchell',
  'lanczos2', 'lanczos3', 'mks2013', 'mks2021'
];
const width = 176;
const height = 154;
const imageWidth = 160;
const imageHeight = 120;
const panels = await Promise.all(kernels.map(async (kernel, index) => {
  const image = await sharp(raster)
    .resize(imageWidth, imageHeight, { kernel, fastShrinkOnLoad: false })
    .png()
    .toBuffer();
  const label = Buffer.from(`<svg width="${width}" height="28" xmlns="http://www.w3.org/2000/svg"><text x="8" y="21" font-size="17" font-family="sans-serif" fill="#16181d">${kernel}</text></svg>`);
  const x = (index % 4) * width;
  const y = Math.floor(index / 4) * height;
  return [
    { input: image, left: x + 8, top: y + 28 },
    { input: label, left: x, top: y }
  ];
}));
await sharp({ create: { width: width * 4, height: height * 2, channels: 4, background: '#fff' } })
  .composite(panels.flat())
  .png()
  .toFile(output);
console.log(output);
