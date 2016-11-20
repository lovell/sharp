#!/bin/sh

# Regenerates lib/types.d.ts Typescript definitions
sources="lib/constructor.js lib/input.js lib/resize.js lib/composite.js lib/operation.js lib/colour.js lib/channel.js lib/output.js lib/utility.js"
types="types.d.ts"

# Generate types via JSDoc comments
./node_modules/.bin/jsdoc -d . -t ./node_modules/tsd-jsdoc $sources

# Wrap output with module declaration
echo "declare module \"sharp\" {\n" > "lib/$types"
cat "$types" >> "lib/$types"
echo "}\n" >> "lib/$types"
rm "$types"
