### Prerequisites

Installed wasm-wasi sdk

### Instructions

```sh
~/bin/wasi-sdk/bin/clang func1.c -c -o out/func1.o
~/bin/wasi-sdk/bin/clang func2.c -c -o out/func2.o
~/bin/wasi-sdk/bin/clang main.c -c -o out/main.o
~/bin/wasi-sdk/bin/clang -o main.wasm out/func1.o out/func2.o out/main.o
wasmtime main.wasm
```

Output
```
The result is 3
```

### Other nice tools

wasm2wat: converts WASM assembly into WASM Text files
wasm-decompile: converts WASM assembly in a decompile C/C++ like form
wasm-objdump: dumps linker and symbol information about wasm files.