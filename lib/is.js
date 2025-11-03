/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

/**
 * Is this value defined and not null?
 * @private
 */
const defined = (val) => typeof val !== 'undefined' && val !== null;

/**
 * Is this value an object?
 * @private
 */
const object = (val) => typeof val === 'object';

/**
 * Is this value a plain object?
 * @private
 */
const plainObject = (val) => Object.prototype.toString.call(val) === '[object Object]';

/**
 * Is this value a function?
 * @private
 */
const fn = (val) => typeof val === 'function';

/**
 * Is this value a boolean?
 * @private
 */
const bool = (val) => typeof val === 'boolean';

/**
 * Is this value a Buffer object?
 * @private
 */
const buffer = (val) => val instanceof Buffer;

/**
 * Is this value a typed array object?. E.g. Uint8Array or Uint8ClampedArray?
 * @private
 */
const typedArray = (val) => {
  if (defined(val)) {
    switch (val.constructor) {
      case Uint8Array:
      case Uint8ClampedArray:
      case Int8Array:
      case Uint16Array:
      case Int16Array:
      case Uint32Array:
      case Int32Array:
      case Float32Array:
      case Float64Array:
        return true;
    }
  }

  return false;
};

/**
 * Is this value an ArrayBuffer object?
 * @private
 */
const arrayBuffer = (val) => val instanceof ArrayBuffer;

/**
 * Is this value a non-empty string?
 * @private
 */
const string = (val) => typeof val === 'string' && val.length > 0;

/**
 * Is this value a real number?
 * @private
 */
const number = (val) => typeof val === 'number' && !Number.isNaN(val);

/**
 * Is this value an integer?
 * @private
 */
const integer = (val) => Number.isInteger(val);

/**
 * Is this value within an inclusive given range?
 * @private
 */
const inRange = (val, min, max) => val >= min && val <= max;

/**
 * Is this value within the elements of an array?
 * @private
 */
const inArray = (val, list) => list.includes(val);

/**
 * Create an Error with a message relating to an invalid parameter.
 *
 * @param {string} name - parameter name.
 * @param {string} expected - description of the type/value/range expected.
 * @param {*} actual - the value received.
 * @returns {Error} Containing the formatted message.
 * @private
 */
const invalidParameterError = (name, expected, actual) => new Error(
    `Expected ${expected} for ${name} but received ${actual} of type ${typeof actual}`
  );

/**
 * Ensures an Error from C++ contains a JS stack.
 *
 * @param {Error} native - Error with message from C++.
 * @param {Error} context - Error with stack from JS.
 * @returns {Error} Error with message and stack.
 * @private
 */
const nativeError = (native, context) => {
  context.message = native.message;
  return context;
};

module.exports = {
  defined,
  object,
  plainObject,
  fn,
  bool,
  buffer,
  typedArray,
  arrayBuffer,
  string,
  number,
  integer,
  inRange,
  inArray,
  invalidParameterError,
  nativeError
};
