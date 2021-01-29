'use strict';

const stopWords = require('./stop-words');

const extractDescription = (str) =>
  str
    .replace(/\(http[^)]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-z0-9_/\-,. ]/g, '')
    .replace(/\s+/g, ' ')
    .substr(0, 140)
    .trim();

const extractKeywords = (str) =>
  [
    ...new Set(
      str
        .split(/[ -/]/)
        .map((word) => word.toLowerCase().replace(/[^a-z]/g, ''))
        .filter((word) => word.length > 2 && word.length < 15 && !stopWords.includes(word))
    )
  ].join(' ');

module.exports = { extractDescription, extractKeywords };
