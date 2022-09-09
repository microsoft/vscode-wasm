### Prerequisites

Installed wasm-wasi sdk

### Documentation

https://iandouglasscott.com/2019/07/18/experimenting-with-webassembly-dynamic-linking-with-clang/
https://github.com/WebAssembly/tool-conventions/blob/main/DynamicLinking.md


### Normal OS executable (e.g. Linux)

```
clang module1.c -c -o module1.o
clang --shared module1.o -o module1.so
clang main.c module1.so -o main
```

#### WASI-SDK

```
~/bin/wasi-sdk/bin/clang module1.c -c -o module1.o
~/bin/wasi-sdk/bin/clang -nostdlib -Wl,--shared -Wl,--export-all module1.o -o module1.wasm
~/bin/wasi-sdk/bin/clang -Wl,--allow-undefined main.c out/func1.wasm -o main.wasm
```

This compiles without any errors and warning however as suspected WASM doesn't dyn-load this (e.g. will not load the `func1.wasm` via something like dlopen). We would need to load it ourself and do the binding between. The `func1.wasm` has a correct `dylink.0` format.

### With emscripten

https://emscripten.org/docs/compiling/Building-Projects.html#faux-dynamic-linking

They don't fully support dynamic linking either, but this works:

```
emcc -c func1.c -o out/func1.o
emcc -sSIDE_MODULE out/func1.o -o func1.wasm
emcc -sMAIN_MODULE main.c func1.wasm -o main.js
node main.js
```




