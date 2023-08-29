## versions
> versions

An Object containing the version numbers of sharp, libvips and its dependencies.


**Example**  
```js
console.log(sharp.versions);
```


## interpolators
> interpolators : <code>enum</code>

An Object containing the available interpolators and their proper values


**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| nearest | <code>string</code> | <code>&quot;nearest&quot;</code> | [Nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation). Suitable for image enlargement only. |
| bilinear | <code>string</code> | <code>&quot;bilinear&quot;</code> | [Bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation). Faster than bicubic but with less smooth results. |
| bicubic | <code>string</code> | <code>&quot;bicubic&quot;</code> | [Bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default). |
| locallyBoundedBicubic | <code>string</code> | <code>&quot;lbb&quot;</code> | [LBB interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/lbb.cpp#L100). Prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2. |
| nohalo | <code>string</code> | <code>&quot;nohalo&quot;</code> | [Nohalo interpolation](http://eprints.soton.ac.uk/268086/). Prevents acutance but typically reduces performance by a factor of 3. |
| vertexSplitQuadraticBasisSpline | <code>string</code> | <code>&quot;vsqbs&quot;</code> | [VSQBS interpolation](https://github.com/libvips/libvips/blob/master/libvips/resample/vsqbs.cpp#L48). Prevents "staircasing" when enlarging. |



## format
> format ⇒ <code>Object</code>

An Object containing nested boolean values representing the available input and output formats/methods.


**Example**  
```js
console.log(sharp.format);
```


## vendor
> vendor

An Object containing the platform and architecture
of the current and installed vendored binaries.


**Example**  
```js
console.log(sharp.vendor);
```


## queue
> queue

An EventEmitter that emits a `change` event when a task is either:
- queued, waiting for _libuv_ to provide a worker thread
- complete


**Example**  
```js
sharp.queue.on('change', function(queueLength) {
  console.log('Queue contains ' + queueLength + ' task(s)');
});
```


## cache
> cache([options]) ⇒ <code>Object</code>

Gets or, when options are provided, sets the limits of _libvips'_ operation cache.
Existing entries in the cache will be trimmed after any change in limits.
This method always returns cache statistics,
useful for determining how much working memory is required for a particular task.



| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> \| <code>boolean</code> | <code>true</code> | Object with the following attributes, or boolean where true uses default cache settings and false removes all caching |
| [options.memory] | <code>number</code> | <code>50</code> | is the maximum memory in MB to use for this cache |
| [options.files] | <code>number</code> | <code>20</code> | is the maximum number of files to hold open |
| [options.items] | <code>number</code> | <code>100</code> | is the maximum number of operations to cache |

**Example**  
```js
const stats = sharp.cache();
```
**Example**  
```js
sharp.cache( { items: 200 } );
sharp.cache( { files: 0 } );
sharp.cache(false);
```


## concurrency
> concurrency([concurrency]) ⇒ <code>number</code>

Gets or, when a concurrency is provided, sets
the maximum number of threads _libvips_ should use to process _each image_.
These are from a thread pool managed by glib,
which helps avoid the overhead of creating new threads.

This method always returns the current concurrency.

The default value is the number of CPU cores,
except when using glibc-based Linux without jemalloc,
where the default is `1` to help reduce memory fragmentation.

A value of `0` will reset this to the number of CPU cores.

Some image format libraries spawn additional threads,
e.g. libaom manages its own 4 threads when encoding AVIF images,
and these are independent of the value set here.

The maximum number of images that sharp can process in parallel
is controlled by libuv's `UV_THREADPOOL_SIZE` environment variable,
which defaults to 4.

https://nodejs.org/api/cli.html#uv_threadpool_sizesize

For example, by default, a machine with 8 CPU cores will process
4 images in parallel and use up to 8 threads per image,
so there will be up to 32 concurrent threads.


**Returns**: <code>number</code> - concurrency  

| Param | Type |
| --- | --- |
| [concurrency] | <code>number</code> | 

**Example**  
```js
const threads = sharp.concurrency(); // 4
sharp.concurrency(2); // 2
sharp.concurrency(0); // 4
```


## counters
> counters() ⇒ <code>Object</code>

Provides access to internal task counters.
- queue is the number of tasks this module has queued waiting for _libuv_ to provide a worker thread from its pool.
- process is the number of resize tasks currently being processed.


**Example**  
```js
const counters = sharp.counters(); // { queue: 2, process: 4 }
```


## simd
> simd([simd]) ⇒ <code>boolean</code>

Get and set use of SIMD vector unit instructions.
Requires libvips to have been compiled with liborc support.

Improves the performance of `resize`, `blur` and `sharpen` operations
by taking advantage of the SIMD vector unit of the CPU, e.g. Intel SSE and ARM NEON.



| Param | Type | Default |
| --- | --- | --- |
| [simd] | <code>boolean</code> | <code>true</code> | 

**Example**  
```js
const simd = sharp.simd();
// simd is `true` if the runtime use of liborc is currently enabled
```
**Example**  
```js
const simd = sharp.simd(false);
// prevent libvips from using liborc at runtime
```


## block
> block(options)

Block libvips operations at runtime.

This is in addition to the `VIPS_BLOCK_UNTRUSTED` environment variable,
which when set will block all "untrusted" operations.


**Since**: 0.32.4  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.operation | <code>Array.&lt;string&gt;</code> | List of libvips low-level operation names to block. |

**Example** *(Block all TIFF input.)*  
```js
sharp.block({
  operation: ['VipsForeignLoadTiff']
});
```


## unblock
> unblock(options)

Unblock libvips operations at runtime.

This is useful for defining a list of allowed operations.


**Since**: 0.32.4  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> |  |
| options.operation | <code>Array.&lt;string&gt;</code> | List of libvips low-level operation names to unblock. |

**Example** *(Block all input except WebP from the filesystem.)*  
```js
sharp.block({
  operation: ['VipsForeignLoad']
});
sharp.unblock({
  operation: ['VipsForeignLoadWebpFile']
});
```
**Example** *(Block all input except JPEG and PNG from a Buffer or Stream.)*  
```js
sharp.block({
  operation: ['VipsForeignLoad']
});
sharp.unblock({
  operation: ['VipsForeignLoadJpegBuffer', 'VipsForeignLoadPngBuffer']
});
```