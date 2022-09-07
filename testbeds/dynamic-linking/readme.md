### Prerequisites

Installed wasm-wasi sdk

### Documentation

https://iandouglasscott.com/2019/07/18/experimenting-with-webassembly-dynamic-linking-with-clang/
https://github.com/WebAssembly/tool-conventions/blob/main/DynamicLinking.md


### Doing this with normal executable target

```
clang func1.c -c -o out/func1.o
clang --shared out/func1.o -o out/func1.so
clang main.c out/func1.so -o main
```

### Things I tried

```
clang -nostdlib -Wl,--export-all, -Wl,--allow-undefined -Wl,--shared -fPIC -o out/func1.wasm func1.c
# Create a shared WASM file for func1. Can be inspected with wasm-objdump which prints a correct
# Custom:
# - name: "dylink.0"
# section

clang -nostdlib -Wl,--export-all, -Wl,--allow-undefined -Wl,--shared -o out/main.wasm main.c out/func1.wasm
# Fails with
# wasm-ld: error: /tmp/main-d0c5b7.o: relocation R_WASM_MEMORY_ADDR_SLEB cannot be used against symbol .L.str; recompile with -fPIC

clang -nostdlib -Wl,--export-all, -Wl,--allow-undefined -Wl, -fPIC -o out/main.wasm main.c out/func1.wasm
# wasm-ld: error: entry symbol not defined (pass --no-entry to suppress): _start

clang -nostdlib -Wl,--export-all, -Wl,--allow-undefined -Wl, -fPIC -o out/main.wasm main.c out/func1.wasm -Wl,--no-entry
# produces a main file.
```

#### Another try with WASM

```
~/bin/wasi-sdk/bin/clang func1.c -c -o out/func1.o
~/bin/wasi-sdk/bin/clang -nostdlib -Wl,--shared -Wl,--export-all out/func1.o -o out/func1.wasm
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




