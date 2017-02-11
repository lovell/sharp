# Changelog

### v0.17 - "*quill*"

Requires libvips v8.4.2.

#### v0.17.2 - 11<sup>th</sup> February 2017

* Ensure Readable side of Stream can start flowing after Writable side has finished.
  [#671](https://github.com/lovell/sharp/issues/671)
  [@danhaller](https://github.com/danhaller)

* Expose WebP alpha quality, lossless and near-lossless output options.
  [#685](https://github.com/lovell/sharp/pull/685)
  [@rnanwani](https://github.com/rnanwani)

#### v0.17.1 - 15<sup>th</sup> January 2017

* Improve error messages for invalid parameters.
  [@spikeon](https://github.com/spikeon)
  [#644](https://github.com/lovell/sharp/pull/644)

* Simplify expression for finding vips-cpp libdir.
  [#656](https://github.com/lovell/sharp/pull/656)

* Allow HTTPS-over-HTTP proxy when downloading pre-compiled dependencies.
  [@wangzhiwei1888](https://github.com/wangzhiwei1888)
  [#679](https://github.com/lovell/sharp/issues/679)

#### v0.17.0 - 11<sup>th</sup> December 2016

* Drop support for versions of Node prior to v4.

* Deprecate the following output format "option" functions:
    quality, progressive, compressionLevel, withoutAdaptiveFiltering,
    withoutChromaSubsampling, trellisQuantisation, trellisQuantization,
    overshootDeringing, optimiseScans and optimizeScans.
  Access to these is now via output format functions, for example `quality(n)`
    is now `jpeg({quality: n})` and/or `webp({quality: n})`.

* Autoconvert GIF and SVG input to PNG output if no other format is specified.

* Expose libvips' "centre" resize option to mimic \*magick's +0.5px convention.
  [#568](https://github.com/lovell/sharp/issues/568)

* Ensure support for embedded base64 PNG and JPEG images within an SVG.
  [#601](https://github.com/lovell/sharp/issues/601)
  [@dynamite-ready](https://github.com/dynamite-ready)

* Ensure premultiply operation occurs before box filter shrink.
  [#605](https://github.com/lovell/sharp/issues/605)
  [@CmdrShepardsPie](https://github.com/CmdrShepardsPie)
  [@teroparvinen](https://github.com/teroparvinen)

* Add support for PNG and WebP tile-based output formats (in addition to JPEG).
  [#622](https://github.com/lovell/sharp/pull/622)
  [@ppaskaris](https://github.com/ppaskaris)

* Allow use of extend with greyscale input.
  [#623](https://github.com/lovell/sharp/pull/623)
  [@ppaskaris](https://github.com/ppaskaris)

* Allow non-RGB input to embed/extend onto background with an alpha channel.
  [#646](https://github.com/lovell/sharp/issues/646)
  [@DaGaMs](https://github.com/DaGaMs)

### v0.16 - "*pencil*"

Requires libvips v8.3.3

#### v0.16.2 - 22<sup>nd</sup> October 2016

* Restrict readelf usage to Linux only when detecting global libvips version.
  [#602](https://github.com/lovell/sharp/issues/602)
  [@caoko](https://github.com/caoko)

#### v0.16.1 - 13<sup>th</sup> October 2016

* C++11 ABI version is now auto-detected, remove sharp-cxx11 installation flag.

* Add experimental 'attention' crop strategy.
  [#295](https://github.com/lovell/sharp/issues/295)

* Include .node extension for Meteor's require() implementation.
  [#537](https://github.com/lovell/sharp/issues/537)
  [@isjackwild](https://github.com/isjackwild)

* Ensure convolution kernel scale is clamped to a minimum value of 1.
  [#561](https://github.com/lovell/sharp/issues/561)
  [@abagshaw](https://github.com/abagshaw)

* Correct calculation of y-axis placement when overlaying image at a fixed point.
  [#566](https://github.com/lovell/sharp/issues/566)
  [@Nateowami](https://github.com/Nateowami)

#### v0.16.0 - 18<sup>th</sup> August 2016

* Add pre-compiled libvips for OS X, ARMv7 and ARMv8.
  [#312](https://github.com/lovell/sharp/issues/312)

* Ensure boolean, bandbool, extractChannel ops occur before sRGB conversion.
  [#504](https://github.com/lovell/sharp/pull/504)
  [@mhirsch](https://github.com/mhirsch)

* Recalculate factors after WebP shrink-on-load to avoid round-to-zero errors.
  [#508](https://github.com/lovell/sharp/issues/508)
  [@asilvas](https://github.com/asilvas)

* Prevent boolean errors during extract operation.
  [#511](https://github.com/lovell/sharp/pull/511)
  [@mhirsch](https://github.com/mhirsch)

* Add joinChannel and toColourspace/toColorspace operations.
  [#513](https://github.com/lovell/sharp/pull/513)
  [@mhirsch](https://github.com/mhirsch)

* Add support for raw pixel data with boolean and withOverlay operations.
  [#516](https://github.com/lovell/sharp/pull/516)
  [@mhirsch](https://github.com/mhirsch)

* Prevent bandbool creating a single channel sRGB image.
  [#519](https://github.com/lovell/sharp/pull/519)
  [@mhirsch](https://github.com/mhirsch)

* Ensure ICC profiles are removed from PNG output unless withMetadata used.
  [#521](https://github.com/lovell/sharp/issues/521)
  [@ChrisPinewood](https://github.com/ChrisPinewood)

* Add alpha channels, if missing, to overlayWith images.
  [#540](https://github.com/lovell/sharp/pull/540)
  [@cmtt](https://github.com/cmtt)

* Remove deprecated interpolateWith method - use resize(w, h, { interpolator: ... })
  [#310](https://github.com/lovell/sharp/issues/310)

### v0.15 - "*outfit*"

Requires libvips v8.3.1

#### v0.15.1 - 12<sup>th</sup> July 2016

* Concat Stream-based input in single operation for ~+3% perf and less GC.
  [#429](https://github.com/lovell/sharp/issues/429)
  [@papandreou](https://github.com/papandreou)

* Add alpha channel, if required, before extend operation.
  [#439](https://github.com/lovell/sharp/pull/439)
  [@frulo](https://github.com/frulo)

* Allow overlay image to be repeated across entire image via tile option.
  [#443](https://github.com/lovell/sharp/pull/443)
  [@lemnisk8](https://github.com/lemnisk8)

* Add cutout option to overlayWith feature, applies only the alpha channel of the overlay image.
  [#448](https://github.com/lovell/sharp/pull/448)
  [@kleisauke](https://github.com/kleisauke)

* Ensure scaling factors are calculated independently to prevent rounding errors.
  [#452](https://github.com/lovell/sharp/issues/452)
  [@puzrin](https://github.com/puzrin)

* Add --sharp-cxx11 flag to compile with gcc's new C++11 ABI.
  [#456](https://github.com/lovell/sharp/pull/456)
  [@kapouer](https://github.com/kapouer)

* Add top/left offset support to overlayWith operation.
  [#473](https://github.com/lovell/sharp/pull/473)
  [@rnanwani](https://github.com/rnanwani)

* Add convolve operation for kernel-based convolution.
  [#479](https://github.com/lovell/sharp/pull/479)
  [@mhirsch](https://github.com/mhirsch)

* Add greyscale option to threshold operation for colourspace conversion control.
  [#480](https://github.com/lovell/sharp/pull/480)
  [@mhirsch](https://github.com/mhirsch)

* Ensure ICC profiles are licenced for distribution.
  [#486](https://github.com/lovell/sharp/issues/486)
  [@kapouer](https://github.com/kapouer)

* Allow images with an alpha channel to work with LAB-colourspace based sharpen.
  [#490](https://github.com/lovell/sharp/issues/490)
  [@jwagner](https://github.com/jwagner)

* Add trim operation to remove "boring" edges.
  [#492](https://github.com/lovell/sharp/pull/492)
  [@kleisauke](https://github.com/kleisauke)

* Add bandbool feature for channel-wise boolean operations.
  [#496](https://github.com/lovell/sharp/pull/496)
  [@mhirsch](https://github.com/mhirsch)

* Add extractChannel operation to extract a channel from an image.
  [#497](https://github.com/lovell/sharp/pull/497)
  [@mhirsch](https://github.com/mhirsch)

* Add ability to read and write native libvips .v files.
  [#500](https://github.com/lovell/sharp/pull/500)
  [@mhirsch](https://github.com/mhirsch)

* Add boolean feature for bitwise image operations.
  [#501](https://github.com/lovell/sharp/pull/501)
  [@mhirsch](https://github.com/mhirsch)

#### v0.15.0 - 21<sup>st</sup> May 2016

* Use libvips' new Lanczos 3 kernel as default for image reduction.
  Deprecate interpolateWith method, now provided as a resize option.
  [#310](https://github.com/lovell/sharp/issues/310)
  [@jcupitt](https://github.com/jcupitt)

* Take advantage of libvips v8.3 features.
  Add support for libvips' new GIF and SVG loaders.
  Pre-built binaries now include giflib and librsvg, exclude *magick.
  Use shrink-on-load for WebP input.
  Break existing sharpen API to accept sigma and improve precision.
  [#369](https://github.com/lovell/sharp/issues/369)

* Remove unnecessary (un)premultiply operations when not resizing/compositing.
  [#413](https://github.com/lovell/sharp/issues/413)
  [@jardakotesovec](https://github.com/jardakotesovec)

### v0.14 - "*needle*"

Requires libvips v8.2.3

#### v0.14.1 - 16<sup>th</sup> April 2016

* Allow removal of limitation on input pixel count via limitInputPixels. Use with care.
  [#250](https://github.com/lovell/sharp/issues/250)
  [#316](https://github.com/lovell/sharp/pull/316)
  [@anandthakker](https://github.com/anandthakker)
  [@kentongray](https://github.com/kentongray)

* Use final output image for metadata passed to callback.
  [#399](https://github.com/lovell/sharp/pull/399)
  [@salzhrani](https://github.com/salzhrani)

* Add support for writing tiled images to a zip container.
  [#402](https://github.com/lovell/sharp/pull/402)
  [@felixbuenemann](https://github.com/felixbuenemann)

* Allow use of embed with 1 and 2 channel images.
  [#411](https://github.com/lovell/sharp/issues/411)
  [@janaz](https://github.com/janaz)

* Improve Electron compatibility by allowing node-gyp rebuilds without npm.
  [#412](https://github.com/lovell/sharp/issues/412)
  [@nouh](https://github.com/nouh)

#### v0.14.0 - 2<sup>nd</sup> April 2016

* Add ability to extend (pad) the edges of an image.
  [#128](https://github.com/lovell/sharp/issues/128)
  [@blowsie](https://github.com/blowsie)

* Add support for Zoomify and Google tile layouts. Breaks existing tile API.
  [#223](https://github.com/lovell/sharp/issues/223)
  [@bdunnette](https://github.com/bdunnette)

* Improvements to overlayWith: differing sizes/formats, gravity, buffer input.
  [#239](https://github.com/lovell/sharp/issues/239)
  [@chrisriley](https://github.com/chrisriley)

* Add entropy-based crop strategy to remove least interesting edges.
  [#295](https://github.com/lovell/sharp/issues/295)
  [@rightaway](https://github.com/rightaway)

* Expose density metadata; set density of images from vector input.
  [#338](https://github.com/lovell/sharp/issues/338)
  [@lookfirst](https://github.com/lookfirst)

* Emit post-processing 'info' event for Stream output.
  [#367](https://github.com/lovell/sharp/issues/367)
  [@salzhrani](https://github.com/salzhrani)

* Ensure output image EXIF Orientation values are within 1-8 range.
  [#385](https://github.com/lovell/sharp/pull/385)
  [@jtobinisaniceguy](https://github.com/jtobinisaniceguy)

* Ensure ratios are not swapped when rotating 90/270 and ignoring aspect.
  [#387](https://github.com/lovell/sharp/issues/387)
  [@kleisauke](https://github.com/kleisauke)

* Remove deprecated style of calling extract API. Breaks calls using positional arguments.
  [#276](https://github.com/lovell/sharp/issues/276)

### v0.13 - "*mind*"

Requires libvips v8.2.2

#### v0.13.1 - 27<sup>th</sup> February 2016

* Fix embedding onto transparent backgrounds; regression introduced in v0.13.0.
  [#366](https://github.com/lovell/sharp/issues/366)
  [@diegocsandrim](https://github.com/diegocsandrim)

#### v0.13.0 - 15<sup>th</sup> February 2016

* Improve vector image support by allowing control of density/DPI.
  Switch pre-built libs from Imagemagick to Graphicsmagick.
  [#110](https://github.com/lovell/sharp/issues/110)
  [@bradisbell](https://github.com/bradisbell)

* Add support for raw, uncompressed pixel Buffer/Stream input.
  [#220](https://github.com/lovell/sharp/issues/220)
  [@mikemorris](https://github.com/mikemorris)

* Switch from libvips' C to C++ bindings, requires upgrade to v8.2.2.
  [#299](https://github.com/lovell/sharp/issues/299)

* Control number of open files in libvips' cache; breaks existing `cache` behaviour.
  [#315](https://github.com/lovell/sharp/issues/315)
  [@impomezia](https://github.com/impomezia)

* Ensure 16-bit input images can be normalised and embedded onto transparent backgrounds.
  [#339](https://github.com/lovell/sharp/issues/339)
  [#340](https://github.com/lovell/sharp/issues/340)
  [@janaz](https://github.com/janaz)

* Ensure selected format takes precedence over any unknown output filename extension.
  [#344](https://github.com/lovell/sharp/issues/344)
  [@ubaltaci](https://github.com/ubaltaci)

* Add support for libvips' PBM, PGM, PPM and FITS image format loaders.
  [#347](https://github.com/lovell/sharp/issues/347)
  [@oaleynik](https://github.com/oaleynik)

* Ensure default crop gravity is center/centre.
  [#351](https://github.com/lovell/sharp/pull/351)
  [@joelmukuthu](https://github.com/joelmukuthu)

* Improve support for musl libc systems e.g. Alpine Linux.
  [#354](https://github.com/lovell/sharp/issues/354)
  [#359](https://github.com/lovell/sharp/pull/359)
  [@download13](https://github.com/download13)
  [@wjordan](https://github.com/wjordan)

* Small optimisation when reducing by an integral factor to favour shrink over affine.

* Add support for gamma correction of images with an alpha channel.

### v0.12 - "*look*"

Requires libvips v8.2.0

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
