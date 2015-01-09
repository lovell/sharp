# Contributing to sharp

Hello, thank you for your interest in helping!

## Submit a new bug report

Please create a [new issue](https://github.com/lovell/sharp/issues/new) containing the steps to reproduce the problem.

New bugs are assigned a `triage` label whilst under investigation.

If you're having problems with `npm install sharp`, please include the output of the following commands, perhaps as a [gist](https://gist.github.com/):

```sh
vips -v
pkg-config --print-provides vips
npm install --verbose sharp
```

## Submit a new feature request

If a [similar request](https://github.com/lovell/sharp/labels/enhancement) exists, it's probably fastest to add a comment to it about your requirement.

Implementation is usually straightforward if _libvips_ [already supports](http://www.vips.ecs.soton.ac.uk/supported/current/doc/html/libvips/ch03.html) the feature you need.

## Submit a Pull Request to fix a bug

Thank you! To prevent the problem occurring again, please add unit tests that would have failed.

Please select the `master` branch as the destination for your Pull Request so your fix can be included in the next minor release.

Please squash your changes into a single commit using a command like `git rebase -i upstream/master`.

## Submit a Pull Request with a new feature

Please add JavaScript [unit tests](https://github.com/lovell/sharp/tree/master/test/unit) to cover your new feature. A test coverage report for the JavaScript code is generated in the `coverage/lcov-report` directory.

You deserve to add your details to the [list of contributors](https://github.com/lovell/sharp/blob/master/package.json#L5).

Any change that modifies the existing public API should be added to the relevant work-in-progress branch for inclusion in the next major release.

| Release | WIP branch |
| ------: | :--------- |
|  v0.9.0 | intake     |
| v0.10.0 | judgement  |
| v0.11.0 | knife      |

Please squash your changes into a single commit using a command like `git rebase -i upstream/<wip-branch>`.

### Add a new public method

The API tries to be as fluent as possible. Image processing concepts follow the naming conventions from _libvips_ and, to a lesser extent, _ImageMagick_.

Most methods have optional parameters and assume sensible defaults. Methods with mandatory parameters often have names like `doSomethingWith(X)`.

Please ensure backwards compatibility where possible. Methods to modify previously default behaviour often have names like `withoutOptionY()` or `withExtraZ()`.

Feel free to create a [new issue](https://github.com/lovell/sharp/issues/new) to gather feedback on a potential API change.

### Remove an existing public method

A method to be removed should be deprecated in the next major version then removed in the following major version.

By way of example, the [bilinearInterpolation method](https://github.com/lovell/sharp/blob/v0.6.0/index.js#L155) present in v0.5.0 was deprecated in v0.6.0 and removed in v0.7.0.

## Run the tests

### Functional tests and static code analysis

```sh
npm test
```

### Memory leak tests

Requires _valgrind_.

```sh
cd sharp/test/leak
./leak.sh
```

## Finally

Please feel free to ask any questions via a [new issue](https://github.com/lovell/sharp/issues/new) or contact me by [e-mail](https://github.com/lovell/sharp/blob/master/package.json#L4).
