

// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function GROWABLE_HEAP_I8() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
  }
  return HEAP8;
}
function GROWABLE_HEAP_U8() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
  }
  return HEAPU8;
}
function GROWABLE_HEAP_I16() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
  }
  return HEAP16;
}
function GROWABLE_HEAP_U16() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
  }
  return HEAPU16;
}
function GROWABLE_HEAP_I32() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
  }
  return HEAP32;
}
function GROWABLE_HEAP_U32() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
  }
  return HEAPU32;
}
function GROWABLE_HEAP_F32() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
  }
  return HEAPF32;
}
function GROWABLE_HEAP_F64() {
  if (wasmMemory.buffer != buffer) {
    updateGlobalBufferAndViews(wasmMemory.buffer);
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

Module.onEmnapiInitialized = (err, emnapi) => {
 if (err) {
  throw err;
 }
 for (const worker of PThread.runningWorkers) {
  worker.unref();
 }
 function wrapProperty(prop, wrapper) {
  emnapi[prop] = wrapper(emnapi[prop]);
 }
 wrapProperty("concurrency", impl => (function(maybeSet) {
  if (typeof maybeSet === "number" && maybeSet > vipsConcurrency) {
   console.warn(`Requested concurrency (${maybeSet}) is higher than the set limit (${vipsConcurrency}).`);
   maybeSet = vipsConcurrency;
  }
  return impl.call(this, maybeSet);
 }));
 const emnapiWorker = PThread.unusedWorkers[0];
 let emnapiRefCount = 0;
 for (const fnName of [ "metadata", "pipeline", "stats" ]) {
  wrapProperty(fnName, impl => (function(...args) {
   if (emnapiRefCount++ === 0) {
    emnapiWorker.ref();
   }
   const callback = args.pop();
   args.push(function() {
    if (--emnapiRefCount === 0) {
     emnapiWorker.unref();
    }
    return callback.apply(this, arguments);
   });
   return impl.apply(this, args);
  }));
 }
 process.once("exit", () => {
  _vips_shutdown();
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

var _scriptDir;

if (ENVIRONMENT_IS_NODE) {
 _scriptDir = __filename;
} else if (ENVIRONMENT_IS_WORKER) {
 _scriptDir = self.location.href;
} else _scriptDir = undefined;

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

function logExceptionOnExit(e) {
 if (e instanceof ExitStatus) return;
 let toLog = e;
 err("exiting due to exception: " + toLog);
}

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
 readAsync = (filename, onload, onerror) => {
  filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
  fs.readFile(filename, function(err, data) {
   if (err) onerror(err); else onload(data.buffer);
  });
 };
 if (process["argv"].length > 1) {
  thisProgram = process["argv"][1].replace(/\\/g, "/");
 }
 arguments_ = process["argv"].slice(2);
 if (typeof module != "undefined") {
  module["exports"] = Module;
 }
 quit_ = (status, toThrow) => {
  if (keepRuntimeAlive()) {
   process["exitCode"] = status;
   throw toThrow;
  }
  logExceptionOnExit(toThrow);
  process["exit"](status);
 };
 Module["inspect"] = function() {
  return "[Emscripten Module object]";
 };
 let nodeWorkerThreads;
 try {
  nodeWorkerThreads = require("worker_threads");
 } catch (e) {
  console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?');
  throw e;
 }
 global.Worker = nodeWorkerThreads.Worker;
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
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

var defaultPrintErr = console.warn.bind(console);

if (ENVIRONMENT_IS_NODE) {
 defaultPrint = str => fs.writeSync(1, str + "\n");
 defaultPrintErr = str => fs.writeSync(2, str + "\n");
}

var out = Module["print"] || defaultPrint;

var err = Module["printErr"] || defaultPrintErr;

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var STACK_ALIGN = 16;

var POINTER_SIZE = 4;

function getNativeTypeSize(type) {
 switch (type) {
 case "i1":
 case "i8":
 case "u8":
  return 1;

 case "i16":
 case "u16":
  return 2;

 case "i32":
 case "u32":
  return 4;

 case "i64":
 case "u64":
  return 8;

 case "float":
  return 4;

 case "double":
  return 8;

 default:
  {
   if (type[type.length - 1] === "*") {
    return POINTER_SIZE;
   }
   if (type[0] === "i") {
    const bits = Number(type.substr(1));
    assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
    return bits / 8;
   }
   return 0;
  }
 }
}

var Atomics_load = Atomics.load;

var Atomics_store = Atomics.store;

var Atomics_compareExchange = Atomics.compareExchange;

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

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : "";
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

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite);
}

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

var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;

if (ENVIRONMENT_IS_PTHREAD) {
 buffer = Module["buffer"];
}

function updateGlobalBufferAndViews(buf) {
 buffer = buf;
 Module["HEAP8"] = HEAP8 = new Int8Array(buf);
 Module["HEAP16"] = HEAP16 = new Int16Array(buf);
 Module["HEAP32"] = HEAP32 = new Int32Array(buf);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
 Module["HEAP64"] = HEAP64 = new BigInt64Array(buf);
 Module["HEAPU64"] = HEAPU64 = new BigUint64Array(buf);
}

var STACK_SIZE = 65536;

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

if (ENVIRONMENT_IS_PTHREAD) {
 wasmMemory = Module["wasmMemory"];
 buffer = Module["buffer"];
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

if (wasmMemory) {
 buffer = wasmMemory.buffer;
}

INITIAL_MEMORY = buffer.byteLength;

updateGlobalBufferAndViews(buffer);

var wasmTable;

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function keepRuntimeAlive() {
 return noExitRuntime;
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

function getBinaryPromise() {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function") {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(function() {
    return getBinary(wasmBinaryFile);
   });
  }
 }
 return Promise.resolve().then(function() {
  return getBinary(wasmBinaryFile);
 });
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
  "env": asmLibraryArg,
  "wasi_snapshot_preview1": asmLibraryArg
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  registerTLSInit(Module["asm"]["_emscripten_tls_init"]);
  wasmTable = Module["asm"]["__indirect_function_table"];
  addOnInit(Module["asm"]["__wasm_call_ctors"]);
  wasmModule = module;
  PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("wasm-instantiate"));
 }
 addRunDependency("wasm-instantiate");
 if (Module["instantiateWasm"]) {
  try {
   var exports = Module["instantiateWasm"](info, receiveInstance);
   return exports;
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 var result = instantiateSync(wasmBinaryFile, info);
 receiveInstance(result[0], result[1]);
 return Module["asm"];
}

var tempDouble;

var tempI64;

var ASM_CONSTS = {};

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
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

function killThread(pthread_ptr) {
 var worker = PThread.pthreads[pthread_ptr];
 delete PThread.pthreads[pthread_ptr];
 worker.terminate();
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
  worker.ref();
 }
 worker.postMessage(msg, threadParams.transferList);
 return 0;
}

var PATH = {
 isAbs: path => nodePath["isAbsolute"](path),
 normalize: path => nodePath["normalize"](path),
 dirname: path => nodePath["dirname"](path),
 basename: path => nodePath["basename"](path),
 join: function() {
  return nodePath["join"].apply(null, arguments);
 },
 join2: (l, r) => nodePath["join"](l, r)
};

function getRandomDevice() {
 if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
  var randomBuffer = new Uint8Array(1);
  return () => {
   crypto.getRandomValues(randomBuffer);
   return randomBuffer[0];
  };
 } else if (ENVIRONMENT_IS_NODE) {
  try {
   var crypto_module = require("crypto");
   return () => crypto_module["randomBytes"](1)[0];
  } catch (e) {}
 }
 return () => abort("randomDevice");
}

var PATH_FS = {
 resolve: function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  paths.unshift(FS.cwd());
  return nodePath["posix"]["resolve"].apply(null, paths);
 },
 relative: (from, to) => nodePath["posix"]["relative"](from || FS.cwd(), to || FS.cwd())
};

function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
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
   if (!(flags & 2) && contents.buffer === buffer) {
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
 var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
 readAsync(url, arrayBuffer => {
  assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
  onload(new Uint8Array(arrayBuffer));
  if (dep) removeRunDependency(dep);
 }, event => {
  if (onerror) {
   onerror();
  } else {
   throw 'Loading data file "' + url + '" failed.';
  }
 });
 if (dep) addRunDependency(dep);
}

var ERRNO_CODES = {};

var NODEFS = {
 isWindows: false,
 staticInit: () => {
  NODEFS.isWindows = !!process.platform.match(/^win/);
  var flags = process["binding"]("constants");
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
 lookup: function(parent, name) {
  return FS.lookupPath(parent.path + "/" + name).node;
 },
 lookupPath: function(path, opts) {
  opts = opts || {};
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
 createStandardStreams: function() {
  FS.streams[0] = FS.createStream({
   nfd: 0,
   position: 0,
   path: "",
   flags: 0,
   tty: true,
   seekable: false
  }, 0, 0);
  for (var i = 1; i < 3; i++) {
   FS.streams[i] = FS.createStream({
    nfd: i,
    position: 0,
    path: "",
    flags: 577,
    tty: true,
    seekable: false
   }, i, i);
  }
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
 fchmod: function() {
  fs.fchmodSync.apply(void 0, arguments);
 },
 chown: function() {
  fs.chownSync.apply(void 0, arguments);
 },
 fchown: function() {
  fs.fchownSync.apply(void 0, arguments);
 },
 truncate: function() {
  fs.truncateSync.apply(void 0, arguments);
 },
 ftruncate: function(fd, len) {
  if (len < 0) {
   throw new FS.ErrnoError(28);
  }
  fs.ftruncateSync.apply(void 0, arguments);
 },
 utime: function(path, atime, mtime) {
  fs.utimesSync(path, atime / 1e3, mtime / 1e3);
 },
 open: function(path, flags, mode, suggestFD) {
  if (typeof flags == "string") {
   flags = VFS.modeStringToFlags(flags);
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
  var fd = suggestFD != null ? suggestFD : FS.nextfd(nfd);
  var node = {
   id: st.ino,
   mode: newMode,
   node_ops: NODERAWFS,
   path: path
  };
  var stream = FS.createStream({
   nfd: nfd,
   position: 0,
   path: path,
   flags: flags,
   node: node,
   seekable: true
  }, fd, fd);
  FS.streams[fd] = stream;
  return stream;
 },
 createStream: function(stream, fd_start, fd_end) {
  var rtn = VFS.createStream(stream, fd_start, fd_end);
  if (typeof rtn.shared.refcnt == "undefined") {
   rtn.shared.refcnt = 1;
  } else {
   rtn.shared.refcnt++;
  }
  return rtn;
 },
 closeStream: function(fd) {
  if (FS.streams[fd]) {
   FS.streams[fd].shared.refcnt--;
  }
  VFS.closeStream(fd);
 },
 close: function(stream) {
  FS.closeStream(stream.fd);
  if (!stream.stream_ops && stream.shared.refcnt === 0) {
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
    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
   }
   path = path ? node.name + "/" + path : node.name;
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
 flagModes: {
  "r": 0,
  "r+": 2,
  "w": 577,
  "w+": 578,
  "a": 1089,
  "a+": 1090
 },
 modeStringToFlags: str => {
  var flags = FS.flagModes[str];
  if (typeof flags == "undefined") {
   throw new Error("Unknown file open mode: " + str);
  }
  return flags;
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
 nextfd: (fd_start = 0, fd_end = FS.MAX_OPEN_FDS) => {
  for (var fd = fd_start; fd <= fd_end; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(33);
 },
 getStream: fd => FS.streams[fd],
 createStream: (stream, fd_start, fd_end) => {
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
  var fd = FS.nextfd(fd_start, fd_end);
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
   err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
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
  flags = typeof flags == "string" ? FS.modeStringToFlags(flags) : flags;
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
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
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
  var random_device = getRandomDevice();
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
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
 getMode: (canRead, canWrite) => {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
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
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
 },
 createDataFile: (parent, name, data, canRead, canWrite, canOwn) => {
  var path = name;
  if (parent) {
   parent = typeof parent == "string" ? parent : FS.getPath(parent);
   path = name ? PATH.join2(parent, name) : parent;
  }
  var mode = FS.getMode(canRead, canWrite);
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
  var mode = FS.getMode(!!input, !!output);
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
 },
 createPreloadedFile: (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency("cp " + fullname);
  function processData(byteArray) {
   function finish(byteArray) {
    if (preFinish) preFinish();
    if (!dontCreateFile) {
     FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
    if (onload) onload();
    removeRunDependency(dep);
   }
   if (Browser.handledByPreloadPlugin(byteArray, fullname, finish, () => {
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
 },
 indexedDB: () => {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 },
 DB_NAME: () => {
  return "EM_FS_" + window.location.pathname;
 },
 DB_VERSION: 20,
 DB_STORE_NAME: "FILE_DATA",
 saveFilesToDB: (paths, onload, onerror) => {
  onload = onload || (() => {});
  onerror = onerror || (() => {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = () => {
   out("creating db");
   var db = openRequest.result;
   db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = () => {
   var db = openRequest.result;
   var transaction = db.transaction([ FS.DB_STORE_NAME ], "readwrite");
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach(path => {
    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
    putRequest.onsuccess = () => {
     ok++;
     if (ok + fail == total) finish();
    };
    putRequest.onerror = () => {
     fail++;
     if (ok + fail == total) finish();
    };
   });
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 },
 loadFilesFromDB: (paths, onload, onerror) => {
  onload = onload || (() => {});
  onerror = onerror || (() => {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = () => {
   var db = openRequest.result;
   try {
    var transaction = db.transaction([ FS.DB_STORE_NAME ], "readonly");
   } catch (e) {
    onerror(e);
    return;
   }
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach(path => {
    var getRequest = files.get(path);
    getRequest.onsuccess = () => {
     if (FS.analyzePath(path).exists) {
      FS.unlink(path);
     }
     FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
     ok++;
     if (ok + fail == total) finish();
    };
    getRequest.onerror = () => {
     fail++;
     if (ok + fail == total) finish();
    };
   });
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 }
};

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
  tempI64 = [ stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  GROWABLE_HEAP_I32()[buf + 40 >> 2] = tempI64[0], GROWABLE_HEAP_I32()[buf + 44 >> 2] = tempI64[1];
  GROWABLE_HEAP_I32()[buf + 48 >> 2] = 4096;
  GROWABLE_HEAP_I32()[buf + 52 >> 2] = stat.blocks;
  var atime = stat.atime.getTime();
  var mtime = stat.mtime.getTime();
  var ctime = stat.ctime.getTime();
  tempI64 = [ Math.floor(atime / 1e3) >>> 0, (tempDouble = Math.floor(atime / 1e3), 
  +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  GROWABLE_HEAP_I32()[buf + 56 >> 2] = tempI64[0], GROWABLE_HEAP_I32()[buf + 60 >> 2] = tempI64[1];
  GROWABLE_HEAP_U32()[buf + 64 >> 2] = atime % 1e3 * 1e3;
  tempI64 = [ Math.floor(mtime / 1e3) >>> 0, (tempDouble = Math.floor(mtime / 1e3), 
  +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  GROWABLE_HEAP_I32()[buf + 72 >> 2] = tempI64[0], GROWABLE_HEAP_I32()[buf + 76 >> 2] = tempI64[1];
  GROWABLE_HEAP_U32()[buf + 80 >> 2] = mtime % 1e3 * 1e3;
  tempI64 = [ Math.floor(ctime / 1e3) >>> 0, (tempDouble = Math.floor(ctime / 1e3), 
  +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  GROWABLE_HEAP_I32()[buf + 88 >> 2] = tempI64[0], GROWABLE_HEAP_I32()[buf + 92 >> 2] = tempI64[1];
  GROWABLE_HEAP_U32()[buf + 96 >> 2] = ctime % 1e3 * 1e3;
  tempI64 = [ stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  GROWABLE_HEAP_I32()[buf + 104 >> 2] = tempI64[0], GROWABLE_HEAP_I32()[buf + 108 >> 2] = tempI64[1];
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
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(1, 1, code);
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
 if (!implicit) {
  if (ENVIRONMENT_IS_PTHREAD) {
   exitOnMainThread(status);
   throw "unwind";
  } else {}
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
  var pthreadPoolSize = vipsConcurrency + 3 + 1;
  while (pthreadPoolSize--) {
   PThread.allocateUnusedWorker();
  }
 },
 initWorker: function() {
  noExitRuntime = false;
 },
 setExitStatus: function(status) {
  EXITSTATUS = status;
 },
 terminateAllThreads: function() {
  for (var worker of Object.values(PThread.pthreads)) {
   PThread.returnWorkerToPool(worker);
  }
  for (var worker of PThread.unusedWorkers) {
   worker.terminate();
  }
  PThread.unusedWorkers = [];
 },
 returnWorkerToPool: function(worker) {
  var pthread_ptr = worker.pthread_ptr;
  delete PThread.pthreads[pthread_ptr];
  PThread.unusedWorkers.push(worker);
  PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
  worker.pthread_ptr = 0;
  if (ENVIRONMENT_IS_NODE) {
   worker.unref();
  }
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
   if (cmd === "processProxyingQueue") {
    executeNotifiedProxyingQueue(d["queue"]);
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
    if (ENVIRONMENT_IS_NODE && !worker.pthread_ptr) {
     worker.unref();
    }
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
   worker.on("detachedExit", function() {});
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
   "urlOrBlob": Module["mainScriptUrlOrBlob"] || _scriptDir,
   "wasmMemory": wasmMemory,
   "wasmModule": wasmModule
  });
 }),
 loadWasmModuleToAllWorkers: function(onMaybeReady) {
  if (ENVIRONMENT_IS_PTHREAD) {
   return onMaybeReady();
  }
  let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
  Module["pthreadPoolReady"] = pthreadPoolReady;
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
   if (!ENVIRONMENT_IS_NODE) {
    return;
   }
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
 var stackTop = GROWABLE_HEAP_I32()[pthread_ptr + 52 >> 2];
 var stackSize = GROWABLE_HEAP_I32()[pthread_ptr + 56 >> 2];
 var stackMax = stackTop - stackSize;
 _emscripten_stack_set_limits(stackTop, stackMax);
 stackRestore(stackTop);
}

Module["establishStackSpace"] = establishStackSpace;

function exitOnMainThread(returnCode) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(2, 0, returnCode);
 try {
  _exit(returnCode);
 } catch (e) {
  handleException(e);
 }
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
  abort("invalid type for getValue: " + type);
 }
 return null;
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
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  GROWABLE_HEAP_I32()[ptr >> 2] = tempI64[0], GROWABLE_HEAP_I32()[ptr + 4 >> 2] = tempI64[1];
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
  abort("invalid type for setValue: " + type);
 }
}

function ___assert_fail(condition, filename, line, func) {
 abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
}

function ___call_sighandler(fp, sig) {
 getWasmTableEntry(fp)(sig);
}

var exceptionCaught = [];

function exception_addRef(info) {
 info.add_ref();
}

var uncaughtExceptionCount = 0;

function ___cxa_begin_catch(ptr) {
 var info = new ExceptionInfo(ptr);
 if (!info.get_caught()) {
  info.set_caught(true);
  uncaughtExceptionCount--;
 }
 info.set_rethrown(false);
 exceptionCaught.push(info);
 exception_addRef(info);
 return info.get_exception_ptr();
}

var exceptionLast = 0;

function exception_decRef(info) {
 if (info.release_ref() && !info.get_rethrown()) {
  var destructor = info.get_destructor();
  if (destructor) {
   getWasmTableEntry(destructor)(info.excPtr);
  }
  ___cxa_free_exception(info.excPtr);
 }
}

function ___cxa_end_catch() {
 _setThrew(0);
 var info = exceptionCaught.pop();
 exception_decRef(info);
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
 this.set_refcount = function(refcount) {
  GROWABLE_HEAP_I32()[this.ptr >> 2] = refcount;
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
  this.set_refcount(0);
  this.set_caught(false);
  this.set_rethrown(false);
 };
 this.add_ref = function() {
  Atomics.add(GROWABLE_HEAP_I32(), this.ptr + 0 >> 2, 1);
 };
 this.release_ref = function() {
  var prev = Atomics.sub(GROWABLE_HEAP_I32(), this.ptr + 0 >> 2, 1);
  return prev === 1;
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
 throw ptr;
}

function ___cxa_find_matching_catch_2() {
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

function ___cxa_find_matching_catch_3() {
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
 throw ptr;
}

function ___cxa_throw(ptr, type, destructor) {
 var info = new ExceptionInfo(ptr);
 info.init(type, destructor);
 exceptionLast = ptr;
 uncaughtExceptionCount++;
 throw ptr;
}

function ___cxa_uncaught_exceptions() {
 return uncaughtExceptionCount;
}

function ___emscripten_init_main_thread_js(tb) {
 __emscripten_thread_init(tb, !ENVIRONMENT_IS_WORKER, 1, !ENVIRONMENT_IS_WEB);
 PThread.threadInitTLS();
}

function ___emscripten_thread_cleanup(thread) {
 if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
  "cmd": "cleanupThread",
  "thread": thread
 });
}

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(3, 1, pthread_ptr, attr, startRoutine, arg);
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
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(4, 1, fd);
 try {
  var old = SYSCALLS.getStreamFromFD(fd);
  return FS.createStream(old, 0).fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_faccessat(dirfd, path, amode, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(5, 1, dirfd, path, amode, flags);
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
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function setErrNo(value) {
 GROWABLE_HEAP_I32()[___errno_location() >> 2] = value;
 return value;
}

function ___syscall_fcntl64(fd, cmd, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(6, 1, fd, cmd, varargs);
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
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_fstat64(fd, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(7, 1, fd, buf);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  return SYSCALLS.doStat(FS.stat, stream.path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

var MAX_INT53 = 9007199254740992;

var MIN_INT53 = -9007199254740992;

function bigintToI53Checked(num) {
 return num < MIN_INT53 || num > MAX_INT53 ? NaN : Number(num);
}

function ___syscall_ftruncate64(fd, length) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(8, 1, fd, length);
 try {
  length = bigintToI53Checked(length);
  if (isNaN(length)) return -61;
  FS.ftruncate(fd, length);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_getcwd(buf, size) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(9, 1, buf, size);
 try {
  if (size === 0) return -28;
  var cwd = FS.cwd();
  var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
  if (size < cwdLengthInBytes) return -68;
  stringToUTF8(cwd, buf, size);
  return cwdLengthInBytes;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_ioctl(fd, op, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(10, 1, fd, op, varargs);
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
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_lstat64(path, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(11, 1, path, buf);
 try {
  path = SYSCALLS.getStr(path);
  return SYSCALLS.doStat(FS.lstat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_newfstatat(dirfd, path, buf, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(12, 1, dirfd, path, buf, flags);
 try {
  path = SYSCALLS.getStr(path);
  var nofollow = flags & 256;
  var allowEmpty = flags & 4096;
  flags = flags & ~6400;
  path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
  return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_openat(dirfd, path, flags, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(13, 1, dirfd, path, flags, varargs);
 SYSCALLS.varargs = varargs;
 try {
  path = SYSCALLS.getStr(path);
  path = SYSCALLS.calculateAt(dirfd, path);
  var mode = varargs ? SYSCALLS.get() : 0;
  return FS.open(path, flags, mode).fd;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_rmdir(path) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(14, 1, path);
 try {
  path = SYSCALLS.getStr(path);
  FS.rmdir(path);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_stat64(path, buf) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(15, 1, path, buf);
 try {
  path = SYSCALLS.getStr(path);
  return SYSCALLS.doStat(FS.stat, path, buf);
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function ___syscall_unlinkat(dirfd, path, flags) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(16, 1, dirfd, path, flags);
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
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function __dlinit(main_dso_handle) {}

var dlopenMissingError = "To use dlopen, you need enable dynamic linking, see https://github.com/emscripten-core/emscripten/wiki/Linking";

function __dlopen_js(filename, flag) {
 abort(dlopenMissingError);
}

function embindRepr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}

function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}

var embind_charCodes = undefined;

function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (GROWABLE_HEAP_U8()[c]) {
  ret += embind_charCodes[GROWABLE_HEAP_U8()[c++]];
 }
 return ret;
}

var awaitingDependencies = {};

var registeredTypes = {};

var typeDependencies = {};

var char_0 = 48;

var char_9 = 57;

function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 }
 return name;
}

function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body);
}

function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, function(message) {
  this.name = errorName;
  this.message = message;
  var stack = new Error(message).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 });
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 };
 return errorClass;
}

var BindingError = undefined;

function throwBindingError(message) {
 throw new BindingError(message);
}

var InternalError = undefined;

function throwInternalError(message) {
 throw new InternalError(message);
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach(function(type) {
  typeDependencies[type] = dependentTypes;
 });
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach((dt, i) => {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push(() => {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   });
  }
 });
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}

function registerType(rawType, registeredInstance, options = {}) {
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach(cb => cb());
 }
}

function getIntegerHeap(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? GROWABLE_HEAP_I8() : GROWABLE_HEAP_U8();

 case 1:
  return signed ? GROWABLE_HEAP_I16() : GROWABLE_HEAP_U16();

 case 2:
  return signed ? GROWABLE_HEAP_I32() : GROWABLE_HEAP_U32();

 case 3:
  return signed ? HEAP64 : HEAPU64;

 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}

function integerReadValueFromPointer(name, shift, signed) {
 var heap = getIntegerHeap(name, shift, signed);
 switch (shift) {
 case 0:
  return function(pointer) {
   return heap[pointer];
  };

 case 1:
  return function(pointer) {
   return heap[pointer >> 1];
  };

 case 2:
  return function(pointer) {
   return heap[pointer >> 2];
  };

 case 3:
  return function(pointer) {
   return heap[pointer >> 3];
  };
 }
}

function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 var shift = getShiftFromSize(size);
 var isUnsignedType = name.includes("u");
 if (isUnsignedType) {
  maxRange = (1n << 64n) - 1n;
 }
 registerType(primitiveType, {
  name: name,
  "fromWireType": function(value) {
   return value;
  },
  "toWireType": function(destructors, value) {
   if (typeof value != "bigint" && typeof value != "number") {
    throw new TypeError('Cannot convert "' + embindRepr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + embindRepr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, !isUnsignedType),
  destructorFunction: null
 });
}

function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;

 case 2:
  return 1;

 case 4:
  return 2;

 case 8:
  return 3;

 default:
  throw new TypeError("Unknown type size: " + size);
 }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(wt) {
   return !!wt;
  },
  "toWireType": function(destructors, o) {
   return o ? trueValue : falseValue;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": function(pointer) {
   var heap = getIntegerHeap(name, shift, true);
   return this["fromWireType"](heap[pointer >> shift]);
  },
  destructorFunction: null
 });
}

var emval_free_list = [];

var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];

function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}

function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}

function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}

function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}

var Emval = {
 toValue: handle => {
  if (!handle) {
   throwBindingError("Cannot use deleted val. handle = " + handle);
  }
  return emval_handle_array[handle].value;
 },
 toHandle: value => {
  switch (value) {
  case undefined:
   return 1;

  case null:
   return 2;

  case true:
   return 3;

  case false:
   return 4;

  default:
   {
    var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
    emval_handle_array[handle] = {
     refcount: 1,
     value: value
    };
    return handle;
   }
  }
 }
};

function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](GROWABLE_HEAP_I32()[pointer >> 2]);
}

function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(handle) {
   var rv = Emval.toValue(handle);
   __emval_decref(handle);
   return rv;
  },
  "toWireType": function(destructors, value) {
   return Emval.toHandle(value);
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}

function getFloatHeap(name, shift) {
 switch (shift) {
 case 2:
  return GROWABLE_HEAP_F32();

 case 3:
  return GROWABLE_HEAP_F64();

 default:
  throw new TypeError("Unknown float type: " + name);
 }
}

function floatReadValueFromPointer(name, shift) {
 var heap = getFloatHeap(name, shift);
 switch (shift) {
 case 2:
  return function(pointer) {
   return this["fromWireType"](heap[pointer >> 2]);
  };

 case 3:
  return function(pointer) {
   return this["fromWireType"](heap[pointer >> 3]);
  };
 }
}

function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   return value;
  },
  "toWireType": function(destructors, value) {
   return value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = value => value;
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = value => value << bitshift >>> bitshift;
 }
 var isUnsignedType = name.includes("unsigned");
 var checkAssertions = (value, toTypeName) => {};
 var toWireType;
 if (isUnsignedType) {
  toWireType = function(destructors, value) {
   checkAssertions(value, this.name);
   return value >>> 0;
  };
 } else {
  toWireType = function(destructors, value) {
   checkAssertions(value, this.name);
   return value;
  };
 }
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": toWireType,
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = GROWABLE_HEAP_U32();
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(buffer, data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}

function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 var stdStringIsUTF8 = name === "std::string";
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = GROWABLE_HEAP_U32()[value >> 2];
   var payload = value + 4;
   var str;
   if (stdStringIsUTF8) {
    var decodeStartPtr = payload;
    for (var i = 0; i <= length; ++i) {
     var currentBytePtr = payload + i;
     if (i == length || GROWABLE_HEAP_U8()[currentBytePtr] == 0) {
      var maxRead = currentBytePtr - decodeStartPtr;
      var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
      if (str === undefined) {
       str = stringSegment;
      } else {
       str += String.fromCharCode(0);
       str += stringSegment;
      }
      decodeStartPtr = currentBytePtr + 1;
     }
    }
   } else {
    var a = new Array(length);
    for (var i = 0; i < length; ++i) {
     a[i] = String.fromCharCode(GROWABLE_HEAP_U8()[payload + i]);
    }
    str = a.join("");
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   var length;
   var valueIsOfTypeString = typeof value == "string";
   if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
    throwBindingError("Cannot pass non-string to std::string");
   }
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    length = lengthBytesUTF8(value);
   } else {
    length = value.length;
   }
   var base = _malloc(4 + length + 1);
   var ptr = base + 4;
   GROWABLE_HEAP_U32()[base >> 2] = length;
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    stringToUTF8(value, ptr, length + 1);
   } else {
    if (valueIsOfTypeString) {
     for (var i = 0; i < length; ++i) {
      var charCode = value.charCodeAt(i);
      if (charCode > 255) {
       _free(ptr);
       throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
      }
      GROWABLE_HEAP_U8()[ptr + i] = charCode;
     }
    } else {
     for (var i = 0; i < length; ++i) {
      GROWABLE_HEAP_U8()[ptr + i] = value[i];
     }
    }
   }
   if (destructors !== null) {
    destructors.push(_free, base);
   }
   return base;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function UTF16ToString(ptr, maxBytesToRead) {
 var str = "";
 for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
  var codeUnit = GROWABLE_HEAP_I16()[ptr + i * 2 >> 1];
  if (codeUnit == 0) break;
  str += String.fromCharCode(codeUnit);
 }
 return str;
}

function stringToUTF16(str, outPtr, maxBytesToWrite) {
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
}

function lengthBytesUTF16(str) {
 return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
 var i = 0;
 var str = "";
 while (!(i >= maxBytesToRead / 4)) {
  var utf32 = GROWABLE_HEAP_I32()[ptr + i * 4 >> 2];
  if (utf32 == 0) break;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
 return str;
}

function stringToUTF32(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  GROWABLE_HEAP_I32()[outPtr >> 2] = codeUnit;
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 GROWABLE_HEAP_I32()[outPtr >> 2] = 0;
 return outPtr - startPtr;
}

function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}

function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var decodeString, encodeString, lengthBytesUTF, shift;
 if (charSize === 2) {
  decodeString = UTF16ToString;
  encodeString = stringToUTF16;
  lengthBytesUTF = lengthBytesUTF16;
  shift = 1;
 } else if (charSize === 4) {
  decodeString = UTF32ToString;
  encodeString = stringToUTF32;
  lengthBytesUTF = lengthBytesUTF32;
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = GROWABLE_HEAP_U32()[value >> 2];
   var HEAP = getIntegerHeap(name, shift, false);
   var str;
   var decodeStartPtr = value + 4;
   for (var i = 0; i <= length; ++i) {
    var currentBytePtr = value + 4 + i * charSize;
    if (i == length || HEAP[currentBytePtr >> shift] == 0) {
     var maxReadBytes = currentBytePtr - decodeStartPtr;
     var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
     if (str === undefined) {
      str = stringSegment;
     } else {
      str += String.fromCharCode(0);
      str += stringSegment;
     }
     decodeStartPtr = currentBytePtr + charSize;
    }
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (!(typeof value == "string")) {
    throwBindingError("Cannot pass non-string to C++ string type " + name);
   }
   var length = lengthBytesUTF(value);
   var ptr = _malloc(4 + length + charSize);
   GROWABLE_HEAP_U32()[ptr >> 2] = length >> shift;
   encodeString(value, ptr + 4, length + charSize);
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": function() {
   return undefined;
  },
  "toWireType": function(destructors, o) {
   return undefined;
  }
 });
}

var emnapi = undefined;

var emnapiGetDynamicCalls = {
 call_vp: function(_ptr, a) {
  return getWasmTableEntry(_ptr)(a);
 },
 call_vpp: function(_ptr, a, b) {
  return getWasmTableEntry(_ptr)(a, b);
 },
 call_ppp: function(_ptr, a, b) {
  return getWasmTableEntry(_ptr)(a, b);
 },
 call_vpip: function(_ptr, a, b, c) {
  return getWasmTableEntry(_ptr)(a, b, c);
 },
 call_vppp: function(_ptr, a, b, c) {
  return getWasmTableEntry(_ptr)(a, b, c);
 },
 call_vpppp: function(_ptr, a, b, c, d) {
  return getWasmTableEntry(_ptr)(a, b, c, d);
 }
};

var errorMessagesPtr = undefined;

var napiExtendedErrorInfoPtr = undefined;

function emnapiInit() {
 var registered = false;
 var emnapiExports;
 var exportsKey;
 var env;
 function callInStack(f) {
  var stack = stackSave();
  var r;
  try {
   r = f();
  } catch (err) {
   stackRestore(stack);
   throw err;
  }
  stackRestore(stack);
  return r;
 }
 function moduleRegister() {
  if (registered) return emnapiExports;
  registered = true;
  napiExtendedErrorInfoPtr = _malloc(16);
  var lastError = {
   data: napiExtendedErrorInfoPtr,
   getErrorCode: function() {
    return GROWABLE_HEAP_I32()[napiExtendedErrorInfoPtr + 12 >> 2];
   },
   setErrorCode: function(_code) {
    GROWABLE_HEAP_I32()[napiExtendedErrorInfoPtr + 12 >> 2] = _code;
   },
   setErrorMessage: function(_ptr) {
    GROWABLE_HEAP_U32()[napiExtendedErrorInfoPtr >> 2] = _ptr;
   },
   dispose: function() {
    _free(napiExtendedErrorInfoPtr);
    napiExtendedErrorInfoPtr = 0;
   }
  };
  env = emnapi.Env.create(emnapiGetDynamicCalls, lastError);
  var scope = emnapi.openScope(env, emnapi.HandleScope);
  try {
   emnapiExports = env.callIntoModule(function(envObject) {
    var exports = {};
    var exportsHandle = scope.add(envObject, exports);
    var napiValue = _napi_register_wasm_v1(envObject.id, exportsHandle.id);
    return !napiValue ? exports : emnapi.handleStore.get(napiValue).value;
   });
  } catch (err) {
   emnapi.closeScope(env, scope);
   registered = false;
   throw err;
  }
  emnapi.closeScope(env, scope);
  return emnapiExports;
 }
 addOnInit(function(Module) {
  delete Module._napi_register_wasm_v1;
  delete Module.__emnapi_runtime_init;
  callInStack(function() {
   var key_pp = stackAlloc(4);
   var errormessages_pp = stackAlloc(4);
   __emnapi_runtime_init(key_pp, errormessages_pp);
   var key_p = GROWABLE_HEAP_U32()[key_pp >> 2];
   exportsKey = (key_p ? UTF8ToString(key_p) : "emnapiExports") || "emnapiExports";
   errorMessagesPtr = GROWABLE_HEAP_U32()[errormessages_pp >> 2] || 0;
  });
  var exports;
  try {
   exports = moduleRegister();
  } catch (err) {
   if (typeof Module.onEmnapiInitialized === "function") {
    Module.onEmnapiInitialized(err || new Error(String(err)));
    return;
   } else {
    throw err;
   }
  }
  Module[exportsKey] = exports;
  if (typeof Module.onEmnapiInitialized === "function") {
   Module.onEmnapiInitialized(null, exports);
  }
 });
}

function __emnapi_call_into_module(env, callback, data) {
 var envObject = emnapi.envStore.get(env);
 var scope = emnapi.openScope(envObject, emnapi.HandleScope);
 try {
  envObject.callIntoModule(function(_envObject) {
   emnapiGetDynamicCalls.call_vpp(callback, env, data);
  });
 } catch (err) {
  emnapi.closeScope(envObject, scope);
  throw err;
 }
 emnapi.closeScope(envObject, scope);
}

var emnapiSetImmediate = typeof setImmediate === "function" ? setImmediate : function(f) {
 var channel = new MessageChannel();
 channel.port1.onmessage = function() {
  channel.port1.onmessage = null;
  channel = undefined;
  f();
 };
 channel.port2.postMessage(null);
};

function __emnapi_set_immediate(callback, data) {
 emnapiSetImmediate(function() {
  emnapiGetDynamicCalls.call_vp(callback, data);
 });
}

function __emscripten_default_pthread_stack_size() {
 return 65536;
}

function __emscripten_err(str) {
 err(UTF8ToString(str));
}

var nowIsMonotonic = true;

function __emscripten_get_now_is_monotonic() {
 return nowIsMonotonic;
}

function executeNotifiedProxyingQueue(queue) {
 Atomics.store(GROWABLE_HEAP_I32(), queue >> 2, 1);
 if (_pthread_self()) {
  __emscripten_proxy_execute_task_queue(queue);
 }
 Atomics.compareExchange(GROWABLE_HEAP_I32(), queue >> 2, 1, 0);
}

Module["executeNotifiedProxyingQueue"] = executeNotifiedProxyingQueue;

function __emscripten_notify_task_queue(targetThreadId, currThreadId, mainThreadId, queue) {
 if (targetThreadId == currThreadId) {
  setTimeout(() => executeNotifiedProxyingQueue(queue));
 } else if (ENVIRONMENT_IS_PTHREAD) {
  postMessage({
   "targetThread": targetThreadId,
   "cmd": "processProxyingQueue",
   "queue": queue
  });
 } else {
  var worker = PThread.pthreads[targetThreadId];
  if (!worker) {
   return;
  }
  worker.postMessage({
   "cmd": "processProxyingQueue",
   "queue": queue
  });
 }
 return 1;
}

function __emscripten_set_offscreencanvas_size(target, width, height) {
 return -1;
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

function __isLeapYear(year) {
 return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

var __MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

var __MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

function __yday_from_date(date) {
 var isLeapYear = __isLeapYear(date.getFullYear());
 var monthDaysCumulative = isLeapYear ? __MONTH_DAYS_LEAP_CUMULATIVE : __MONTH_DAYS_REGULAR_CUMULATIVE;
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
 var yday = __yday_from_date(date) | 0;
 GROWABLE_HEAP_I32()[tmPtr + 28 >> 2] = yday;
 GROWABLE_HEAP_I32()[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
 var start = new Date(date.getFullYear(), 0, 1);
 var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
 var winterOffset = start.getTimezoneOffset();
 var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
 GROWABLE_HEAP_I32()[tmPtr + 32 >> 2] = dst;
}

function __mmap_js(len, prot, flags, fd, off, allocated, addr) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(17, 1, len, prot, flags, fd, off, allocated, addr);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var res = FS.mmap(stream, len, off, prot, flags);
  var ptr = res.ptr;
  GROWABLE_HEAP_I32()[allocated >> 2] = res.allocated;
  GROWABLE_HEAP_U32()[addr >> 2] = ptr;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function __munmap_js(addr, len, prot, flags, fd, offset) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(18, 1, addr, len, prot, flags, fd, offset);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  if (prot & 2) {
   SYSCALLS.doMsync(addr, stream, len, flags, offset);
  }
  FS.munmap(stream);
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return -e.errno;
 }
}

function allocateUTF8(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8Array(str, GROWABLE_HEAP_I8(), ret, size);
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
 var winterNamePtr = allocateUTF8(winterName);
 var summerNamePtr = allocateUTF8(summerName);
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

function emnapiWrap(type, env, js_object, native_object, finalize_cb, finalize_hint, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ js_object ], function() {
   var value = emnapi.handleStore.get(js_object);
   if (!(value.isObject() || value.isFunction())) {
    return envObject.setLastError(1);
   }
   if (type === 0) {
    if (value.wrapped !== 0) {
     return envObject.setLastError(1);
    }
   } else if (type === 1) {
    if (!finalize_cb) return envObject.setLastError(1);
   }
   var reference;
   if (result) {
    if (!finalize_cb) return envObject.setLastError(1);
    reference = emnapi.Reference.create(envObject, value.id, 0, false, finalize_cb, native_object, finalize_hint);
    GROWABLE_HEAP_U32()[result >> 2] = reference.id;
   } else {
    reference = emnapi.Reference.create(envObject, value.id, 0, true, finalize_cb, native_object, !finalize_cb ? finalize_cb : finalize_hint);
   }
   if (type === 0) {
    value.wrapped = reference.id;
   }
   return envObject.getReturnStatus();
  });
 });
}

function _emnapi_create_external_uint8array(env, external_data, byte_length, finalize_cb, finalize_hint, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   byte_length = byte_length >>> 0;
   if (!external_data) {
    byte_length = 0;
   }
   if (byte_length > 2147483647) {
    throw new RangeError("Cannot create a Uint8Array larger than 2147483647 bytes");
   }
   if (external_data + byte_length > GROWABLE_HEAP_U8().buffer.byteLength) {
    throw new RangeError("Memory out of range");
   }
   if (!emnapi.supportFinalizer && finalize_cb) {
    throw new emnapi.NotSupportWeakRefError("emnapi_create_external_uint8array", 'Parameter "finalize_cb" must be 0(NULL)');
   }
   var u8arr = new Uint8Array(GROWABLE_HEAP_U8().buffer, external_data, byte_length);
   var handle = emnapi.addToCurrentScope(envObject, u8arr);
   if (finalize_cb) {
    var status_1 = emnapiWrap(1, env, handle.id, external_data, finalize_cb, finalize_hint, 0);
    if (status_1 === 10) {
     var err = envObject.tryCatch.extractException();
     envObject.clearLastError();
     throw err;
    } else if (status_1 !== 0) {
     return envObject.setLastError(status_1);
    }
   }
   GROWABLE_HEAP_U32()[result >> 2] = handle.id;
   return envObject.getReturnStatus();
  });
 });
}

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
  err(text);
 }
}

function _emscripten_check_blocking_allowed() {
 if (ENVIRONMENT_IS_NODE) return;
 if (ENVIRONMENT_IS_WORKER) return;
 warnOnce("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread");
}

function _emscripten_date_now() {
 return Date.now();
}

function getHeapMax() {
 return 2147483648;
}

function _emscripten_get_heap_max() {
 return getHeapMax();
}

var _emscripten_get_now;

if (ENVIRONMENT_IS_NODE) {
 _emscripten_get_now = () => {
  var t = process["hrtime"]();
  return t[0] * 1e3 + t[1] / 1e6;
 };
} else _emscripten_get_now = () => performance.timeOrigin + performance.now();

function _emscripten_memcpy_big(dest, src, num) {
 GROWABLE_HEAP_U8().copyWithin(dest, src, src + num);
}

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

function _emscripten_proxy_to_main_thread_js(index, sync) {
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
  return _emscripten_run_in_main_runtime_thread_js(index, serializedNumCallArgs, args, sync);
 });
}

var _emscripten_receive_on_main_thread_js_callArgs = [];

function _emscripten_receive_on_main_thread_js(index, numCallArgs, args) {
 numCallArgs /= 2;
 _emscripten_receive_on_main_thread_js_callArgs.length = numCallArgs;
 var b = args >> 3;
 for (var i = 0; i < numCallArgs; i++) {
  if (HEAP64[b + 2 * i]) {
   _emscripten_receive_on_main_thread_js_callArgs[i] = HEAP64[b + 2 * i + 1];
  } else {
   _emscripten_receive_on_main_thread_js_callArgs[i] = GROWABLE_HEAP_F64()[b + 2 * i + 1];
  }
 }
 var isEmAsmConst = index < 0;
 var func = !isEmAsmConst ? proxiedFunctionTable[index] : ASM_CONSTS[-index - 1];
 return func.apply(null, _emscripten_receive_on_main_thread_js_callArgs);
}

function emscripten_realloc_buffer(size) {
 try {
  wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
  updateGlobalBufferAndViews(wasmMemory.buffer);
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
 let alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
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

function runtimeKeepalivePop() {}

var _emscripten_runtime_keepalive_pop = runtimeKeepalivePop;

function runtimeKeepalivePush() {}

var _emscripten_runtime_keepalive_push = runtimeKeepalivePush;

function _emscripten_unwind_to_js_event_loop() {
 throw "unwind";
}

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
   strings.push(x + "=" + env[x]);
  }
  getEnvStrings.strings = strings;
 }
 return getEnvStrings.strings;
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  GROWABLE_HEAP_I8()[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) GROWABLE_HEAP_I8()[buffer >> 0] = 0;
}

function _environ_get(__environ, environ_buf) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(19, 1, __environ, environ_buf);
 var bufSize = 0;
 getEnvStrings().forEach(function(string, i) {
  var ptr = environ_buf + bufSize;
  GROWABLE_HEAP_U32()[__environ + i * 4 >> 2] = ptr;
  writeAsciiToMemory(string, ptr);
  bufSize += string.length + 1;
 });
 return 0;
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(20, 1, penviron_count, penviron_buf_size);
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
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(21, 1, fd);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return e.errno;
 }
}

function _fd_fdstat_get(fd, pbuf) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(22, 1, fd, pbuf);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
  GROWABLE_HEAP_I8()[pbuf >> 0] = type;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
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
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(23, 1, fd, iov, iovcnt, pnum);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doReadv(stream, iov, iovcnt);
  GROWABLE_HEAP_U32()[pnum >> 2] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return e.errno;
 }
}

function _fd_seek(fd, offset, whence, newOffset) {
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(24, 1, fd, offset, whence, newOffset);
 try {
  offset = bigintToI53Checked(offset);
  if (isNaN(offset)) return 61;
  var stream = SYSCALLS.getStreamFromFD(fd);
  FS.llseek(stream, offset, whence);
  tempI64 = [ stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  GROWABLE_HEAP_I32()[newOffset >> 2] = tempI64[0], GROWABLE_HEAP_I32()[newOffset + 4 >> 2] = tempI64[1];
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
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
 if (ENVIRONMENT_IS_PTHREAD) return _emscripten_proxy_to_main_thread_js(25, 1, fd, iov, iovcnt, pnum);
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = doWritev(stream, iov, iovcnt);
  GROWABLE_HEAP_U32()[pnum >> 2] = num;
  return 0;
 } catch (e) {
  if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
  return e.errno;
 }
}

function _llvm_eh_typeid_for(type) {
 return type;
}

function _napi_add_finalizer(env, js_object, native_object, finalize_cb, finalize_hint, result) {
 if (!emnapi.supportFinalizer) {
  return emnapi.preamble(env, function() {
   throw new emnapi.NotSupportWeakRefError("napi_add_finalizer", "This API is unavailable");
  });
 }
 return emnapiWrap(1, env, js_object, native_object, finalize_cb, finalize_hint, result);
}

function _napi_call_function(env, recv, func, argc, argv, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ recv ], function() {
   argc = argc >>> 0;
   if (argc > 0) {
    if (!argv) return envObject.setLastError(1);
   }
   var v8recv = emnapi.handleStore.get(recv).value;
   if (!func) return envObject.setLastError(1);
   var v8func = emnapi.handleStore.get(func).value;
   if (typeof v8func !== "function") return envObject.setLastError(1);
   var args = [];
   for (var i = 0; i < argc; i++) {
    var argVal = GROWABLE_HEAP_U32()[argv + i * 4 >> 2];
    args.push(emnapi.handleStore.get(argVal).value);
   }
   var ret = v8func.apply(v8recv, args);
   if (result) {
    var v = envObject.ensureHandleId(ret);
    GROWABLE_HEAP_U32()[result >> 2] = v;
   }
   return envObject.clearLastError();
  });
 });
}

function _napi_clear_last_error(env) {
 var envObject = emnapi.envStore.get(env);
 return envObject.clearLastError();
}

function _napi_close_escapable_handle_scope(env, scope) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ scope ], function() {
   var scopeObject = emnapi.scopeStore.get(scope);
   if (envObject.openHandleScopes === 0 || scopeObject !== emnapi.getCurrentScope()) {
    return 13;
   }
   emnapi.closeScope(envObject, emnapi.scopeStore.get(scope));
   return envObject.clearLastError();
  });
 });
}

function _napi_close_handle_scope(env, scope) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ scope ], function() {
   var scopeObject = emnapi.scopeStore.get(scope);
   if (envObject.openHandleScopes === 0 || scopeObject !== emnapi.getCurrentScope()) {
    return 13;
   }
   emnapi.closeScope(envObject, emnapi.scopeStore.get(scope));
   return envObject.clearLastError();
  });
 });
}

function _napi_create_array(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var value = emnapi.addToCurrentScope(envObject, []).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_create_array_with_length(env, length, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   length = length >>> 0;
   var value = emnapi.addToCurrentScope(envObject, new Array(length)).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_create_double(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var v = emnapi.addToCurrentScope(envObject, value).id;
   GROWABLE_HEAP_U32()[result >> 2] = v;
   return envObject.clearLastError();
  });
 });
}

function emnapiSetErrorCode(envObject, error, code, code_string) {
 if (code || code_string) {
  var codeValue = void 0;
  if (code) {
   codeValue = emnapi.handleStore.get(code).value;
   if (typeof codeValue !== "string") {
    return envObject.setLastError(3);
   }
  } else {
   codeValue = UTF8ToString(code_string);
  }
  error.code = codeValue;
 }
 return 0;
}

function _napi_create_error(env, code, msg, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ msg, result ], function() {
   var msgValue = emnapi.handleStore.get(msg).value;
   if (typeof msgValue !== "string") {
    return envObject.setLastError(3);
   }
   var error = new Error(msgValue);
   var status = emnapiSetErrorCode(envObject, error, code, 0);
   if (status !== 0) return status;
   var value = emnapi.addToCurrentScope(envObject, error).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function emnapiCreateFunction(envObject, utf8name, length, cb, data) {
 var functionName = !utf8name || !length ? "" : length === -1 ? UTF8ToString(utf8name) : UTF8ToString(utf8name, length);
 var f;
 var makeFunction = function() {
  return function() {
   "use strict";
   var newTarget = this && this instanceof f ? this.constructor : undefined;
   var cbinfo = emnapi.CallbackInfo.create(envObject, this, data, arguments.length, Array.prototype.slice.call(arguments), newTarget);
   var scope = emnapi.openScope(envObject, emnapi.HandleScope);
   var r;
   try {
    r = envObject.callIntoModule(function(envObject) {
     var napiValue = emnapiGetDynamicCalls.call_ppp(cb, envObject.id, cbinfo.id);
     return !napiValue ? undefined : emnapi.handleStore.get(napiValue).value;
    });
   } catch (err) {
    cbinfo.dispose();
    emnapi.closeScope(envObject, scope);
    throw err;
   }
   cbinfo.dispose();
   emnapi.closeScope(envObject, scope);
   return r;
  };
 };
 if (functionName === "") {
  f = makeFunction();
 } else {
  if (!/^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(functionName)) {
   return {
    status: 1,
    f: undefined
   };
  }
  if (emnapi.supportNewFunction) {
   f = new Function("_", "return function " + functionName + "(){" + '"use strict";' + "return _.apply(this,arguments);" + "};")(makeFunction());
  } else {
   f = makeFunction();
   if (emnapi.canSetFunctionName) {
    Object.defineProperty(f, "name", {
     value: functionName
    });
   }
  }
 }
 return {
  status: 0,
  f: f
 };
}

function _napi_create_function(env, utf8name, length, cb, data, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result, cb ], function() {
   var fresult = emnapiCreateFunction(envObject, utf8name, length, cb, data);
   if (fresult.status !== 0) return envObject.setLastError(fresult.status);
   var f = fresult.f;
   var valueHandle = emnapi.addToCurrentScope(envObject, f);
   var value = valueHandle.id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_create_object(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var value = emnapi.addToCurrentScope(envObject, {}).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_create_reference(env, value, initial_refcount, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var handle = emnapi.handleStore.get(value);
   if (!(handle.isObject() || handle.isFunction())) {
    return envObject.setLastError(2);
   }
   var ref = emnapi.Reference.create(envObject, handle.id, initial_refcount >>> 0, false);
   GROWABLE_HEAP_U32()[result >> 2] = ref.id;
   return envObject.clearLastError();
  });
 });
}

function _napi_create_string_latin1(env, str, length, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   length = length >>> 0;
   if (!(length === 4294967295 || length <= 2147483647) || !str) {
    return envObject.setLastError(1);
   }
   var latin1String = "";
   var len = 0;
   if (length === -1) {
    while (true) {
     var ch = GROWABLE_HEAP_U8()[str];
     if (!ch) break;
     latin1String += String.fromCharCode(ch);
     str++;
    }
   } else {
    while (len < length) {
     var ch = GROWABLE_HEAP_U8()[str];
     if (!ch) break;
     latin1String += String.fromCharCode(ch);
     len++;
     str++;
    }
   }
   var value = emnapi.addToCurrentScope(envObject, latin1String).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_create_string_utf8(env, str, length, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   length = length >>> 0;
   if (!(length === 4294967295 || length <= 2147483647) || !str) {
    return envObject.setLastError(1);
   }
   var utf8String = length === -1 ? UTF8ToString(str) : UTF8ToString(str, length);
   var value = emnapi.addToCurrentScope(envObject, utf8String).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_create_type_error(env, code, msg, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ msg, result ], function() {
   var msgValue = emnapi.handleStore.get(msg).value;
   if (typeof msgValue !== "string") {
    return envObject.setLastError(3);
   }
   var error = new TypeError(msgValue);
   var status = emnapiSetErrorCode(envObject, error, code, 0);
   if (status !== 0) return status;
   var value = emnapi.addToCurrentScope(envObject, error).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
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
   value: emnapi.handleStore.get(value).value
  };
  Object.defineProperty(obj, propertyName, desc);
 }
}

function _napi_define_properties(env, object, property_count, properties) {
 return emnapi.preamble(env, function(envObject) {
  property_count = property_count >>> 0;
  if (property_count > 0) {
   if (!properties) return envObject.setLastError(1);
  }
  if (!object) return envObject.setLastError(1);
  var h = emnapi.handleStore.get(object);
  var maybeObject = h.value;
  if (!(h.isObject() || h.isFunction())) {
   return envObject.setLastError(2);
  }
  var propertyName;
  for (var i = 0; i < property_count; i++) {
   var propPtr = properties + i * (4 * 8);
   var utf8Name = GROWABLE_HEAP_U32()[propPtr >> 2];
   var name_2 = GROWABLE_HEAP_U32()[propPtr + 4 >> 2];
   var method = GROWABLE_HEAP_U32()[propPtr + 8 >> 2];
   var getter = GROWABLE_HEAP_U32()[propPtr + 12 >> 2];
   var setter = GROWABLE_HEAP_U32()[propPtr + 16 >> 2];
   var value = GROWABLE_HEAP_U32()[propPtr + 20 >> 2];
   var attributes = GROWABLE_HEAP_I32()[propPtr + 24 >> 2];
   var data = GROWABLE_HEAP_U32()[propPtr + 28 >> 2];
   if (utf8Name) {
    propertyName = UTF8ToString(utf8Name);
   } else {
    if (!name_2) {
     return envObject.setLastError(4);
    }
    propertyName = emnapi.handleStore.get(name_2).value;
    if (typeof propertyName !== "string" && typeof propertyName !== "symbol") {
     return envObject.setLastError(4);
    }
   }
   emnapiDefineProperty(envObject, maybeObject, propertyName, method, getter, setter, value, attributes, data);
  }
  return 0;
 });
}

function _napi_delete_reference(env, ref) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ ref ], function() {
   emnapi.Reference.doDelete(emnapi.refStore.get(ref));
   return envObject.clearLastError();
  });
 });
}

function _napi_escape_handle(env, scope, escapee, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ scope, escapee, result ], function() {
   var scopeObject = emnapi.scopeStore.get(scope);
   if (!scopeObject.escapeCalled()) {
    var newHandle = scopeObject.escape(escapee);
    var value = newHandle ? newHandle.id : 0;
    GROWABLE_HEAP_U32()[result >> 2] = value;
    return envObject.clearLastError();
   }
   return envObject.setLastError(12);
  });
 });
}

function _napi_fatal_error(location, location_len, message, message_len) {
 abort("FATAL ERROR: " + (location_len === -1 ? UTF8ToString(location) : UTF8ToString(location, location_len)) + " " + (message_len === -1 ? UTF8ToString(message) : UTF8ToString(message, message_len)));
}

function _napi_get_and_clear_last_exception(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
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
  });
 });
}

function _napi_get_array_length(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var handle = emnapi.handleStore.get(value);
   if (!handle.isArray()) {
    return envObject.setLastError(8);
   }
   GROWABLE_HEAP_U32()[result >> 2] = handle.value.length >>> 0;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_boolean(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var v = value === 0 ? emnapi.HandleStore.ID_FALSE : emnapi.HandleStore.ID_TRUE;
   GROWABLE_HEAP_U32()[result >> 2] = v;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_cb_info(env, cbinfo, argc, argv, this_arg, data) {
 if (!env) return 1;
 var envObject = emnapi.envStore.get(env);
 if (!cbinfo) return envObject.setLastError(1);
 var cbinfoValue = emnapi.cbInfoStore.get(cbinfo);
 if (argv) {
  if (!argc) return envObject.setLastError(1);
  var argcValue = GROWABLE_HEAP_U32()[argc >> 2];
  var arrlen = argcValue < cbinfoValue._length ? argcValue : cbinfoValue._length;
  var i = 0;
  for (;i < arrlen; i++) {
   var argVal = envObject.ensureHandleId(cbinfoValue._args[i]);
   GROWABLE_HEAP_U32()[argv + i * 4 >> 2] = argVal;
  }
  if (i < argcValue) {
   for (;i < argcValue; i++) {
    GROWABLE_HEAP_U32()[argv + i * 4 >> 2] = 1;
   }
  }
 }
 if (argc) {
  GROWABLE_HEAP_U32()[argc >> 2] = cbinfoValue._length;
 }
 if (this_arg) {
  var v = envObject.ensureHandleId(cbinfoValue._this);
  GROWABLE_HEAP_U32()[this_arg >> 2] = v;
 }
 if (data) {
  GROWABLE_HEAP_U32()[data >> 2] = cbinfoValue._data;
 }
 return envObject.clearLastError();
}

function _napi_get_element(env, object, index, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result, object ], function() {
   var h = emnapi.handleStore.get(object);
   if (h.value == null) {
    throw new TypeError("Cannot convert undefined or null to object");
   }
   var v;
   try {
    v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
   } catch (_) {
    return envObject.setLastError(2);
   }
   var value = envObject.ensureHandleId(v[index >>> 0]);
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_get_global(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var value = emnapi.HandleStore.ID_GLOBAL;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_last_error_info(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var error_code = envObject.lastError.getErrorCode();
   var messagePointer = GROWABLE_HEAP_U32()[errorMessagesPtr + error_code * 4 >> 2];
   envObject.lastError.setErrorMessage(messagePointer);
   if (error_code === 0) {
    envObject.clearLastError();
   }
   var value = envObject.lastError.data;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return 0;
  });
 });
}

function _napi_get_named_property(env, object, utf8name, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result, object ], function() {
   if (!utf8name) {
    return envObject.setLastError(1);
   }
   var h = emnapi.handleStore.get(object);
   if (h.value == null) {
    throw new TypeError("Cannot convert undefined or null to object");
   }
   var v;
   try {
    v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
   } catch (_) {
    return envObject.setLastError(2);
   }
   var value = envObject.ensureHandleId(v[UTF8ToString(utf8name)]);
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_get_null(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var value = emnapi.HandleStore.ID_NULL;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_property(env, object, key, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ key, result, object ], function() {
   var h = emnapi.handleStore.get(object);
   if (h.value == null) {
    throw new TypeError("Cannot convert undefined or null to object");
   }
   var v;
   try {
    v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
   } catch (_) {
    return envObject.setLastError(2);
   }
   var value = envObject.ensureHandleId(v[emnapi.handleStore.get(key).value]);
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.getReturnStatus();
  });
 });
}

function emnapiAddName(ret, name, key_filter, conversion_mode) {
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
}

function emnapiGetPropertyNames(obj, collection_mode, key_filter, conversion_mode) {
 var props = [];
 var names;
 var symbols;
 var i;
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
  if (collection_mode === 1) {
   break;
  }
  obj = Object.getPrototypeOf(obj);
  own = false;
 } while (obj);
 var ret = [];
 for (i = 0; i < props.length; i++) {
  var prop = props[i];
  var name_1 = prop.name;
  var desc = prop.desc;
  if (key_filter === 0) {
   emnapiAddName(ret, name_1, key_filter, conversion_mode);
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
    emnapiAddName(ret, name_1, key_filter, conversion_mode);
   }
  }
 }
 return ret;
}

function _napi_get_all_property_names(env, object, key_mode, key_filter, key_conversion, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result, object ], function() {
   var h = emnapi.handleStore.get(object);
   if (h.value == null) {
    throw new TypeError("Cannot convert undefined or null to object");
   }
   var v;
   try {
    v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
   } catch (_) {
    return envObject.setLastError(2);
   }
   if (key_mode !== 0 && key_mode !== 1) {
    return envObject.setLastError(1);
   }
   if (key_conversion !== 0 && key_conversion !== 1) {
    return envObject.setLastError(1);
   }
   var names = emnapiGetPropertyNames(v, key_mode, key_filter, key_conversion);
   var value = emnapi.addToCurrentScope(envObject, names).id;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_get_property_names(env, object, result) {
 return _napi_get_all_property_names(env, object, 0, 2 | 16, 1, result);
}

function _napi_get_reference_value(env, ref, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ ref, result ], function() {
   var reference = emnapi.refStore.get(ref);
   var handleId = reference.get();
   GROWABLE_HEAP_U32()[result >> 2] = handleId;
   return envObject.clearLastError();
  });
 });
}

var typedArrayMemoryMap = new WeakMap();

var memoryPointerDeleter = typeof FinalizationRegistry === "function" ? new FinalizationRegistry(function(pointer) {
 _free(pointer);
}) : undefined;

function getViewPointer(view) {
 if (!memoryPointerDeleter) {
  return 0;
 }
 if (view.buffer === GROWABLE_HEAP_U8().buffer) {
  return view.byteOffset;
 }
 var pointer;
 if (typedArrayMemoryMap.has(view)) {
  pointer = typedArrayMemoryMap.get(view);
  GROWABLE_HEAP_U8().set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength), pointer);
  return pointer;
 }
 pointer = _malloc(view.byteLength);
 GROWABLE_HEAP_U8().set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength), pointer);
 typedArrayMemoryMap.set(view, pointer);
 memoryPointerDeleter.register(view, pointer);
 return pointer;
}

function _napi_get_typedarray_info(env, typedarray, type, length, data, arraybuffer, byte_offset) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ typedarray ], function() {
   var handle = emnapi.handleStore.get(typedarray);
   if (!handle.isTypedArray()) {
    return envObject.setLastError(1);
   }
   var v = handle.value;
   if (type) {
    if (v instanceof Int8Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 0;
    } else if (v instanceof Uint8Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 1;
    } else if (v instanceof Uint8ClampedArray) {
     GROWABLE_HEAP_I32()[type >> 2] = 2;
    } else if (v instanceof Int16Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 3;
    } else if (v instanceof Uint16Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 4;
    } else if (v instanceof Int32Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 5;
    } else if (v instanceof Uint32Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 6;
    } else if (v instanceof Float32Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 7;
    } else if (v instanceof Float64Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 8;
    } else if (v instanceof BigInt64Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 9;
    } else if (v instanceof BigUint64Array) {
     GROWABLE_HEAP_I32()[type >> 2] = 10;
    }
   }
   if (length) {
    GROWABLE_HEAP_U32()[length >> 2] = v.length;
   }
   var buffer;
   if (data || arraybuffer) {
    buffer = v.buffer;
    if (data) {
     var p = getViewPointer(v);
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
  });
 });
}

function _napi_get_undefined(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var value = emnapi.HandleStore.ID_UNDEFINED;
   GROWABLE_HEAP_U32()[result >> 2] = value;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_value_bool(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var handle = emnapi.handleStore.get(value);
   if (typeof handle.value !== "boolean") {
    return envObject.setLastError(7);
   }
   GROWABLE_HEAP_U8()[result] = handle.value ? 1 : 0;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_value_double(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var handle = emnapi.handleStore.get(value);
   if (typeof handle.value !== "number") {
    return envObject.setLastError(6);
   }
   GROWABLE_HEAP_F64()[result >> 3] = handle.value;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_value_int32(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var handle = emnapi.handleStore.get(value);
   if (typeof handle.value !== "number") {
    return envObject.setLastError(6);
   }
   GROWABLE_HEAP_I32()[result >> 2] = handle.value;
   return envObject.clearLastError();
  });
 });
}

function _napi_get_value_int64(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var handle = emnapi.handleStore.get(value);
   if (typeof handle.value !== "number") {
    return envObject.setLastError(6);
   }
   var numberValue = handle.value;
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
    var tempI64 = [ numberValue >>> 0, (tempDouble = numberValue, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ];
    GROWABLE_HEAP_I32()[result >> 2] = tempI64[0];
    GROWABLE_HEAP_I32()[result + 4 >> 2] = tempI64[1];
   }
   return envObject.clearLastError();
  });
 });
}

function _napi_get_value_string_utf8(env, value, buf, buf_size, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value ], function() {
   buf_size = buf_size >>> 0;
   var handle = emnapi.handleStore.get(value);
   if (typeof handle.value !== "string") {
    return envObject.setLastError(3);
   }
   if (!buf) {
    if (!result) return envObject.setLastError(1);
    var strLength = lengthBytesUTF8(handle.value);
    GROWABLE_HEAP_U32()[result >> 2] = strLength;
   } else if (buf_size !== 0) {
    var copied = stringToUTF8(handle.value, buf, buf_size);
    if (result) {
     GROWABLE_HEAP_U32()[result >> 2] = copied;
    }
   } else if (result) {
    GROWABLE_HEAP_U32()[result >> 2] = 0;
   }
   return envObject.clearLastError();
  });
 });
}

function _napi_get_value_uint32(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var handle = emnapi.handleStore.get(value);
   if (typeof handle.value !== "number") {
    return envObject.setLastError(6);
   }
   GROWABLE_HEAP_U32()[result >> 2] = handle.value;
   return envObject.clearLastError();
  });
 });
}

function _napi_has_named_property(env, object, utf8name, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result, object ], function() {
   if (!utf8name) {
    return envObject.setLastError(1);
   }
   var h = emnapi.handleStore.get(object);
   if (h.value == null) {
    throw new TypeError("Cannot convert undefined or null to object");
   }
   var v;
   try {
    v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
   } catch (_) {
    return envObject.setLastError(2);
   }
   var r = UTF8ToString(utf8name) in v;
   GROWABLE_HEAP_U8()[result] = r ? 1 : 0;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_has_own_property(env, object, key, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ key, result, object ], function() {
   var h = emnapi.handleStore.get(object);
   if (h.value == null) {
    throw new TypeError("Cannot convert undefined or null to object");
   }
   var v;
   try {
    v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
   } catch (_) {
    return envObject.setLastError(2);
   }
   var prop = emnapi.handleStore.get(key).value;
   if (typeof prop !== "string" && typeof prop !== "symbol") {
    return envObject.setLastError(4);
   }
   var r = Object.prototype.hasOwnProperty.call(v, emnapi.handleStore.get(key).value);
   GROWABLE_HEAP_U8()[result] = r ? 1 : 0;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_has_property(env, object, key, result) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ key, result, object ], function() {
   var h = emnapi.handleStore.get(object);
   if (h.value == null) {
    throw new TypeError("Cannot convert undefined or null to object");
   }
   var v;
   try {
    v = h.isObject() || h.isFunction() ? h.value : Object(h.value);
   } catch (_) {
    return envObject.setLastError(2);
   }
   GROWABLE_HEAP_U8()[result] = emnapi.handleStore.get(key).value in v ? 1 : 0;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_is_exception_pending(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var r = envObject.tryCatch.hasCaught();
   GROWABLE_HEAP_U8()[result] = r ? 1 : 0;
   return envObject.clearLastError();
  });
 });
}

function _napi_open_escapable_handle_scope(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var scope = emnapi.openScope(envObject, emnapi.EscapableHandleScope);
   GROWABLE_HEAP_U32()[result >> 2] = scope.id;
   return envObject.clearLastError();
  });
 });
}

function _napi_open_handle_scope(env, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ result ], function() {
   var scope = emnapi.openScope(envObject, emnapi.HandleScope);
   GROWABLE_HEAP_U32()[result >> 2] = scope.id;
   return envObject.clearLastError();
  });
 });
}

function _napi_set_element(env, object, index, value) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, object ], function() {
   var h = emnapi.handleStore.get(object);
   if (!(h.isObject() || h.isFunction())) {
    return envObject.setLastError(2);
   }
   h.value[index >>> 0] = emnapi.handleStore.get(value).value;
   return envObject.getReturnStatus();
  });
 });
}

function _napi_set_last_error(env, error_code, engine_error_code, engine_reserved) {
 var envObject = emnapi.envStore.get(env);
 return envObject.setLastError(error_code, engine_error_code, engine_reserved);
}

function _napi_set_named_property(env, object, cname, value) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, object ], function() {
   var h = emnapi.handleStore.get(object);
   if (!(h.isObject() || h.isFunction())) {
    return envObject.setLastError(2);
   }
   if (!cname) {
    return envObject.setLastError(1);
   }
   emnapi.handleStore.get(object).value[UTF8ToString(cname)] = emnapi.handleStore.get(value).value;
   return 0;
  });
 });
}

function _napi_throw(env, error) {
 return emnapi.preamble(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ error ], function() {
   envObject.tryCatch.setError(emnapi.handleStore.get(error).value);
   return envObject.clearLastError();
  });
 });
}

function _napi_typeof(env, value, result) {
 return emnapi.checkEnv(env, function(envObject) {
  return emnapi.checkArgs(envObject, [ value, result ], function() {
   var v = emnapi.handleStore.get(value);
   if (v.isNumber()) {
    GROWABLE_HEAP_I32()[result >> 2] = 3;
   } else if (v.isBigInt()) {
    GROWABLE_HEAP_I32()[result >> 2] = 9;
   } else if (v.isString()) {
    GROWABLE_HEAP_I32()[result >> 2] = 4;
   } else if (v.isFunction()) {
    GROWABLE_HEAP_I32()[result >> 2] = 7;
   } else if (v.isExternal()) {
    GROWABLE_HEAP_I32()[result >> 2] = 8;
   } else if (v.isObject()) {
    GROWABLE_HEAP_I32()[result >> 2] = 6;
   } else if (v.isBoolean()) {
    GROWABLE_HEAP_I32()[result >> 2] = 2;
   } else if (v.isUndefined()) {
    GROWABLE_HEAP_I32()[result >> 2] = 0;
   } else if (v.isSymbol()) {
    GROWABLE_HEAP_I32()[result >> 2] = 5;
   } else if (v.isNull()) {
    GROWABLE_HEAP_I32()[result >> 2] = 1;
   } else {
    return envObject.setLastError(1);
   }
   return envObject.clearLastError();
  });
 });
}

function __arraySum(array, index) {
 var sum = 0;
 for (var i = 0; i <= index; sum += array[i++]) {}
 return sum;
}

var __MONTH_DAYS_LEAP = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var __MONTH_DAYS_REGULAR = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

function __addDays(date, days) {
 var newDate = new Date(date.getTime());
 while (days > 0) {
  var leap = __isLeapYear(newDate.getFullYear());
  var currentMonth = newDate.getMonth();
  var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
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
  var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
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
   return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
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
    if (dec31 == 4 || dec31 == 5 && __isLeapYear(date.tm_year % 400 - 1)) {
     val++;
    }
   } else if (val == 53) {
    var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
    if (jan1 != 4 && (jan1 != 3 || !__isLeapYear(date.tm_year))) val = 1;
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
  "j": "i32",
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
  if (sig[i] === "j") {
   type.parameters.push("i32");
  }
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

if (ENVIRONMENT_IS_NODE) {
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
 var VFS = Object.assign({}, FS);
 for (var _key in NODERAWFS) {
  FS[_key] = _wrapNodeError(NODERAWFS[_key]);
 }
} else {
 throw new Error("NODERAWFS is currently only supported on Node.js environment.");
}

embind_init_charCodes();

BindingError = Module["BindingError"] = extendError(Error, "BindingError");

InternalError = Module["InternalError"] = extendError(Error, "InternalError");

init_emval();

var emnapi = function(exports) {
 var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || {
   __proto__: []
  } instanceof Array && function(d, b) {
   d.__proto__ = b;
  } || function(d, b) {
   for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
  };
  return extendStatics(d, b);
 };
 function __extends(d, b) {
  if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
   this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
 }
 var Store = function() {
  function Store(capacity) {
   this._values = [ undefined ];
   this._values.length = capacity;
   this._size = 1;
   this._freeList = [];
  }
  Store.prototype.add = function(value) {
   var id;
   if (this._freeList.length) {
    id = this._freeList.shift();
   } else {
    id = this._size;
    this._size++;
    var capacity = this._values.length;
    if (id >= capacity) {
     this._values.length = Math.ceil(capacity * 1.5);
    }
   }
   value.id = id;
   this._values[id] = value;
  };
  Store.prototype.get = function(id) {
   return this._values[id];
  };
  Store.prototype.has = function(id) {
   return this._values[id] !== undefined;
  };
  Store.prototype.remove = function(id) {
   var value = this._values[id];
   if (value) {
    value.id = 0;
    this._values[id] = undefined;
    this._freeList.push(Number(id));
   }
  };
  Store.prototype.dispose = function() {
   for (var i = 1; i < this._size; ++i) {
    var value = this._values[i];
    value === null || value === void 0 ? void 0 : value.dispose();
   }
   this._values = [ undefined ];
   this._size = 1;
   this._freeList = [];
  };
  return Store;
 }();
 var EnvStore = function(_super) {
  __extends(EnvStore, _super);
  function EnvStore() {
   return _super.call(this, 4) || this;
  }
  return EnvStore;
 }(Store);
 var envStore = new EnvStore();
 var _a$1;
 var supportNewFunction = function() {
  var f;
  try {
   f = new Function();
  } catch (_) {
   return false;
  }
  return typeof f === "function";
 }();
 var _global = function() {
  if (typeof globalThis !== "undefined") return globalThis;
  var g = function() {
   return this;
  }();
  if (!g && supportNewFunction) {
   g = new Function("return this")();
  }
  if (!g) {
   if (typeof __webpack_public_path__ === "undefined") {
    if (typeof global !== "undefined") return global;
   }
   if (typeof window !== "undefined") return window;
   if (typeof self !== "undefined") return self;
  }
  return g;
 }();
 var TryCatch = function() {
  function TryCatch() {
   this._exception = undefined;
   this._caught = false;
  }
  TryCatch.prototype.hasCaught = function() {
   return this._caught;
  };
  TryCatch.prototype.exception = function() {
   return this._exception;
  };
  TryCatch.prototype.setError = function(err) {
   this._exception = err;
   this._caught = true;
  };
  TryCatch.prototype.reset = function() {
   this._exception = undefined;
   this._caught = false;
  };
  TryCatch.prototype.extractException = function() {
   var e = this._exception;
   this.reset();
   return e;
  };
  return TryCatch;
 }();
 function checkEnv(env, fn) {
  if (!env) return 1;
  var envObject = envStore.get(env);
  if (envObject === undefined) return 1;
  return fn(envObject);
 }
 function checkArgs(envObject, args, fn) {
  for (var i = 0; i < args.length; i++) {
   var arg = args[i];
   if (!arg) {
    return envObject.setLastError(1);
   }
  }
  return fn();
 }
 function preamble(env, fn) {
  return checkEnv(env, function(envObject) {
   if (envObject.tryCatch.hasCaught()) return envObject.setLastError(10);
   envObject.clearLastError();
   try {
    return fn(envObject);
   } catch (err) {
    envObject.tryCatch.setError(err);
    return envObject.setLastError(10);
   }
  });
 }
 exports.canSetFunctionName = false;
 try {
  exports.canSetFunctionName = !!((_a$1 = Object.getOwnPropertyDescriptor(Function.prototype, "name")) === null || _a$1 === void 0 ? void 0 : _a$1.configurable);
 } catch (_) {}
 var supportReflect = typeof Reflect === "object";
 var supportFinalizer = typeof FinalizationRegistry !== "undefined" && typeof WeakRef !== "undefined";
 var supportBigInt = typeof BigInt !== "undefined";
 function isReferenceType(v) {
  return typeof v === "object" && v !== null || typeof v === "function";
 }
 var EmnapiError = function(_super) {
  __extends(EmnapiError, _super);
  function EmnapiError(message) {
   var _newTarget = this.constructor;
   var _this = _super.call(this, message) || this;
   var ErrorConstructor = _newTarget;
   var proto = ErrorConstructor.prototype;
   if (!(_this instanceof EmnapiError)) {
    var setPrototypeOf = Object.setPrototypeOf;
    if (typeof setPrototypeOf === "function") {
     setPrototypeOf.call(Object, _this, proto);
    } else {
     _this.__proto__ = proto;
    }
    if (typeof Error.captureStackTrace === "function") {
     Error.captureStackTrace(_this, ErrorConstructor);
    }
   }
   return _this;
  }
  return EmnapiError;
 }(Error);
 Object.defineProperty(EmnapiError.prototype, "name", {
  configurable: true,
  writable: true,
  value: "EmnapiError"
 });
 var NotSupportWeakRefError = function(_super) {
  __extends(NotSupportWeakRefError, _super);
  function NotSupportWeakRefError(api, message) {
   return _super.call(this, "".concat(api, ': The current runtime does not support "FinalizationRegistry" and "WeakRef".').concat(message ? " ".concat(message) : "")) || this;
  }
  return NotSupportWeakRefError;
 }(EmnapiError);
 Object.defineProperty(NotSupportWeakRefError.prototype, "name", {
  configurable: true,
  writable: true,
  value: "NotSupportWeakRefError"
 });
 var NotSupportBigIntError = function(_super) {
  __extends(NotSupportBigIntError, _super);
  function NotSupportBigIntError(api, message) {
   return _super.call(this, "".concat(api, ': The current runtime does not support "BigInt".').concat(message ? " ".concat(message) : "")) || this;
  }
  return NotSupportBigIntError;
 }(EmnapiError);
 Object.defineProperty(NotSupportBigIntError.prototype, "name", {
  configurable: true,
  writable: true,
  value: "NotSupportBigIntError"
 });
 var ScopeStore = function(_super) {
  __extends(ScopeStore, _super);
  function ScopeStore() {
   return _super.call(this, 8) || this;
  }
  return ScopeStore;
 }(Store);
 var scopeStore = new ScopeStore();
 var RefStore = function(_super) {
  __extends(RefStore, _super);
  function RefStore() {
   return _super.call(this, 8) || this;
  }
  return RefStore;
 }(Store);
 var refStore = new RefStore();
 var DeferredStore = function(_super) {
  __extends(DeferredStore, _super);
  function DeferredStore() {
   return _super.call(this, 8) || this;
  }
  return DeferredStore;
 }(Store);
 var deferredStore = new DeferredStore();
 var CallbackInfoStore = function(_super) {
  __extends(CallbackInfoStore, _super);
  function CallbackInfoStore() {
   return _super.call(this, 16) || this;
  }
  return CallbackInfoStore;
 }(Store);
 var cbInfoStore = new CallbackInfoStore();
 var _a;
 var Handle = function() {
  function Handle(envObject, id, value) {
   this.wrapped = 0;
   this._envObject = envObject;
   this.id = id;
   this.value = value;
   this.inScope = null;
   this.wrapped = 0;
   this.tag = null;
   this.refs = [];
  }
  Handle.create = function(envObject, value) {
   var handle = new Handle(envObject, 0, value);
   handleStore.add(handle);
   return handle;
  };
  Handle.prototype.getEnv = function() {
   return this._envObject;
  };
  Handle.prototype.moveTo = function(other) {
   this._envObject = undefined;
   this.id = 0;
   this.value = undefined;
   this.inScope = null;
   other.wrapped = this.wrapped;
   this.wrapped = 0;
   other.tag = this.tag;
   this.tag = null;
   other.refs = this.refs;
   this.refs = [];
  };
  Handle.prototype.isEmpty = function() {
   return this.id === 0;
  };
  Handle.prototype.isNumber = function() {
   return !this.isEmpty() && typeof this.value === "number";
  };
  Handle.prototype.isBigInt = function() {
   return !this.isEmpty() && typeof this.value === "bigint";
  };
  Handle.prototype.isString = function() {
   return !this.isEmpty() && typeof this.value === "string";
  };
  Handle.prototype.isFunction = function() {
   return !this.isEmpty() && typeof this.value === "function";
  };
  Handle.prototype.isExternal = function() {
   return !this.isEmpty() && this instanceof ExternalHandle;
  };
  Handle.prototype.isObject = function() {
   return !this.isEmpty() && typeof this.value === "object" && this.value !== null;
  };
  Handle.prototype.isArray = function() {
   return !this.isEmpty() && Array.isArray(this.value);
  };
  Handle.prototype.isArrayBuffer = function() {
   return !this.isEmpty() && this.value instanceof ArrayBuffer;
  };
  Handle.prototype.isTypedArray = function() {
   return !this.isEmpty() && ArrayBuffer.isView(this.value) && !(this.value instanceof DataView);
  };
  Handle.prototype.isDataView = function() {
   return !this.isEmpty() && this.value instanceof DataView;
  };
  Handle.prototype.isDate = function() {
   return !this.isEmpty() && this.value instanceof Date;
  };
  Handle.prototype.isPromise = function() {
   return !this.isEmpty() && this.value instanceof Promise;
  };
  Handle.prototype.isBoolean = function() {
   return !this.isEmpty() && typeof this.value === "boolean";
  };
  Handle.prototype.isUndefined = function() {
   return !this.isEmpty() && this.value === undefined;
  };
  Handle.prototype.isSymbol = function() {
   return !this.isEmpty() && typeof this.value === "symbol";
  };
  Handle.prototype.isNull = function() {
   return !this.isEmpty() && this.value === null;
  };
  Handle.prototype.addRef = function(ref) {
   if (this.refs.indexOf(ref) !== -1) {
    return;
   }
   this.refs.push(ref);
  };
  Handle.prototype.removeRef = function(ref) {
   var index = this.refs.indexOf(ref);
   if (index !== -1) {
    this.refs.splice(index, 1);
   }
   this.tryDispose();
  };
  Handle.prototype.tryDispose = function() {
   if (this.id < HandleStore.getMinId || this.inScope !== null || (supportFinalizer ? this.refs.some(function(ref) {
    return ref.refCount() > 0;
   }) : this.refs.length > 0)) return;
   this.dispose();
  };
  Handle.prototype.dispose = function() {
   if (this.id === 0) return;
   var id = this.id;
   handleStore.remove(id);
   this.id = 0;
   this.value = undefined;
  };
  return Handle;
 }();
 function External() {
  Object.setPrototypeOf(this, null);
 }
 External.prototype = null;
 var ExternalHandle = function(_super) {
  __extends(ExternalHandle, _super);
  function ExternalHandle(envObject, data) {
   if (data === void 0) {
    data = 0;
   }
   var _this = _super.call(this, envObject, 0, new External()) || this;
   _this._data = data;
   return _this;
  }
  ExternalHandle.createExternal = function(envObject, data) {
   if (data === void 0) {
    data = 0;
   }
   var h = new ExternalHandle(envObject, data);
   handleStore.add(h);
   return h;
  };
  ExternalHandle.prototype.data = function() {
   return this._data;
  };
  return ExternalHandle;
 }(Handle);
 var HandleStore = function(_super) {
  __extends(HandleStore, _super);
  function HandleStore() {
   var _this = _super.call(this, 16) || this;
   _this._objWeakMap = new WeakMap();
   _super.prototype.add.call(_this, new Handle(undefined, 1, undefined));
   _super.prototype.add.call(_this, new Handle(undefined, 2, null));
   _super.prototype.add.call(_this, new Handle(undefined, 3, false));
   _super.prototype.add.call(_this, new Handle(undefined, 4, true));
   _super.prototype.add.call(_this, new Handle(undefined, 5, _global));
   return _this;
  }
  Object.defineProperty(HandleStore, "getMinId", {
   get: function() {
    return 6;
   },
   enumerable: false,
   configurable: true
  });
  HandleStore.prototype.add = function(h) {
   _super.prototype.add.call(this, h);
   var isRefType = isReferenceType(h.value);
   if (isRefType) {
    if (this._objWeakMap.has(h.value)) {
     var old = this._objWeakMap.get(h.value);
     old.moveTo(h);
    }
    this._objWeakMap.set(h.value, h);
   }
  };
  HandleStore.prototype.remove = function(id) {
   if (!this.has(id) || id < HandleStore.getMinId) return;
   _super.prototype.remove.call(this, id);
  };
  HandleStore.prototype.getObjectHandle = function(value) {
   return this._objWeakMap.get(value);
  };
  HandleStore.prototype.dispose = function() {
   this._objWeakMap = null;
   _super.prototype.dispose.call(this);
  };
  HandleStore.ID_UNDEFINED = 1;
  HandleStore.ID_NULL = 2;
  HandleStore.ID_FALSE = 3;
  HandleStore.ID_TRUE = 4;
  HandleStore.ID_GLOBAL = 5;
  HandleStore.globalConstants = (_a = {}, _a[HandleStore.ID_UNDEFINED] = undefined, 
  _a[HandleStore.ID_NULL] = null, _a[HandleStore.ID_FALSE] = false, _a[HandleStore.ID_TRUE] = true, 
  _a[HandleStore.ID_GLOBAL] = _global, _a);
  return HandleStore;
 }(Store);
 var handleStore = new HandleStore();
 var HandleScope = function() {
  function HandleScope(parentScope) {
   this._disposed = false;
   this.id = 0;
   this.parent = parentScope;
   this.child = null;
   this.handles = [];
  }
  HandleScope._create = function(parentScope) {
   var scope = new this(parentScope);
   if (parentScope) {
    parentScope.child = scope;
   }
   scopeStore.add(scope);
   return scope;
  };
  HandleScope.create = function(parentScope) {
   return HandleScope._create(parentScope);
  };
  HandleScope.prototype.add = function(envObject, value) {
   if (value instanceof Handle) {
    throw new TypeError("Can not add a handle to scope");
   }
   if (value === undefined) {
    return handleStore.get(HandleStore.ID_UNDEFINED);
   }
   if (value === null) {
    return handleStore.get(HandleStore.ID_NULL);
   }
   if (typeof value === "boolean") {
    return handleStore.get(value ? HandleStore.ID_TRUE : HandleStore.ID_FALSE);
   }
   if (value === _global) {
    return handleStore.get(HandleStore.ID_GLOBAL);
   }
   var h = Handle.create(envObject, value);
   this.handles.push(h);
   h.inScope = this;
   return h;
  };
  HandleScope.prototype.addHandle = function(handle) {
   if (this.handles.indexOf(handle) !== -1) {
    return handle;
   }
   this.handles.push(handle);
   handle.inScope = this;
   return handle;
  };
  HandleScope.prototype.clearHandles = function() {
   if (this.handles.length > 0) {
    var handles = this.handles;
    for (var i = 0; i < handles.length; i++) {
     var handle = handles[i];
     handle.inScope = null;
     handle.tryDispose();
    }
    this.handles = [];
   }
  };
  HandleScope.prototype.dispose = function() {
   if (this._disposed) return;
   this._disposed = true;
   this.clearHandles();
   this.parent = null;
   this.child = null;
   scopeStore.remove(this.id);
  };
  return HandleScope;
 }();
 var EscapableHandleScope = function(_super) {
  __extends(EscapableHandleScope, _super);
  function EscapableHandleScope(parentScope) {
   var _this = _super.call(this, parentScope) || this;
   _this._escapeCalled = false;
   return _this;
  }
  EscapableHandleScope.create = function(parentScope) {
   return EscapableHandleScope._create(parentScope);
  };
  EscapableHandleScope.prototype.escape = function(handle) {
   if (this._escapeCalled) return null;
   this._escapeCalled = true;
   var exists = false;
   var index = -1;
   var handleId;
   if (typeof handle === "number") {
    handleId = handle;
    for (var i = 0; i < this.handles.length; i++) {
     if (this.handles[i].id === handleId) {
      index = i;
      exists = true;
      break;
     }
    }
   } else {
    handleId = handle.id;
    index = this.handles.indexOf(handle);
    exists = index !== -1;
   }
   if (exists) {
    var h = handleStore.get(handleId);
    if (h && this.parent !== null) {
     var envObject = h.getEnv();
     this.handles.splice(index, 1);
     handleStore.remove(handleId);
     var newHandle = this.parent.add(envObject, h.value);
     return newHandle;
    } else {
     return null;
    }
   } else {
    return null;
   }
  };
  EscapableHandleScope.prototype.escapeCalled = function() {
   return this._escapeCalled;
  };
  return EscapableHandleScope;
 }(HandleScope);
 var rootScope = HandleScope.create(null);
 var currentScope = null;
 function getCurrentScope() {
  return currentScope;
 }
 function addToCurrentScope(envObject, value) {
  return currentScope.add(envObject, value);
 }
 function openScope(envObject, ScopeConstructor) {
  if (ScopeConstructor === void 0) {
   ScopeConstructor = HandleScope;
  }
  if (currentScope) {
   var scope = ScopeConstructor.create(currentScope);
   currentScope.child = scope;
   currentScope = scope;
  } else {
   currentScope = rootScope;
  }
  envObject.openHandleScopes++;
  return currentScope;
 }
 function closeScope(envObject, scope) {
  if (scope === currentScope) {
   currentScope = scope.parent;
  }
  if (scope.parent) {
   scope.parent.child = scope.child;
  }
  if (scope.child) {
   scope.child.parent = scope.parent;
  }
  if (scope === rootScope) {
   scope.clearHandles();
   scope.child = null;
  } else {
   scope.dispose();
  }
  envObject.openHandleScopes--;
 }
 var RefTracker = function() {
  function RefTracker() {
   this._next = null;
   this._prev = null;
  }
  RefTracker.prototype.finalize = function(_isEnvTeardown) {};
  RefTracker.prototype.link = function(list) {
   this._prev = list;
   this._next = list._next;
   if (this._next !== null) {
    this._next._prev = this;
   }
   list._next = this;
  };
  RefTracker.prototype.unlink = function() {
   if (this._prev !== null) {
    this._prev._next = this._next;
   }
   if (this._next !== null) {
    this._next._prev = this._prev;
   }
   this._prev = null;
   this._next = null;
  };
  RefTracker.finalizeAll = function(list) {
   while (list._next !== null) {
    list._next.finalize(true);
   }
  };
  return RefTracker;
 }();
 var Finalizer = function() {
  function Finalizer(envObject, _finalizeCallback, _finalizeData, _finalizeHint, refmode) {
   if (_finalizeCallback === void 0) {
    _finalizeCallback = 0;
   }
   if (_finalizeData === void 0) {
    _finalizeData = 0;
   }
   if (_finalizeHint === void 0) {
    _finalizeHint = 0;
   }
   if (refmode === void 0) {
    refmode = 0;
   }
   this.envObject = envObject;
   this._finalizeCallback = _finalizeCallback;
   this._finalizeData = _finalizeData;
   this._finalizeHint = _finalizeHint;
   this._finalizeRan = false;
   this._hasEnvReference = refmode === 1;
   if (this._hasEnvReference) {
    envObject.ref();
   }
  }
  Finalizer.prototype.dispose = function() {
   if (this._hasEnvReference) {
    this.envObject.unref();
   }
   this.envObject = undefined;
  };
  return Finalizer;
 }();
 var RefBase = function(_super) {
  __extends(RefBase, _super);
  function RefBase(envObject, initial_refcount, delete_self, finalize_callback, finalize_data, finalize_hint) {
   var _this = _super.call(this, envObject, finalize_callback, finalize_data, finalize_hint) || this;
   _this._next = null;
   _this._prev = null;
   _this._refcount = initial_refcount;
   _this._deleteSelf = delete_self;
   _this.link(!finalize_callback ? envObject.reflist : envObject.finalizing_reflist);
   return _this;
  }
  RefBase.finalizeAll = function(list) {
   RefTracker.finalizeAll(list);
  };
  RefBase.prototype.link = function(list) {
   RefTracker.prototype.link.call(this, list);
  };
  RefBase.prototype.unlink = function() {
   RefTracker.prototype.unlink.call(this);
  };
  RefBase.prototype.dispose = function() {
   this.unlink();
   _super.prototype.dispose.call(this);
  };
  RefBase.prototype.data = function() {
   return this._finalizeData;
  };
  RefBase.prototype.ref = function() {
   return ++this._refcount;
  };
  RefBase.prototype.unref = function() {
   if (this._refcount === 0) {
    return 0;
   }
   return --this._refcount;
  };
  RefBase.prototype.refCount = function() {
   return this._refcount;
  };
  RefBase.doDelete = function(reference) {
   if (reference.refCount() !== 0 || reference._deleteSelf || reference._finalizeRan || !supportFinalizer) {
    reference.dispose();
   } else {
    reference._deleteSelf = true;
   }
  };
  RefBase.prototype.finalize = function(isEnvTeardown) {
   if (isEnvTeardown === void 0) {
    isEnvTeardown = false;
   }
   if (isEnvTeardown && this.refCount() > 0) this._refcount = 0;
   var error;
   var caught = false;
   if (this._finalizeCallback) {
    var fini = Number(this._finalizeCallback);
    this._finalizeCallback = 0;
    try {
     this.envObject.callFinalizer(fini, this._finalizeData, this._finalizeHint);
    } catch (err) {
     caught = true;
     error = err;
    }
   }
   if (this._deleteSelf || isEnvTeardown) {
    RefBase.doDelete(this);
   } else {
    this._finalizeRan = true;
   }
   if (caught) {
    throw error;
   }
  };
  return RefBase;
 }(Finalizer);
 var Env = function() {
  function Env(emnapiGetDynamicCalls, lastError) {
   this.emnapiGetDynamicCalls = emnapiGetDynamicCalls;
   this.lastError = lastError;
   this.openHandleScopes = 0;
   this.instanceData = null;
   this.tryCatch = new TryCatch();
   this.refs = 1;
   this.reflist = new RefTracker();
   this.finalizing_reflist = new RefTracker();
   this.id = 0;
  }
  Env.create = function(emnapiGetDynamicCalls, lastError) {
   var env = new Env(emnapiGetDynamicCalls, lastError);
   envStore.add(env);
   return env;
  };
  Env.prototype.ref = function() {
   this.refs++;
  };
  Env.prototype.unref = function() {
   this.refs--;
   if (this.refs === 0) {
    this.dispose();
   }
  };
  Env.prototype.ensureHandle = function(value) {
   if (isReferenceType(value)) {
    var handle = handleStore.getObjectHandle(value);
    if (!handle) {
     return currentScope.add(this, value);
    }
    if (handle.value === value) {
     if (!handle.inScope) {
      currentScope.addHandle(handle);
     }
     return handle;
    }
    handle.value = value;
    Store.prototype.add.call(handleStore, handle);
    currentScope.addHandle(handle);
    return handle;
   }
   return currentScope.add(this, value);
  };
  Env.prototype.ensureHandleId = function(value) {
   return this.ensureHandle(value).id;
  };
  Env.prototype.clearLastError = function() {
   this.lastError.setErrorCode(0);
   this.lastError.setErrorMessage(0);
   return 0;
  };
  Env.prototype.setLastError = function(error_code, _engine_error_code, _engine_reserved) {
   this.lastError.setErrorCode(error_code);
   return error_code;
  };
  Env.prototype.getReturnStatus = function() {
   return !this.tryCatch.hasCaught() ? 0 : this.setLastError(10);
  };
  Env.prototype.callIntoModule = function(fn) {
   this.clearLastError();
   var r = fn(this);
   if (this.tryCatch.hasCaught()) {
    var err = this.tryCatch.extractException();
    if (this.lastError.getErrorCode() === 10) {
     this.clearLastError();
    }
    throw err;
   }
   return r;
  };
  Env.prototype.callFinalizer = function(cb, data, hint) {
   var _this = this;
   var scope = openScope(this, HandleScope);
   try {
    this.callIntoModule(function(envObject) {
     _this.emnapiGetDynamicCalls.call_vppp(cb, envObject.id, data, hint);
    });
   } catch (err) {
    closeScope(this, scope);
    throw err;
   }
   closeScope(this, scope);
  };
  Env.prototype.dispose = function() {
   RefBase.finalizeAll(this.finalizing_reflist);
   RefBase.finalizeAll(this.reflist);
   this.tryCatch.extractException();
   try {
    this.lastError.dispose();
   } catch (_) {}
   this.lastError = null;
   envStore.remove(this.id);
  };
  return Env;
 }();
 var Reference = function(_super) {
  __extends(Reference, _super);
  function Reference(envObject, handle, initialRefcount, deleteSelf, finalize_callback, finalize_data, finalize_hint) {
   if (finalize_callback === void 0) {
    finalize_callback = 0;
   }
   if (finalize_data === void 0) {
    finalize_data = 0;
   }
   if (finalize_hint === void 0) {
    finalize_hint = 0;
   }
   var _this = _super.call(this, envObject, initialRefcount >>> 0, deleteSelf, finalize_callback, finalize_data, finalize_hint) || this;
   _this.envObject = envObject;
   _this.handle = handle;
   _this.finalizerRegistered = false;
   _this.id = 0;
   return _this;
  }
  Reference.create = function(envObject, handle_id, initialRefcount, deleteSelf, finalize_callback, finalize_data, finalize_hint) {
   if (finalize_callback === void 0) {
    finalize_callback = 0;
   }
   if (finalize_data === void 0) {
    finalize_data = 0;
   }
   if (finalize_hint === void 0) {
    finalize_hint = 0;
   }
   var handle = handleStore.get(handle_id);
   var ref = new Reference(envObject, handle, initialRefcount, deleteSelf, finalize_callback, finalize_data, finalize_hint);
   refStore.add(ref);
   handle.addRef(ref);
   if (supportFinalizer && isReferenceType(handle.value)) {
    ref.objWeakRef = new WeakRef(handle.value);
   } else {
    ref.objWeakRef = null;
   }
   if (initialRefcount === 0) {
    ref._setWeak(handle.value);
   }
   return ref;
  };
  Reference.prototype.ref = function() {
   var count = _super.prototype.ref.call(this);
   if (count === 1 && this.objWeakRef) {
    var obj = this.objWeakRef.deref();
    if (obj) {
     var handle = this.envObject.ensureHandle(obj);
     handle.addRef(this);
     this._clearWeak();
     if (handle !== this.handle) {
      this.handle.removeRef(this);
      this.handle = handle;
     }
    }
   }
   return count;
  };
  Reference.prototype.unref = function() {
   var oldRefcount = this.refCount();
   var refcount = _super.prototype.unref.call(this);
   if (oldRefcount === 1 && refcount === 0) {
    if (this.objWeakRef) {
     var obj = this.objWeakRef.deref();
     if (obj) {
      this._setWeak(obj);
     }
    }
    this.handle.tryDispose();
   }
   return refcount;
  };
  Reference.prototype.get = function() {
   var _a;
   if (this.objWeakRef) {
    var obj = this.objWeakRef.deref();
    if (obj) {
     var handle = this.envObject.ensureHandle(obj);
     handle.addRef(this);
     if (handle !== this.handle) {
      this.handle.removeRef(this);
      this.handle = handle;
     }
     return handle.id;
    }
   } else {
    if ((_a = this.handle) === null || _a === void 0 ? void 0 : _a.value) {
     return this.handle.id;
    }
   }
   return 0;
  };
  Reference.prototype._setWeak = function(value) {
   if (!supportFinalizer || this.finalizerRegistered) return;
   Reference.finalizationGroup.register(value, this, this);
   this.finalizerRegistered = true;
  };
  Reference.prototype._clearWeak = function() {
   if (!supportFinalizer || !this.finalizerRegistered) return;
   try {
    this.finalizerRegistered = false;
    Reference.finalizationGroup.unregister(this);
   } catch (_) {}
  };
  Reference.prototype.finalize = function(isEnvTeardown) {
   if (isEnvTeardown === void 0) {
    isEnvTeardown = false;
   }
   if (isEnvTeardown) {
    this._clearWeak();
   }
   _super.prototype.finalize.call(this, isEnvTeardown);
  };
  Reference.prototype.dispose = function() {
   if (this.id === 0) return;
   refStore.remove(this.id);
   this.handle.removeRef(this);
   this._clearWeak();
   this.handle = undefined;
   _super.prototype.dispose.call(this);
   this.id = 0;
  };
  Reference.finalizationGroup = supportFinalizer ? new FinalizationRegistry(function(ref) {
   ref.finalize(false);
  }) : null;
  return Reference;
 }(RefBase);
 var Deferred = function() {
  function Deferred(envObject, value) {
   this.id = 0;
   this.envObject = envObject;
   this.value = value;
  }
  Deferred.create = function(envObject, value) {
   var deferred = new Deferred(envObject, value);
   deferredStore.add(deferred);
   return deferred;
  };
  Deferred.prototype.resolve = function(value) {
   this.value.resolve(value);
   this.dispose();
  };
  Deferred.prototype.reject = function(reason) {
   this.value.reject(reason);
   this.dispose();
  };
  Deferred.prototype.dispose = function() {
   deferredStore.remove(this.id);
   this.id = 0;
   this.value = null;
  };
  return Deferred;
 }();
 var CallbackInfo = function() {
  function CallbackInfo(envObject, _this, _data, _length, _args, _newTarget) {
   this.envObject = envObject;
   this._this = _this;
   this._data = _data;
   this._length = _length;
   this._args = _args;
   this._newTarget = _newTarget;
   this.id = 0;
   this._isConstructCall = Boolean(_newTarget);
  }
  CallbackInfo.create = function(envObject, _this, _data, _length, _args, _newTarget) {
   var cbInfo = new CallbackInfo(envObject, _this, _data, _length, _args, _newTarget);
   cbInfoStore.add(cbInfo);
   return cbInfo;
  };
  CallbackInfo.prototype.dispose = function() {
   cbInfoStore.remove(this.id);
   this.id = 0;
   this._this = undefined;
   this._data = 0;
   this._length = 0;
   this._args = undefined;
   this._newTarget = undefined;
   this._isConstructCall = false;
  };
  return CallbackInfo;
 }();
 Object.defineProperty(exports, "version", {
  configurable: true,
  enumerable: true,
  writable: false,
  value: "0.20.0"
 });
 exports.CallbackInfo = CallbackInfo;
 exports.CallbackInfoStore = CallbackInfoStore;
 exports.Deferred = Deferred;
 exports.DeferredStore = DeferredStore;
 exports.EmnapiError = EmnapiError;
 exports.Env = Env;
 exports.EnvStore = EnvStore;
 exports.EscapableHandleScope = EscapableHandleScope;
 exports.ExternalHandle = ExternalHandle;
 exports.Finalizer = Finalizer;
 exports.Handle = Handle;
 exports.HandleScope = HandleScope;
 exports.HandleStore = HandleStore;
 exports.NotSupportBigIntError = NotSupportBigIntError;
 exports.NotSupportWeakRefError = NotSupportWeakRefError;
 exports.RefBase = RefBase;
 exports.RefStore = RefStore;
 exports.RefTracker = RefTracker;
 exports.Reference = Reference;
 exports.ScopeStore = ScopeStore;
 exports.Store = Store;
 exports.TryCatch = TryCatch;
 exports.addToCurrentScope = addToCurrentScope;
 exports.cbInfoStore = cbInfoStore;
 exports.checkArgs = checkArgs;
 exports.checkEnv = checkEnv;
 exports.closeScope = closeScope;
 exports.deferredStore = deferredStore;
 exports.envStore = envStore;
 exports.getCurrentScope = getCurrentScope;
 exports.handleStore = handleStore;
 exports.openScope = openScope;
 exports.preamble = preamble;
 exports.refStore = refStore;
 exports.scopeStore = scopeStore;
 exports.supportBigInt = supportBigInt;
 exports.supportFinalizer = supportFinalizer;
 exports.supportNewFunction = supportNewFunction;
 exports.supportReflect = supportReflect;
 Object.defineProperty(exports, "__esModule", {
  value: true
 });
 return exports;
}({});

emnapiInit();

var proxiedFunctionTable = [ null, _proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall_dup, ___syscall_faccessat, ___syscall_fcntl64, ___syscall_fstat64, ___syscall_ftruncate64, ___syscall_getcwd, ___syscall_ioctl, ___syscall_lstat64, ___syscall_newfstatat, ___syscall_openat, ___syscall_rmdir, ___syscall_stat64, ___syscall_unlinkat, __mmap_js, __munmap_js, _environ_get, _environ_sizes_get, _fd_close, _fd_fdstat_get, _fd_read, _fd_seek, _fd_write ];

var ASSERTIONS = false;

var asmLibraryArg = {
 "__assert_fail": ___assert_fail,
 "__call_sighandler": ___call_sighandler,
 "__cxa_begin_catch": ___cxa_begin_catch,
 "__cxa_end_catch": ___cxa_end_catch,
 "__cxa_find_matching_catch_2": ___cxa_find_matching_catch_2,
 "__cxa_find_matching_catch_3": ___cxa_find_matching_catch_3,
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
 "_dlinit": __dlinit,
 "_dlopen_js": __dlopen_js,
 "_embind_register_bigint": __embind_register_bigint,
 "_embind_register_bool": __embind_register_bool,
 "_embind_register_emval": __embind_register_emval,
 "_embind_register_float": __embind_register_float,
 "_embind_register_integer": __embind_register_integer,
 "_embind_register_memory_view": __embind_register_memory_view,
 "_embind_register_std_string": __embind_register_std_string,
 "_embind_register_std_wstring": __embind_register_std_wstring,
 "_embind_register_void": __embind_register_void,
 "_emnapi_call_into_module": __emnapi_call_into_module,
 "_emnapi_set_immediate": __emnapi_set_immediate,
 "_emscripten_default_pthread_stack_size": __emscripten_default_pthread_stack_size,
 "_emscripten_err": __emscripten_err,
 "_emscripten_get_now_is_monotonic": __emscripten_get_now_is_monotonic,
 "_emscripten_notify_task_queue": __emscripten_notify_task_queue,
 "_emscripten_set_offscreencanvas_size": __emscripten_set_offscreencanvas_size,
 "_emscripten_throw_longjmp": __emscripten_throw_longjmp,
 "_gmtime_js": __gmtime_js,
 "_localtime_js": __localtime_js,
 "_mmap_js": __mmap_js,
 "_munmap_js": __munmap_js,
 "_tzset_js": __tzset_js,
 "abort": _abort,
 "emnapi_create_external_uint8array": _emnapi_create_external_uint8array,
 "emscripten_check_blocking_allowed": _emscripten_check_blocking_allowed,
 "emscripten_date_now": _emscripten_date_now,
 "emscripten_get_heap_max": _emscripten_get_heap_max,
 "emscripten_get_now": _emscripten_get_now,
 "emscripten_memcpy_big": _emscripten_memcpy_big,
 "emscripten_num_logical_cores": _emscripten_num_logical_cores,
 "emscripten_receive_on_main_thread_js": _emscripten_receive_on_main_thread_js,
 "emscripten_resize_heap": _emscripten_resize_heap,
 "emscripten_runtime_keepalive_pop": _emscripten_runtime_keepalive_pop,
 "emscripten_runtime_keepalive_push": _emscripten_runtime_keepalive_push,
 "emscripten_unwind_to_js_event_loop": _emscripten_unwind_to_js_event_loop,
 "environ_get": _environ_get,
 "environ_sizes_get": _environ_sizes_get,
 "exit": _exit,
 "fd_close": _fd_close,
 "fd_fdstat_get": _fd_fdstat_get,
 "fd_read": _fd_read,
 "fd_seek": _fd_seek,
 "fd_write": _fd_write,
 "ffi_call_helper": ffi_call_helper,
 "ffi_closure_alloc_helper": ffi_closure_alloc_helper,
 "ffi_closure_free_helper": ffi_closure_free_helper,
 "ffi_prep_closure_loc_helper": ffi_prep_closure_loc_helper,
 "invoke_di": invoke_di,
 "invoke_dii": invoke_dii,
 "invoke_diii": invoke_diii,
 "invoke_diiii": invoke_diiii,
 "invoke_fiii": invoke_fiii,
 "invoke_i": invoke_i,
 "invoke_ii": invoke_ii,
 "invoke_iidi": invoke_iidi,
 "invoke_iii": invoke_iii,
 "invoke_iiid": invoke_iiid,
 "invoke_iiii": invoke_iiii,
 "invoke_iiiii": invoke_iiiii,
 "invoke_iiiiii": invoke_iiiiii,
 "invoke_iiiiiii": invoke_iiiiiii,
 "invoke_iiiiiiii": invoke_iiiiiiii,
 "invoke_iiiiiiiiii": invoke_iiiiiiiiii,
 "invoke_iiiiiiiiiii": invoke_iiiiiiiiiii,
 "invoke_iiiiiiiiiiii": invoke_iiiiiiiiiiii,
 "invoke_iiiiiiiiiiiii": invoke_iiiiiiiiiiiii,
 "invoke_iiiiij": invoke_iiiiij,
 "invoke_jii": invoke_jii,
 "invoke_jiiii": invoke_jiiii,
 "invoke_jiji": invoke_jiji,
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
 "llvm_eh_typeid_for": _llvm_eh_typeid_for,
 "memory": wasmMemory,
 "napi_add_finalizer": _napi_add_finalizer,
 "napi_call_function": _napi_call_function,
 "napi_clear_last_error": _napi_clear_last_error,
 "napi_close_escapable_handle_scope": _napi_close_escapable_handle_scope,
 "napi_close_handle_scope": _napi_close_handle_scope,
 "napi_create_array": _napi_create_array,
 "napi_create_array_with_length": _napi_create_array_with_length,
 "napi_create_double": _napi_create_double,
 "napi_create_error": _napi_create_error,
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
 "napi_get_global": _napi_get_global,
 "napi_get_last_error_info": _napi_get_last_error_info,
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
 "strftime_l": _strftime_l,
 "unbox_small_structs": unbox_small_structs
};

var asm = createWasm();

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["__wasm_call_ctors"];

var __emnapi_runtime_init = Module["__emnapi_runtime_init"] = asm["_emnapi_runtime_init"];

var _free = Module["_free"] = asm["free"];

var _malloc = Module["_malloc"] = asm["malloc"];

var ___errno_location = Module["___errno_location"] = asm["__errno_location"];

var _emscripten_main_browser_thread_id = Module["_emscripten_main_browser_thread_id"] = asm["emscripten_main_browser_thread_id"];

var _pthread_self = Module["_pthread_self"] = asm["pthread_self"];

var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];

var ___cxa_free_exception = Module["___cxa_free_exception"] = asm["__cxa_free_exception"];

var _napi_register_wasm_v1 = Module["_napi_register_wasm_v1"] = asm["napi_register_wasm_v1"];

var _vips_shutdown = Module["_vips_shutdown"] = asm["vips_shutdown"];

var _ntohs = Module["_ntohs"] = asm["ntohs"];

var __emscripten_tls_init = Module["__emscripten_tls_init"] = asm["_emscripten_tls_init"];

var _emscripten_builtin_memalign = Module["_emscripten_builtin_memalign"] = asm["emscripten_builtin_memalign"];

var ___getTypeName = Module["___getTypeName"] = asm["__getTypeName"];

var __embind_initialize_bindings = Module["__embind_initialize_bindings"] = asm["_embind_initialize_bindings"];

var ___dl_seterr = Module["___dl_seterr"] = asm["__dl_seterr"];

var __emscripten_thread_init = Module["__emscripten_thread_init"] = asm["_emscripten_thread_init"];

var __emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = asm["_emscripten_thread_crashed"];

var _emscripten_main_thread_process_queued_calls = Module["_emscripten_main_thread_process_queued_calls"] = asm["emscripten_main_thread_process_queued_calls"];

var _htons = Module["_htons"] = asm["htons"];

var _htonl = Module["_htonl"] = asm["htonl"];

var _emscripten_run_in_main_runtime_thread_js = Module["_emscripten_run_in_main_runtime_thread_js"] = asm["emscripten_run_in_main_runtime_thread_js"];

var _emscripten_dispatch_to_thread_ = Module["_emscripten_dispatch_to_thread_"] = asm["emscripten_dispatch_to_thread_"];

var __emscripten_proxy_execute_task_queue = Module["__emscripten_proxy_execute_task_queue"] = asm["_emscripten_proxy_execute_task_queue"];

var __emscripten_thread_free_data = Module["__emscripten_thread_free_data"] = asm["_emscripten_thread_free_data"];

var __emscripten_thread_exit = Module["__emscripten_thread_exit"] = asm["_emscripten_thread_exit"];

var _setThrew = Module["_setThrew"] = asm["setThrew"];

var _saveSetjmp = Module["_saveSetjmp"] = asm["saveSetjmp"];

var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];

var _emscripten_stack_set_limits = Module["_emscripten_stack_set_limits"] = asm["emscripten_stack_set_limits"];

var stackSave = Module["stackSave"] = asm["stackSave"];

var stackRestore = Module["stackRestore"] = asm["stackRestore"];

var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];

var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["__cxa_can_catch"];

var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["__cxa_is_pointer_type"];

var ___start_em_js = Module["___start_em_js"] = 1881492;

var ___stop_em_js = Module["___stop_em_js"] = 1891920;

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

function invoke_jiji(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
  return 0n;
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

Module["keepRuntimeAlive"] = keepRuntimeAlive;

Module["wasmMemory"] = wasmMemory;

Module["ExitStatus"] = ExitStatus;

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function run(args) {
 args = args || arguments_;
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
