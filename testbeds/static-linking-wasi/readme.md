### Prerequisites

Installed wasm-wasi sdk

### Instructions

```sh
~/bin/wasi-sdk/bin/clang module1.c -c -o out/module1.o
~/bin/wasi-sdk/bin/clang main.c -c -o out/main.o
~/bin/wasi-sdk/bin/clang -o main.wasm out/module1.o out/main.o
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