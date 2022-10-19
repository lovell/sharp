'use strict';

/* istanbul ignore next */
if ('webcontainer' in process.versions) {
  process.env.npm_config_arch = 'wasm32';
}

const Sharp = require('./constructor');
require('./input')(Sharp);
require('./resize')(Sharp);
require('./composite')(Sharp);
require('./operation')(Sharp);
require('./colour')(Sharp);
require('./channel')(Sharp);
require('./output')(Sharp);
require('./utility')(Sharp);

module.exports = Sharp;
