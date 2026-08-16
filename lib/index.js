/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import Sharp from './constructor.js';
import input from './input.js';
import resize from './resize.js';
import composite from './composite.js';
import operation from './operation.js';
import colour from './colour.js';
import channel from './channel.js';
import output from './output.js';
import utility from './utility.js';

input(Sharp);
resize(Sharp);
composite(Sharp);
operation(Sharp);
colour(Sharp);
channel(Sharp);
output(Sharp);
utility(Sharp);

export default Sharp;
