```sh
clang -c example.c -o example.o
wasm-ld --export=add --no-entry example.o -o example.wasm
```