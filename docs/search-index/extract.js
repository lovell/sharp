// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const stopWords = require('./stop-words');

const extractDescription = (str) =>
  str
    .replace(/### Examples.*/sg, '')
    .replace(/\(http[^)]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-z0-9_/\-,. ]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 200)
    .trim();

const extractParameters = (str) =>
  [...str.matchAll(/options\.(?<name>[^.`\] ]+)/gs)]
    .map((match) => match.groups.name)
    .map((name) => name.replace(/([A-Z])/g, ' $1').toLowerCase())
    .join(' ');

const extractKeywords = (str) =>
  [
    ...new Set(
      str
        .split(/[ -/]/)
        .map((word) => word.toLowerCase().replace(/[^a-z]/g, ''))
        .filter((word) => word.length > 2 && word.length < 15 && !stopWords.includes(word))
    )
  ].join(' ');

module.exports = { extractDescription, extractKeywords, extractParameters };
