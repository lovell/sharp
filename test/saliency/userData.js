'use strict';

const fs = require('fs');
const path = require('path');

const userDataDir = 'UserData';

const images = {};

const median = function (values) {
  values.sort(function (a, b) {
    return a - b;
  });
  const half = Math.floor(values.length / 2);
  if (values.length % 2) {
    return values[half];
  } else {
    return Math.floor((values[half - 1] + values[half]) / 2);
  }
};

// List of files
fs.readdirSync(userDataDir).forEach(function (file) {
  // Contents of file
  const lines = fs.readFileSync(path.join(userDataDir, file), { encoding: 'utf-8' }).split(/\r\n/);
  // First line = number of entries
  const entries = parseInt(lines[0], 10);
  // Verify number of entries
  if (entries !== 500) {
    throw new Error('Expecting 500 images in ' + file + ', found ' + entries);
  }
  // Keep track of which line we're on
  let linePos = 2;
  for (let i = 0; i < entries; i++) {
    // Get data for current image
    const filename = lines[linePos].replace(/\\/, path.sep);
    linePos = linePos + 2;
    const regions = lines[linePos].split('; ');
    linePos = linePos + 2;
    // Parse human-labelled regions for min/max coords
    const lefts = [];
    const tops = [];
    const rights = [];
    const bottoms = [];
    regions.forEach(function (region) {
      if (region.indexOf(' ') !== -1) {
        const coords = region.split(' ');
        lefts.push(parseInt(coords[0], 10));
        tops.push(parseInt(coords[1], 10));
        rights.push(parseInt(coords[2], 10));
        bottoms.push(parseInt(coords[3], 10));
      }
    });
    // Add image
    images[filename] = {
      left: median(lefts),
      top: median(tops),
      right: median(rights),
      bottom: median(bottoms)
    };
  }
});

// Verify number of images found
const imageCount = Object.keys(images).length;
if (imageCount === 5000) {
  // Write output
  fs.writeFileSync('userData.json', JSON.stringify(images, null, 2));
} else {
  throw new Error('Expecting 5000 images, found ' + imageCount);
}
