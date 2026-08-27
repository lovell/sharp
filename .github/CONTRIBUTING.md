Thank you for your interest in helping!

### Report a bug

Please create a [new issue](https://github.com/lovell/sharp/issues) containing the steps to reproduce the problem.
New bugs are assigned a `triage` label whilst under investigation.

### Request a new feature

If a [similar request](https://github.com/lovell/sharp/labels/enhancement) exists,
it's probably fastest to add a comment to it about your requirement.
Implementation is usually straightforward if libvips
[already supports](https://www.libvips.org/API/current/function-list.html)
the feature you need.

### Submit a Pull Request to fix a bug

Thank you! To prevent the problem occurring again, please add unit tests that would have failed.

Please select the `main` branch as the destination for your Pull Request so your fix can be included in the next minor release.
Please squash your changes into a single commit using a command like `git rebase -i upstream/main`.

To build CJS from ESM:
```sh frame="none"
npm run build:dist
```

To build C++:
```sh frame="none"
npm run build
```

### Submit a Pull Request with a new feature

Please add JavaScript [unit tests](https://github.com/lovell/sharp/tree/main/test/unit) to cover your new feature.
Where possible, the functional tests use gradient-based perceptual hashes
based on [dHash](http://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html)
to compare expected vs actual images.
Please also update the [TypeScript definitions](https://github.com/lovell/sharp/tree/main/lib/index.d.ts), along with the [type definition tests](https://github.com/lovell/sharp/tree/main/test/types/sharp.test-d.ts).

Please squash your changes into a single commit using a command like `git rebase -i upstream/<wip-branch>`.
Any change that modifies the existing public API should be added to the relevant work-in-progress branch for inclusion in the next major release.

You deserve to add your details to the [list of humans](https://github.com/lovell/sharp/blob/main/docs/public/humans.txt).

#### Add a new public method

The API tries to be as fluent as possible.
Image processing concepts follow the naming conventions from libvips and, to a lesser extent, ImageMagick.
Most methods have optional parameters and assume sensible defaults.
Please ensure backwards compatibility where possible.

Please include documentation updates in any Pull Request that modifies the public API.
The public API is documented with [JSDoc](https://jsdoc.app/) annotated comments.
These can be converted to Markdown by running:
```sh frame="none"
npm run docs-build
```

Feel free to create a [new question](https://github.com/lovell/sharp/issues) to gather feedback on a potential API change.

#### Remove an existing public method

A method to be removed should be deprecated in the next major version then removed in the following major version.
By way of example, the `background()` method present in v0.20.0 was deprecated in v0.21.0 and removed in v0.22.0.

### AI Contribution Policy

#### Never let an LLM speak for you

Comments and descriptions on issues and pull requests should be written in your own words and using your own voice.

Spelling and grammar are much less important than keeping things clear, concise and human.
Please don't use or copy-paste LLM-generated summaries.

#### Never let an LLM think for you

You can use LLM-based tooling to help explore ideas and generate small code samples.
Please ensure you fully understand, take legal responsibility for and can reason about any code submitted.

Contributing to open source software should help you learn as a human, and is a great step towards becoming a longer term maintainer.

### Finally

Please feel free to ask for help publicly via a
[new question](https://github.com/lovell/sharp/issues).

If you're unable to post details publicly, please
[e-mail](https://github.com/lovell/sharp/blob/main/package.json#L5)
for private, paid consulting.
