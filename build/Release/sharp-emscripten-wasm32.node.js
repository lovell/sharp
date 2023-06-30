// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function GROWABLE_HEAP_I8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP8;
}
function GROWABLE_HEAP_U8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU8;
}
function GROWABLE_HEAP_I16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP16;
}
function GROWABLE_HEAP_U16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU16;
}
function GROWABLE_HEAP_I32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP32;
}
function GROWABLE_HEAP_U32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU32;
}
function GROWABLE_HEAP_F32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF32;
}
function GROWABLE_HEAP_F64() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF64;
}

var Module = typeof Module != "undefined" ? Module : {};

let vipsConcurrency;

if ("webcontainer" in process.versions) {
 vipsConcurrency = 2;
} else {
 vipsConcurrency = +process.env.VIPS_CONCURRENCY || require("os").cpus().length;
}

Module.preRun = () => {
 ENV.VIPS_CONCURRENCY = vipsConcurrency;
};

Module.onRuntimeInitialized = () => {
 const emnapi = Module.emnapiInit({
  context: require("@emnapi/runtime").getDefaultContext()
 });
 const {concurrency: concurrency} = emnapi;
 emnapi.concurrency = function(maybeSet) {
  if (typeof maybeSet === "number" && maybeSet > vipsConcurrency) {
   console.warn(`Requested concurrency (${maybeSet}) is higher than the set limit (${vipsConcurrency}).`);
   maybeSet = vipsConcurrency;
  }
  return concurrency.call(this, maybeSet);
 };
 process.once("exit", () => {
  _vips_shutdown();
  _uv_library_shutdown();
 });
 module.exports = emnapi;
};

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = false;

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = true;

var ENVIRONMENT_IS_SHELL = false;

var ENVIRONMENT_IS_PTHREAD = Module["ENVIRONMENT_IS_PTHREAD"] || false;

var currentScript;

if (typeof __filename !== "undefined") {
 currentScript = __filename;
} else if (ENVIRONMENT_IS_WORKER) {
 currentScript = self.location.href;
} else currentScript = "";

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 var nodePath = require("path");
 scriptDirectory = __dirname + "/";
 read_ = (filename, binary) => {
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  return fs.readFileSync(filename, binary ? undefined : "utf8");
 };
 readBinary = filename => {
  var ret = read_(filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  return ret;
 };
 readAsync = (filename, onload, onerror, binary = true) => {
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
   if (err) onerror(err); else onload(binary ? data.buffer : data);
  });
 };
 if (!Module["thisProgram"] && process.argv.length > 1) {
  thisProgram = process.argv[1].replace(/\\/g, "/");
 }
 arguments_ = process.argv.slice(2);
 if (typeof module != "undefined") {
  module["exports"] = Module;
 }
 quit_ = (status, toThrow) => {
  process.exitCode = status;
  throw toThrow;
 };
 Module["inspect"] = () => "[Emscripten Module object]";
 let nodeWorkerThreads;
 try {
  nodeWorkerThreads = require("worker_threads");
 } catch (e) {
  console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?');
  throw e;
 }
 global.Worker = nodeWorkerThreads.Worker;
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (currentScript.indexOf("blob:") !== 0) {
  scriptDirectory = currentScript.substr(0, currentScript.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 }
 if (!ENVIRONMENT_IS_NODE) {
  read_ = url => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = title => document.title = title;
} else {}

if (ENVIRONMENT_IS_NODE) {
 if (typeof performance == "undefined") {
  global.performance = require("perf_hooks").performance;
 }
}

var defaultPrint = console.log.bind(console);

var defaultPrintErr = console.error.bind(console);

if (ENVIRONMENT_IS_NODE) {
 defaultPrint = (...args) => fs.writeSync(1, args.join(" ") + "\n");
 defaultPrintErr = (...args) => fs.writeSync(2, args.join(" ") + "\n");
}

var out = Module["print"] || defaultPrint;

var err = Module["printErr"] || defaultPrintErr;

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

var noExitRuntime = Module["noExitRuntime"] || true;

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

var wasmMemory;

var wasmModule;

var ABORT = false;

var EXITSTATUS;

function assert(condition, text) {
 if (!condition) {
  abort(text);
 }
}

var HEAP, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;

function updateMemoryViews() {
 var b = wasmMemory.buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(b);
 Module["HEAP16"] = HEAP16 = new Int16Array(b);
 Module["HEAP32"] = HEAP32 = new Int32Array(b);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
 Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
 Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b);
}

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

assert(INITIAL_MEMORY >= 65536, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 65536 + ")");

if (ENVIRONMENT_IS_PTHREAD) {
 wasmMemory = Module["wasmMemory"];
} else {
 if (Module["wasmMemory"]) {
  wasmMemory = Module["wasmMemory"];
 } else {
  wasmMemory = new WebAssembly.Memory({
   "initial": INITIAL_MEMORY / 65536,
   "maximum": 2147483648 / 65536,
   "shared": true
  });
  if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
   err("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag");
   if (ENVIRONMENT_IS_NODE) {
    err("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and/or recent version)");
   }
   throw Error("bad memory");
  }
 }
}

updateMemoryViews();

INITIAL_MEMORY = wasmMemory.buffer.byteLength;

var wasmTable;

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
 return noExitRuntime || runtimeKeepaliveCounter > 0;
}

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 if (ENVIRONMENT_IS_PTHREAD) return;
 if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
 FS.ignorePermissions = false;
 TTY.init();
 callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
 if (ENVIRONMENT_IS_PTHREAD) return;
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
 return id;
}

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what += ". Build with -sASSERTIONS for more info.";
 var e = new WebAssembly.RuntimeError(what);
 throw e;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return filename.startsWith(dataURIPrefix);
}

function isFileURI(filename) {
 return filename.startsWith("file://");
}

var wasmBinaryFile;

wasmBinaryFile = "sharp-emscripten-wasm32.node.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
 try {
  if (file == wasmBinaryFile && wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
   return readBinary(file);
  }
  throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise(binaryFile) {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function") {
   return fetch(binaryFile, {
    credentials: "same-origin"
   }).then(response => {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + binaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(() => getBinary(binaryFile));
  }
 }
 return Promise.resolve().then(() => getBinary(binaryFile));
}

function instantiateSync(file, info) {
 var instance;
 var module;
 var binary;
 try {
  binary = getBinary(file);
  module = new WebAssembly.Module(binary);
  instance = new WebAssembly.Instance(module, info);
 } catch (e) {
  var str = e.toString();
  err("failed to compile wasm module: " + str);
  if (str.includes("imported Memory") || str.includes("memory import")) {
   err("Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).");
  }
  throw e;
 }
 return [ instance, module ];
}

function createWasm() {
 var info = {
  "env": wasmImports,
  "wasi_snapshot_preview1": wasmImports
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  registerTLSInit(Module["asm"]["_emscripten_tls_init"]);
  wasmTable = Module["asm"]["__indirect_function_table"];
  addOnInit(Module["asm"]["__wasm_call_ctors"]);
  wasmModule = module;
  removeRunDependency("wasm-instantiate");
  return exports;
 }
 addRunDependency("wasm-instantiate");
 if (Module["instantiateWasm"]) {
  try {
   return Module["instantiateWasm"](info, receiveInstance);
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 var result = instantiateSync(wasmBinaryFile, info);
 return receiveInstance(result[0], result[1]);
}

function unbox_small_structs(type_ptr) {
 var type_id = GROWABLE_HEAP_U16()[(type_ptr + 6 >> 1) + 0];
 while (type_id === 13) {
  var elements = GROWABLE_HEAP_U32()[(type_ptr + 8 >> 2) + 0];
  var first_element = GROWABLE_HEAP_U32()[(elements >> 2) + 0];
  if (first_element === 0) {
   type_id = 0;
   break;
  } else if (GROWABLE_HEAP_U32()[(elements >> 2) + 1] === 0) {
   type_ptr = first_element;
   type_id = GROWABLE_HEAP_U16()[(first_element + 6 >> 1) + 0];
  } else {
   break;
  }
 }
 return [ type_ptr, type_id ];
}

function ffi_call_helper(cif, fn, rvalue, avalue) {
 var abi = GROWABLE_HEAP_U32()[(cif >> 2) + 0];
 var nargs = GROWABLE_HEAP_U32()[(cif >> 2) + 1];
 var nfixedargs = GROWABLE_HEAP_U32()[(cif >> 2) + 6];
 var arg_types_ptr = GROWABLE_HEAP_U32()[(cif >> 2) + 2];
 var rtype_unboxed = unbox_small_structs(GROWABLE_HEAP_U32()[(cif >> 2) + 3]);
 var rtype_ptr = rtype_unboxed[0];
 var rtype_id = rtype_unboxed[1];
 var orig_stack_ptr = stackSave();
 var cur_stack_ptr = orig_stack_ptr;
 var args = [];
 var ret_by_arg = false;
 if (rtype_id === 15) {
  throw new Error("complex ret marshalling nyi");
 }
 if (rtype_id < 0 || rtype_id > 15) {
  throw new Error("Unexpected rtype " + rtype_id);
 }
 if (rtype_id === 4 || rtype_id === 13) {
  args.push(rvalue);
  ret_by_arg = true;
 }
 for (var i = 0; i < nfixedargs; i++) {
  var arg_ptr = GROWABLE_HEAP_U32()[(avalue >> 2) + i];
  var arg_unboxed = unbox_small_structs(GROWABLE_HEAP_U32()[(arg_types_ptr >> 2) + i]);
  var arg_type_ptr = arg_unboxed[0];
  var arg_type_id = arg_unboxed[1];
  switch (arg_type_id) {
  case 1:
  case 10:
  case 9:
  case 14:
   args.push(GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 0]);
   break;

  case 2:
   args.push(GROWABLE_HEAP_F32()[(arg_ptr >> 2) + 0]);
   break;

  case 3:
   args.push(GROWABLE_HEAP_F64()[(arg_ptr >> 3) + 0]);
   break;

  case 5:
   args.push(GROWABLE_HEAP_U8()[arg_ptr + 0]);
   break;

  case 6:
   args.push(GROWABLE_HEAP_I8()[arg_ptr + 0]);
   break;

  case 7:
   args.push(GROWABLE_HEAP_U16()[(arg_ptr >> 1) + 0]);
   break;

  case 8:
   args.push(GROWABLE_HEAP_I16()[(arg_ptr >> 1) + 0]);
   break;

  case 11:
  case 12:
   args.push(HEAPU64[(arg_ptr >> 3) + 0]);
   break;

  case 4:
   args.push(HEAPU64[(arg_ptr >> 3) + 0]);
   args.push(HEAPU64[(arg_ptr >> 3) + 1]);
   break;

  case 13:
   var size = GROWABLE_HEAP_U32()[(arg_type_ptr >> 2) + 0];
   var align = GROWABLE_HEAP_U16()[(arg_type_ptr + 4 >> 1) + 0];
   cur_stack_ptr -= size, cur_stack_ptr &= ~(align - 1);
   GROWABLE_HEAP_I8().subarray(cur_stack_ptr, cur_stack_ptr + size).set(GROWABLE_HEAP_I8().subarray(arg_ptr, arg_ptr + size));
   args.push(cur_stack_ptr);
   break;

  case 15:
   throw new Error("complex marshalling nyi");

  default:
   throw new Error("Unexpected type " + arg_type_id);
  }
 }
 if (nfixedargs != nargs) {
  var struct_arg_info = [];
  for (var i = nargs - 1; i >= nfixedargs; i--) {
   var arg_ptr = GROWABLE_HEAP_U32()[(avalue >> 2) + i];
   var arg_unboxed = unbox_small_structs(GROWABLE_HEAP_U32()[(arg_types_ptr >> 2) + i]);
   var arg_type_ptr = arg_unboxed[0];
   var arg_type_id = arg_unboxed[1];
   switch (arg_type_id) {
   case 5:
   case 6:
    cur_stack_ptr -= 1, cur_stack_ptr &= ~(1 - 1);
    GROWABLE_HEAP_U8()[cur_stack_ptr + 0] = GROWABLE_HEAP_U8()[arg_ptr + 0];
    break;

   case 7:
   case 8:
    cur_stack_ptr -= 2, cur_stack_ptr &= ~(2 - 1);
    GROWABLE_HEAP_U16()[(cur_stack_ptr >> 1) + 0] = GROWABLE_HEAP_U16()[(arg_ptr >> 1) + 0];
    break;

   case 1:
   case 9:
   case 10:
   case 14:
   case 2:
    cur_stack_ptr -= 4, cur_stack_ptr &= ~(4 - 1);
    GROWABLE_HEAP_U32()[(cur_stack_ptr >> 2) + 0] = GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 0];
    break;

   case 3:
   case 11:
   case 12:
    cur_stack_ptr -= 8, cur_stack_ptr &= ~(8 - 1);
    GROWABLE_HEAP_U32()[(cur_stack_ptr >> 2) + 0] = GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 0];
    GROWABLE_HEAP_U32()[(cur_stack_ptr >> 2) + 1] = GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 1];
    break;

   case 4:
    cur_stack_ptr -= 16, cur_stack_ptr &= ~(8 - 1);
    GROWABLE_HEAP_U32()[(cur_stack_ptr >> 2) + 0] = GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 0];
    GROWABLE_HEAP_U32()[(cur_stack_ptr >> 2) + 1] = GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 1];
    GROWABLE_HEAP_U32()[(cur_stack_ptr >> 2) + 2] = GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 1];
    GROWABLE_HEAP_U32()[(cur_stack_ptr >> 2) + 3] = GROWABLE_HEAP_U32()[(arg_ptr >> 2) + 1];
    break;

   case 13:
    cur_stack_ptr -= 4, cur_stack_ptr &= ~(4 - 1);
    struct_arg_info.push([ cur_stack_ptr, arg_ptr, GROWABLE_HEAP_U32()[(arg_type_ptr >> 2) + 0], GROWABLE_HEAP_U16()[(arg_type_ptr + 4 >> 1) + 0] ]);
    break;

   case 15:
    throw new Error("complex arg marshalling nyi");

   default:
    throw new Error("Unexpected argtype " + arg_type_id);
   }
  }
  args.push(cur_stack_ptr);
  for (var i = 0; i < struct_arg_info.length; i++) {
   var struct_info = struct_arg_info[i];
   var arg_target = struct_info[0];
   var arg_ptr = struct_info[1];
   var size = struct_info[2];
   var align = struct_info[3];
   cur_stack_ptr -= size, cur_stack_ptr &= ~(align - 1);
   GROWABLE_HEAP_I8().subarray(cur_stack_ptr, cur_stack_ptr + size).set(GROWABLE_HEAP_I8().subarray(arg_ptr, arg_ptr + size));
   GROWABLE_HEAP_U32()[(arg_target >> 2) + 0] = cur_stack_ptr;
  }
 }
 cur_stack_ptr -= 0, cur_stack_ptr &= ~(8 - 1);
 stackRestore(cur_stack_ptr);
 var result = wasmTable.get(fn).apply(null, args);
 stackRestore(orig_stack_ptr);
 if (ret_by_arg) {
  return;
 }
 switch (rtype_id) {
 case 0:
  break;

 case 1:
 case 9:
 case 10:
 case 14:
  GROWABLE_HEAP_U32()[(rvalue >> 2) + 0] = result;
  break;

 case 2:
  GROWABLE_HEAP_F32()[(rvalue >> 2) + 0] = result;
  break;

 case 3:
  GROWABLE_HEAP_F64()[(rvalue >> 3) + 0] = result;
  break;

 case 5:
 case 6:
  GROWABLE_HEAP_U8()[rvalue + 0] = result;
  break;

 case 7:
 case 8:
  GROWABLE_HEAP_U16()[(rvalue >> 1) + 0] = result;
  break;

 case 11:
 case 12:
  HEAPU64[(rvalue >> 3) + 0] = result;
  break;

 case 15:
  throw new Error("complex ret marshalling nyi");

 default:
  throw new Error("Unexpected rtype " + rtype_id);
 }
}

function ffi_closure_alloc_helper(size, code) {
 var closure = _malloc(size);
 var index = getEmptyTableSlot();
 GROWABLE_HEAP_U32()[(code >> 2) + 0] = index;
 GROWABLE_HEAP_U32()[(closure >> 2) + 0] = index;
 return closure;
}

function ffi_closure_free_helper(closure) {
 var index = GROWABLE_HEAP_U32()[(closure >> 2) + 0];
 freeTableIndexes.push(index);
 _free(closure);
}

function ffi_prep_closure_loc_helper(closure, cif, fun, user_data, codeloc) {
 var abi = GROWABLE_HEAP_U32()[(cif >> 2) + 0];
 var nargs = GROWABLE_HEAP_U32()[(cif >> 2) + 1];
 var nfixedargs = GROWABLE_HEAP_U32()[(cif >> 2) + 6];
 var arg_types_ptr = GROWABLE_HEAP_U32()[(cif >> 2) + 2];
 var rtype_unboxed = unbox_small_structs(GROWABLE_HEAP_U32()[(cif >> 2) + 3]);
 var rtype_ptr = rtype_unboxed[0];
 var rtype_id = rtype_unboxed[1];
 var sig;
 var ret_by_arg = false;
 switch (rtype_id) {
 case 0:
  sig = "v";
  break;

 case 13:
 case 4:
  sig = "vi";
  ret_by_arg = true;
  break;

 case 1:
 case 5:
 case 6:
 case 7:
 case 8:
 case 9:
 case 10:
 case 14:
  sig = "i";
  break;

 case 2:
  sig = "f";
  break;

 case 3:
  sig = "d";
  break;

 case 11:
 case 12:
  sig = "j";
  break;

 case 15:
  throw new Error("complex ret marshalling nyi");

 default:
  throw new Error("Unexpected rtype " + rtype_id);
 }
 var unboxed_arg_type_id_list = [];
 var unboxed_arg_type_info_list = [];
 for (var i = 0; i < nargs; i++) {
  var arg_unboxed = unbox_small_structs(GROWABLE_HEAP_U32()[(arg_types_ptr >> 2) + i]);
  var arg_type_ptr = arg_unboxed[0];
  var arg_type_id = arg_unboxed[1];
  unboxed_arg_type_id_list.push(arg_type_id);
  unboxed_arg_type_info_list.push([ GROWABLE_HEAP_U32()[(arg_type_ptr >> 2) + 0], GROWABLE_HEAP_U16()[(arg_type_ptr + 4 >> 1) + 0] ]);
 }
 for (var i = 0; i < nfixedargs; i++) {
  switch (unboxed_arg_type_id_list[i]) {
  case 1:
  case 5:
  case 6:
  case 7:
  case 8:
  case 9:
  case 10:
  case 14:
  case 13:
   sig += "i";
   break;

  case 2:
   sig += "f";
   break;

  case 3:
   sig += "d";
   break;

  case 4:
   sig += "jj";
   break;

  case 11:
  case 12:
   sig += "j";
   break;

  case 15:
   throw new Error("complex marshalling nyi");

  default:
   throw new Error("Unexpected argtype " + arg_type_id);
  }
 }
 if (nfixedargs < nargs) {
  sig += "i";
 }
 function trampoline() {
  var args = Array.prototype.slice.call(arguments);
  var size = 0;
  var orig_stack_ptr = stackSave();
  var cur_ptr = orig_stack_ptr;
  var ret_ptr;
  var jsarg_idx = 0;
  if (ret_by_arg) {
   ret_ptr = args[jsarg_idx++];
  } else {
   cur_ptr -= 8, cur_ptr &= ~(8 - 1);
   ret_ptr = cur_ptr;
  }
  cur_ptr -= 4 * nargs;
  var args_ptr = cur_ptr;
  var carg_idx = 0;
  for (;carg_idx < nfixedargs; carg_idx++) {
   var cur_arg = args[jsarg_idx++];
   var arg_type_info = unboxed_arg_type_info_list[carg_idx];
   var arg_size = arg_type_info[0];
   var arg_align = arg_type_info[1];
   var arg_type_id = unboxed_arg_type_id_list[carg_idx];
   switch (arg_type_id) {
   case 5:
   case 6:
    cur_ptr -= 1, cur_ptr &= ~(4 - 1);
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    GROWABLE_HEAP_U8()[cur_ptr + 0] = cur_arg;
    break;

   case 7:
   case 8:
    cur_ptr -= 2, cur_ptr &= ~(4 - 1);
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    GROWABLE_HEAP_U16()[(cur_ptr >> 1) + 0] = cur_arg;
    break;

   case 1:
   case 9:
   case 10:
   case 14:
    cur_ptr -= 4, cur_ptr &= ~(4 - 1);
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    GROWABLE_HEAP_U32()[(cur_ptr >> 2) + 0] = cur_arg;
    break;

   case 13:
    cur_ptr -= arg_size, cur_ptr &= ~(arg_align - 1);
    GROWABLE_HEAP_I8().subarray(cur_ptr, cur_ptr + arg_size).set(GROWABLE_HEAP_I8().subarray(cur_arg, cur_arg + arg_size));
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    break;

   case 2:
    cur_ptr -= 4, cur_ptr &= ~(4 - 1);
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    GROWABLE_HEAP_F32()[(cur_ptr >> 2) + 0] = cur_arg;
    break;

   case 3:
    cur_ptr -= 8, cur_ptr &= ~(8 - 1);
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    GROWABLE_HEAP_F64()[(cur_ptr >> 3) + 0] = cur_arg;
    break;

   case 11:
   case 12:
    cur_ptr -= 8, cur_ptr &= ~(8 - 1);
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    HEAPU64[(cur_ptr >> 3) + 0] = cur_arg;
    break;

   case 4:
    cur_ptr -= 16, cur_ptr &= ~(8 - 1);
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
    HEAPU64[(cur_ptr >> 3) + 0] = cur_arg;
    cur_arg = args[jsarg_idx++];
    HEAPU64[(cur_ptr >> 3) + 1] = cur_arg;
    break;
   }
  }
  var varargs = args[args.length - 1];
  for (;carg_idx < nargs; carg_idx++) {
   var arg_type_id = unboxed_arg_type_id_list[carg_idx];
   var arg_type_info = unboxed_arg_type_info_list[carg_idx];
   var arg_size = arg_type_info[0];
   var arg_align = arg_type_info[1];
   if (arg_type_id === 13) {
    var struct_ptr = GROWABLE_HEAP_U32()[(varargs >> 2) + 0];
    cur_ptr -= arg_size, cur_ptr &= ~(arg_align - 1);
    GROWABLE_HEAP_I8().subarray(cur_ptr, cur_ptr + arg_size).set(GROWABLE_HEAP_I8().subarray(struct_ptr, struct_ptr + arg_size));
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = cur_ptr;
   } else {
    GROWABLE_HEAP_U32()[(args_ptr >> 2) + carg_idx] = varargs;
   }
   varargs += 4;
  }
  cur_ptr -= 0, cur_ptr &= ~(8 - 1);
  stackRestore(cur_ptr);
  wasmTable.get(GROWABLE_HEAP_U32()[(closure >> 2) + 2])(GROWABLE_HEAP_U32()[(closure >> 2) + 1], ret_ptr, args_ptr, GROWABLE_HEAP_U32()[(closure >> 2) + 3]);
  stackRestore(orig_stack_ptr);
  if (!ret_by_arg) {
   switch (sig[0]) {
   case "i":
    return GROWABLE_HEAP_U32()[(ret_ptr >> 2) + 0];

   case "j":
    return HEAPU64[(ret_ptr >> 3) + 0];

   case "d":
    return GROWABLE_HEAP_F64()[(ret_ptr >> 3) + 0];

   case "f":
    return GROWABLE_HEAP_F32()[(ret_ptr >> 2) + 0];
   }
  }
 }
 try {
  var wasm_trampoline = convertJsFunctionToWasm(trampoline, sig);
 } catch (e) {
  return 1;
 }
 wasmTable.set(codeloc, wasm_trampoline);
 GROWABLE_HEAP_U32()[(closure >> 2) + 1] = cif;
 GROWABLE_HEAP_U32()[(closure >> 2) + 2] = fun;
 GROWABLE_HEAP_U32()[(closure >> 2) + 3] = user_data;
 return 0;
}

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = `Program terminated with exit(${status})`;
 this.status = status;
}

function terminateWorker(worker) {
 worker.terminate();
 worker.onmessage = e => {};
}

function killThread(pthread_ptr) {
 var worker = PThread.pthreads[pthread_ptr];
 delete PThread.pthreads[pthread_ptr];
 terminateWorker(worker);
 __emscripten_thread_free_data(pthread_ptr);
 PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
 worker.pthread_ptr = 0;
}

function cancelThread(pthread_ptr) {
 var worker = PThread.pthreads[pthread_ptr];
 worker.postMessage({
  "cmd": "cancel"
 });
}

function cleanupThread(pthread_ptr) {
 var worker = PThread.pthreads[pthread_ptr];
 assert(worker);
 PThread.returnWorkerToPool(worker);
}

function zeroMemory(address, size) {
 GROWABLE_HEAP_U8().fill(0, address, address + size);
 return address;
}

function spawnThread(threadParams) {
 var worker = PThread.getNewWorker();
 if (!worker) {
  return 6;
 }
 PThread.runningWorkers.push(worker);
 PThread.pthreads[threadParams.pthread_ptr] = worker;
 worker.pthread_ptr = threadParams.pthread_ptr;
 var msg = {
  "cmd": "run",
  "start_routine": threadParams.startRoutine,
  "arg": threadParams.arg,
  "pthread_ptr": threadParams.pthread_ptr
 };
 if (ENVIRONMENT_IS_NODE) {
  worker.unref();
 }
 worker.postMessage(msg, threadParams.transferList);
 return 0;
}

var PATH = {
 isAbs: path => nodePath["isAbsolute"](path),
 normalize: path => nodePath["posix"]["normalize"](path),
 dirname: path => nodePath["dirname"](path),
 basename: path => nodePath["basename"](path),
 join: function() {
  return nodePath["posix"]["join"].apply(null, arguments);
 },
 join2: (l, r) => nodePath["posix"]["join"](l, r)
};

function initRandomFill() {
 if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
  return view => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), 
  view);
 } else if (ENVIRONMENT_IS_NODE) {
  try {
   var crypto_module = require("crypto");
   var randomFillSync = crypto_module["randomFillSync"];
   if (randomFillSync) {
    return view => crypto_module["randomFillSync"](view);
   }
   var randomBytes = crypto_module["randomBytes"];
   return view => (view.set(randomBytes(view.byteLength)), view);
  } catch (e) {}
 }
 abort("initRandomDevice");
}

function randomFill(view) {
 return (randomFill = initRandomFill())(view);
}

var PATH_FS = {
 resolve: function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  paths.unshift(FS.cwd());
  return nodePath["posix"]["resolve"].apply(null, paths);
 },
 relative: (from, to) => nodePath["posix"]["relative"](from || FS.cwd(), to || FS.cwd())
};

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var c = str.charCodeAt(i);
  if (c <= 127) {
   len++;
  } else if (c <= 2047) {
   len += 2;
  } else if (c >= 55296 && c <= 57343) {
   len += 4;
   ++i;
  } else {
   len += 3;
  }
 }
 return len;
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}

function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var str = "";
 while (!(idx >= endIdx)) {
  var u0 = heapOrArray[idx++];
  if (!u0) return str;
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  var u1 = heapOrArray[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
 return str;
}

var TTY = {
 ttys: [],
 init: function() {},
 shutdown: function() {},
 register: function(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 },
 stream_ops: {
  open: function(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(43);
   }
   stream.tty = tty;
   stream.seekable = false;
  },
  close: function(stream) {
   stream.tty.ops.fsync(stream.tty);
  },
  fsync: function(stream) {
   stream.tty.ops.fsync(stream.tty);
  },
  read: function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(60);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(29);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(6);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  },
  write: function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(60);
   }
   try {
    for (var i = 0; i < length; i++) {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    }
   } catch (e) {
    throw new FS.ErrnoError(29);
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  }
 },
 default_tty_ops: {
  get_char: function(tty) {
   if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
     var BUFSIZE = 256;
     var buf = Buffer.alloc(BUFSIZE);
     var bytesRead = 0;
     try {
      bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, -1);
     } catch (e) {
      if (e.toString().includes("EOF")) bytesRead = 0; else throw e;
     }
     if (bytesRead > 0) {
      result = buf.slice(0, bytesRead).toString("utf-8");
     } else {
      result = null;
     }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
     result = window.prompt("Input: ");
     if (result !== null) {
      result += "\n";
     }
    } else if (typeof readline == "function") {
     result = readline();
     if (result !== null) {
      result += "\n";
     }
    }
    if (!result) {
     return null;
    }
    tty.input = intArrayFromString(result, true);
   }
   return tty.input.shift();
  },
  put_char: function(tty, val) {
   if (val === null || val === 10) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  fsync: function(tty) {
   if (tty.output && tty.output.length > 0) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  }
 },
 default_tty1_ops: {
  put_char: function(tty, val) {
   if (val === null || val === 10) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  fsync: function(tty) {
   if (tty.output && tty.output.length > 0) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  }
 }
};

function alignMemory(size, alignment) {
 return Math.ceil(size / alignment) * alignment;
}

function mmapAlloc(size) {
 size = alignMemory(size, 65536);
 var ptr = _emscripten_builtin_memalign(65536, size);
 if (!ptr) return 0;
 return zeroMemory(ptr, size);
}

var MEMFS = {
 ops_table: null,
 mount: function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
 },
 createNode: function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(63);
  }
  if (!MEMFS.ops_table) {
   MEMFS.ops_table = {
    dir: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      lookup: MEMFS.node_ops.lookup,
      mknod: MEMFS.node_ops.mknod,
      rename: MEMFS.node_ops.rename,
      unlink: MEMFS.node_ops.unlink,
      rmdir: MEMFS.node_ops.rmdir,
      readdir: MEMFS.node_ops.readdir,
      symlink: MEMFS.node_ops.symlink
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek
     }
    },
    file: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek,
      read: MEMFS.stream_ops.read,
      write: MEMFS.stream_ops.write,
      allocate: MEMFS.stream_ops.allocate,
      mmap: MEMFS.stream_ops.mmap,
      msync: MEMFS.stream_ops.msync
     }
    },
    link: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      readlink: MEMFS.node_ops.readlink
     },
     stream: {}
    },
    chrdev: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: FS.chrdev_stream_ops
    }
   };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
   parent.timestamp = node.timestamp;
  }
  return node;
 },
 getFileDataAsTypedArray: function(node) {
  if (!node.contents) return new Uint8Array(0);
  if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 },
 expandFileStorage: function(node, newCapacity) {
  var prevCapacity = node.contents ? node.contents.length : 0;
  if (prevCapacity >= newCapacity) return;
  var CAPACITY_DOUBLING_MAX = 1024 * 1024;
  newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
  if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
  var oldContents = node.contents;
  node.contents = new Uint8Array(newCapacity);
  if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
 },
 resizeFileStorage: function(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
  } else {
   var oldContents = node.contents;
   node.contents = new Uint8Array(newSize);
   if (oldContents) {
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   }
   node.usedBytes = newSize;
  }
 },
 node_ops: {
  getattr: function(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  },
  setattr: function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  },
  lookup: function(parent, name) {
   throw FS.genericErrors[44];
  },
  mknod: function(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  },
  rename: function(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(55);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.parent.timestamp = Date.now();
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   new_dir.timestamp = old_node.parent.timestamp;
   old_node.parent = new_dir;
  },
  unlink: function(parent, name) {
   delete parent.contents[name];
   parent.timestamp = Date.now();
  },
  rmdir: function(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(55);
   }
   delete parent.contents[name];
   parent.timestamp = Date.now();
  },
  readdir: function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  },
  symlink: function(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
   node.link = oldpath;
   return node;
  },
  readlink: function(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(28);
   }
   return node.link;
  }
 },
 stream_ops: {
  read: function(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  },
  write: function(stream, buffer, offset, length, position, canOwn) {
   if (buffer.buffer === GROWABLE_HEAP_I8().buffer) {
    canOwn = false;
   }
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = buffer.slice(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) {
    node.contents.set(buffer.subarray(offset, offset + length), position);
   } else {
    for (var i = 0; i < length; i++) {
     node.contents[position + i] = buffer[offset + i];
    }
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  },
  llseek: function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(28);
   }
   return position;
  },
  allocate: function(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  },
  mmap: function(stream, length, position, prot, flags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && contents.buffer === GROWABLE_HEAP_I8().buffer) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < contents.length) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = mmapAlloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(48);
    }
    GROWABLE_HEAP_I8().set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  },
  msync: function(stream, buffer, offset, length, mmapFlags) {
   MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  }
 }
};

function asyncLoad(url, onload, onerror, noRunDep) {
 var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
 readAsync(url, arrayBuffer => {
  assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
  onload(new Uint8Array(arrayBuffer));
  if (dep) removeRunDependency(dep);
 }, event => {
  if (onerror) {
   onerror();
  } else {
   throw `Loading data file "${url}" failed.`;
  }
 });
 if (dep) addRunDependency(dep);
}

var preloadPlugins = Module["preloadPlugins"] || [];

function FS_handledByPreloadPlugin(byteArray, fullname, finish, onerror) {
 if (typeof Browser != "undefined") Browser.init();
 var handled = false;
 preloadPlugins.forEach(function(plugin) {
  if (handled) return;
  if (plugin["canHandle"](fullname)) {
   plugin["handle"](byteArray, fullname, finish, onerror);
   handled = true;
  }
 });
 return handled;
}

function FS_createPreloadedFile(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
 var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
 var dep = getUniqueRunDependency(`cp ${fullname}`);
 function processData(byteArray) {
  function finish(byteArray) {
   if (preFinish) preFinish();
   if (!dontCreateFile) {
    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
   }
   if (onload) onload();
   removeRunDependency(dep);
  }
  if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
   if (onerror) onerror();
   removeRunDependency(dep);
  })) {
   return;
  }
  finish(byteArray);
 }
 addRunDependency(dep);
 if (typeof url == "string") {
  asyncLoad(url, byteArray => processData(byteArray), onerror);
 } else {
  processData(url);
 }
}

function FS_modeStringToFlags(str) {
 var flagModes = {
  "r": 0,
  "r+": 2,
  "w": 512 | 64 | 1,
  "w+": 512 | 64 | 2,
  "a": 1024 | 64 | 1,
  "a+": 1024 | 64 | 2
 };
 var flags = flagModes[str];
 if (typeof flags == "undefined") {
  throw new Error(`Unknown file open mode: ${str}`);
 }
 return flags;
}

function FS_getMode(canRead, canWrite) {
 var mode = 0;
 if (canRead) mode |= 292 | 73;
 if (canWrite) mode |= 146;
 return mode;
}

var ERRNO_CODES = {};

var NODEFS = {
 isWindows: false,
 staticInit: () => {
  NODEFS.isWindows = !!process.platform.match(/^win/);
  var flags = process.binding("constants");
  if (flags["fs"]) {
   flags = flags["fs"];
  }
  NODEFS.flagsForNodeMap = {
   1024: flags["O_APPEND"],
   64: flags["O_CREAT"],
   128: flags["O_EXCL"],
   256: flags["O_NOCTTY"],
   0: flags["O_RDONLY"],
   2: flags["O_RDWR"],
   4096: flags["O_SYNC"],
   512: flags["O_TRUNC"],
   1: flags["O_WRONLY"],
   131072: flags["O_NOFOLLOW"]
  };
 },
 convertNodeCode: e => {
  var code = e.code;
  return ERRNO_CODES[code];
 },
 mount: mount => {
  return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
 },
 createNode: (parent, name, mode, dev) => {
  if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
   throw new FS.ErrnoError(28);
  }
  var node = FS.createNode(parent, name, mode);
  node.node_ops = NODEFS.node_ops;
  node.stream_ops = NODEFS.stream_ops;
  return node;
 },
 getMode: path => {
  var stat;
  try {
   stat = fs.lstatSync(path);
   if (NODEFS.isWindows) {
    stat.mode = stat.mode | (stat.mode & 292) >> 2;
   }
  } catch (e) {
   if (!e.code) throw e;
   throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
  }
  return stat.mode;
 },
 realPath: node => {
  var parts = [];
  while (node.parent !== node) {
   parts.push(node.name);
   node = node.parent;
  }
  parts.push(node.mount.opts.root);
  parts.reverse();
  return PATH.join.apply(null, parts);
 },
 flagsForNode: flags => {
  flags &= ~2097152;
  flags &= ~2048;
  flags &= ~32768;
  flags &= ~524288;
  flags &= ~65536;
  var newFlags = 0;
  for (var k in NODEFS.flagsForNodeMap) {
   if (flags & k) {
    newFlags |= NODEFS.flagsForNodeMap[k];
    flags ^= k;
   }
  }
  if (flags) {
   throw new FS.ErrnoError(28);
  }
  return newFlags;
 },
 node_ops: {
  getattr: node => {
   var path = NODEFS.realPath(node);
   var stat;
   try {
    stat = fs.lstatSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
   if (NODEFS.isWindows && !stat.blksize) {
    stat.blksize = 4096;
   }
   if (NODEFS.isWindows && !stat.blocks) {
    stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
   }
   return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    uid: stat.uid,
    gid: stat.gid,
    rdev: stat.rdev,
    size: stat.size,
    atime: stat.atime,
    mtime: stat.mtime,
    ctime: stat.ctime,
    blksize: stat.blksize,
    blocks: stat.blocks
   };
  },
  setattr: (node, attr) => {
   var path = NODEFS.realPath(node);
   try {
    if (attr.mode !== undefined) {
     fs.chmodSync(path, attr.mode);
     node.mode = attr.mode;
    }
    if (attr.timestamp !== undefined) {
     var date = new Date(attr.timestamp);
     fs.utimesSync(path, date, date);
    }
    if (attr.size !== undefined) {
     fs.truncateSync(path, attr.size);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  lookup: (parent, name) => {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   var mode = NODEFS.getMode(path);
   return NODEFS.createNode(parent, name, mode);
  },
  mknod: (parent, name, mode, dev) => {
   var node = NODEFS.createNode(parent, name, mode, dev);
   var path = NODEFS.realPath(node);
   try {
    if (FS.isDir(node.mode)) {
     fs.mkdirSync(path, node.mode);
    } else {
     fs.writeFileSync(path, "", {
      mode: node.mode
     });
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
   return node;
  },
  rename: (oldNode, newDir, newName) => {
   var oldPath = NODEFS.realPath(oldNode);
   var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
   try {
    fs.renameSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
   oldNode.name = newName;
  },
  unlink: (parent, name) => {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.unlinkSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  rmdir: (parent, name) => {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.rmdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  readdir: node => {
   var path = NODEFS.realPath(node);
   try {
    return fs.readdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  symlink: (parent, newName, oldPath) => {
   var newPath = PATH.join2(NODEFS.realPath(parent), newName);
   try {
    fs.symlinkSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  readlink: node => {
   var path = NODEFS.realPath(node);
   try {
    path = fs.readlinkSync(path);
    path = nodePath.relative(nodePath.resolve(node.mount.opts.root), path);
    return path;
   } catch (e) {
    if (!e.code) throw e;
    if (e.code === "UNKNOWN") throw new FS.ErrnoError(28);
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  }
 },
 stream_ops: {
  open: stream => {
   var path = NODEFS.realPath(stream.node);
   try {
    if (FS.isFile(stream.node.mode)) {
     stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  close: stream => {
   try {
    if (FS.isFile(stream.node.mode) && stream.nfd) {
     fs.closeSync(stream.nfd);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  read: (stream, buffer, offset, length, position) => {
   if (length === 0) return 0;
   try {
    return fs.readSync(stream.nfd, Buffer.from(buffer.buffer), offset, length, position);
   } catch (e) {
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  write: (stream, buffer, offset, length, position) => {
   try {
    return fs.writeSync(stream.nfd, Buffer.from(buffer.buffer), offset, length, position);
   } catch (e) {
    throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
   }
  },
  llseek: (stream, offset, whence) => {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     try {
      var stat = fs.fstatSync(stream.nfd);
      position += stat.size;
     } catch (e) {
      throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
     }
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(28);
   }
   return position;
  },
  mmap: (stream, length, position, prot, flags) => {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
   }
   var ptr = mmapAlloc(length);
   NODEFS.stream_ops.read(stream, GROWABLE_HEAP_I8(), ptr, length, position);
   return {
    ptr: ptr,
    allocated: true
   };
  },
  msync: (stream, buffer, offset, length, mmapFlags) => {
   NODEFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  }
 }
};

var NODERAWFS = {
 init: (input, output, error) => {
  VFS.init(input, output, error);
  var _wrapNodeError = function(func) {
   return function() {
    try {
     return func.apply(this, arguments);
    } catch (e) {
     if (e.code) {
      throw new FS.ErrnoError(ERRNO_CODES[e.code]);
     }
     throw e;
    }
   };
  };
  for (var _key in NODERAWFS) {
   FS[_key] = _wrapNodeError(NODERAWFS[_key]);
  }
 },
 lookup: function(parent, name) {
  return FS.lookupPath(`${parent.path}/${name}`).node;
 },
 lookupPath: function(path, opts = {}) {
  if (opts.parent) {
   path = nodePath.dirname(path);
  }
  var st = fs.lstatSync(path);
  var mode = NODEFS.getMode(path);
  return {
   path: path,
   node: {
    id: st.ino,
    mode: mode,
    node_ops: NODERAWFS,
    path: path
   }
  };
 },
 cwd: function() {
  return process.cwd();
 },
 chdir: function() {
  process.chdir.apply(void 0, arguments);
 },
 mknod: function(path, mode) {
  if (FS.isDir(path)) {
   fs.mkdirSync(path, mode);
  } else {
   fs.writeFileSync(path, "", {
    mode: mode
   });
  }
 },
 mkdir: function() {
  fs.mkdirSync.apply(void 0, arguments);
 },
 symlink: function() {
  fs.symlinkSync.apply(void 0, arguments);
 },
 rename: function() {
  fs.renameSync.apply(void 0, arguments);
 },
 rmdir: function() {
  fs.rmdirSync.apply(void 0, arguments);
 },
 readdir: function() {
  return [ ".", ".." ].concat(fs.readdirSync.apply(void 0, arguments));
 },
 unlink: function() {
  fs.unlinkSync.apply(void 0, arguments);
 },
 readlink: function() {
  return fs.readlinkSync.apply(void 0, arguments);
 },
 stat: function() {
  return fs.statSync.apply(void 0, arguments);
 },
 lstat: function() {
  return fs.lstatSync.apply(void 0, arguments);
 },
 chmod: function() {
  fs.chmodSync.apply(void 0, arguments);
 },
 fchmod: function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  fs.fchmodSync(stream.nfd, mode);
 },
 chown: function() {
  fs.chownSync.apply(void 0, arguments);
 },
 fchown: function(fd, owner, group) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  fs.fchownSync(stream.nfd, owner, group);
 },
 truncate: function() {
  fs.truncateSync.apply(void 0, arguments);
 },
 ftruncate: function(fd, len) {
  if (len < 0) {
   throw new FS.ErrnoError(28);
  }
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  fs.ftruncateSync(stream.nfd, len);
 },
 utime: function(path, atime, mtime) {
  fs.utimesSync(path, atime / 1e3, mtime / 1e3);
 },
 open: function(path, flags, mode) {
  if (typeof flags == "string") {
   flags = FS_modeStringToFlags(flags);
  }
  var pathTruncated = path.split("/").map(function(s) {
   return s.substr(0, 255);
  }).join("/");
  var nfd = fs.openSync(pathTruncated, NODEFS.flagsForNode(flags), mode);
  var st = fs.fstatSync(nfd);
  if (flags & 65536 && !st.isDirectory()) {
   fs.closeSync(nfd);
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  var newMode = NODEFS.getMode(pathTruncated);
  var node = {
   id: st.ino,
   mode: newMode,
   node_ops: NODERAWFS,
   path: path
  };
  return FS.createStream({
   nfd: nfd,
   position: 0,
   path: path,
   flags: flags,
   node: node,
   seekable: true
  });
 },
 createStream: function(stream, fd) {
  var rtn = VFS.createStream(stream, fd);
  if (typeof rtn.shared.refcnt == "undefined") {
   rtn.shared.refcnt = 1;
  } else {
   rtn.shared.refcnt++;
  }
  return rtn;
 },
 close: function(stream) {
  VFS.closeStream(stream.fd);
  if (!stream.stream_ops && --stream.shared.refcnt === 0) {
   fs.closeSync(stream.nfd);
  }
 },
 llseek: function(stream, offset, whence) {
  if (stream.stream_ops) {
   return VFS.llseek(stream, offset, whence);
  }
  var position = offset;
  if (whence === 1) {
   position += stream.position;
  } else if (whence === 2) {
   position += fs.fstatSync(stream.nfd).size;
  } else if (whence !== 0) {
   throw new FS.ErrnoError(28);
  }
  if (position < 0) {
   throw new FS.ErrnoError(28);
  }
  stream.position = position;
  return position;
 },
 read: function(stream, buffer, offset, length, position) {
  if (stream.stream_ops) {
   return VFS.read(stream, buffer, offset, length, position);
  }
  var seeking = typeof position != "undefined";
  if (!seeking && stream.seekable) position = stream.position;
  var bytesRead = fs.readSync(stream.nfd, Buffer.from(buffer.buffer), offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 },
 write: function(stream, buffer, offset, length, position) {
  if (stream.stream_ops) {
   return VFS.write(stream, buffer, offset, length, position);
  }
  if (stream.flags & +"1024") {
   FS.llseek(stream, 0, +"2");
  }
  var seeking = typeof position != "undefined";
  if (!seeking && stream.seekable) position = stream.position;
  var bytesWritten = fs.writeSync(stream.nfd, Buffer.from(buffer.buffer), offset, length, position);
  if (!seeking) stream.position += bytesWritten;
  return bytesWritten;
 },
 allocate: function() {
  throw new FS.ErrnoError(138);
 },
 mmap: function(stream, length, position, prot, flags) {
  if (stream.stream_ops) {
   return VFS.mmap(stream, length, position, prot, flags);
  }
  var ptr = mmapAlloc(length);
  FS.read(stream, GROWABLE_HEAP_I8(), ptr, length, position);
  return {
   ptr: ptr,
   allocated: true
  };
 },
 msync: function(stream, buffer, offset, length, mmapFlags) {
  if (stream.stream_ops) {
   return VFS.msync(stream, buffer, offset, length, mmapFlags);
  }
  FS.write(stream, buffer, 0, length, offset);
  return 0;
 },
 munmap: function() {
  return 0;
 },
 ioctl: function() {
  throw new FS.ErrnoError(59);
 }
};

var FS = {
 root: null,
 mounts: [],
 devices: {},
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 ErrnoError: null,
 genericErrors: {},
 filesystems: null,
 syncFSRequests: 0,
 lookupPath: (path, opts = {}) => {
  path = PATH_FS.resolve(path);
  if (!path) return {
   path: "",
   node: null
  };
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  opts = Object.assign(defaults, opts);
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(32);
  }
  var parts = path.split("/").filter(p => !!p);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = i === parts.length - 1;
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || islast && opts.follow_mount) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count + 1
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(32);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 },
 getPath: node => {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
   }
   path = path ? `${node.name}/${path}` : node.name;
   node = node.parent;
  }
 },
 hashName: (parentid, name) => {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
 },
 hashAddNode: node => {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 },
 hashRemoveNode: node => {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 },
 lookupNode: (parent, name) => {
  var errCode = FS.mayLookup(parent);
  if (errCode) {
   throw new FS.ErrnoError(errCode, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 },
 createNode: (parent, name, mode, rdev) => {
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 },
 destroyNode: node => {
  FS.hashRemoveNode(node);
 },
 isRoot: node => {
  return node === node.parent;
 },
 isMountpoint: node => {
  return !!node.mounted;
 },
 isFile: mode => {
  return (mode & 61440) === 32768;
 },
 isDir: mode => {
  return (mode & 61440) === 16384;
 },
 isLink: mode => {
  return (mode & 61440) === 40960;
 },
 isChrdev: mode => {
  return (mode & 61440) === 8192;
 },
 isBlkdev: mode => {
  return (mode & 61440) === 24576;
 },
 isFIFO: mode => {
  return (mode & 61440) === 4096;
 },
 isSocket: mode => {
  return (mode & 49152) === 49152;
 },
 flagsToPermissionString: flag => {
  var perms = [ "r", "w", "rw" ][flag & 3];
  if (flag & 512) {
   perms += "w";
  }
  return perms;
 },
 nodePermissions: (node, perms) => {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.includes("r") && !(node.mode & 292)) {
   return 2;
  } else if (perms.includes("w") && !(node.mode & 146)) {
   return 2;
  } else if (perms.includes("x") && !(node.mode & 73)) {
   return 2;
  }
  return 0;
 },
 mayLookup: dir => {
  var errCode = FS.nodePermissions(dir, "x");
  if (errCode) return errCode;
  if (!dir.node_ops.lookup) return 2;
  return 0;
 },
 mayCreate: (dir, name) => {
  try {
   var node = FS.lookupNode(dir, name);
   return 20;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 },
 mayDelete: (dir, name, isdir) => {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var errCode = FS.nodePermissions(dir, "wx");
  if (errCode) {
   return errCode;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return 54;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return 10;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return 31;
   }
  }
  return 0;
 },
 mayOpen: (node, flags) => {
  if (!node) {
   return 44;
  }
  if (FS.isLink(node.mode)) {
   return 32;
  } else if (FS.isDir(node.mode)) {
   if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
    return 31;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 },
 MAX_OPEN_FDS: 4096,
 nextfd: () => {
  for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(33);
 },
 getStream: fd => FS.streams[fd],
 createStream: (stream, fd = -1) => {
  if (!FS.FSStream) {
   FS.FSStream = function() {
    this.shared = {};
   };
   FS.FSStream.prototype = {};
   Object.defineProperties(FS.FSStream.prototype, {
    object: {
     get: function() {
      return this.node;
     },
     set: function(val) {
      this.node = val;
     }
    },
    isRead: {
     get: function() {
      return (this.flags & 2097155) !== 1;
     }
    },
    isWrite: {
     get: function() {
      return (this.flags & 2097155) !== 0;
     }
    },
    isAppend: {
     get: function() {
      return this.flags & 1024;
     }
    },
    flags: {
     get: function() {
      return this.shared.flags;
     },
     set: function(val) {
      this.shared.flags = val;
     }
    },
    position: {
     get: function() {
      return this.shared.position;
     },
     set: function(val) {
      this.shared.position = val;
     }
    }
   });
  }
  stream = Object.assign(new FS.FSStream(), stream);
  if (fd == -1) {
   fd = FS.nextfd();
  }
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 },
 closeStream: fd => {
  FS.streams[fd] = null;
 },
 chrdev_stream_ops: {
  open: stream => {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
   }
  },
  llseek: () => {
   throw new FS.ErrnoError(70);
  }
 },
 major: dev => dev >> 8,
 minor: dev => dev & 255,
 makedev: (ma, mi) => ma << 8 | mi,
 registerDevice: (dev, ops) => {
  FS.devices[dev] = {
   stream_ops: ops
  };
 },
 getDevice: dev => FS.devices[dev],
 getMounts: mount => {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 },
 syncfs: (populate, callback) => {
  if (typeof populate == "function") {
   callback = populate;
   populate = false;
  }
  FS.syncFSRequests++;
  if (FS.syncFSRequests > 1) {
   err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function doCallback(errCode) {
   FS.syncFSRequests--;
   return callback(errCode);
  }
  function done(errCode) {
   if (errCode) {
    if (!done.errored) {
     done.errored = true;
     return doCallback(errCode);
    }
    return;
   }
   if (++completed >= mounts.length) {
    doCallback(null);
   }
  }
  mounts.forEach(mount => {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  });
 },
 mount: (type, opts, mountpoint) => {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(10);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(10);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(54);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 },
 unmount: mountpoint => {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(28);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach(hash => {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.includes(current.mount)) {
     FS.destroyNode(current);
    }
    current = next;
   }
  });
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  node.mount.mounts.splice(idx, 1);
 },
 lookup: (parent, name) => {
  return parent.node_ops.lookup(parent, name);
 },
 mknod: (path, mode, dev) => {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
   throw new FS.ErrnoError(28);
  }
  var errCode = FS.mayCreate(parent, name);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(63);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 },
 create: (path, mode) => {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 },
 mkdir: (path, mode) => {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 },
 mkdirTree: (path, mode) => {
  var dirs = path.split("/");
  var d = "";
  for (var i = 0; i < dirs.length; ++i) {
   if (!dirs[i]) continue;
   d += "/" + dirs[i];
   try {
    FS.mkdir(d, mode);
   } catch (e) {
    if (e.errno != 20) throw e;
   }
  }
 },
 mkdev: (path, mode, dev) => {
  if (typeof dev == "undefined") {
   dev = mode;
   mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
 },
 symlink: (oldpath, newpath) => {
  if (!PATH_FS.resolve(oldpath)) {
   throw new FS.ErrnoError(44);
  }
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(44);
  }
  var newname = PATH.basename(newpath);
  var errCode = FS.mayCreate(parent, newname);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(63);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 },
 rename: (old_path, new_path) => {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  lookup = FS.lookupPath(old_path, {
   parent: true
  });
  old_dir = lookup.node;
  lookup = FS.lookupPath(new_path, {
   parent: true
  });
  new_dir = lookup.node;
  if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(75);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH_FS.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(28);
  }
  relative = PATH_FS.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(55);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var errCode = FS.mayDelete(old_dir, old_name, isdir);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
   throw new FS.ErrnoError(10);
  }
  if (new_dir !== old_dir) {
   errCode = FS.nodePermissions(old_dir, "w");
   if (errCode) {
    throw new FS.ErrnoError(errCode);
   }
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
 },
 rmdir: path => {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, true);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(10);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
 },
 readdir: path => {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(54);
  }
  return node.node_ops.readdir(node);
 },
 unlink: path => {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(44);
  }
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, false);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(10);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
 },
 readlink: path => {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
   throw new FS.ErrnoError(44);
  }
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(28);
  }
  return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
 },
 stat: (path, dontFollow) => {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node) {
   throw new FS.ErrnoError(44);
  }
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(63);
  }
  return node.node_ops.getattr(node);
 },
 lstat: path => {
  return FS.stat(path, true);
 },
 chmod: (path, mode, dontFollow) => {
  var node;
  if (typeof path == "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {
   mode: mode & 4095 | node.mode & ~4095,
   timestamp: Date.now()
  });
 },
 lchmod: (path, mode) => {
  FS.chmod(path, mode, true);
 },
 fchmod: (fd, mode) => {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  FS.chmod(stream.node, mode);
 },
 chown: (path, uid, gid, dontFollow) => {
  var node;
  if (typeof path == "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 },
 lchown: (path, uid, gid) => {
  FS.chown(path, uid, gid, true);
 },
 fchown: (fd, uid, gid) => {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  FS.chown(stream.node, uid, gid);
 },
 truncate: (path, len) => {
  if (len < 0) {
   throw new FS.ErrnoError(28);
  }
  var node;
  if (typeof path == "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(28);
  }
  var errCode = FS.nodePermissions(node, "w");
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 },
 ftruncate: (fd, len) => {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(28);
  }
  FS.truncate(stream.node, len);
 },
 utime: (path, atime, mtime) => {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 },
 open: (path, flags, mode) => {
  if (path === "") {
   throw new FS.ErrnoError(44);
  }
  flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
  mode = typeof mode == "undefined" ? 438 : mode;
  if (flags & 64) {
   mode = mode & 4095 | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path == "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  var created = false;
  if (flags & 64) {
   if (node) {
    if (flags & 128) {
     throw new FS.ErrnoError(20);
    }
   } else {
    node = FS.mknod(path, mode, 0);
    created = true;
   }
  }
  if (!node) {
   throw new FS.ErrnoError(44);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(54);
  }
  if (!created) {
   var errCode = FS.mayOpen(node, flags);
   if (errCode) {
    throw new FS.ErrnoError(errCode);
   }
  }
  if (flags & 512 && !created) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512 | 131072);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  });
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
   }
  }
  return stream;
 },
 close: stream => {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (stream.getdents) stream.getdents = null;
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
  stream.fd = null;
 },
 isClosed: stream => {
  return stream.fd === null;
 },
 llseek: (stream, offset, whence) => {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(70);
  }
  if (whence != 0 && whence != 1 && whence != 2) {
   throw new FS.ErrnoError(28);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
 },
 read: (stream, buffer, offset, length, position) => {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(28);
  }
  var seeking = typeof position != "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(70);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 },
 write: (stream, buffer, offset, length, position, canOwn) => {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(28);
  }
  if (stream.seekable && stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = typeof position != "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(70);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  return bytesWritten;
 },
 allocate: (stream, offset, length) => {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(28);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(8);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(43);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(138);
  }
  stream.stream_ops.allocate(stream, offset, length);
 },
 mmap: (stream, length, position, prot, flags) => {
  if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
   throw new FS.ErrnoError(2);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(2);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(43);
  }
  return stream.stream_ops.mmap(stream, length, position, prot, flags);
 },
 msync: (stream, buffer, offset, length, mmapFlags) => {
  if (!stream.stream_ops.msync) {
   return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
 },
 munmap: stream => 0,
 ioctl: (stream, cmd, arg) => {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(59);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 },
 readFile: (path, opts = {}) => {
  opts.flags = opts.flags || 0;
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error(`Invalid encoding type "${opts.encoding}"`);
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 },
 writeFile: (path, data, opts = {}) => {
  opts.flags = opts.flags || 577;
  var stream = FS.open(path, opts.flags, opts.mode);
  if (typeof data == "string") {
   var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
   var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
   FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
  } else if (ArrayBuffer.isView(data)) {
   FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
  } else {
   throw new Error("Unsupported data type");
  }
  FS.close(stream);
 },
 cwd: () => FS.currentPath,
 chdir: path => {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (lookup.node === null) {
   throw new FS.ErrnoError(44);
  }
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(54);
  }
  var errCode = FS.nodePermissions(lookup.node, "x");
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  FS.currentPath = lookup.path;
 },
 createDefaultDirectories: () => {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
 },
 createDefaultDevices: () => {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: () => 0,
   write: (stream, buffer, offset, length, pos) => length
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var randomBuffer = new Uint8Array(1024), randomLeft = 0;
  var randomByte = () => {
   if (randomLeft === 0) {
    randomLeft = randomFill(randomBuffer).byteLength;
   }
   return randomBuffer[--randomLeft];
  };
  FS.createDevice("/dev", "random", randomByte);
  FS.createDevice("/dev", "urandom", randomByte);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 },
 createSpecialDirectories: () => {
  FS.mkdir("/proc");
  var proc_self = FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({
   mount: () => {
    var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
    node.node_ops = {
     lookup: (parent, name) => {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(8);
      var ret = {
       parent: null,
       mount: {
        mountpoint: "fake"
       },
       node_ops: {
        readlink: () => stream.path
       }
      };
      ret.parent = ret;
      return ret;
     }
    };
    return node;
   }
  }, {}, "/proc/self/fd");
 },
 createStandardStreams: () => {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", 0);
  var stdout = FS.open("/dev/stdout", 1);
  var stderr = FS.open("/dev/stderr", 1);
 },
 ensureErrnoError: () => {
  if (FS.ErrnoError) return;
  FS.ErrnoError = function ErrnoError(errno, node) {
   this.name = "ErrnoError";
   this.node = node;
   this.setErrno = function(errno) {
    this.errno = errno;
   };
   this.setErrno(errno);
   this.message = "FS error";
  };
  FS.ErrnoError.prototype = new Error();
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ 44 ].forEach(code => {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  });
 },
 staticInit: () => {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {
   "MEMFS": MEMFS,
   "NODEFS": NODEFS
  };
 },
 init: (input, output, error) => {
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 },
 quit: () => {
  FS.init.initialized = false;
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 },
 findObject: (path, dontResolveLastLink) => {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (!ret.exists) {
   return null;
  }
  return ret.object;
 },
 analyzePath: (path, dontResolveLastLink) => {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 },
 createPath: (parent, path, canRead, canWrite) => {
  parent = typeof parent == "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 },
 createFile: (parent, name, properties, canRead, canWrite) => {
  var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
  var mode = FS_getMode(canRead, canWrite);
  return FS.create(path, mode);
 },
 createDataFile: (parent, name, data, canRead, canWrite, canOwn) => {
  var path = name;
  if (parent) {
   parent = typeof parent == "string" ? parent : FS.getPath(parent);
   path = name ? PATH.join2(parent, name) : parent;
  }
  var mode = FS_getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data == "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, 577);
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
  return node;
 },
 createDevice: (parent, name, input, output) => {
  var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
  var mode = FS_getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open: stream => {
    stream.seekable = false;
   },
   close: stream => {
    if (output && output.buffer && output.buffer.length) {
     output(10);
    }
   },
   read: (stream, buffer, offset, length, pos) => {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(29);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(6);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   },
   write: (stream, buffer, offset, length, pos) => {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(29);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   }
  });
  return FS.mkdev(path, mode, dev);
 },
 forceLoadFile: obj => {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  if (typeof XMLHttpRequest != "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (read_) {
   try {
    obj.contents = intArrayFromString(read_(obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    throw new FS.ErrnoError(29);
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
 },
 createLazyFile: (parent, name, url, canRead, canWrite) => {
  function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = idx / this.chunkSize | 0;
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest();
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = (from, to) => {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(xhr.response || []);
    }
    return intArrayFromString(xhr.responseText || "", true);
   };
   var lazyArray = this;
   lazyArray.setDataGetter(chunkNum => {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] == "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   });
   if (usesGzip || !datalength) {
    chunkSize = datalength = 1;
    datalength = this.getter(0).length;
    chunkSize = datalength;
    out("LazyFiles on gzip forces download of the whole file when length is accessed");
   }
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest != "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array();
   Object.defineProperties(lazyArray, {
    length: {
     get: function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._length;
     }
    },
    chunkSize: {
     get: function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._chunkSize;
     }
    }
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperties(node, {
   usedBytes: {
    get: function() {
     return this.contents.length;
    }
   }
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach(key => {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    FS.forceLoadFile(node);
    return fn.apply(null, arguments);
   };
  });
  function writeChunks(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  }
  stream_ops.read = (stream, buffer, offset, length, position) => {
   FS.forceLoadFile(node);
   return writeChunks(stream, buffer, offset, length, position);
  };
  stream_ops.mmap = (stream, length, position, prot, flags) => {
   FS.forceLoadFile(node);
   var ptr = mmapAlloc(length);
   if (!ptr) {
    throw new FS.ErrnoError(48);
   }
   writeChunks(stream, GROWABLE_HEAP_I8(), ptr, length, position);
   return {
    ptr: ptr,
    allocated: true
   };
  };
  node.stream_ops = stream_ops;
  return node;
 }
};

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : "";
}

var SYSCALLS = {
 DEFAULT_POLLMASK: 5,
 calculateAt: function(dirfd, path, allowEmpty) {
  if (PATH.isAbs(path)) {
   return path;
  }
  var dir;
  if (dirfd === -100) {
   dir = FS.cwd();
  } else {
   var dirstream = SYSCALLS.getStreamFromFD(dirfd);
   dir = dirstream.path;
  }
  if (path.length == 0) {
   if (!allowEmpty) {
    throw new FS.ErrnoError(44);
   }
   return dir;
  }
  return PATH.join2(dir, path);
 },
 doStat: function(func, path, buf) {
  try {
   var stat = func(path);
  } catch (e) {
   if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
    return -54;
   }
   throw e;
  }
  GROWABLE_HEAP_I32()[buf >> 2] = stat.dev;
  GROWABLE_HEAP_I32()[buf + 8 >> 2] = stat.ino;
  GROWABLE_HEAP_I32()[buf + 12 >> 2] = stat.mode;
  GROWABLE_HEAP_U32()[buf + 16 >> 2] = stat.nlink;
  GROWABLE_HEAP_I32()[buf + 20 >> 2] = stat.uid;
  GROWABLE_HEAP_I32()[buf + 24 >> 2] = stat.gid;
  GROWABLE_HEAP_I32()[buf + 28 >> 2] = stat.rdev;
  HEAP64[buf + 40 >> 3] = BigInt(stat.size);
  GROWABLE_HEAP_I32()[buf + 48 >> 2] = 4096;
  GROWABLE_HEAP_I32()[buf + 52 >> 2] = stat.blocks;
  var atime = stat.atime.getTime();
  var mtime = stat.mtime.getTime();
  var ctime = stat.ctime.getTime();
  HEAP64[buf + 56 >> 3] = BigInt(Math.floor(atime / 1e3));
  GROWABLE_HEAP_U32()[buf + 64 >> 2] = atime % 1e3 * 1e3;
  HEAP64[buf + 72 >> 3] = BigInt(Math.floor(mtime / 1e3));
  GROWABLE_HEAP_U32()[buf + 80 >> 2] = mtime % 1e3 * 1e3;
  HEAP64[buf + 88 >> 3] = BigInt(Math.floor(ctime / 1e3));
  GROWABLE_HEAP_U32()[buf + 96 >> 2] = ctime % 1e3 * 1e3;
  HEAP64[buf + 104 >> 3] = BigInt(stat.ino);
  return 0;
 },
 doMsync: function(addr, stream, len, flags, offset) {
  if (!FS.isFile(stream.node.mode)) {
   throw new FS.ErrnoError(43);
  }
  if (flags & 2) {
   return 0;
  }
  var buffer = GROWABLE_HEAP_U8().slice(addr, addr + len);
  FS.msync(stream, buffer, offset, len, flags);
 },
 varargs: undefined,
 get: function() {
  SYSCALLS.varargs += 4;
  var ret = GROWABLE_HEAP_I32()[SYSCALLS.varargs - 4 >> 2];
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 },
 getStreamFromFD: function(fd) {
  var stream = FS.getStream(fd);
  if (!stream) throw new FS.ErrnoError(8);
  return stream;
 }
};

function _proc_exit(code) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 1, code);
 EXITSTATUS = code;
 if (!keepRuntimeAlive()) {
  PThread.terminateAllThreads();
  if (Module["onExit"]) Module["onExit"](code);
  ABORT = true;
 }
 quit_(code, new ExitStatus(code));
}

function exitJS(status, implicit) {
 EXITSTATUS = status;
 if (ENVIRONMENT_IS_PTHREAD) {
  exitOnMainThread(status);
  throw "unwind";
 }
 _proc_exit(status);
}

var _exit = exitJS;

function handleException(e) {
 if (e instanceof ExitStatus || e == "unwind") {
  return EXITSTATUS;
 }
 quit_(1, e);
}

var PThread = {
 unusedWorkers: [],
 runningWorkers: [],
 tlsInitFunctions: [],
 pthreads: {},
 init: function() {
  if (ENVIRONMENT_IS_PTHREAD) {
   PThread.initWorker();
  } else {
   PThread.initMainThread();
  }
 },
 initMainThread: function() {
  addOnPreRun(() => {
   addRunDependency("loading-workers");
   PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("loading-workers"));
  });
 },
 initWorker: function() {
  noExitRuntime = false;
 },
 setExitStatus: function(status) {
  EXITSTATUS = status;
 },
 terminateAllThreads__deps: [ "$terminateWorker" ],
 terminateAllThreads: function() {
  for (var worker of PThread.runningWorkers) {
   terminateWorker(worker);
  }
  for (var worker of PThread.unusedWorkers) {
   terminateWorker(worker);
  }
  PThread.unusedWorkers = [];
  PThread.runningWorkers = [];
  PThread.pthreads = [];
 },
 returnWorkerToPool: function(worker) {
  var pthread_ptr = worker.pthread_ptr;
  delete PThread.pthreads[pthread_ptr];
  PThread.unusedWorkers.push(worker);
  PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
  worker.pthread_ptr = 0;
  __emscripten_thread_free_data(pthread_ptr);
 },
 receiveObjectTransfer: function(data) {},
 threadInitTLS: function() {
  PThread.tlsInitFunctions.forEach(f => f());
 },
 loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
  worker.onmessage = e => {
   var d = e["data"];
   var cmd = d["cmd"];
   if (worker.pthread_ptr) PThread.currentProxiedOperationCallerThread = worker.pthread_ptr;
   if (d["targetThread"] && d["targetThread"] != _pthread_self()) {
    var targetWorker = PThread.pthreads[d.targetThread];
    if (targetWorker) {
     targetWorker.postMessage(d, d["transferList"]);
    } else {
     err('Internal error! Worker sent a message "' + cmd + '" to target pthread ' + d["targetThread"] + ", but that thread no longer exists!");
    }
    PThread.currentProxiedOperationCallerThread = undefined;
    return;
   }
   if (cmd === "checkMailbox") {
    checkMailbox();
   } else if (cmd === "spawnThread") {
    spawnThread(d);
   } else if (cmd === "cleanupThread") {
    cleanupThread(d["thread"]);
   } else if (cmd === "killThread") {
    killThread(d["thread"]);
   } else if (cmd === "cancelThread") {
    cancelThread(d["thread"]);
   } else if (cmd === "loaded") {
    worker.loaded = true;
    onFinishedLoading(worker);
   } else if (cmd === "print") {
    out("Thread " + d["threadId"] + ": " + d["text"]);
   } else if (cmd === "printErr") {
    err("Thread " + d["threadId"] + ": " + d["text"]);
   } else if (cmd === "alert") {
    alert("Thread " + d["threadId"] + ": " + d["text"]);
   } else if (d.target === "setimmediate") {
    worker.postMessage(d);
   } else if (cmd === "callHandler") {
    Module[d["handler"]](...d["args"]);
   } else if (cmd) {
    err("worker sent an unknown command " + cmd);
   }
   PThread.currentProxiedOperationCallerThread = undefined;
  };
  worker.onerror = e => {
   var message = "worker sent an error!";
   err(message + " " + e.filename + ":" + e.lineno + ": " + e.message);
   throw e;
  };
  if (ENVIRONMENT_IS_NODE) {
   worker.on("message", function(data) {
    worker.onmessage({
     data: data
    });
   });
   worker.on("error", function(e) {
    worker.onerror(e);
   });
  }
  var handlers = [];
  var knownHandlers = [ "onExit", "onAbort", "print", "printErr" ];
  for (var handler of knownHandlers) {
   if (Module.hasOwnProperty(handler)) {
    handlers.push(handler);
   }
  }
  worker.postMessage({
   "cmd": "load",
   "handlers": handlers,
   "urlOrBlob": Module["mainScriptUrlOrBlob"] || currentScript,
   "wasmMemory": wasmMemory,
   "wasmModule": wasmModule
  });
 }),
 loadWasmModuleToAllWorkers: function(onMaybeReady) {
  onMaybeReady();
 },
 allocateUnusedWorker: function() {
  var worker;
  var pthreadMainJs = locateFile("sharp-emscripten-wasm32.node.worker.js");
  worker = new Worker(pthreadMainJs);
  PThread.unusedWorkers.push(worker);
 },
 getNewWorker: function() {
  if (PThread.unusedWorkers.length == 0) {
   PThread.allocateUnusedWorker();
   PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
  }
  return PThread.unusedWorkers.pop();
 }
};

Module["PThread"] = PThread;

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
}

function establishStackSpace() {
 var pthread_ptr = _pthread_self();
 var stackHigh = GROWABLE_HEAP_I32()[pthread_ptr + 52 >> 2];
 var stackSize = GROWABLE_HEAP_I32()[pthread_ptr + 56 >> 2];
 var stackLow = stackHigh - stackSize;
 _emscripten_stack_set_limits(stackHigh, stackLow);
 stackRestore(stackHigh);
}

Module["establishStackSpace"] = establishStackSpace;

function exitOnMainThread(returnCode) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 0, returnCode);
 _exit(returnCode);
}

function getValue(ptr, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  return GROWABLE_HEAP_I8()[ptr >> 0];

 case "i8":
  return GROWABLE_HEAP_I8()[ptr >> 0];

 case "i16":
  return GROWABLE_HEAP_I16()[ptr >> 1];

 case "i32":
  return GROWABLE_HEAP_I32()[ptr >> 2];

 case "i64":
  return HEAP64[ptr >> 3];

 case "float":
  return GROWABLE_HEAP_F32()[ptr >> 2];

 case "double":
  return GROWABLE_HEAP_F64()[ptr >> 3];

 case "*":
  return GROWABLE_HEAP_U32()[ptr >> 2];

 default:
  abort(`invalid type for getValue: ${type}`);
 }
}

var wasmTableMirror = [];

function getWasmTableEntry(funcPtr) {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 return func;
}

function invokeEntryPoint(ptr, arg) {
 var result = getWasmTableEntry(ptr)(arg);
 if (keepRuntimeAlive()) {
  PThread.setExitStatus(result);
 } else {
  __emscripten_thread_exit(result);
 }
}

Module["invokeEntryPoint"] = invokeEntryPoint;

function registerTLSInit(tlsInitFunc) {
 PThread.tlsInitFunctions.push(tlsInitFunc);
}

function setValue(ptr, value, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  GROWABLE_HEAP_I8()[ptr >> 0] = value;
  break;

 case "i8":
  GROWABLE_HEAP_I8()[ptr >> 0] = value;
  break;

 case "i16":
  GROWABLE_HEAP_I16()[ptr >> 1] = value;
  break;

 case "i32":
  GROWABLE_HEAP_I32()[ptr >> 2] = value;
  break;

 case "i64":
  HEAP64[ptr >> 3] = BigInt(value);
  break;

 case "float":
  GROWABLE_HEAP_F32()[ptr >> 2] = value;
  break;

 case "double":
  GROWABLE_HEAP_F64()[ptr >> 3] = value;
  break;

 case "*":
  GROWABLE_HEAP_U32()[ptr >> 2] = value;
  break;

 default:
  abort(`invalid type for setValue: ${type}`);
 }
}

function ___assert_fail(condition, filename, line, func) {
 abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
}

function ___call_sighandler(fp, sig) {
 getWasmTableEntry(fp)(sig);
}

var exceptionCaught = [];

var uncaughtExceptionCount = 0;

function ___cxa_begin_catch(ptr) {
 var info = new ExceptionInfo(ptr);
 if (!info.get_caught()) {
  info.set_caught(true);
  uncaughtExceptionCount--;
 }
 info.set_rethrown(false);
 exceptionCaught.push(info);
 ___cxa_increment_exception_refcount(info.excPtr);
 return info.get_exception_ptr();
}

var exceptionLast = 0;

function ___cxa_end_catch() {
 _setThrew(0);
 var info = exceptionCaught.pop();
 ___cxa_decrement_exception_refcount(info.excPtr);
 exceptionLast = 0;
}

function ExceptionInfo(excPtr) {
 this.excPtr = excPtr;
 this.ptr = excPtr - 24;
 this.set_type = function(type) {
  GROWABLE_HEAP_U32()[this.ptr + 4 >> 2] = type;
 };
 this.get_type = function() {
  return GROWABLE_HEAP_U32()[this.ptr + 4 >> 2];
 };
 this.set_destructor = function(destructor) {
  GROWABLE_HEAP_U32()[this.ptr + 8 >> 2] = destructor;
 };
 this.get_destructor = function() {
  return GROWABLE_HEAP_U32()[this.ptr + 8 >> 2];
 };
 this.set_caught = function(caught) {
  caught = caught ? 1 : 0;
  GROWABLE_HEAP_I8()[this.ptr + 12 >> 0] = caught;
 };
 this.get_caught = function() {
  return GROWABLE_HEAP_I8()[this.ptr + 12 >> 0] != 0;
 };
 this.set_rethrown = function(rethrown) {
  rethrown = rethrown ? 1 : 0;
  GROWABLE_HEAP_I8()[this.ptr + 13 >> 0] = rethrown;
 };
 this.get_rethrown = function() {
  return GROWABLE_HEAP_I8()[this.ptr + 13 >> 0] != 0;
 };
 this.init = function(type, destructor) {
  this.set_adjusted_ptr(0);
  this.set_type(type);
  this.set_destructor(destructor);
 };
 this.set_adjusted_ptr = function(adjustedPtr) {
  GROWABLE_HEAP_U32()[this.ptr + 16 >> 2] = adjustedPtr;
 };
 this.get_adjusted_ptr = function() {
  return GROWABLE_HEAP_U32()[this.ptr + 16 >> 2];
 };
 this.get_exception_ptr = function() {
  var isPointer = ___cxa_is_pointer_type(this.get_type());
  if (isPointer) {
   return GROWABLE_HEAP_U32()[this.excPtr >> 2];
  }
  var adjusted = this.get_adjusted_ptr();
  if (adjusted !== 0) return adjusted;
  return this.excPtr;
 };
}

function ___resumeException(ptr) {
 if (!exceptionLast) {
  exceptionLast = ptr;
 }
 throw exceptionLast;
}

function ___cxa_find_matching_catch() {
 var thrown = exceptionLast;
 if (!thrown) {
  setTempRet0(0);
  return 0;
 }
 var info = new ExceptionInfo(thrown);
 info.set_adjusted_ptr(thrown);
 var thrownType = info.get_type();
 if (!thrownType) {
  setTempRet0(0);
  return thrown;
 }
 for (var i = 0; i < arguments.length; i++) {
  var caughtType = arguments[i];
  if (caughtType === 0 || caughtType === thrownType) {
   break;
  }
  var adjusted_ptr_addr = info.ptr + 16;
  if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
   setTempRet0(caughtType);
   return thrown;
  }
 }
 setTempRet0(thrownType);
 return thrown;
}

var ___cxa_find_matching_catch_2 = ___cxa_find_matching_catch;

var ___cxa_find_matching_catch_3 = ___cxa_find_matching_catch;

var ___cxa_find_matching_catch_4 = ___cxa_find_matching_catch;

function ___cxa_rethrow() {
 var info = exceptionCaught.pop();
 if (!info) {
  abort("no exception to throw");
 }
 var ptr = info.excPtr;
 if (!info.get_rethrown()) {
  exceptionCaught.push(info);
  info.set_rethrown(true);
  info.set_caught(false);
  uncaughtExceptionCount++;
 }
 exceptionLast = ptr;
 throw exceptionLast;
}

function ___cxa_throw(ptr, type, destructor) {
 var info = new ExceptionInfo(ptr);
 info.init(type, destructor);
 exceptionLast = ptr;
 uncaughtExceptionCount++;
 throw exceptionLast;
}

function ___cxa_uncaught_exceptions() {
 return uncaughtExceptionCount;
}

function ___emscripten_init_main_thread_js(tb) {
 __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1, !ENVIRONMENT_IS_WEB, 65536);
 PThread.threadInitTLS();
}

function ___emscripten_thread_cleanup(thread) {
 if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
  "cmd": "cleanupThread",
  "thread": thread
 });
}

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 1, pthread_ptr, attr, startRoutine, arg);
 return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}

function ___pthread_create_js(pthread_ptr, attr, startRoutine, arg) {
 if (typeof SharedArrayBuffer == "undefined") {
  err("Current environment does not support SharedArrayBuffer, pthreads are not available!");
  return 6;
 }
 var transferList = [];
 var error = 0;
 if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
  return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
 }
 if (error) return error;
 var threadParams = {
  startRoutine: startRoutine,
  pthread_ptr: pthread_ptr,
  arg: arg,
  transferList: transferList
 };
 if (ENVIRONMENT_IS_PTHREAD) {
  threadParams.cmd = "spawnThread";
  postMessage(threadParams, transferList);
  return 0;
 }
 return spawnThread(threadParams);
}

function ___syscall_dup(fd) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 1, fd);
 try {
  var old = SYSCALLS.getStreamFromFD(fd);
  return FS.createStream(old).fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_faccessat(dirfd, path, amode, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 1, dirfd, path, amode, flags);
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  if (amode & ~7) {
   return -28;
  }
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node) {
   return -44;
  }
  var perms = "";
  if (amode & 4) perms += "r";
  if (amode & 2) perms += "w";
  if (amode & 1) perms += "x";
  if (perms && FS.nodePermissions(node, perms)) {
   return -2;
  }
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function setErrNo(value) {
 GROWABLE_HEAP_I32()[___errno_location() >> 2] = value;
 return value;
}

function ___syscall_fcntl64(fd, cmd, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 1, fd, cmd, varargs);
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  switch (cmd) {
  case 0:
   {
    var arg = SYSCALLS.get();
    if (arg < 0) {
     return -28;
    }
    var newStream;
    newStream = FS.createStream(stream, arg);
    return newStream.fd;
   }

  case 1:
  case 2:
   return 0;

  case 3:
   return stream.flags;

  case 4:
   {
    var arg = SYSCALLS.get();
    stream.flags |= arg;
    return 0;
   }

  case 5:
   {
    var arg = SYSCALLS.get();
    var offset = 0;
    GROWABLE_HEAP_I16()[arg + offset >> 1] = 2;
    return 0;
   }

  case 6:
  case 7:
   return 0;

  case 16:
  case 8:
   return -28;

  case 9:
   setErrNo(28);
   return -1;

  default:
   {
    return -28;
   }
  }
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_fstat64(fd, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 1, fd, buf);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  return SYSCALLS.doStat(FS.stat, stream.path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

var MAX_INT53 = 9007199254740992;

var MIN_INT53 = -9007199254740992;

function bigintToI53Checked(num) {
 return num < MIN_INT53 || num > MAX_INT53 ? NaN : Number(num);
}

function ___syscall_ftruncate64(fd, length) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 1, fd, length);
 try {
  length = bigintToI53Checked(length);
  if (isNaN(length)) return -61;
  FS.ftruncate(fd, length);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite);
}

function ___syscall_getcwd(buf, size) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 1, buf, size);
 try {
  if (size === 0) return -28;
  var cwd = FS.cwd();
  var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
  if (size < cwdLengthInBytes) return -68;
  stringToUTF8(cwd, buf, size);
  return cwdLengthInBytes;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_ioctl(fd, op, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 1, fd, op, varargs);
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  switch (op) {
  case 21509:
  case 21505:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  case 21510:
  case 21511:
  case 21512:
  case 21506:
  case 21507:
  case 21508:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  case 21519:
   {
    if (!stream.tty) return -59;
    var argp = SYSCALLS.get();
    GROWABLE_HEAP_I32()[argp >> 2] = 0;
    return 0;
   }

  case 21520:
   {
    if (!stream.tty) return -59;
    return -28;
   }

  case 21531:
   {
    var argp = SYSCALLS.get();
    return FS.ioctl(stream, op, argp);
   }

  case 21523:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  case 21524:
   {
    if (!stream.tty) return -59;
    return 0;
   }

  default:
   return -28;
  }
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_lstat64(path, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 1, path, buf);
 try {
  path = SYSCALLS.getStr(path);
  return SYSCALLS.doStat(FS.lstat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_newfstatat(dirfd, path, buf, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 1, dirfd, path, buf, flags);
 try {
  path = SYSCALLS.getStr(path);
  var nofollow = flags & 256;
  var allowEmpty = flags & 4096;
  flags = flags & ~6400;
  path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
  return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_openat(dirfd, path, flags, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(13, 1, dirfd, path, flags, varargs);
 SYSCALLS.varargs = varargs;
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  var mode = varargs ? SYSCALLS.get() : 0;
  return FS.open(path, flags, mode).fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_rmdir(path) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(14, 1, path);
 try {
  path = SYSCALLS.getStr(path);
  FS.rmdir(path);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_stat64(path, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(15, 1, path, buf);
 try {
  path = SYSCALLS.getStr(path);
  return SYSCALLS.doStat(FS.stat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function ___syscall_unlinkat(dirfd, path, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(16, 1, dirfd, path, flags);
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  if (flags === 0) {
   FS.unlink(path);
  } else if (flags === 512) {
   FS.rmdir(path);
  } else {
   abort("Invalid flags passed to unlinkat");
  }
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

var emnapiModule = {
 exports: {},
 loaded: false,
 filename: ""
};

var emnapiCtx = undefined;

var emnapiNodeBinding = undefined;

var emnapiAsyncWorkPoolSize = 0;

function emnapiInit(options) {
 if (emnapiModule.loaded) return emnapiModule.exports;
 if (typeof options !== "object" || options === null) {
  throw new TypeError("Invalid emnapi init option");
 }
 var context = options.context;
 if (typeof context !== "object" || context === null) {
  throw new TypeError("Invalid `options.context`. Use `import { getDefaultContext } from '@emnapi/runtime'`");
 }
 emnapiCtx = context;
 var filename = typeof options.filename === "string" ? options.filename : "";
 emnapiModule.filename = filename;
 if ("nodeBinding" in options) {
  var nodeBinding = options.nodeBinding;
  if (typeof nodeBinding !== "object" || nodeBinding === null) {
   throw new TypeError("Invalid `options.nodeBinding`. Use @emnapi/node-binding package");
  }
  emnapiNodeBinding = nodeBinding;
 }
 if ("asyncWorkPoolSize" in options) {
  if (typeof options.asyncWorkPoolSize !== "number") {
   throw new TypeError("options.asyncWorkPoolSize must be a integer");
  }
  emnapiAsyncWorkPoolSize = options.asyncWorkPoolSize >> 0;
  if (emnapiAsyncWorkPoolSize > 1024) {
   emnapiAsyncWorkPoolSize = 1024;
  } else if (emnapiAsyncWorkPoolSize < -1024) {
   emnapiAsyncWorkPoolSize = -1024;
  }
 }
 var moduleApiVersion = _node_api_module_get_api_version_v1();
 var envObject = emnapiModule.envObject || (emnapiModule.envObject = emnapiCtx.createEnv(filename, moduleApiVersion, function(cb) {
  return getWasmTableEntry(cb);
 }, function(cb) {
  return getWasmTableEntry(cb);
 }, abort, emnapiNodeBinding));
 var scope = emnapiCtx.openScope(envObject);
 try {
  envObject.callIntoModule(function(_envObject) {
   var exports = emnapiModule.exports;
   var exportsHandle = scope.add(exports);
   var napiValue = _napi_register_wasm_v1(_envObject.id, exportsHandle.id);
   emnapiModule.exports = !napiValue ? exports : emnapiCtx.handleStore.get(napiValue).value;
  });
 } catch (err) {
  emnapiCtx.closeScope(envObject, scope);
  throw err;
 }
 emnapiCtx.closeScope(envObject, scope);
 emnapiModule.loaded = true;
 delete emnapiModule.envObject;
 return emnapiModule.exports;
}

function __emnapi_callback_into_module(forceUncaught, env, callback, data, close_scope_if_throw) {
 var envObject = emnapiCtx.envStore.get(env);
 var scope = emnapiCtx.openScope(envObject);
 try {
  envObject.callbackIntoModule(Boolean(forceUncaught), function() {
   getWasmTableEntry(callback)(env, data);
  });
 } catch (err) {
  emnapiCtx.closeScope(envObject, scope);
  if (close_scope_if_throw) {
   emnapiCtx.closeScope(envObject);
  }
  throw err;
 }
 emnapiCtx.closeScope(envObject, scope);
}

function __emnapi_ctx_decrease_waiting_request_counter() {
 emnapiCtx.decreaseWaitingRequestCounter();
}

function __emnapi_ctx_increase_waiting_request_counter() {
 emnapiCtx.increaseWaitingRequestCounter();
}

function __emnapi_get_last_error_info(env, error_code, engine_error_code, engine_reserved) {
 var envObject = emnapiCtx.envStore.get(env);
 var lastError = envObject.lastError;
 var errorCode = lastError.errorCode;
 var engineErrorCode = lastError.engineErrorCode >>> 0;
 var engineReserved = lastError.engineReserved;
 GROWABLE_HEAP_I32()[error_code >> 2] = errorCode;
 GROWABLE_HEAP_U32()[engine_error_code >> 2] = engineErrorCode;
 GROWABLE_HEAP_U32()[engine_reserved >> 2] = engineReserved;
}

function __emnapi_node_emit_async_destroy(async_id, trigger_async_id) {
 if (!emnapiNodeBinding) return;
 emnapiNodeBinding.node.emitAsyncDestroy({
  asyncId: async_id,
  triggerAsyncId: trigger_async_id
 });
}

function __emnapi_node_emit_async_init(async_resource, async_resource_name, trigger_async_id, result) {
 if (!emnapiNodeBinding) return;
 var resource = emnapiCtx.handleStore.get(async_resource).value;
 var resource_name = emnapiCtx.handleStore.get(async_resource_name).value;
 var asyncContext = emnapiNodeBinding.node.emitAsyncInit(resource, resource_name, trigger_async_id);
 var asyncId = asyncContext.asyncId;
 var triggerAsyncId = asyncContext.triggerAsyncId;
 if (result) {
  GROWABLE_HEAP_F64()[result >> 3] = asyncId;
  GROWABLE_HEAP_F64()[result + 8 >> 3] = triggerAsyncId;
 }
}

function __emnapi_node_make_callback(env, async_resource, cb, argv, size, async_id, trigger_async_id, result) {
 var i = 0;
 var v;
 if (!emnapiNodeBinding) return;
 var resource = emnapiCtx.handleStore.get(async_resource).value;
 var callback = emnapiCtx.handleStore.get(cb).value;
 size = size >>> 0;
 var arr = Array(size);
 for (;i < size; i++) {
  var argVal = GROWABLE_HEAP_U32()[argv + i * 4 >> 2];
  arr[i] = emnapiCtx.handleStore.get(argVal).value;
 }
 var ret = emnapiNodeBinding.node.makeCallback(resource, callback, arr, {
  asyncId: async_id,
  triggerAsyncId: trigger_async_id
 });
 if (result) {
  var envObject = emnapiCtx.envStore.get(env);
  v = envObject.ensureHandleId(ret);
  GROWABLE_HEAP_U32()[result >> 2] = v;
 }
}

function __emnapi_set_immediate(callback, data) {
 emnapiCtx.feature.setImmediate(function() {
  getWasmTableEntry(callback)(data);
 });
}

function __emnapi_worker_unref(pid) {
 var worker = PThread.pthreads[pid];
 worker = worker.worker || worker;
 if (typeof worker.unref === "function") {
  worker.unref();
 }
}

var nowIsMonotonic = true;

function __emscripten_get_now_is_monotonic() {
 return nowIsMonotonic;
}

function maybeExit() {
 if (!keepRuntimeAlive()) {
  try {
   if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS); else _exit(EXITSTATUS);
  } catch (e) {
   handleException(e);
  }
 }
}

function callUserCallback(func) {
 if (ABORT) {
  return;
 }
 try {
  func();
  maybeExit();
 } catch (e) {
  handleException(e);
 }
}

function __emscripten_thread_mailbox_await(pthread_ptr) {
 if (typeof Atomics.waitAsync === "function") {
  var wait = Atomics.waitAsync(GROWABLE_HEAP_I32(), pthread_ptr >> 2, pthread_ptr);
  wait.value.then(checkMailbox);
  var waitingAsync = pthread_ptr + 128;
  Atomics.store(GROWABLE_HEAP_I32(), waitingAsync >> 2, 1);
 }
}

Module["__emscripten_thread_mailbox_await"] = __emscripten_thread_mailbox_await;

function checkMailbox() {
 var pthread_ptr = _pthread_self();
 if (pthread_ptr) {
  __emscripten_thread_mailbox_await(pthread_ptr);
  callUserCallback(() => __emscripten_check_mailbox());
 }
}

Module["checkMailbox"] = checkMailbox;

function __emscripten_notify_mailbox_postmessage(targetThreadId, currThreadId, mainThreadId) {
 if (targetThreadId == currThreadId) {
  setTimeout(() => checkMailbox());
 } else if (ENVIRONMENT_IS_PTHREAD) {
  postMessage({
   "targetThread": targetThreadId,
   "cmd": "checkMailbox"
  });
 } else {
  var worker = PThread.pthreads[targetThreadId];
  if (!worker) {
   return;
  }
  worker.postMessage({
   "cmd": "checkMailbox"
  });
 }
}

function __emscripten_set_offscreencanvas_size(target, width, height) {
 return -1;
}

function __emscripten_thread_set_strongref(thread) {
 if (ENVIRONMENT_IS_NODE) {
  PThread.pthreads[thread].ref();
 }
}

function __emscripten_throw_longjmp() {
 throw Infinity;
}

function readI53FromI64(ptr) {
 return GROWABLE_HEAP_U32()[ptr >> 2] + GROWABLE_HEAP_I32()[ptr + 4 >> 2] * 4294967296;
}

function __gmtime_js(time, tmPtr) {
 var date = new Date(readI53FromI64(time) * 1e3);
 GROWABLE_HEAP_I32()[tmPtr >> 2] = date.getUTCSeconds();
 GROWABLE_HEAP_I32()[tmPtr + 4 >> 2] = date.getUTCMinutes();
 GROWABLE_HEAP_I32()[tmPtr + 8 >> 2] = date.getUTCHours();
 GROWABLE_HEAP_I32()[tmPtr + 12 >> 2] = date.getUTCDate();
 GROWABLE_HEAP_I32()[tmPtr + 16 >> 2] = date.getUTCMonth();
 GROWABLE_HEAP_I32()[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
 GROWABLE_HEAP_I32()[tmPtr + 24 >> 2] = date.getUTCDay();
 var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
 var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
 GROWABLE_HEAP_I32()[tmPtr + 28 >> 2] = yday;
}

function isLeapYear(year) {
 return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

var MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

var MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

function ydayFromDate(date) {
 var leap = isLeapYear(date.getFullYear());
 var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
 var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
 return yday;
}

function __localtime_js(time, tmPtr) {
 var date = new Date(readI53FromI64(time) * 1e3);
 GROWABLE_HEAP_I32()[tmPtr >> 2] = date.getSeconds();
 GROWABLE_HEAP_I32()[tmPtr + 4 >> 2] = date.getMinutes();
 GROWABLE_HEAP_I32()[tmPtr + 8 >> 2] = date.getHours();
 GROWABLE_HEAP_I32()[tmPtr + 12 >> 2] = date.getDate();
 GROWABLE_HEAP_I32()[tmPtr + 16 >> 2] = date.getMonth();
 GROWABLE_HEAP_I32()[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
 GROWABLE_HEAP_I32()[tmPtr + 24 >> 2] = date.getDay();
 var yday = ydayFromDate(date) | 0;
 GROWABLE_HEAP_I32()[tmPtr + 28 >> 2] = yday;
 GROWABLE_HEAP_I32()[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
 var start = new Date(date.getFullYear(), 0, 1);
 var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
 var winterOffset = start.getTimezoneOffset();
 var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
 GROWABLE_HEAP_I32()[tmPtr + 32 >> 2] = dst;
}

function __mmap_js(len, prot, flags, fd, off, allocated, addr) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(17, 1, len, prot, flags, fd, off, allocated, addr);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var res = FS.mmap(stream, len, off, prot, flags);
  var ptr = res.ptr;
  GROWABLE_HEAP_I32()[allocated >> 2] = res.allocated;
  GROWABLE_HEAP_U32()[addr >> 2] = ptr;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function __munmap_js(addr, len, prot, flags, fd, offset) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(18, 1, addr, len, prot, flags, fd, offset);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  if (prot & 2) {
   SYSCALLS.doMsync(addr, stream, len, flags, offset);
  }
  FS.munmap(stream);
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return -e.errno;
 }
}

function stringToNewUTF8(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8(str, ret, size);
 return ret;
}

function __tzset_js(timezone, daylight, tzname) {
 var currentYear = new Date().getFullYear();
 var winter = new Date(currentYear, 0, 1);
 var summer = new Date(currentYear, 6, 1);
 var winterOffset = winter.getTimezoneOffset();
 var summerOffset = summer.getTimezoneOffset();
 var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
 GROWABLE_HEAP_U32()[timezone >> 2] = stdTimezoneOffset * 60;
 GROWABLE_HEAP_I32()[daylight >> 2] = Number(winterOffset != summerOffset);
 function extractZone(date) {
  var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
  return match ? match[1] : "GMT";
 }
 var winterName = extractZone(winter);
 var summerName = extractZone(summer);
 var winterNamePtr = stringToNewUTF8(winterName);
 var summerNamePtr = stringToNewUTF8(summerName);
 if (summerOffset < winterOffset) {
  GROWABLE_HEAP_U32()[tzname >> 2] = winterNamePtr;
  GROWABLE_HEAP_U32()[tzname + 4 >> 2] = summerNamePtr;
 } else {
  GROWABLE_HEAP_U32()[tzname >> 2] = summerNamePtr;
  GROWABLE_HEAP_U32()[tzname + 4 >> 2] = winterNamePtr;
 }
}

function _abort() {
 abort("");
}

function _emnapi_is_node_binding_available() {
 return emnapiNodeBinding ? 1 : 0;
}

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
  err(text);
 }
}

function _emscripten_check_blocking_allowed() {}

function _emscripten_date_now() {
 return Date.now();
}

function runtimeKeepalivePush() {
 runtimeKeepaliveCounter += 1;
}

function _emscripten_exit_with_live_runtime() {
 runtimeKeepalivePush();
 throw "unwind";
}

function getHeapMax() {
 return 2147483648;
}

function _emscripten_get_heap_max() {
 return getHeapMax();
}

var _emscripten_get_now;

if (ENVIRONMENT_IS_NODE) {
 global.performance = require("perf_hooks").performance;
}

_emscripten_get_now = () => performance.timeOrigin + performance.now();

function _emscripten_num_logical_cores() {
 if (ENVIRONMENT_IS_NODE) return require("os").cpus().length;
 return navigator["hardwareConcurrency"];
}

function withStackSave(f) {
 var stack = stackSave();
 var ret = f();
 stackRestore(stack);
 return ret;
}

function proxyToMainThread(index, sync) {
 var numCallArgs = arguments.length - 2;
 var outerArgs = arguments;
 return withStackSave(() => {
  var serializedNumCallArgs = numCallArgs * 2;
  var args = stackAlloc(serializedNumCallArgs * 8);
  var b = args >> 3;
  for (var i = 0; i < numCallArgs; i++) {
   var arg = outerArgs[2 + i];
   if (typeof arg == "bigint") {
    HEAP64[b + 2 * i] = 1n;
    HEAP64[b + 2 * i + 1] = arg;
   } else {
    HEAP64[b + 2 * i] = 0n;
    GROWABLE_HEAP_F64()[b + 2 * i + 1] = arg;
   }
  }
  return __emscripten_run_in_main_runtime_thread_js(index, serializedNumCallArgs, args, sync);
 });
}

var emscripten_receive_on_main_thread_js_callArgs = [];

function _emscripten_receive_on_main_thread_js(index, numCallArgs, args) {
 numCallArgs /= 2;
 emscripten_receive_on_main_thread_js_callArgs.length = numCallArgs;
 var b = args >> 3;
 for (var i = 0; i < numCallArgs; i++) {
  if (HEAP64[b + 2 * i]) {
   emscripten_receive_on_main_thread_js_callArgs[i] = HEAP64[b + 2 * i + 1];
  } else {
   emscripten_receive_on_main_thread_js_callArgs[i] = GROWABLE_HEAP_F64()[b + 2 * i + 1];
  }
 }
 var func = proxiedFunctionTable[index];
 return func.apply(null, emscripten_receive_on_main_thread_js_callArgs);
}

function emscripten_realloc_buffer(size) {
 var b = wasmMemory.buffer;
 var pages = size - b.byteLength + 65535 >>> 16;
 try {
  wasmMemory.grow(pages);
  updateMemoryViews();
  return 1;
 } catch (e) {}
}

function _emscripten_resize_heap(requestedSize) {
 var oldSize = GROWABLE_HEAP_U8().length;
 requestedSize = requestedSize >>> 0;
 if (requestedSize <= oldSize) {
  return false;
 }
 var maxHeapSize = getHeapMax();
 if (requestedSize > maxHeapSize) {
  return false;
 }
 var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
 for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
  var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
  overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
  var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  var replacement = emscripten_realloc_buffer(newSize);
  if (replacement) {
   return true;
  }
 }
 return false;
}

function runtimeKeepalivePop() {
 runtimeKeepaliveCounter -= 1;
}

var _emscripten_runtime_keepalive_pop = runtimeKeepalivePop;

var _emscripten_runtime_keepalive_push = runtimeKeepalivePush;

var ENV = {};

function getExecutableName() {
 return thisProgram || "./this.program";
}

function getEnvStrings() {
 if (!getEnvStrings.strings) {
  var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
  var env = {
   "USER": "web_user",
   "LOGNAME": "web_user",
   "PATH": "/",
   "PWD": "/",
   "HOME": "/home/web_user",
   "LANG": lang,
   "_": getExecutableName()
  };
  for (var x in ENV) {
   if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
  }
  var strings = [];
  for (var x in env) {
   strings.push(`${x}=${env[x]}`);
  }
  getEnvStrings.strings = strings;
 }
 return getEnvStrings.strings;
}

function stringToAscii(str, buffer) {
 for (var i = 0; i < str.length; ++i) {
  GROWABLE_HEAP_I8()[buffer++ >> 0] = str.charCodeAt(i);
 }
 GROWABLE_HEAP_I8()[buffer >> 0] = 0;
}

function _environ_get(__environ, environ_buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(19, 1, __environ, environ_buf);
 var bufSize = 0;
 getEnvStrings().forEach(function(string, i) {
  var ptr = environ_buf + bufSize;
  GROWABLE_HEAP_U32()[__environ + i * 4 >> 2] = ptr;
  stringToAscii(string, ptr);
  bufSize += string.length + 1;
 });
 return 0;
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(20, 1, penviron_count, penviron_buf_size);
 var strings = getEnvStrings();
 GROWABLE_HEAP_U32()[penviron_count >> 2] = strings.length;
 var bufSize = 0;
 strings.forEach(function(string) {
  bufSize += string.length + 1;
 });
 GROWABLE_HEAP_U32()[penviron_buf_size >> 2] = bufSize;
 return 0;
}

function _fd_close(fd) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(21, 1, fd);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function _fd_fdstat_get(fd, pbuf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(22, 1, fd, pbuf);
 try {
  var rightsBase = 0;
  var rightsInheriting = 0;
  var flags = 0;
  {
   var stream = SYSCALLS.getStreamFromFD(fd);
   var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
  }
  GROWABLE_HEAP_I8()[pbuf >> 0] = type;
  GROWABLE_HEAP_I16()[pbuf + 2 >> 1] = flags;
  HEAP64[pbuf + 8 >> 3] = BigInt(rightsBase);
  HEAP64[pbuf + 16 >> 3] = BigInt(rightsInheriting);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function doReadv(stream, iov, iovcnt, offset) {
 var ret = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = GROWABLE_HEAP_U32()[iov >> 2];
  var len = GROWABLE_HEAP_U32()[iov + 4 >> 2];
  iov += 8;
  var curr = FS.read(stream, GROWABLE_HEAP_I8(), ptr, len, offset);
  if (curr < 0) return -1;
  ret += curr;
  if (curr < len) break;
  if (typeof offset !== "undefined") {
   offset += curr;
  }
 }
 return ret;
}

function _fd_read(fd, iov, iovcnt, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(23, 1, fd, iov, iovcnt, pnum);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doReadv(stream, iov, iovcnt);
  GROWABLE_HEAP_U32()[pnum >> 2] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function _fd_seek(fd, offset, whence, newOffset) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(24, 1, fd, offset, whence, newOffset);
 try {
  offset = bigintToI53Checked(offset);
  if (isNaN(offset)) return 61;
  var stream = SYSCALLS.getStreamFromFD(fd);
  FS.llseek(stream, offset, whence);
  HEAP64[newOffset >> 3] = BigInt(stream.position);
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function doWritev(stream, iov, iovcnt, offset) {
 var ret = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = GROWABLE_HEAP_U32()[iov >> 2];
  var len = GROWABLE_HEAP_U32()[iov + 4 >> 2];
  iov += 8;
  var curr = FS.write(stream, GROWABLE_HEAP_I8(), ptr, len, offset);
  if (curr < 0) return -1;
  ret += curr;
  if (typeof offset !== "undefined") {
   offset += curr;
  }
 }
 return ret;
}

function _fd_write(fd, iov, iovcnt, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(25, 1, fd, iov, iovcnt, pnum);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doWritev(stream, iov, iovcnt);
  GROWABLE_HEAP_U32()[pnum >> 2] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
  return e.errno;
 }
}

function _llvm_eh_typeid_for(type) {
 return type;
}

function emnapiGetHandle(js_object) {
 var handle = emnapiCtx.handleStore.get(js_object);
 if (!(handle.isObject() || handle.isFunction())) {
  return {
   status: 1
  };
 }
 if (typeof emnapiExternalMemory !== "undefined" && ArrayBuffer.isView(handle.value)) {
  if (emnapiExternalMemory.wasmMemoryViewTable.has(handle.value)) {
   handle = emnapiCtx.addToCurrentScope(emnapiExternalMemory.wasmMemoryViewTable.get(handle.value));
  }
 }
 return {
  status: 0,
  handle: handle
 };
}

function _napi_add_finalizer(env, js_object, finalize_data, finalize_cb, finalize_hint, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!emnapiCtx.feature.supportFinalizer) {
  return envObject.setLastError(9);
 }
 if (!js_object) return envObject.setLastError(1);
 if (!finalize_cb) return envObject.setLastError(1);
 var handleResult = emnapiGetHandle(js_object);
 if (handleResult.status !== 0) {
  return envObject.setLastError(handleResult.status);
 }
 var handle = handleResult.handle;
 var ownership = !result ? 0 : 1;
 var reference = emnapiCtx.createReference(envObject, handle.id, 0, ownership, finalize_cb, finalize_data, finalize_hint);
 if (result) {
  var referenceId = reference.id;
  GROWABLE_HEAP_U32()[result >> 2] = referenceId;
 }
 return envObject.clearLastError();
}

function _napi_call_function(env, recv, func, argc, argv, result) {
 var i = 0;
 var v;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!recv) return envObject.setLastError(1);
  argc = argc >>> 0;
  if (argc > 0) {
   if (!argv) return envObject.setLastError(1);
  }
  var v8recv = emnapiCtx.handleStore.get(recv).value;
  if (!func) return envObject.setLastError(1);
  var v8func = emnapiCtx.handleStore.get(func).value;
  if (typeof v8func !== "function") return envObject.setLastError(1);
  var args = [];
  for (;i < argc; i++) {
   var argVal = GROWABLE_HEAP_U32()[argv + i * 4 >> 2];
   args.push(emnapiCtx.handleStore.get(argVal).value);
  }
  var ret = v8func.apply(v8recv, args);
  if (result) {
   v = envObject.ensureHandleId(ret);
   GROWABLE_HEAP_U32()[result >> 2] = v;
  }
  return envObject.clearLastError();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_clear_last_error(env) {
 var envObject = emnapiCtx.envStore.get(env);
 return envObject.clearLastError();
}

function _napi_close_escapable_handle_scope(env, scope) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!scope) return envObject.setLastError(1);
 if (envObject.openHandleScopes === 0) {
  return 13;
 }
 emnapiCtx.closeScope(envObject);
 return envObject.clearLastError();
}

function _napi_close_handle_scope(env, scope) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!scope) return envObject.setLastError(1);
 if (envObject.openHandleScopes === 0) {
  return 13;
 }
 emnapiCtx.closeScope(envObject);
 return envObject.clearLastError();
}

function _napi_coerce_to_object(env, value, result) {
 var v;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!value) return envObject.setLastError(1);
  if (!result) return envObject.setLastError(1);
  var handle = emnapiCtx.handleStore.get(value);
  if (handle.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  v = envObject.ensureHandleId(Object(handle.value));
  GROWABLE_HEAP_U32()[result >> 2] = v;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_coerce_to_string(env, value, result) {
 var v;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!value) return envObject.setLastError(1);
  if (!result) return envObject.setLastError(1);
  var handle = emnapiCtx.handleStore.get(value);
  if (handle.isSymbol()) {
   throw new TypeError("Cannot convert a Symbol value to a string");
  }
  v = emnapiCtx.addToCurrentScope(String(handle.value)).id;
  GROWABLE_HEAP_U32()[result >> 2] = v;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_create_array(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var value = emnapiCtx.addToCurrentScope([]).id;
 GROWABLE_HEAP_U32()[result >> 2] = value;
 return envObject.clearLastError();
}

function _napi_create_array_with_length(env, length, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 length = length >>> 0;
 var value = emnapiCtx.addToCurrentScope(new Array(length)).id;
 GROWABLE_HEAP_U32()[result >> 2] = value;
 return envObject.clearLastError();
}

var emnapiExternalMemory = {
 registry: {},
 table: {},
 wasmMemoryViewTable: {},
 init: function() {
  emnapiExternalMemory.registry = typeof FinalizationRegistry === "function" ? new FinalizationRegistry(function(_pointer) {
   _free(_pointer);
  }) : undefined;
  emnapiExternalMemory.table = new WeakMap();
  emnapiExternalMemory.wasmMemoryViewTable = new WeakMap();
 },
 isDetachedArrayBuffer: function(arrayBuffer) {
  if (arrayBuffer.byteLength === 0) {
   try {
    new Uint8Array(arrayBuffer);
   } catch (_) {
    return true;
   }
  }
  return false;
 },
 getArrayBufferPointer: function(arrayBuffer, shouldCopy) {
  var _a;
  var info = {
   address: 0,
   ownership: 0,
   runtimeAllocated: 0
  };
  if (arrayBuffer === wasmMemory.buffer) {
   return info;
  }
  var isDetached = emnapiExternalMemory.isDetachedArrayBuffer(arrayBuffer);
  if (emnapiExternalMemory.table.has(arrayBuffer)) {
   var cachedInfo = emnapiExternalMemory.table.get(arrayBuffer);
   if (isDetached) {
    cachedInfo.address = 0;
    return cachedInfo;
   }
   if (shouldCopy && cachedInfo.ownership === 0 && cachedInfo.runtimeAllocated === 1) {
    new Uint8Array(wasmMemory.buffer).set(new Uint8Array(arrayBuffer), cachedInfo.address);
   }
   return cachedInfo;
  }
  if (isDetached || arrayBuffer.byteLength === 0) {
   return info;
  }
  if (!shouldCopy) {
   return info;
  }
  var pointer = _malloc(arrayBuffer.byteLength);
  if (!pointer) throw new Error("Out of memory");
  new Uint8Array(wasmMemory.buffer).set(new Uint8Array(arrayBuffer), pointer);
  info.address = pointer;
  info.ownership = emnapiExternalMemory.registry ? 0 : 1;
  info.runtimeAllocated = 1;
  emnapiExternalMemory.table.set(arrayBuffer, info);
  (_a = emnapiExternalMemory.registry) === null || _a === void 0 ? void 0 : _a.register(arrayBuffer, pointer);
  return info;
 },
 getOrUpdateMemoryView: function(view) {
  if (view.buffer === wasmMemory.buffer) {
   if (!emnapiExternalMemory.wasmMemoryViewTable.has(view)) {
    emnapiExternalMemory.wasmMemoryViewTable.set(view, {
     Ctor: view.constructor,
     address: view.byteOffset,
     length: view instanceof DataView ? view.byteLength : view.length,
     ownership: 1,
     runtimeAllocated: 0
    });
   }
   return view;
  }
  var maybeOldWasmMemory = emnapiExternalMemory.isDetachedArrayBuffer(view.buffer) || typeof SharedArrayBuffer === "function" && view.buffer instanceof SharedArrayBuffer;
  if (maybeOldWasmMemory && emnapiExternalMemory.wasmMemoryViewTable.has(view)) {
   var info = emnapiExternalMemory.wasmMemoryViewTable.get(view);
   var Ctor = info.Ctor;
   var newView = void 0;
   var Buffer = emnapiCtx.feature.Buffer;
   if (typeof Buffer === "function" && Ctor === Buffer) {
    newView = Buffer.from(wasmMemory.buffer, info.address, info.length);
   } else {
    newView = new Ctor(wasmMemory.buffer, info.address, info.length);
   }
   emnapiExternalMemory.wasmMemoryViewTable.set(newView, info);
   return newView;
  }
  return view;
 },
 getViewPointer: function(view, shouldCopy) {
  view = emnapiExternalMemory.getOrUpdateMemoryView(view);
  if (view.buffer === wasmMemory.buffer) {
   if (emnapiExternalMemory.wasmMemoryViewTable.has(view)) {
    var _a = emnapiExternalMemory.wasmMemoryViewTable.get(view), address_1 = _a.address, ownership_1 = _a.ownership, runtimeAllocated_1 = _a.runtimeAllocated;
    return {
     address: address_1,
     ownership: ownership_1,
     runtimeAllocated: runtimeAllocated_1,
     view: view
    };
   }
   return {
    address: view.byteOffset,
    ownership: 1,
    runtimeAllocated: 0,
    view: view
   };
  }
  var _b = emnapiExternalMemory.getArrayBufferPointer(view.buffer, shouldCopy), address = _b.address, ownership = _b.ownership, runtimeAllocated = _b.runtimeAllocated;
  return {
   address: address === 0 ? 0 : address + view.byteOffset,
   ownership: ownership,
   runtimeAllocated: runtimeAllocated,
   view: view
  };
 }
};

function emnapiCreateArrayBuffer(byte_length, data) {
 byte_length = byte_length >>> 0;
 var arrayBuffer = new ArrayBuffer(byte_length);
 if (data) {
  var p = emnapiExternalMemory.getArrayBufferPointer(arrayBuffer, true).address;
  GROWABLE_HEAP_U32()[data >> 2] = p;
 }
 return arrayBuffer;
}

function _napi_create_buffer_copy(env, length, data, result_data, result) {
 var value;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!result) return envObject.setLastError(1);
  var Buffer = emnapiCtx.feature.Buffer;
  if (!Buffer) {
   throw emnapiCtx.createNotSupportBufferError("napi_create_buffer_copy", "");
  }
  var arrayBuffer = emnapiCreateArrayBuffer(length, result_data);
  var buffer = Buffer.from(arrayBuffer);
  buffer.set(new Uint8Array(wasmMemory.buffer).subarray(data, data + length));
  value = emnapiCtx.addToCurrentScope(buffer).id;
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_create_double(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var v = emnapiCtx.addToCurrentScope(value).id;
 GROWABLE_HEAP_U32()[result >> 2] = v;
 return envObject.clearLastError();
}

var emnapiString = {
 utf8Decoder: undefined,
 utf16Decoder: undefined,
 init: function() {
  var fallbackDecoder = {
   decode: function(bytes) {
    var inputIndex = 0;
    var pendingSize = Math.min(4096, bytes.length + 1);
    var pending = new Uint16Array(pendingSize);
    var chunks = [];
    var pendingIndex = 0;
    for (;;) {
     var more = inputIndex < bytes.length;
     if (!more || pendingIndex >= pendingSize - 1) {
      var subarray = pending.subarray(0, pendingIndex);
      var arraylike = subarray;
      chunks.push(String.fromCharCode.apply(null, arraylike));
      if (!more) {
       return chunks.join("");
      }
      bytes = bytes.subarray(inputIndex);
      inputIndex = 0;
      pendingIndex = 0;
     }
     var byte1 = bytes[inputIndex++];
     if ((byte1 & 128) === 0) {
      pending[pendingIndex++] = byte1;
     } else if ((byte1 & 224) === 192) {
      var byte2 = bytes[inputIndex++] & 63;
      pending[pendingIndex++] = (byte1 & 31) << 6 | byte2;
     } else if ((byte1 & 240) === 224) {
      var byte2 = bytes[inputIndex++] & 63;
      var byte3 = bytes[inputIndex++] & 63;
      pending[pendingIndex++] = (byte1 & 31) << 12 | byte2 << 6 | byte3;
     } else if ((byte1 & 248) === 240) {
      var byte2 = bytes[inputIndex++] & 63;
      var byte3 = bytes[inputIndex++] & 63;
      var byte4 = bytes[inputIndex++] & 63;
      var codepoint = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (codepoint > 65535) {
       codepoint -= 65536;
       pending[pendingIndex++] = codepoint >>> 10 & 1023 | 55296;
       codepoint = 56320 | codepoint & 1023;
      }
      pending[pendingIndex++] = codepoint;
     } else {}
    }
   }
  };
  var utf8Decoder;
  utf8Decoder = fallbackDecoder;
  emnapiString.utf8Decoder = utf8Decoder;
  var fallbackDecoder2 = {
   decode: function(input) {
    var bytes = new Uint16Array(input.buffer, input.byteOffset, input.byteLength / 2);
    if (bytes.length <= 4096) {
     return String.fromCharCode.apply(null, bytes);
    }
    var chunks = [];
    var i = 0;
    var len = 0;
    for (;i < bytes.length; i += len) {
     len = Math.min(4096, bytes.length - i);
     chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + len)));
    }
    return chunks.join("");
   }
  };
  var utf16Decoder;
  utf16Decoder = fallbackDecoder2;
  emnapiString.utf16Decoder = utf16Decoder;
 },
 lengthBytesUTF8: function(str) {
  var c;
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
   c = str.charCodeAt(i);
   if (c <= 127) {
    len++;
   } else if (c <= 2047) {
    len += 2;
   } else if (c >= 55296 && c <= 57343) {
    len += 4;
    ++i;
   } else {
    len += 3;
   }
  }
  return len;
 },
 UTF8ToString: function(ptr, length) {
  if (!ptr || !length) return "";
  ptr >>>= 0;
  var HEAPU8 = new Uint8Array(wasmMemory.buffer);
  var end = ptr;
  if (length === -1) {
   for (;GROWABLE_HEAP_U8()[end]; ) ++end;
  } else {
   end = ptr + (length >>> 0);
  }
  length = end - ptr;
  if (length <= 16) {
   var idx = ptr;
   var str = "";
   while (idx < end) {
    var u0 = GROWABLE_HEAP_U8()[idx++];
    if (!(u0 & 128)) {
     str += String.fromCharCode(u0);
     continue;
    }
    var u1 = GROWABLE_HEAP_U8()[idx++] & 63;
    if ((u0 & 224) === 192) {
     str += String.fromCharCode((u0 & 31) << 6 | u1);
     continue;
    }
    var u2 = GROWABLE_HEAP_U8()[idx++] & 63;
    if ((u0 & 240) === 224) {
     u0 = (u0 & 15) << 12 | u1 << 6 | u2;
    } else {
     u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | GROWABLE_HEAP_U8()[idx++] & 63;
    }
    if (u0 < 65536) {
     str += String.fromCharCode(u0);
    } else {
     var ch = u0 - 65536;
     str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    }
   }
   return str;
  }
  return emnapiString.utf8Decoder.decode(GROWABLE_HEAP_U8().slice(ptr, end));
 },
 stringToUTF8: function(str, outPtr, maxBytesToWrite) {
  var HEAPU8 = new Uint8Array(wasmMemory.buffer);
  var outIdx = outPtr;
  outIdx >>>= 0;
  if (!(maxBytesToWrite > 0)) {
   return 0;
  }
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
   var u = str.charCodeAt(i);
   if (u >= 55296 && u <= 57343) {
    var u1 = str.charCodeAt(++i);
    u = 65536 + ((u & 1023) << 10) | u1 & 1023;
   }
   if (u <= 127) {
    if (outIdx >= endIdx) break;
    GROWABLE_HEAP_U8()[outIdx++] = u;
   } else if (u <= 2047) {
    if (outIdx + 1 >= endIdx) break;
    GROWABLE_HEAP_U8()[outIdx++] = 192 | u >> 6;
    GROWABLE_HEAP_U8()[outIdx++] = 128 | u & 63;
   } else if (u <= 65535) {
    if (outIdx + 2 >= endIdx) break;
    GROWABLE_HEAP_U8()[outIdx++] = 224 | u >> 12;
    GROWABLE_HEAP_U8()[outIdx++] = 128 | u >> 6 & 63;
    GROWABLE_HEAP_U8()[outIdx++] = 128 | u & 63;
   } else {
    if (outIdx + 3 >= endIdx) break;
    GROWABLE_HEAP_U8()[outIdx++] = 240 | u >> 18;
    GROWABLE_HEAP_U8()[outIdx++] = 128 | u >> 12 & 63;
    GROWABLE_HEAP_U8()[outIdx++] = 128 | u >> 6 & 63;
    GROWABLE_HEAP_U8()[outIdx++] = 128 | u & 63;
   }
  }
  GROWABLE_HEAP_U8()[outIdx] = 0;
  return outIdx - startIdx;
 },
 UTF16ToString: function(ptr, length) {
  if (!ptr || !length) return "";
  ptr >>>= 0;
  var end = ptr;
  if (length === -1) {
   var idx = end >> 1;
   var HEAPU16 = new Uint16Array(wasmMemory.buffer);
   while (GROWABLE_HEAP_U16()[idx]) ++idx;
   end = idx << 1;
  } else {
   end = ptr + (length >>> 0) * 2;
  }
  length = end - ptr;
  if (length <= 32) {
   return String.fromCharCode.apply(null, new Uint16Array(wasmMemory.buffer, ptr, length / 2));
  }
  var HEAPU8 = new Uint8Array(wasmMemory.buffer);
  return emnapiString.utf16Decoder.decode(GROWABLE_HEAP_U8().slice(ptr, end));
 },
 stringToUTF16: function(str, outPtr, maxBytesToWrite) {
  if (maxBytesToWrite === undefined) {
   maxBytesToWrite = 2147483647;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2;
  var startPtr = outPtr;
  var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
   var codeUnit = str.charCodeAt(i);
   GROWABLE_HEAP_I16()[outPtr >> 1] = codeUnit;
   outPtr += 2;
  }
  GROWABLE_HEAP_I16()[outPtr >> 1] = 0;
  return outPtr - startPtr;
 },
 newString: function(env, str, length, result, stringMaker) {
  if (!env) return 1;
  var envObject = emnapiCtx.envStore.get(env);
  var autoLength = length === -1;
  var sizelength = length >>> 0;
  if (length !== 0) {
   if (!str) return envObject.setLastError(1);
  }
  if (!result) return envObject.setLastError(1);
  if (!(autoLength || sizelength <= 2147483647)) {
   return envObject.setLastError(1);
  }
  var strValue = stringMaker(autoLength, sizelength);
  var value = emnapiCtx.addToCurrentScope(strValue).id;
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.clearLastError();
 },
 newExternalString: function(env, str, length, finalize_callback, finalize_hint, result, copied, createApi, stringMaker) {
  var status = createApi(env, str, length, result);
  if (status === 0) {
   if (copied) {
    GROWABLE_HEAP_I8()[copied >> 0] = 1;
   }
   if (finalize_callback) {
    var envObject = emnapiCtx.envStore.get(env);
    envObject.callFinalizer(finalize_callback, str, finalize_hint);
   }
  }
  return status;
 }
};

function _napi_create_error(env, code, msg, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!msg) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var msgValue = emnapiCtx.handleStore.get(msg).value;
 if (typeof msgValue !== "string") {
  return envObject.setLastError(3);
 }
 var error = new Error(msgValue);
 if (code) {
  var codeValue = emnapiCtx.handleStore.get(code).value;
  if (typeof codeValue !== "string") {
   return envObject.setLastError(3);
  }
  error.code = codeValue;
 }
 var value = emnapiCtx.addToCurrentScope(error).id;
 GROWABLE_HEAP_U32()[result >> 2] = value;
 return envObject.clearLastError();
}

function _emnapi_create_memory_view(env, typedarray_type, external_data, byte_length, finalize_cb, finalize_hint, result) {
 var value;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!result) return envObject.setLastError(1);
  byte_length = byte_length >>> 0;
  if (!external_data) {
   byte_length = 0;
  }
  if (byte_length > 2147483647) {
   throw new RangeError("Cannot create a memory view larger than 2147483647 bytes");
  }
  if (external_data + byte_length > wasmMemory.buffer.byteLength) {
   throw new RangeError("Memory out of range");
  }
  if (!emnapiCtx.feature.supportFinalizer && finalize_cb) {
   throw emnapiCtx.createNotSupportWeakRefError("emnapi_create_memory_view", 'Parameter "finalize_cb" must be 0(NULL)');
  }
  var viewDescriptor = void 0;
  switch (typedarray_type) {
  case 0:
   viewDescriptor = {
    Ctor: Int8Array,
    address: external_data,
    length: byte_length,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 1:
   viewDescriptor = {
    Ctor: Uint8Array,
    address: external_data,
    length: byte_length,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 2:
   viewDescriptor = {
    Ctor: Uint8ClampedArray,
    address: external_data,
    length: byte_length,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 3:
   viewDescriptor = {
    Ctor: Int16Array,
    address: external_data,
    length: byte_length >> 1,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 4:
   viewDescriptor = {
    Ctor: Uint16Array,
    address: external_data,
    length: byte_length >> 1,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 5:
   viewDescriptor = {
    Ctor: Int32Array,
    address: external_data,
    length: byte_length >> 2,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 6:
   viewDescriptor = {
    Ctor: Uint32Array,
    address: external_data,
    length: byte_length >> 2,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 7:
   viewDescriptor = {
    Ctor: Float32Array,
    address: external_data,
    length: byte_length >> 2,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 8:
   viewDescriptor = {
    Ctor: Float64Array,
    address: external_data,
    length: byte_length >> 3,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 9:
   viewDescriptor = {
    Ctor: BigInt64Array,
    address: external_data,
    length: byte_length >> 3,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case 10:
   viewDescriptor = {
    Ctor: BigUint64Array,
    address: external_data,
    length: byte_length >> 3,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case -1:
   viewDescriptor = {
    Ctor: DataView,
    address: external_data,
    length: byte_length,
    ownership: 1,
    runtimeAllocated: 0
   };
   break;

  case -2:
   {
    if (!emnapiCtx.feature.Buffer) {
     throw emnapiCtx.createNotSupportBufferError("emnapi_create_memory_view", "");
    }
    viewDescriptor = {
     Ctor: emnapiCtx.feature.Buffer,
     address: external_data,
     length: byte_length,
     ownership: 1,
     runtimeAllocated: 0
    };
    break;
   }

  default:
   return envObject.setLastError(1);
  }
  var Ctor = viewDescriptor.Ctor;
  var typedArray = typedarray_type === -2 ? emnapiCtx.feature.Buffer.from(wasmMemory.buffer, viewDescriptor.address, viewDescriptor.length) : new Ctor(wasmMemory.buffer, viewDescriptor.address, viewDescriptor.length);
  var handle = emnapiCtx.addToCurrentScope(typedArray);
  emnapiExternalMemory.wasmMemoryViewTable.set(typedArray, viewDescriptor);
  if (finalize_cb) {
   var status_1 = _napi_add_finalizer(env, handle.id, external_data, finalize_cb, finalize_hint, 0);
   if (status_1 === 10) {
    var err = envObject.tryCatch.extractException();
    envObject.clearLastError();
    throw err;
   } else if (status_1 !== 0) {
    return envObject.setLastError(status_1);
   }
  }
  value = handle.id;
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_create_external_buffer(env, length, data, finalize_cb, finalize_hint, result) {
 return _emnapi_create_memory_view(env, -2, data, length, finalize_cb, finalize_hint, result);
}

function emnapiCreateFunction(envObject, utf8name, length, cb, data) {
 var functionName = !utf8name || !length ? "" : emnapiString.UTF8ToString(utf8name, length);
 var f;
 var makeFunction = function() {
  return function() {
   "use strict";
   emnapiCtx.cbinfoStack.push(this, data, arguments, f);
   var scope = emnapiCtx.openScope(envObject);
   try {
    return envObject.callIntoModule(function(envObject) {
     var napiValue = getWasmTableEntry(cb)(envObject.id, 0);
     return !napiValue ? undefined : emnapiCtx.handleStore.get(napiValue).value;
    });
   } finally {
    emnapiCtx.cbinfoStack.pop();
    emnapiCtx.closeScope(envObject, scope);
   }
  };
 };
 if (functionName === "") {
  f = makeFunction();
  return {
   status: 0,
   f: f
  };
 }
 if (!/^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(functionName)) {
  return {
   status: 1,
   f: undefined
  };
 }
 if (emnapiCtx.feature.supportNewFunction) {
  var _ = makeFunction();
  try {
   f = new Function("_", "return function " + functionName + "(){" + '"use strict";' + "return _.apply(this,arguments);" + "};")(_);
  } catch (_err) {
   f = makeFunction();
   if (emnapiCtx.feature.canSetFunctionName) Object.defineProperty(f, "name", {
    value: functionName
   });
  }
 } else {
  f = makeFunction();
  if (emnapiCtx.feature.canSetFunctionName) Object.defineProperty(f, "name", {
   value: functionName
  });
 }
 return {
  status: 0,
  f: f
 };
}

function _napi_create_function(env, utf8name, length, cb, data, result) {
 var value;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!result) return envObject.setLastError(1);
  if (!cb) return envObject.setLastError(1);
  var fresult = emnapiCreateFunction(envObject, utf8name, length, cb, data);
  if (fresult.status !== 0) return envObject.setLastError(fresult.status);
  var f = fresult.f;
  var valueHandle = emnapiCtx.addToCurrentScope(f);
  value = valueHandle.id;
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_create_object(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var value = emnapiCtx.addToCurrentScope({}).id;
 GROWABLE_HEAP_U32()[result >> 2] = value;
 return envObject.clearLastError();
}

function _napi_create_reference(env, value, initial_refcount, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(value);
 if (envObject.moduleApiVersion !== 2147483647) {
  if (!(handle.isObject() || handle.isFunction() || handle.isSymbol())) {
   return envObject.setLastError(1);
  }
 }
 var ref = emnapiCtx.createReference(envObject, handle.id, initial_refcount >>> 0, 1);
 GROWABLE_HEAP_U32()[result >> 2] = ref.id;
 return envObject.clearLastError();
}

function _napi_create_string_latin1(env, str, length, result) {
 return emnapiString.newString(env, str, length, result, function(autoLength, sizeLength) {
  var latin1String = "";
  var len = 0;
  if (autoLength) {
   while (true) {
    var ch = GROWABLE_HEAP_U8()[str >> 0];
    if (!ch) break;
    latin1String += String.fromCharCode(ch);
    str++;
   }
  } else {
   while (len < sizeLength) {
    var ch = GROWABLE_HEAP_U8()[str >> 0];
    if (!ch) break;
    latin1String += String.fromCharCode(ch);
    len++;
    str++;
   }
  }
  return latin1String;
 });
}

function _napi_create_string_utf8(env, str, length, result) {
 return emnapiString.newString(env, str, length, result, function() {
  return emnapiString.UTF8ToString(str, length);
 });
}

function _napi_create_type_error(env, code, msg, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!msg) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var msgValue = emnapiCtx.handleStore.get(msg).value;
 if (typeof msgValue !== "string") {
  return envObject.setLastError(3);
 }
 var error = new TypeError(msgValue);
 if (code) {
  var codeValue = emnapiCtx.handleStore.get(code).value;
  if (typeof codeValue !== "string") {
   return envObject.setLastError(3);
  }
  error.code = codeValue;
 }
 var value = emnapiCtx.addToCurrentScope(error).id;
 GROWABLE_HEAP_U32()[result >> 2] = value;
 return envObject.clearLastError();
}

function emnapiDefineProperty(envObject, obj, propertyName, method, getter, setter, value, attributes, data) {
 if (getter || setter) {
  var localGetter = void 0;
  var localSetter = void 0;
  if (getter) {
   localGetter = emnapiCreateFunction(envObject, 0, 0, getter, data).f;
  }
  if (setter) {
   localSetter = emnapiCreateFunction(envObject, 0, 0, setter, data).f;
  }
  var desc = {
   configurable: (attributes & 4) !== 0,
   enumerable: (attributes & 2) !== 0,
   get: localGetter,
   set: localSetter
  };
  Object.defineProperty(obj, propertyName, desc);
 } else if (method) {
  var localMethod = emnapiCreateFunction(envObject, 0, 0, method, data).f;
  var desc = {
   configurable: (attributes & 4) !== 0,
   enumerable: (attributes & 2) !== 0,
   writable: (attributes & 1) !== 0,
   value: localMethod
  };
  Object.defineProperty(obj, propertyName, desc);
 } else {
  var desc = {
   configurable: (attributes & 4) !== 0,
   enumerable: (attributes & 2) !== 0,
   writable: (attributes & 1) !== 0,
   value: emnapiCtx.handleStore.get(value).value
  };
  Object.defineProperty(obj, propertyName, desc);
 }
}

function _napi_define_properties(env, object, property_count, properties) {
 var propPtr, attributes;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  property_count = property_count >>> 0;
  if (property_count > 0) {
   if (!properties) return envObject.setLastError(1);
  }
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  var maybeObject = h.value;
  if (!(h.isObject() || h.isFunction())) {
   return envObject.setLastError(2);
  }
  var propertyName = void 0;
  for (var i = 0; i < property_count; i++) {
   propPtr = properties + i * (4 * 8);
   var utf8Name = GROWABLE_HEAP_U32()[propPtr >> 2];
   var name_2 = GROWABLE_HEAP_U32()[propPtr + 4 >> 2];
   var method = GROWABLE_HEAP_U32()[propPtr + 8 >> 2];
   var getter = GROWABLE_HEAP_U32()[propPtr + 12 >> 2];
   var setter = GROWABLE_HEAP_U32()[propPtr + 16 >> 2];
   var value = GROWABLE_HEAP_U32()[propPtr + 20 >> 2];
   attributes = GROWABLE_HEAP_I32()[propPtr + 24 >> 2];
   var data = GROWABLE_HEAP_U32()[propPtr + 28 >> 2];
   if (utf8Name) {
    propertyName = emnapiString.UTF8ToString(utf8Name, -1);
   } else {
    if (!name_2) {
     return envObject.setLastError(4);
    }
    propertyName = emnapiCtx.handleStore.get(name_2).value;
    if (typeof propertyName !== "string" && typeof propertyName !== "symbol") {
     return envObject.setLastError(4);
    }
   }
   emnapiDefineProperty(envObject, maybeObject, propertyName, method, getter, setter, value, attributes, data);
  }
  return 0;
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_delete_reference(env, ref) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!ref) return envObject.setLastError(1);
 emnapiCtx.refStore.get(ref).dispose();
 return envObject.clearLastError();
}

function _napi_escape_handle(env, scope, escapee, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!scope) return envObject.setLastError(1);
 if (!escapee) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var scopeObject = emnapiCtx.scopeStore.get(scope);
 if (!scopeObject.escapeCalled()) {
  var newHandle = scopeObject.escape(escapee);
  var value = newHandle ? newHandle.id : 0;
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.clearLastError();
 }
 return envObject.setLastError(12);
}

function _napi_fatal_error(location, location_len, message, message_len) {
 var locationStr = emnapiString.UTF8ToString(location, location_len);
 var messageStr = emnapiString.UTF8ToString(message, message_len);
 if (emnapiNodeBinding) {
  emnapiNodeBinding.napi.fatalError(locationStr, messageStr);
 } else {
  abort("FATAL ERROR: " + locationStr + " " + messageStr);
 }
}

function _napi_get_and_clear_last_exception(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 if (!envObject.tryCatch.hasCaught()) {
  GROWABLE_HEAP_U32()[result >> 2] = 1;
  return envObject.clearLastError();
 } else {
  var err = envObject.tryCatch.exception();
  var value = envObject.ensureHandleId(err);
  GROWABLE_HEAP_U32()[result >> 2] = value;
  envObject.tryCatch.reset();
 }
 return envObject.clearLastError();
}

function _napi_get_array_length(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(value);
 if (!handle.isArray()) {
  return envObject.setLastError(8);
 }
 var v = handle.value.length >>> 0;
 GROWABLE_HEAP_U32()[result >> 2] = v;
 return envObject.clearLastError();
}

function _napi_get_boolean(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var v = value === 0 ? 3 : 4;
 GROWABLE_HEAP_U32()[result >> 2] = v;
 return envObject.clearLastError();
}

function _napi_get_cb_info(env, _cbinfo, argc, argv, this_arg, data) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 var cbinfoValue = emnapiCtx.cbinfoStack.current;
 if (argv) {
  if (!argc) return envObject.setLastError(1);
  var argcValue = GROWABLE_HEAP_U32()[argc >> 2];
  var len = cbinfoValue.args.length;
  var arrlen = argcValue < len ? argcValue : len;
  var i = 0;
  for (;i < arrlen; i++) {
   var argVal = envObject.ensureHandleId(cbinfoValue.args[i]);
   GROWABLE_HEAP_U32()[argv + i * 4 >> 2] = argVal;
  }
  if (i < argcValue) {
   for (;i < argcValue; i++) {
    GROWABLE_HEAP_U32()[argv + i * 4 >> 2] = 1;
   }
  }
 }
 if (argc) {
  GROWABLE_HEAP_U32()[argc >> 2] = cbinfoValue.args.length;
 }
 if (this_arg) {
  var v = envObject.ensureHandleId(cbinfoValue.thiz);
  GROWABLE_HEAP_U32()[this_arg >> 2] = v;
 }
 if (data) {
  GROWABLE_HEAP_U32()[data >> 2] = cbinfoValue.data;
 }
 return envObject.clearLastError();
}

function _napi_get_element(env, object, index, result) {
 var value;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!result) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  if (h.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  var v = void 0;
  try {
   v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
  } catch (_) {
   return envObject.setLastError(2);
  }
  value = envObject.ensureHandleId(v[index >>> 0]);
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_get_named_property(env, object, utf8name, result) {
 var value;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!result) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  if (!utf8name) {
   return envObject.setLastError(1);
  }
  var h = emnapiCtx.handleStore.get(object);
  if (h.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  var v = void 0;
  try {
   v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
  } catch (_) {
   return envObject.setLastError(2);
  }
  value = envObject.ensureHandleId(v[emnapiString.UTF8ToString(utf8name, -1)]);
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_get_null(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var value = 2;
 GROWABLE_HEAP_U32()[result >> 2] = value;
 return envObject.clearLastError();
}

function _napi_get_property(env, object, key, result) {
 var value;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!key) return envObject.setLastError(1);
  if (!result) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  if (h.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  var v = void 0;
  try {
   v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
  } catch (_) {
   return envObject.setLastError(2);
  }
  value = envObject.ensureHandleId(v[emnapiCtx.handleStore.get(key).value]);
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_get_all_property_names(env, object, key_mode, key_filter, key_conversion, result) {
 var value;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!result) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  if (h.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  var obj = void 0;
  try {
   obj = h.isObject() || h.isFunction() ? h.value : Object(h.value);
  } catch (_) {
   return envObject.setLastError(2);
  }
  if (key_mode !== 0 && key_mode !== 1) {
   return envObject.setLastError(1);
  }
  if (key_conversion !== 0 && key_conversion !== 1) {
   return envObject.setLastError(1);
  }
  var props = [];
  var names = void 0;
  var symbols = void 0;
  var i = void 0;
  var own = true;
  var integerIndiceRegex = /^(0|[1-9][0-9]*)$/;
  do {
   names = Object.getOwnPropertyNames(obj);
   symbols = Object.getOwnPropertySymbols(obj);
   for (i = 0; i < names.length; i++) {
    props.push({
     name: integerIndiceRegex.test(names[i]) ? Number(names[i]) : names[i],
     desc: Object.getOwnPropertyDescriptor(obj, names[i]),
     own: own
    });
   }
   for (i = 0; i < symbols.length; i++) {
    props.push({
     name: symbols[i],
     desc: Object.getOwnPropertyDescriptor(obj, symbols[i]),
     own: own
    });
   }
   if (key_mode === 1) {
    break;
   }
   obj = Object.getPrototypeOf(obj);
   own = false;
  } while (obj);
  var ret = [];
  var addName = function(ret, name, key_filter, conversion_mode) {
   if (ret.indexOf(name) !== -1) return;
   if (conversion_mode === 0) {
    ret.push(name);
   } else if (conversion_mode === 1) {
    var realName = typeof name === "number" ? String(name) : name;
    if (typeof realName === "string") {
     if (!(key_filter & 8)) {
      ret.push(realName);
     }
    } else {
     ret.push(realName);
    }
   }
  };
  for (i = 0; i < props.length; i++) {
   var prop = props[i];
   var name_1 = prop.name;
   var desc = prop.desc;
   if (key_filter === 0) {
    addName(ret, name_1, key_filter, key_conversion);
   } else {
    if (key_filter & 8 && typeof name_1 === "string") {
     continue;
    }
    if (key_filter & 16 && typeof name_1 === "symbol") {
     continue;
    }
    var shouldAdd = true;
    switch (key_filter & 7) {
    case 1:
     {
      shouldAdd = Boolean(desc.writable);
      break;
     }

    case 2:
     {
      shouldAdd = Boolean(desc.enumerable);
      break;
     }

    case 1 | 2:
     {
      shouldAdd = Boolean(desc.writable && desc.enumerable);
      break;
     }

    case 4:
     {
      shouldAdd = Boolean(desc.configurable);
      break;
     }

    case 4 | 1:
     {
      shouldAdd = Boolean(desc.configurable && desc.writable);
      break;
     }

    case 4 | 2:
     {
      shouldAdd = Boolean(desc.configurable && desc.enumerable);
      break;
     }

    case 4 | 2 | 1:
     {
      shouldAdd = Boolean(desc.configurable && desc.enumerable && desc.writable);
      break;
     }
    }
    if (shouldAdd) {
     addName(ret, name_1, key_filter, key_conversion);
    }
   }
  }
  value = emnapiCtx.addToCurrentScope(ret).id;
  GROWABLE_HEAP_U32()[result >> 2] = value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_get_property_names(env, object, result) {
 return _napi_get_all_property_names(env, object, 0, 2 | 16, 1, result);
}

function _napi_get_reference_value(env, ref, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!ref) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var reference = emnapiCtx.refStore.get(ref);
 var handleId = reference.get();
 GROWABLE_HEAP_U32()[result >> 2] = handleId;
 return envObject.clearLastError();
}

function _napi_get_typedarray_info(env, typedarray, type, length, data, arraybuffer, byte_offset) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!typedarray) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(typedarray);
 if (!handle.isTypedArray()) {
  return envObject.setLastError(1);
 }
 var v = handle.value;
 if (type) {
  var t = void 0;
  if (v instanceof Int8Array) {
   t = 0;
  } else if (v instanceof Uint8Array) {
   t = 1;
  } else if (v instanceof Uint8ClampedArray) {
   t = 2;
  } else if (v instanceof Int16Array) {
   t = 3;
  } else if (v instanceof Uint16Array) {
   t = 4;
  } else if (v instanceof Int32Array) {
   t = 5;
  } else if (v instanceof Uint32Array) {
   t = 6;
  } else if (v instanceof Float32Array) {
   t = 7;
  } else if (v instanceof Float64Array) {
   t = 8;
  } else if (v instanceof BigInt64Array) {
   t = 9;
  } else if (v instanceof BigUint64Array) {
   t = 10;
  } else {
   return envObject.setLastError(9);
  }
  GROWABLE_HEAP_I32()[type >> 2] = t;
 }
 if (length) {
  GROWABLE_HEAP_U32()[length >> 2] = v.length;
 }
 var buffer;
 if (data || arraybuffer) {
  buffer = v.buffer;
  if (data) {
   var p = emnapiExternalMemory.getViewPointer(v, true).address;
   GROWABLE_HEAP_U32()[data >> 2] = p;
  }
  if (arraybuffer) {
   var ab = envObject.ensureHandleId(buffer);
   GROWABLE_HEAP_U32()[arraybuffer >> 2] = ab;
  }
 }
 if (byte_offset) {
  GROWABLE_HEAP_U32()[byte_offset >> 2] = v.byteOffset;
 }
 return envObject.clearLastError();
}

function _napi_get_undefined(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var value = 1;
 GROWABLE_HEAP_U32()[result >> 2] = value;
 return envObject.clearLastError();
}

function _napi_get_value_bool(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(value);
 if (typeof handle.value !== "boolean") {
  return envObject.setLastError(7);
 }
 var r = handle.value ? 1 : 0;
 GROWABLE_HEAP_I8()[result >> 0] = r;
 return envObject.clearLastError();
}

function _napi_get_value_double(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(value);
 if (typeof handle.value !== "number") {
  return envObject.setLastError(6);
 }
 var r = handle.value;
 GROWABLE_HEAP_F64()[result >> 3] = r;
 return envObject.clearLastError();
}

function _napi_get_value_int32(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(value);
 if (typeof handle.value !== "number") {
  return envObject.setLastError(6);
 }
 GROWABLE_HEAP_I32()[result >> 2] = handle.value;
 return envObject.clearLastError();
}

function _napi_get_value_int64(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(value);
 if (typeof handle.value !== "number") {
  return envObject.setLastError(6);
 }
 var numberValue = handle.value;
 var tempI64;
 if (numberValue === Number.POSITIVE_INFINITY || numberValue === Number.NEGATIVE_INFINITY || isNaN(numberValue)) {
  GROWABLE_HEAP_I32()[result >> 2] = 0;
  GROWABLE_HEAP_I32()[result + 4 >> 2] = 0;
 } else if (numberValue < -0x8000000000000000) {
  GROWABLE_HEAP_I32()[result >> 2] = 0;
  GROWABLE_HEAP_I32()[result + 4 >> 2] = 2147483648;
 } else if (numberValue >= 0x8000000000000000) {
  GROWABLE_HEAP_U32()[result >> 2] = 4294967295;
  GROWABLE_HEAP_U32()[result + 4 >> 2] = 2147483647;
 } else {
  var tempDouble = void 0;
  tempI64 = [ numberValue >>> 0, (tempDouble = numberValue, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ];
  GROWABLE_HEAP_I32()[result >> 2] = tempI64[0];
  GROWABLE_HEAP_I32()[result + 4 >> 2] = tempI64[1];
 }
 return envObject.clearLastError();
}

function _napi_get_value_string_utf8(env, value, buf, buf_size, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 buf_size = buf_size >>> 0;
 var handle = emnapiCtx.handleStore.get(value);
 if (typeof handle.value !== "string") {
  return envObject.setLastError(3);
 }
 if (!buf) {
  if (!result) return envObject.setLastError(1);
  var strLength = emnapiString.lengthBytesUTF8(handle.value);
  GROWABLE_HEAP_U32()[result >> 2] = strLength;
 } else if (buf_size !== 0) {
  var copied = emnapiString.stringToUTF8(handle.value, buf, buf_size);
  if (result) {
   GROWABLE_HEAP_U32()[result >> 2] = copied;
  }
 } else if (result) {
  GROWABLE_HEAP_U32()[result >> 2] = 0;
 }
 return envObject.clearLastError();
}

function _napi_get_value_uint32(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var handle = emnapiCtx.handleStore.get(value);
 if (typeof handle.value !== "number") {
  return envObject.setLastError(6);
 }
 GROWABLE_HEAP_U32()[result >> 2] = handle.value;
 return envObject.clearLastError();
}

function _napi_has_named_property(env, object, utf8name, result) {
 var r;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!result) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  if (!utf8name) {
   return envObject.setLastError(1);
  }
  var h = emnapiCtx.handleStore.get(object);
  if (h.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  var v = void 0;
  try {
   v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
  } catch (_) {
   return envObject.setLastError(2);
  }
  r = emnapiString.UTF8ToString(utf8name, -1) in v;
  GROWABLE_HEAP_I8()[result >> 0] = r ? 1 : 0;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_has_own_property(env, object, key, result) {
 var value, r;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!key) return envObject.setLastError(1);
  if (!result) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  if (h.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  var v = void 0;
  try {
   v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
  } catch (_) {
   return envObject.setLastError(2);
  }
  var prop = emnapiCtx.handleStore.get(key).value;
  if (typeof prop !== "string" && typeof prop !== "symbol") {
   return envObject.setLastError(4);
  }
  r = Object.prototype.hasOwnProperty.call(v, emnapiCtx.handleStore.get(key).value);
  GROWABLE_HEAP_I8()[result >> 0] = r ? 1 : 0;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_has_property(env, object, key, result) {
 var r;
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!key) return envObject.setLastError(1);
  if (!result) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  if (h.value == null) {
   throw new TypeError("Cannot convert undefined or null to object");
  }
  var v = void 0;
  try {
   v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
  } catch (_) {
   return envObject.setLastError(2);
  }
  r = emnapiCtx.handleStore.get(key).value in v ? 1 : 0;
  GROWABLE_HEAP_I8()[result >> 0] = r;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_is_exception_pending(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var r = envObject.tryCatch.hasCaught();
 GROWABLE_HEAP_I8()[result >> 0] = r ? 1 : 0;
 return envObject.clearLastError();
}

function _napi_open_escapable_handle_scope(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var scope = emnapiCtx.openScope(envObject);
 GROWABLE_HEAP_U32()[result >> 2] = scope.id;
 return envObject.clearLastError();
}

function _napi_open_handle_scope(env, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!result) return envObject.setLastError(1);
 var scope = emnapiCtx.openScope(envObject);
 GROWABLE_HEAP_U32()[result >> 2] = scope.id;
 return envObject.clearLastError();
}

function _napi_set_element(env, object, index, value) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!value) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  if (!(h.isObject() || h.isFunction())) {
   return envObject.setLastError(2);
  }
  h.value[index >>> 0] = emnapiCtx.handleStore.get(value).value;
  return envObject.getReturnStatus();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_set_last_error(env, error_code, engine_error_code, engine_reserved) {
 var envObject = emnapiCtx.envStore.get(env);
 return envObject.setLastError(error_code, engine_error_code, engine_reserved);
}

function _napi_set_named_property(env, object, cname, value) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!value) return envObject.setLastError(1);
  if (!object) return envObject.setLastError(1);
  var h = emnapiCtx.handleStore.get(object);
  if (!(h.isObject() || h.isFunction())) {
   return envObject.setLastError(2);
  }
  if (!cname) {
   return envObject.setLastError(1);
  }
  emnapiCtx.handleStore.get(object).value[emnapiString.UTF8ToString(cname, -1)] = emnapiCtx.handleStore.get(value).value;
  return 0;
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_throw(env, error) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
 if (!envObject.canCallIntoJs()) {
  return envObject.setLastError(envObject.moduleApiVersion === 2147483647 ? 23 : 10);
 }
 envObject.clearLastError();
 try {
  if (!error) return envObject.setLastError(1);
  envObject.tryCatch.setError(emnapiCtx.handleStore.get(error).value);
  return envObject.clearLastError();
 } catch (err) {
  envObject.tryCatch.setError(err);
  return envObject.setLastError(10);
 }
}

function _napi_typeof(env, value, result) {
 if (!env) return 1;
 var envObject = emnapiCtx.envStore.get(env);
 if (!value) return envObject.setLastError(1);
 if (!result) return envObject.setLastError(1);
 var v = emnapiCtx.handleStore.get(value);
 var r;
 if (v.isNumber()) {
  r = 3;
 } else if (v.isBigInt()) {
  r = 9;
 } else if (v.isString()) {
  r = 4;
 } else if (v.isFunction()) {
  r = 7;
 } else if (v.isExternal()) {
  r = 8;
 } else if (v.isObject()) {
  r = 6;
 } else if (v.isBoolean()) {
  r = 2;
 } else if (v.isUndefined()) {
  r = 0;
 } else if (v.isSymbol()) {
  r = 5;
 } else if (v.isNull()) {
  r = 1;
 } else {
  return envObject.setLastError(1);
 }
 GROWABLE_HEAP_I32()[result >> 2] = r;
 return envObject.clearLastError();
}

function arraySum(array, index) {
 var sum = 0;
 for (var i = 0; i <= index; sum += array[i++]) {}
 return sum;
}

var MONTH_DAYS_LEAP = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var MONTH_DAYS_REGULAR = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

function addDays(date, days) {
 var newDate = new Date(date.getTime());
 while (days > 0) {
  var leap = isLeapYear(newDate.getFullYear());
  var currentMonth = newDate.getMonth();
  var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
  if (days > daysInCurrentMonth - newDate.getDate()) {
   days -= daysInCurrentMonth - newDate.getDate() + 1;
   newDate.setDate(1);
   if (currentMonth < 11) {
    newDate.setMonth(currentMonth + 1);
   } else {
    newDate.setMonth(0);
    newDate.setFullYear(newDate.getFullYear() + 1);
   }
  } else {
   newDate.setDate(newDate.getDate() + days);
   return newDate;
  }
 }
 return newDate;
}

function writeArrayToMemory(array, buffer) {
 GROWABLE_HEAP_I8().set(array, buffer);
}

function _strftime(s, maxsize, format, tm) {
 var tm_zone = GROWABLE_HEAP_I32()[tm + 40 >> 2];
 var date = {
  tm_sec: GROWABLE_HEAP_I32()[tm >> 2],
  tm_min: GROWABLE_HEAP_I32()[tm + 4 >> 2],
  tm_hour: GROWABLE_HEAP_I32()[tm + 8 >> 2],
  tm_mday: GROWABLE_HEAP_I32()[tm + 12 >> 2],
  tm_mon: GROWABLE_HEAP_I32()[tm + 16 >> 2],
  tm_year: GROWABLE_HEAP_I32()[tm + 20 >> 2],
  tm_wday: GROWABLE_HEAP_I32()[tm + 24 >> 2],
  tm_yday: GROWABLE_HEAP_I32()[tm + 28 >> 2],
  tm_isdst: GROWABLE_HEAP_I32()[tm + 32 >> 2],
  tm_gmtoff: GROWABLE_HEAP_I32()[tm + 36 >> 2],
  tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
 };
 var pattern = UTF8ToString(format);
 var EXPANSION_RULES_1 = {
  "%c": "%a %b %d %H:%M:%S %Y",
  "%D": "%m/%d/%y",
  "%F": "%Y-%m-%d",
  "%h": "%b",
  "%r": "%I:%M:%S %p",
  "%R": "%H:%M",
  "%T": "%H:%M:%S",
  "%x": "%m/%d/%y",
  "%X": "%H:%M:%S",
  "%Ec": "%c",
  "%EC": "%C",
  "%Ex": "%m/%d/%y",
  "%EX": "%H:%M:%S",
  "%Ey": "%y",
  "%EY": "%Y",
  "%Od": "%d",
  "%Oe": "%e",
  "%OH": "%H",
  "%OI": "%I",
  "%Om": "%m",
  "%OM": "%M",
  "%OS": "%S",
  "%Ou": "%u",
  "%OU": "%U",
  "%OV": "%V",
  "%Ow": "%w",
  "%OW": "%W",
  "%Oy": "%y"
 };
 for (var rule in EXPANSION_RULES_1) {
  pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
 }
 var WEEKDAYS = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
 var MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
 function leadingSomething(value, digits, character) {
  var str = typeof value == "number" ? value.toString() : value || "";
  while (str.length < digits) {
   str = character[0] + str;
  }
  return str;
 }
 function leadingNulls(value, digits) {
  return leadingSomething(value, digits, "0");
 }
 function compareByDay(date1, date2) {
  function sgn(value) {
   return value < 0 ? -1 : value > 0 ? 1 : 0;
  }
  var compare;
  if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
   if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
    compare = sgn(date1.getDate() - date2.getDate());
   }
  }
  return compare;
 }
 function getFirstWeekStartDate(janFourth) {
  switch (janFourth.getDay()) {
  case 0:
   return new Date(janFourth.getFullYear() - 1, 11, 29);

  case 1:
   return janFourth;

  case 2:
   return new Date(janFourth.getFullYear(), 0, 3);

  case 3:
   return new Date(janFourth.getFullYear(), 0, 2);

  case 4:
   return new Date(janFourth.getFullYear(), 0, 1);

  case 5:
   return new Date(janFourth.getFullYear() - 1, 11, 31);

  case 6:
   return new Date(janFourth.getFullYear() - 1, 11, 30);
  }
 }
 function getWeekBasedYear(date) {
  var thisDate = addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
  var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
  var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
  var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
  var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
   if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
    return thisDate.getFullYear() + 1;
   }
   return thisDate.getFullYear();
  }
  return thisDate.getFullYear() - 1;
 }
 var EXPANSION_RULES_2 = {
  "%a": function(date) {
   return WEEKDAYS[date.tm_wday].substring(0, 3);
  },
  "%A": function(date) {
   return WEEKDAYS[date.tm_wday];
  },
  "%b": function(date) {
   return MONTHS[date.tm_mon].substring(0, 3);
  },
  "%B": function(date) {
   return MONTHS[date.tm_mon];
  },
  "%C": function(date) {
   var year = date.tm_year + 1900;
   return leadingNulls(year / 100 | 0, 2);
  },
  "%d": function(date) {
   return leadingNulls(date.tm_mday, 2);
  },
  "%e": function(date) {
   return leadingSomething(date.tm_mday, 2, " ");
  },
  "%g": function(date) {
   return getWeekBasedYear(date).toString().substring(2);
  },
  "%G": function(date) {
   return getWeekBasedYear(date);
  },
  "%H": function(date) {
   return leadingNulls(date.tm_hour, 2);
  },
  "%I": function(date) {
   var twelveHour = date.tm_hour;
   if (twelveHour == 0) twelveHour = 12; else if (twelveHour > 12) twelveHour -= 12;
   return leadingNulls(twelveHour, 2);
  },
  "%j": function(date) {
   return leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
  },
  "%m": function(date) {
   return leadingNulls(date.tm_mon + 1, 2);
  },
  "%M": function(date) {
   return leadingNulls(date.tm_min, 2);
  },
  "%n": function() {
   return "\n";
  },
  "%p": function(date) {
   if (date.tm_hour >= 0 && date.tm_hour < 12) {
    return "AM";
   }
   return "PM";
  },
  "%S": function(date) {
   return leadingNulls(date.tm_sec, 2);
  },
  "%t": function() {
   return "\t";
  },
  "%u": function(date) {
   return date.tm_wday || 7;
  },
  "%U": function(date) {
   var days = date.tm_yday + 7 - date.tm_wday;
   return leadingNulls(Math.floor(days / 7), 2);
  },
  "%V": function(date) {
   var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7) / 7);
   if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
    val++;
   }
   if (!val) {
    val = 52;
    var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
    if (dec31 == 4 || dec31 == 5 && isLeapYear(date.tm_year % 400 - 1)) {
     val++;
    }
   } else if (val == 53) {
    var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
    if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year))) val = 1;
   }
   return leadingNulls(val, 2);
  },
  "%w": function(date) {
   return date.tm_wday;
  },
  "%W": function(date) {
   var days = date.tm_yday + 7 - (date.tm_wday + 6) % 7;
   return leadingNulls(Math.floor(days / 7), 2);
  },
  "%y": function(date) {
   return (date.tm_year + 1900).toString().substring(2);
  },
  "%Y": function(date) {
   return date.tm_year + 1900;
  },
  "%z": function(date) {
   var off = date.tm_gmtoff;
   var ahead = off >= 0;
   off = Math.abs(off) / 60;
   off = off / 60 * 100 + off % 60;
   return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
  },
  "%Z": function(date) {
   return date.tm_zone;
  },
  "%%": function() {
   return "%";
  }
 };
 pattern = pattern.replace(/%%/g, "\0\0");
 for (var rule in EXPANSION_RULES_2) {
  if (pattern.includes(rule)) {
   pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
  }
 }
 pattern = pattern.replace(/\0\0/g, "%");
 var bytes = intArrayFromString(pattern, false);
 if (bytes.length > maxsize) {
  return 0;
 }
 writeArrayToMemory(bytes, s);
 return bytes.length - 1;
}

function _strftime_l(s, maxsize, format, tm, loc) {
 return _strftime(s, maxsize, format, tm);
}

var freeTableIndexes = [];

function getEmptyTableSlot() {
 if (freeTableIndexes.length) {
  return freeTableIndexes.pop();
 }
 try {
  wasmTable.grow(1);
 } catch (err) {
  if (!(err instanceof RangeError)) {
   throw err;
  }
  throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
 }
 return wasmTable.length - 1;
}

function uleb128Encode(n, target) {
 if (n < 128) {
  target.push(n);
 } else {
  target.push(n % 128 | 128, n >> 7);
 }
}

function sigToWasmTypes(sig) {
 var typeNames = {
  "i": "i32",
  "j": "i64",
  "f": "f32",
  "d": "f64",
  "p": "i32"
 };
 var type = {
  parameters: [],
  results: sig[0] == "v" ? [] : [ typeNames[sig[0]] ]
 };
 for (var i = 1; i < sig.length; ++i) {
  type.parameters.push(typeNames[sig[i]]);
 }
 return type;
}

function generateFuncType(sig, target) {
 var sigRet = sig.slice(0, 1);
 var sigParam = sig.slice(1);
 var typeCodes = {
  "i": 127,
  "p": 127,
  "j": 126,
  "f": 125,
  "d": 124
 };
 target.push(96);
 uleb128Encode(sigParam.length, target);
 for (var i = 0; i < sigParam.length; ++i) {
  target.push(typeCodes[sigParam[i]]);
 }
 if (sigRet == "v") {
  target.push(0);
 } else {
  target.push(1, typeCodes[sigRet]);
 }
}

function convertJsFunctionToWasm(func, sig) {
 if (typeof WebAssembly.Function == "function") {
  return new WebAssembly.Function(sigToWasmTypes(sig), func);
 }
 var typeSectionBody = [ 1 ];
 generateFuncType(sig, typeSectionBody);
 var bytes = [ 0, 97, 115, 109, 1, 0, 0, 0, 1 ];
 uleb128Encode(typeSectionBody.length, bytes);
 bytes.push.apply(bytes, typeSectionBody);
 bytes.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
 var module = new WebAssembly.Module(new Uint8Array(bytes));
 var instance = new WebAssembly.Instance(module, {
  "e": {
   "f": func
  }
 });
 var wrappedFunc = instance.exports["f"];
 return wrappedFunc;
}

PThread.init();

var FSNode = function(parent, name, mode, rdev) {
 if (!parent) {
  parent = this;
 }
 this.parent = parent;
 this.mount = parent.mount;
 this.mounted = null;
 this.id = FS.nextInode++;
 this.name = name;
 this.mode = mode;
 this.node_ops = {};
 this.stream_ops = {};
 this.rdev = rdev;
};

var readMode = 292 | 73;

var writeMode = 146;

Object.defineProperties(FSNode.prototype, {
 read: {
  get: function() {
   return (this.mode & readMode) === readMode;
  },
  set: function(val) {
   val ? this.mode |= readMode : this.mode &= ~readMode;
  }
 },
 write: {
  get: function() {
   return (this.mode & writeMode) === writeMode;
  },
  set: function(val) {
   val ? this.mode |= writeMode : this.mode &= ~writeMode;
  }
 },
 isFolder: {
  get: function() {
   return FS.isDir(this.mode);
  }
 },
 isDevice: {
  get: function() {
   return FS.isChrdev(this.mode);
  }
 }
});

FS.FSNode = FSNode;

FS.createPreloadedFile = FS_createPreloadedFile;

FS.staticInit();

if (ENVIRONMENT_IS_NODE) {
 NODEFS.staticInit();
}

ERRNO_CODES = {
 "EPERM": 63,
 "ENOENT": 44,
 "ESRCH": 71,
 "EINTR": 27,
 "EIO": 29,
 "ENXIO": 60,
 "E2BIG": 1,
 "ENOEXEC": 45,
 "EBADF": 8,
 "ECHILD": 12,
 "EAGAIN": 6,
 "EWOULDBLOCK": 6,
 "ENOMEM": 48,
 "EACCES": 2,
 "EFAULT": 21,
 "ENOTBLK": 105,
 "EBUSY": 10,
 "EEXIST": 20,
 "EXDEV": 75,
 "ENODEV": 43,
 "ENOTDIR": 54,
 "EISDIR": 31,
 "EINVAL": 28,
 "ENFILE": 41,
 "EMFILE": 33,
 "ENOTTY": 59,
 "ETXTBSY": 74,
 "EFBIG": 22,
 "ENOSPC": 51,
 "ESPIPE": 70,
 "EROFS": 69,
 "EMLINK": 34,
 "EPIPE": 64,
 "EDOM": 18,
 "ERANGE": 68,
 "ENOMSG": 49,
 "EIDRM": 24,
 "ECHRNG": 106,
 "EL2NSYNC": 156,
 "EL3HLT": 107,
 "EL3RST": 108,
 "ELNRNG": 109,
 "EUNATCH": 110,
 "ENOCSI": 111,
 "EL2HLT": 112,
 "EDEADLK": 16,
 "ENOLCK": 46,
 "EBADE": 113,
 "EBADR": 114,
 "EXFULL": 115,
 "ENOANO": 104,
 "EBADRQC": 103,
 "EBADSLT": 102,
 "EDEADLOCK": 16,
 "EBFONT": 101,
 "ENOSTR": 100,
 "ENODATA": 116,
 "ETIME": 117,
 "ENOSR": 118,
 "ENONET": 119,
 "ENOPKG": 120,
 "EREMOTE": 121,
 "ENOLINK": 47,
 "EADV": 122,
 "ESRMNT": 123,
 "ECOMM": 124,
 "EPROTO": 65,
 "EMULTIHOP": 36,
 "EDOTDOT": 125,
 "EBADMSG": 9,
 "ENOTUNIQ": 126,
 "EBADFD": 127,
 "EREMCHG": 128,
 "ELIBACC": 129,
 "ELIBBAD": 130,
 "ELIBSCN": 131,
 "ELIBMAX": 132,
 "ELIBEXEC": 133,
 "ENOSYS": 52,
 "ENOTEMPTY": 55,
 "ENAMETOOLONG": 37,
 "ELOOP": 32,
 "EOPNOTSUPP": 138,
 "EPFNOSUPPORT": 139,
 "ECONNRESET": 15,
 "ENOBUFS": 42,
 "EAFNOSUPPORT": 5,
 "EPROTOTYPE": 67,
 "ENOTSOCK": 57,
 "ENOPROTOOPT": 50,
 "ESHUTDOWN": 140,
 "ECONNREFUSED": 14,
 "EADDRINUSE": 3,
 "ECONNABORTED": 13,
 "ENETUNREACH": 40,
 "ENETDOWN": 38,
 "ETIMEDOUT": 73,
 "EHOSTDOWN": 142,
 "EHOSTUNREACH": 23,
 "EINPROGRESS": 26,
 "EALREADY": 7,
 "EDESTADDRREQ": 17,
 "EMSGSIZE": 35,
 "EPROTONOSUPPORT": 66,
 "ESOCKTNOSUPPORT": 137,
 "EADDRNOTAVAIL": 4,
 "ENETRESET": 39,
 "EISCONN": 30,
 "ENOTCONN": 53,
 "ETOOMANYREFS": 141,
 "EUSERS": 136,
 "EDQUOT": 19,
 "ESTALE": 72,
 "ENOTSUP": 138,
 "ENOMEDIUM": 148,
 "EILSEQ": 25,
 "EOVERFLOW": 61,
 "ECANCELED": 11,
 "ENOTRECOVERABLE": 56,
 "EOWNERDEAD": 62,
 "ESTRPIPE": 135
};

if (!ENVIRONMENT_IS_NODE) {
 throw new Error("NODERAWFS is currently only supported on Node.js environment.");
}

var VFS = Object.assign({}, FS);

FS.init = NODERAWFS.init;

emnapiExternalMemory.init();

emnapiString.init();

var proxiedFunctionTable = [ null, _proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall_dup, ___syscall_faccessat, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_ftruncate64, ___syscall_getcwd, ___syscall_ioctl, ___syscall_lstat64, ___syscall_newfstatat, ___syscall_openat, ___syscall_rmdir, ___syscall_stat64, ___syscall_unlinkat, __mmap_js, __munmap_js, _environ_get, _environ_sizes_get, _fd_close, _fd_fdstat_get, _fd_read, _fd_seek, _fd_write ];

var wasmImports = {
 "__assert_fail": ___assert_fail,
 "__call_sighandler": ___call_sighandler,
 "__cxa_begin_catch": ___cxa_begin_catch,
 "__cxa_end_catch": ___cxa_end_catch,
 "__cxa_find_matching_catch_2": ___cxa_find_matching_catch_2,
 "__cxa_find_matching_catch_3": ___cxa_find_matching_catch_3,
 "__cxa_find_matching_catch_4": ___cxa_find_matching_catch_4,
 "__cxa_rethrow": ___cxa_rethrow,
 "__cxa_throw": ___cxa_throw,
 "__cxa_uncaught_exceptions": ___cxa_uncaught_exceptions,
 "__emscripten_init_main_thread_js": ___emscripten_init_main_thread_js,
 "__emscripten_thread_cleanup": ___emscripten_thread_cleanup,
 "__pthread_create_js": ___pthread_create_js,
 "__resumeException": ___resumeException,
 "__syscall_dup": ___syscall_dup,
 "__syscall_faccessat": ___syscall_faccessat,
 "__syscall_fcntl64": ___syscall_fcntl64,
 "__syscall_fstat64": ___syscall_fstat64,
 "__syscall_ftruncate64": ___syscall_ftruncate64,
 "__syscall_getcwd": ___syscall_getcwd,
 "__syscall_ioctl": ___syscall_ioctl,
 "__syscall_lstat64": ___syscall_lstat64,
 "__syscall_newfstatat": ___syscall_newfstatat,
 "__syscall_openat": ___syscall_openat,
 "__syscall_rmdir": ___syscall_rmdir,
 "__syscall_stat64": ___syscall_stat64,
 "__syscall_unlinkat": ___syscall_unlinkat,
 "_emnapi_callback_into_module": __emnapi_callback_into_module,
 "_emnapi_ctx_decrease_waiting_request_counter": __emnapi_ctx_decrease_waiting_request_counter,
 "_emnapi_ctx_increase_waiting_request_counter": __emnapi_ctx_increase_waiting_request_counter,
 "_emnapi_get_last_error_info": __emnapi_get_last_error_info,
 "_emnapi_node_emit_async_destroy": __emnapi_node_emit_async_destroy,
 "_emnapi_node_emit_async_init": __emnapi_node_emit_async_init,
 "_emnapi_node_make_callback": __emnapi_node_make_callback,
 "_emnapi_set_immediate": __emnapi_set_immediate,
 "_emnapi_worker_unref": __emnapi_worker_unref,
 "_emscripten_get_now_is_monotonic": __emscripten_get_now_is_monotonic,
 "_emscripten_notify_mailbox_postmessage": __emscripten_notify_mailbox_postmessage,
 "_emscripten_set_offscreencanvas_size": __emscripten_set_offscreencanvas_size,
 "_emscripten_thread_mailbox_await": __emscripten_thread_mailbox_await,
 "_emscripten_thread_set_strongref": __emscripten_thread_set_strongref,
 "_emscripten_throw_longjmp": __emscripten_throw_longjmp,
 "_gmtime_js": __gmtime_js,
 "_localtime_js": __localtime_js,
 "_mmap_js": __mmap_js,
 "_munmap_js": __munmap_js,
 "_tzset_js": __tzset_js,
 "abort": _abort,
 "emnapi_is_node_binding_available": _emnapi_is_node_binding_available,
 "emscripten_check_blocking_allowed": _emscripten_check_blocking_allowed,
 "emscripten_date_now": _emscripten_date_now,
 "emscripten_exit_with_live_runtime": _emscripten_exit_with_live_runtime,
 "emscripten_get_heap_max": _emscripten_get_heap_max,
 "emscripten_get_now": _emscripten_get_now,
 "emscripten_num_logical_cores": _emscripten_num_logical_cores,
 "emscripten_receive_on_main_thread_js": _emscripten_receive_on_main_thread_js,
 "emscripten_resize_heap": _emscripten_resize_heap,
 "emscripten_runtime_keepalive_pop": _emscripten_runtime_keepalive_pop,
 "emscripten_runtime_keepalive_push": _emscripten_runtime_keepalive_push,
 "environ_get": _environ_get,
 "environ_sizes_get": _environ_sizes_get,
 "exit": _exit,
 "fd_close": _fd_close,
 "fd_fdstat_get": _fd_fdstat_get,
 "fd_read": _fd_read,
 "fd_seek": _fd_seek,
 "fd_write": _fd_write,
 "ffi_call_helper": ffi_call_helper,
 "invoke_di": invoke_di,
 "invoke_dii": invoke_dii,
 "invoke_diii": invoke_diii,
 "invoke_diiii": invoke_diiii,
 "invoke_fiii": invoke_fiii,
 "invoke_i": invoke_i,
 "invoke_ii": invoke_ii,
 "invoke_iidi": invoke_iidi,
 "invoke_iif": invoke_iif,
 "invoke_iii": invoke_iii,
 "invoke_iiid": invoke_iiid,
 "invoke_iiii": invoke_iiii,
 "invoke_iiiii": invoke_iiiii,
 "invoke_iiiiid": invoke_iiiiid,
 "invoke_iiiiii": invoke_iiiiii,
 "invoke_iiiiiii": invoke_iiiiiii,
 "invoke_iiiiiiii": invoke_iiiiiiii,
 "invoke_iiiiiiiiii": invoke_iiiiiiiiii,
 "invoke_iiiiiiiiiii": invoke_iiiiiiiiiii,
 "invoke_iiiiiiiiiiii": invoke_iiiiiiiiiiii,
 "invoke_iiiiiiiiiiiii": invoke_iiiiiiiiiiiii,
 "invoke_iiiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiiii,
 "invoke_iiiiij": invoke_iiiiij,
 "invoke_iiijii": invoke_iiijii,
 "invoke_iij": invoke_iij,
 "invoke_ji": invoke_ji,
 "invoke_jii": invoke_jii,
 "invoke_jiiii": invoke_jiiii,
 "invoke_v": invoke_v,
 "invoke_vi": invoke_vi,
 "invoke_vid": invoke_vid,
 "invoke_vii": invoke_vii,
 "invoke_viid": invoke_viid,
 "invoke_viidd": invoke_viidd,
 "invoke_viidddddd": invoke_viidddddd,
 "invoke_viiddi": invoke_viiddi,
 "invoke_viiddid": invoke_viiddid,
 "invoke_viidi": invoke_viidi,
 "invoke_viii": invoke_viii,
 "invoke_viiid": invoke_viiid,
 "invoke_viiii": invoke_viiii,
 "invoke_viiiiddi": invoke_viiiiddi,
 "invoke_viiiii": invoke_viiiii,
 "invoke_viiiiii": invoke_viiiiii,
 "invoke_viiiiiii": invoke_viiiiiii,
 "invoke_viiiiiiii": invoke_viiiiiiii,
 "invoke_viiiiiiiii": invoke_viiiiiiiii,
 "invoke_viiiiiiiiii": invoke_viiiiiiiiii,
 "invoke_viiiiiiiiiii": invoke_viiiiiiiiiii,
 "invoke_viiiiiiiiiiiiiii": invoke_viiiiiiiiiiiiiii,
 "invoke_viij": invoke_viij,
 "llvm_eh_typeid_for": _llvm_eh_typeid_for,
 "memory": wasmMemory,
 "napi_add_finalizer": _napi_add_finalizer,
 "napi_call_function": _napi_call_function,
 "napi_clear_last_error": _napi_clear_last_error,
 "napi_close_escapable_handle_scope": _napi_close_escapable_handle_scope,
 "napi_close_handle_scope": _napi_close_handle_scope,
 "napi_coerce_to_object": _napi_coerce_to_object,
 "napi_coerce_to_string": _napi_coerce_to_string,
 "napi_create_array": _napi_create_array,
 "napi_create_array_with_length": _napi_create_array_with_length,
 "napi_create_buffer_copy": _napi_create_buffer_copy,
 "napi_create_double": _napi_create_double,
 "napi_create_error": _napi_create_error,
 "napi_create_external_buffer": _napi_create_external_buffer,
 "napi_create_function": _napi_create_function,
 "napi_create_object": _napi_create_object,
 "napi_create_reference": _napi_create_reference,
 "napi_create_string_latin1": _napi_create_string_latin1,
 "napi_create_string_utf8": _napi_create_string_utf8,
 "napi_create_type_error": _napi_create_type_error,
 "napi_define_properties": _napi_define_properties,
 "napi_delete_reference": _napi_delete_reference,
 "napi_escape_handle": _napi_escape_handle,
 "napi_fatal_error": _napi_fatal_error,
 "napi_get_and_clear_last_exception": _napi_get_and_clear_last_exception,
 "napi_get_array_length": _napi_get_array_length,
 "napi_get_boolean": _napi_get_boolean,
 "napi_get_cb_info": _napi_get_cb_info,
 "napi_get_element": _napi_get_element,
 "napi_get_named_property": _napi_get_named_property,
 "napi_get_null": _napi_get_null,
 "napi_get_property": _napi_get_property,
 "napi_get_property_names": _napi_get_property_names,
 "napi_get_reference_value": _napi_get_reference_value,
 "napi_get_typedarray_info": _napi_get_typedarray_info,
 "napi_get_undefined": _napi_get_undefined,
 "napi_get_value_bool": _napi_get_value_bool,
 "napi_get_value_double": _napi_get_value_double,
 "napi_get_value_int32": _napi_get_value_int32,
 "napi_get_value_int64": _napi_get_value_int64,
 "napi_get_value_string_utf8": _napi_get_value_string_utf8,
 "napi_get_value_uint32": _napi_get_value_uint32,
 "napi_has_named_property": _napi_has_named_property,
 "napi_has_own_property": _napi_has_own_property,
 "napi_has_property": _napi_has_property,
 "napi_is_exception_pending": _napi_is_exception_pending,
 "napi_open_escapable_handle_scope": _napi_open_escapable_handle_scope,
 "napi_open_handle_scope": _napi_open_handle_scope,
 "napi_set_element": _napi_set_element,
 "napi_set_last_error": _napi_set_last_error,
 "napi_set_named_property": _napi_set_named_property,
 "napi_throw": _napi_throw,
 "napi_typeof": _napi_typeof,
 "strftime": _strftime,
 "strftime_l": _strftime_l
};

var asm = createWasm();

var ___wasm_call_ctors = asm["__wasm_call_ctors"];

var _free = asm["free"];

var _malloc = asm["malloc"];

var _uv_library_shutdown = Module["_uv_library_shutdown"] = asm["uv_library_shutdown"];

var ___errno_location = asm["__errno_location"];

var _emscripten_main_runtime_thread_id = asm["emscripten_main_runtime_thread_id"];

var _pthread_self = Module["_pthread_self"] = asm["pthread_self"];

var ___cxa_free_exception = asm["__cxa_free_exception"];

var _node_api_module_get_api_version_v1 = asm["node_api_module_get_api_version_v1"];

var _napi_register_wasm_v1 = asm["napi_register_wasm_v1"];

var _vips_shutdown = Module["_vips_shutdown"] = asm["vips_shutdown"];

var _ntohs = asm["ntohs"];

var __emscripten_tls_init = Module["__emscripten_tls_init"] = asm["_emscripten_tls_init"];

var _emscripten_builtin_memalign = asm["emscripten_builtin_memalign"];

var __emscripten_thread_init = Module["__emscripten_thread_init"] = asm["_emscripten_thread_init"];

var __emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = asm["_emscripten_thread_crashed"];

var _emscripten_main_thread_process_queued_calls = asm["emscripten_main_thread_process_queued_calls"];

var _htons = asm["htons"];

var _htonl = asm["htonl"];

var __emscripten_run_in_main_runtime_thread_js = asm["_emscripten_run_in_main_runtime_thread_js"];

var _emscripten_dispatch_to_thread_ = asm["emscripten_dispatch_to_thread_"];

var __emscripten_thread_free_data = asm["_emscripten_thread_free_data"];

var __emscripten_thread_exit = Module["__emscripten_thread_exit"] = asm["_emscripten_thread_exit"];

var __emscripten_check_mailbox = Module["__emscripten_check_mailbox"] = asm["_emscripten_check_mailbox"];

var _setThrew = asm["setThrew"];

var setTempRet0 = asm["setTempRet0"];

var _emscripten_stack_set_limits = asm["emscripten_stack_set_limits"];

var stackSave = asm["stackSave"];

var stackRestore = asm["stackRestore"];

var stackAlloc = asm["stackAlloc"];

var ___cxa_decrement_exception_refcount = asm["__cxa_decrement_exception_refcount"];

var ___cxa_increment_exception_refcount = asm["__cxa_increment_exception_refcount"];

var ___cxa_can_catch = asm["__cxa_can_catch"];

var ___cxa_is_pointer_type = asm["__cxa_is_pointer_type"];

var ___start_em_js = Module["___start_em_js"] = 1888712;

var ___stop_em_js = Module["___stop_em_js"] = 1899140;

function invoke_vii(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_dii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ii(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_i(index) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vid(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiid(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vi(index, a1) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viid(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_v(index) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_di(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iidi(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiddi(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viidi(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiid(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiddi(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiddid(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viidddddd(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viidd(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiij(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jiiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_fiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_diii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ji(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
 }
}

function invoke_iij(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iif(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viij(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_diiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiijii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

Module["keepRuntimeAlive"] = keepRuntimeAlive;

Module["wasmMemory"] = wasmMemory;

Module["ExitStatus"] = ExitStatus;

Module["emnapiInit"] = emnapiInit;

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function run() {
 if (runDependencies > 0) {
  return;
 }
 if (ENVIRONMENT_IS_PTHREAD) {
  initRuntime();
  startWorker(Module);
  return;
 }
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

run();
