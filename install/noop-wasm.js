// Stops the `install` command if we just want to use prebuilt Wasm assets, proceeds to the node-gyp compilation otherwise.
if (!process.env.npm_config_arch?.startsWith('wasm') || process.env.npm_config_build_from_source) {
  process.exit(1);
}
