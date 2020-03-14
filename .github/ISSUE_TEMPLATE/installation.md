---
name: Installation
about: Something went wrong during either 'npm install sharp' or 'require("sharp")'
labels: installation

---

Did you see the [documentation relating to installation](https://sharp.pixelplumbing.com/install)?

Have you ensured the platform and version of Node.js used for `npm install` is the same as the platform and version of Node.js used at runtime?

Are you using the latest version? Is the version currently in use as reported by `npm ls sharp` the same as the latest version as reported by `npm view sharp dist-tags.latest`?

If you are installing as a `root` or `sudo` user, have you tried with the `npm install --unsafe-perm` flag?

If you are using the `ignore-scripts` feature of `npm`, have you tried with the `npm install --ignore-scripts=false` flag?

What is the complete output of running `npm install --verbose sharp`? Have you checked this output for useful error messages?

What is the output of running `npx envinfo --binaries --system`?
