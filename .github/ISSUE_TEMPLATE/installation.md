---
name: Installation
about: Something went wrong **installing** sharp
title: ''
labels: installation
assignees: ''

---

Did you see the [documentation relating to installation](https://sharp.pixelplumbing.com/en/stable/install/)?

Have you ensured the platform and version of Node.js used for `npm install` is the same as the platform and version of Node.js used at runtime?

If you are installing as a `root` or `sudo` user, have you tried with the `npm install --unsafe-perm` flag?

What is the complete output of running `npm install --verbose sharp`? Have you checked this output for useful error messages?

What is the output of running `npx envinfo --binaries --languages --system --utilities`?
