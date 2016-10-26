'use strict';

const fs = require('fs');
const childProcess = require('child_process');

const a = [];
const b = [];

fs.readdirSync('./images')
  .filter((file) => file.endsWith('.jpg'))
  .forEach((file) => {
    // Extract one pixel, avoiding first DCT block, and return value of A and B channels
    const command = `convert ./images/${file}[1x1+8+8] -colorspace lab -format "%[fx:u.g] %[fx:u.b]" info:`;
    const result = childProcess.execSync(command, { encoding: 'utf8' });
    const ab = result.split(' ');
    a.push(ab[0]);
    b.push(ab[1]);
  });

a.sort((v1, v2) => v1 - v2);
b.sort((v1, v2) => v1 - v2);

// Convert from 0..1 to -128..128
const convert = function (v) {
  return Math.round(256 * (v - 0.5));
};

const threshold = Math.round(a.length / 100);
console.log(`Trimming lowest/highest ${threshold} for 98th percentile`);

// Ignore ~2% outliers
console.log(`a ${convert(a[threshold])} - ${convert(a[a.length - threshold])}`);
console.log(`b ${convert(b[threshold])} - ${convert(b[b.length - threshold])}`);
