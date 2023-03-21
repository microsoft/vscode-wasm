## Compiling matplotlob under WASM-WASI

Getting matplotlob to work under WASM-WASI is currently not possible. Major reason is the missing thread support in WASM-WASI. Both the Python code of matplotlob as well as thye native code depend on threads (and a bunch of other libraries).

Here is a list of dependencies the native code has on other libs:

```
linux-vdso.so.1
libstdc++.so.6
libm.so.6
libgcc_s.so.1
libpthread.so.0
libc.so.6
/lib64/ld-linux-x86-64.so.2
libdl.so.2
libm.so.6
libdl.so.2
```

In addition matplotlib depends on various other libraries and programs for its backends (e.g. to render a plot). The list of dependencies is listed [here](https://matplotlib.org/stable/devel/dependencies.html)
