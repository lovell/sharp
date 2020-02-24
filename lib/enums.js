'use strict';

/**
 * An Object containing the available interpolators and their proper values
 */
const interpolators = Object.freeze({
  nearest: 'nearest',
  bilinear: 'bilinear',
  bicubic: 'bicubic',
  locallyBoundedBicubic: 'lbb',
  nohalo: 'nohalo',
  vertexSplitQuadraticBasisSpline: 'vsqbs'
});

module.exports = {
  interpolators
};
