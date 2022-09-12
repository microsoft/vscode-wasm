### Useful setting

```js
var ENVIRONMENT = 'web,webview,worker,node';
var ASYNCIFY = 0;

// Runtime elements that are exported on Module by default. We used to export
// quite a lot here, but have removed them all. You should use
// EXPORTED_RUNTIME_METHODS for things you want to export from the runtime. Note
// that methods on this list are only exported if they are included (either
// automatically from linking, or due to being in
// DEFAULT_LIBRARY_FUNCS_TO_INCLUDE).
// Note that the name may be slightly misleading, as this is for any JS library
// element, and not just methods. For example, we can export the FS object by
// having "FS" in this list.
// [link]
var EXPORTED_RUNTIME_METHODS = [];

// A list of incoming values on the Module object in JS that we care about. If
// a value is not in this list, then we don't emit code to check if you provide
// it on the Module object. For example, if
// you have this:
//
//  var Module = {
//    print: function(x) { console.log('print: ' + x) },
//    preRun: [function() { console.log('pre run') }]
//  };
//
// Then MODULE_JS_API must contain 'print' and 'preRun'; if it does not then
// we may not emit code to read and use that value. In other words, this
// option lets you set, statically at compile time, the list of which Module
// JS values you will be providing at runtime, so the compiler can better
// optimize.
//
// Setting this list to [], or at least a short and concise set of names you
// actually use, can be very useful for reducing code size. By default the
// list contains all the possible APIs.
//
// FIXME: should this just be  0  if we want everything?
// [link]
var INCOMING_MODULE_JS_API = [
  'ENVIRONMENT', 'GL_MAX_TEXTURE_IMAGE_UNITS', 'SDL_canPlayWithWebAudio',
  'SDL_numSimultaneouslyQueuedBuffers', 'INITIAL_MEMORY', 'wasmMemory', 'arguments',
  'buffer', 'canvas', 'doNotCaptureKeyboard', 'dynamicLibraries',
  'elementPointerLock', 'extraStackTrace', 'forcedAspectRatio',
  'instantiateWasm', 'keyboardListeningElement', 'freePreloadedMediaOnUse',
  'loadSplitModule', 'locateFile', 'logReadFiles', 'mainScriptUrlOrBlob', 'mem',
  'monitorRunDependencies', 'noExitRuntime', 'noInitialRun', 'onAbort',
  'onCustomMessage', 'onExit', 'onFree', 'onFullScreen', 'onMalloc',
  'onRealloc', 'onRuntimeInitialized', 'postMainLoop', 'postRun', 'preInit',
  'preMainLoop', 'preRun',
  'preinitializedWebGLContext', 'memoryInitializerRequest', 'preloadPlugins',
  'print', 'printErr', 'quit', 'setStatus', 'statusMessage', 'stderr',
  'stdin', 'stdout', 'thisProgram', 'wasm', 'wasmBinary', 'websocket'
];

// This saves the compiled wasm module in a file with name
//   $WASM_BINARY_NAME.$V8_VERSION.cached
// and loads it on subsequent runs. This caches the compiled wasm code from
// v8 in node, which saves compiling on subsequent runs, making them start up
// much faster.
// The V8 version used in node is included in the cache name so that we don't
// try to load cached code from another version, which fails silently (it seems
// to load ok, but we do actually recompile).
//  * The only version known to work for sure is node 12.9.1, as this has
//    regressed, see
//    https://github.com/nodejs/node/issues/18265#issuecomment-622971547
//  * The default location of the .cached files is alongside the wasm binary,
//    as mentioned earlier. If that is in a read-only directory, you may need
//    to place them elsewhere. You can use the locateFile() hook to do so.
// [link]
var NODE_CODE_CACHING = 0;

// If set to 1, this is a worker library, a special kind of library that is run
// in a worker. See emscripten.h
// [link]
var BUILD_AS_WORKER = 0;

// If 1, will include shim code that tries to 'fake' a browser environment, in
// order to let you run a browser program (say, using SDL) in the shell.
// Obviously nothing is rendered, but this can be useful for benchmarking and
// debugging if actual rendering is not the issue. Note that the shim code is
// very partial - it is hard to fake a whole browser! - so keep your
// expectations low for this to work.
// [link]
var HEADLESS = 0;

// By default we emit all code in a straightforward way into the output
// .js file. That means that if you load that in a script tag in a web
// page, it will use the global scope. With `MODULARIZE` set, we instead emit
// the code wrapped in a function that returns a promise. The promise is
// resolved with the module instance when it is safe to run the compiled code,
// similar to the `onRuntimeInitialized` callback. You do not need to use the
// `onRuntimeInitialized` callback when using `MODULARIZE`.
//
// (If WASM_ASYNC_COMPILATION is off, that is, if compilation is
// *synchronous*, then it would not make sense to return a Promise, and instead
// the Module object itself is returned, which is ready to be used.)
//
// The default name of the function is `Module`, but can be changed using the
// `EXPORT_NAME` option. We recommend renaming it to a more typical name for a
// factory function, e.g. `createModule`.
//
//
// You use the factory function like so:
//
//   const module = await EXPORT_NAME();
//
// or:
//
//   let module;
//   EXPORT_NAME().then(instance => {
//     module = instance;
//   });
//
//
// The factory function accepts 1 parameter, an object with default values for
// the module instance:
//
//   const module = await EXPORT_NAME({ option: value, ... });
//
// Note the parentheses - we are calling EXPORT_NAME in order to instantiate
// the module. This allows you to create multiple instances of the module.
//
// Note that in MODULARIZE mode we do *not* look for a global `Module` object
// for default values. Default values must be passed as a parameter to the
// factory function.
//
// The default .html shell file provided in MINIMAL_RUNTIME mode will create
// a singleton instance automatically, to run the application on the page.
// (Note that it does so without using the Promise API mentioned earlier, and
// so code for the Promise is not even emitted in the .js file if you tell
// emcc to emit an .html output.)
// The default .html shell file provided by traditional runtime mode is only
// compatible with MODULARIZE=0 mode, so when building with traditional
// runtime, you should provided your own html shell file to perform the
// instantiation when building with MODULARIZE=1. (For more details, see
// https://github.com/emscripten-core/emscripten/issues/7950)
//
// If you add --pre-js or --post-js files, they will be included inside
// the factory function with the rest of the emitted code in order to be
// optimized together with it.
//
// If you want to include code outside all of the generated code, including the
// factory function, you can use --extern-pre-js or --extern-post-js. While
// --pre-js and --post-js happen to do that in non-MODULARIZE mode, their
// intended usage is to add code that is optimized with the rest of the emitted
// code, allowing better dead code elimination and minification.
// [link]
var MODULARIZE = 0;

// STANDALONE_WASM indicates that we want to emit a wasm file that can run
// without JavaScript. The file will use standard APIs such as wasi as much as
// possible to achieve that.
//
// This option does not guarantee that the wasm can be used by itself - if you
// use APIs with no non-JS alternative, we will still use those (e.g., OpenGL
// at the time of writing this). This gives you the option to see which APIs
// are missing, and if you are compiling for a custom wasi embedding, to add
// those to your embedding.
//
// We may still emit JS with this flag, but the JS should only be a convenient
// way to run the wasm on the Web or in Node.js, and you can run the wasm by
// itself without that JS (again, unless you use APIs for which there is no
// non-JS alternative) in a wasm runtime like wasmer or wasmtime.
//
// Note that even without this option we try to use wasi etc. syscalls as much
// as possible. What this option changes is that we do so even when it means
// a tradeoff with JS size. For example, when this option is set we do not
// import the Memory - importing it is useful for JS, so that JS can start to
// use it before the wasm is even loaded, but in wasi and other wasm-only
// environments the expectation is to create the memory in the wasm itself.
// Doing so prevents some possible JS optimizations, so we only do it behind
// this flag.
//
// When this flag is set we do not legalize the JS interface, since the wasm is
// meant to run in a wasm VM, which can handle i64s directly. If we legalized it
// the wasm VM would not recognize the API. However, this means that the
// optional JS emitted won't run if you use a JS API with an i64. You can use
// the WASM_BIGINT option to avoid that problem by using BigInts for i64s which
// means we don't need to legalize for JS (but this requires a new enough JS
// VM).
//
// Standlone builds require a `main` entry point by default.  If you want to
// build a library (also known as a reactor) instead you can pass `--no-entry`.
// [link]
var STANDALONE_WASM = 0;

// If true, enables support for pthreads.
// This setting is equivalent to `-pthread`, which should be preferred.
// [compile+link] - affects user code at compile and system libraries at link.
var USE_PTHREADS = 0;

// Is enabled, use the JavaScript TextDecoder API for string marshalling.
// Enabled by default, set this to 0 to disable.
// If set to 2, we assume TextDecoder is present and usable, and do not emit
// any JS code to fall back if it is missing. In single threaded -Oz build modes,
// TEXTDECODER defaults to value == 2 to save code size.
// [link]
var TEXTDECODER = 1;

// Embind specific: If enabled, assume UTF-8 encoded data in std::string binding.
// Disable this to support binary data transfer.
// [link]
var EMBIND_STD_STRING_IS_UTF8 = 1;

// If true, uses minimal sized runtime without POSIX features, Module,
// preRun/preInit/etc., Emscripten built-in XHR loading or library_browser.js.
// Enable this setting to target the smallest code size possible.  Set
// MINIMAL_RUNTIME=2 to further enable even more code size optimizations. These
// opts are quite hacky, and work around limitations in Closure and other parts
// of the build system, so they may not work in all generated programs (But can
// be useful for really small programs)
// [link]
var MINIMAL_RUNTIME = 0;

// Build binaries that use as many WASI APIs as possible, and include additional
// JS support libraries for those APIs.  This allows emscripten to produce binaries
// are more WASI compilant and also allows it to process and execute WASI
// binaries built with other SDKs (e.g.  wasi-sdk).
// This setting is experimental and subject to change or removal.
// Implies STANDALONE_WASM.
// [link]
var PURE_WASI = 0;

// Set to 1 to define the WebAssembly.Memory object outside of the wasm
// module.  By default the wasm module defines the memory and exports
// it to JavaScript.
// Use of the following settings will enable this settings since they
// depend on being able to define the memory in JavaScript:
// - USE_PTHREADS
// - RELOCATABLE
// - ASYNCIFY_LAZY_LOAD_CODE
// - WASM2JS (WASM=0)
// [link]
var IMPORTED_MEMORY = 0;
```