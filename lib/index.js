/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import Sharp from './constructor';
import input from './input';
import resize from './resize';
import composite from './composite';
import operation from './operation';
import colour from './colour';
import channel from './channel';
import output from './output';
import utility from './utility';

input(Sharp);
resize(Sharp);
composite(Sharp);
operation(Sharp);
colour(Sharp);
channel(Sharp);
output(Sharp);
utility(Sharp);

export default Sharp;
