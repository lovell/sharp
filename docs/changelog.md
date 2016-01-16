# Changelog

### v0.12 - "*look*"

#### v0.12.2 - 16<sup>th</sup> January 2016

* Upgrade libvips to v8.2.0 for improved vips_shrink.

* Add pre-compiled libvips for ARMv6+ CPUs.

* Ensure 16-bit input images work with embed option.
  [#325](https://github.com/lovell/sharp/issues/325)
  [@janaz](https://github.com/janaz)

* Allow compilation with gmake to provide FreeBSD support.
  [#326](https://github.com/lovell/sharp/issues/326)
  [@c0decafe](https://github.com/c0decafe)

* Attempt to remove temporary file after installation.
  [#331](https://github.com/lovell/sharp/issues/331)
  [@dtoubelis](https://github.com/dtoubelis)

#### v0.12.1 - 12<sup>th</sup> December 2015

* Allow use of SIMD vector instructions (via liborc) to be toggled on/off.
  [#172](https://github.com/lovell/sharp/issues/172)
  [@bkw](https://github.com/bkw)
  [@puzrin](https://github.com/puzrin)

* Ensure embedded ICC profiles output with perceptual intent.
  [#321](https://github.com/lovell/sharp/issues/321)
  [@vlapo](https://github.com/vlapo)

* Use the NPM-configured HTTPS proxy, if any, for binary downloads.

#### v0.12.0 - 23<sup>rd</sup> November 2015

* Bundle pre-compiled libvips and its dependencies for 64-bit Linux and Windows.
  [#42](https://github.com/lovell/sharp/issues/42)

* Take advantage of libvips v8.1.0+ features.
  [#152](https://github.com/lovell/sharp/issues/152)

* Add support for 64-bit Windows. Drop support for 32-bit Windows.
  [#224](https://github.com/lovell/sharp/issues/224)
  [@sabrehagen](https://github.com/sabrehagen)

* Switch default interpolator to bicubic.
  [#289](https://github.com/lovell/sharp/issues/289)
  [@mahnunchik](https://github.com/mahnunchik)

* Pre-extract rotatation should not swap width/height.
  [#296](https://github.com/lovell/sharp/issues/296)
  [@asilvas](https://github.com/asilvas)

* Ensure 16-bit+alpha input images are (un)premultiplied correctly.
  [#301](https://github.com/lovell/sharp/issues/301)
  [@izaakschroeder](https://github.com/izaakschroeder)

* Add `threshold` operation.
  [#303](https://github.com/lovell/sharp/pull/303)
  [@dacarley](https://github.com/dacarley)

* Add `negate` operation.
  [#306](https://github.com/lovell/sharp/pull/306)
  [@dacarley](https://github.com/dacarley)

* Support `options` Object with existing `extract` operation.
  [#309](https://github.com/lovell/sharp/pull/309)
  [@papandreou](https://github.com/papandreou)

### v0.11 - "*knife*"

#### v0.11.4 - 5<sup>th</sup> November 2015

* Add corners, e.g. `northeast`, to existing `gravity` option.
  [#291](https://github.com/lovell/sharp/pull/291)
  [@brandonaaron](https://github.com/brandonaaron)

* Ensure correct auto-rotation for EXIF Orientation values 2 and 4.
  [#288](https://github.com/lovell/sharp/pull/288)
  [@brandonaaron](https://github.com/brandonaaron)

* Make static linking possible via `--runtime_link` install option.
  [#287](https://github.com/lovell/sharp/pull/287)
  [@vlapo](https://github.com/vlapo)

#### v0.11.3 - 8<sup>th</sup> September 2015

* Intrepret blurSigma, sharpenFlat, and sharpenJagged as double precision.
  [#263](https://github.com/lovell/sharp/pull/263)
  [@chrisriley](https://github.com/chrisriley)

#### v0.11.2 - 28<sup>th</sup> August 2015

* Allow crop gravity to be provided as a String.
  [#255](https://github.com/lovell/sharp/pull/255)
  [@papandreou](https://github.com/papandreou)
* Add support for io.js v3 and Node v4.
  [#246](https://github.com/lovell/sharp/issues/246)

#### v0.11.1 - 12<sup>th</sup> August 2015

* Silence MSVC warning: "C4530: C++ exception handler used, but unwind semantics are not enabled".
  [#244](https://github.com/lovell/sharp/pull/244)
  [@TheThing](https://github.com/TheThing)

* Suppress gamma correction for input image with alpha transparency.
  [#249](https://github.com/lovell/sharp/issues/249)
  [@compeak](https://github.com/compeak)

#### v0.11.0 - 15<sup>th</sup> July 2015

* Allow alpha transparency compositing via new `overlayWith` method.
  [#97](https://github.com/lovell/sharp/issues/97)
  [@gasi](https://github.com/gasi)

* Expose raw ICC profile data as a Buffer when using `metadata`.
  [#129](https://github.com/lovell/sharp/issues/129)
  [@homerjam](https://github.com/homerjam)

* Allow image header updates via a parameter passed to existing `withMetadata` method.
  Provide initial support for EXIF `Orientation` tag,
  which if present is now removed when using `rotate`, `flip` or `flop`.
  [#189](https://github.com/lovell/sharp/issues/189)
  [@h2non](https://github.com/h2non)

* Tighten constructor parameter checks.
  [#221](https://github.com/lovell/sharp/issues/221)
  [@mikemorris](https://github.com/mikemorris)

* Allow one input Stream to be shared with two or more output Streams via new `clone` method.
  [#235](https://github.com/lovell/sharp/issues/235)
  [@jaubourg](https://github.com/jaubourg)

* Use `round` instead of `floor` when auto-scaling dimensions to avoid floating-point rounding errors.
  [#238](https://github.com/lovell/sharp/issues/238)
  [@richardadjogah](https://github.com/richardadjogah)

### v0.10 - "*judgment*"

#### v0.10.1 - 1<sup>st</sup> June 2015

* Allow embed of image with alpha transparency onto non-transparent background.
  [#204](https://github.com/lovell/sharp/issues/204)
  [@mikemliu](https://github.com/mikemliu)

* Include C standard library for `atoi` as Xcode 6.3 appears to no longer do this.
  [#228](https://github.com/lovell/sharp/issues/228)
  [@doggan](https://github.com/doggan)

#### v0.10.0 - 23<sup>rd</sup> April 2015

* Add support for Windows (x86).
  [#19](https://github.com/lovell/sharp/issues/19)
  [@DullReferenceException](https://github.com/DullReferenceException)
  [@itsananderson](https://github.com/itsananderson)

* Add support for Openslide input and DeepZoom output.
  [#146](https://github.com/lovell/sharp/issues/146)
  [@mvictoras](https://github.com/mvictoras)

* Allow arbitrary aspect ratios when resizing images via new `ignoreAspectRatio` method.
  [#192](https://github.com/lovell/sharp/issues/192)
  [@skedastik](https://github.com/skedastik)

* Enhance output image contrast by stretching its luminance to cover the full dynamic range via new `normalize` method.
  [#194](https://github.com/lovell/sharp/issues/194)
  [@bkw](https://github.com/bkw)
  [@codingforce](https://github.com/codingforce)
