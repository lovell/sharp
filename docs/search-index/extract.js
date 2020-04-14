'use strict';

const stopWords = [
  'a',
  'about',
  'all',
  'already',
  'always',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'been',
  'by',
  'can',
  'do',
  'does',
  'each',
  'either',
  'etc',
  'for',
  'from',
  'get',
  'gets',
  'has',
  'have',
  'how',
  'if',
  'in',
  'is',
  'it',
  'its',
  'may',
  'more',
  'much',
  'no',
  'not',
  'of',
  'on',
  'or',
  'over',
  'set',
  'sets',
  'should',
  'that',
  'the',
  'their',
  'there',
  'therefore',
  'these',
  'this',
  'to',
  'use',
  'using',
  'when',
  'which',
  'will',
  'with'
];

const extractDescription = (str) =>
  str
    .replace(/\(http[^)]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-z0-9_/\-,. ]/g, '')
    .replace(/\s+/g, ' ')
    .substr(0, 140)
    .trim();

const extractKeywords = (str) =>
  str
    .split(/[ -/]/)
    .map((word) => word.toLowerCase().replace(/[^a-z]/g, ''))
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .join(' ');

module.exports = { extractDescription, extractKeywords };
