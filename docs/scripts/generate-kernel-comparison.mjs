/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

// Rebuild docs/public/api-resize-kernels.png from a synthetic test pattern of
// concentric rings, slightly-curved diagonals and a checkerboard.
// Rasterise the SVG at 1280x960 first, then downsize the same PNG to 160x120.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from '../../lib/index.mjs';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Concentric rings with varying spacing, centred in the left half.
const rings = [];
let radius = 10;
for (let index = 0; radius < 700; index += 1) {
  rings.push(`<circle cx="320" cy="480" r="${radius}" fill="none" stroke="${index % 2 === 0 ? '#111' : '#e84428'}" stroke-width="${index % 3 === 0 ? 6 : 3}"/>`);
  radius += 8 + (index % 4) * 5;
}
// Fine checkerboard in the bottom-right quarter.
const squares = [];
const cell = 16;
for (let row = 0; row < 30; row += 1) {
  for (let col = 0; col < 40; col += 1) {
    if ((row + col) % 2 === 0) {
      squares.push(`<rect x="${640 + col * cell}" y="${480 + row * cell}" width="${cell}" height="${cell}" fill="#111"/>`);
    }
  }
}
const input = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="960" viewBox="0 0 1280 960">
  <rect width="1280" height="960" fill="white"/>
  <clipPath id="left"><rect width="640" height="960"/></clipPath>
  <g clip-path="url(#left)">${rings.join('')}</g>
  <path d="M660 60 Q960 220 1260 110" fill="none" stroke="#111" stroke-width="22"/>
  <path d="M660 200 Q940 330 1260 260" fill="none" stroke="#e84428" stroke-width="9"/>
  <path d="M660 330 Q980 430 1260 390" fill="none" stroke="#111" stroke-width="3"/>
  ${squares.join('')}
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
