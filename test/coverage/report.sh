#!/bin/sh

CPPFLAGS="--coverage" LDFLAGS="--coverage" npm rebuild
npm test
geninfo --no-external --base-directory src --output-file coverage/sharp.info build/Release/obj.target/sharp/src
genhtml --title sharp --demangle-cpp --output-directory coverage/sharp coverage/*.info
