### Extension modules in C

Python support building extension modules in C. These extension modules are usually linking into a shared library (`so`) and then loaded during runtime using `dlopen`.

A good example on how this can be done is [here](https://realpython.com/build-python-c-extension-module/).

Interesting to note is that the compilation of these `C` modules is usually done using a 'setup.py` script. For the above mentioned example that script looks like this:

```python
from distutils.core import setup, Extension

def main():
    setup(name="fputs",
          version="1.0.0",
          description="Python interface for the fputs C library function",
          author="Dirk Baeumer",
          author_email="dirk.baeumer@gmail.com",
          ext_modules=[Extension("fputs", ["fputsmodule.c"])])

if __name__ == "__main__":
    main()
```

This script takes care of all the right setup of the compiler and linker tool chain.

### C Extension modules and WASM

To support C extension modules under WASM we need to find answer to the following problems:

- how to build the code. The setup.py script can not be used in that form since running python in a WebAssembly will not give us access to the WASM compiler tool chain to use.
- how to load the code. Shared libraries and `dlopen` are not supported under WASM-WASI and only support with limitation under Emscripten.


#### Building the code

Best option is to use the `wasm-env` script from CPython's `Tools\wasm` folder to setup the same environment as CPython does when building python. We also must make sure to use the `pyconfig.h` from the WASM Python build. The other header files can be used from a normal Python Dev install, however we need to ensure that the versions match to the WASM Python build.

To ease this we should start considering bundling the include files into a separate dev tar and make it available for download together with the corresponding WASM builds.

#### WASM and Shared libraries

When it comes to shared libraries we need to distinguish two areas:

- the compiler and linker tool chain to produce shared libraries.
- WASM support to load a shared library and to do the dynamic linking.

##### Tool Chain

A proposal for the toolchain exists [here](https://github.com/WebAssembly/tool-conventions/blob/main/DynamicLinking.md). It specifies which object code needs to be emitted to build relocatable WASM libraries.

I tested the Emscripten tool chain and the latest WASI-SDK and both are able to emitted the proposed format. However both claim the following

```
wasm-ld: warning: creating shared libraries, with -shared, is not yet stable
```

##### Executing shared library code

Loading a shared library either during start of the main wasm or using `dlopen` is currently not supported in WASI-SDK / LLVM. The WASI-SDK doesn't ship a `dlfcn.h` header hence `dlopen` can't be used.

Emscripten offers support for dynamic libraries however it is limited compared to the support you usually have on an OS like Linux. Emscripten supports dynamic libraries as side modules and a main module:

- Main modules, which have system libraries linked in. A project should contain exactly one main module.
- Side modules, which do not have system libraries linked in.

The actual linking between side and main modules happens in JavaScript in Emscripten.

For Python extensions in C this would mean that the `python.wasm` would be the main module and the native extension would be a side module. Since the side module needs to get system libraries from the main module (which need to be linked in statically) we need to know upfront when compiling `python.wasm` which functions a possible side module needs. For simple side modules this might work but will very likely fail if the native Python extension (side module) is more complex.

#### A static approach to native Python extension

Since we need to curate native extensions at the beginning and need to make sure that all system library functions are available at runtime we could alternatively link them statically.

In the native example from above the native code resides in a file called `fputsmodule.c`. Here would be the steps to link a new python.wasm containing the `fputs` native module:

- compile `fputsmodule.c` to a WSAM obj file: `clang -c fputsmodule.c -o fputsmodule.o`
- now we need to create a new `python.wasm` using the following command:
  ```
  clang -z stack-size=524288 -Wl,--stack-first -Wl,--initial-memory=10485760 -lwasi-emulated-signal -lwasi-emulated-getpid -lwasi-emulated-process-clocks -o python.wasm Programs/python.o libpython3.12.a Modules/_decimal/libmpdec/libmpdec.a Modules/expat/libexpat.a fputsmodule.o -Wl,--export=PyInit_fputs
  ```

  I extracted parts of the command from the Python makefile. This produces a `python.wasm` with an exported entry `PyInit-fputs` which we could then call when the `fputs` module gets imported (e.g. `import fputs`)

However such an approach would require some modification to

1. the published package. We would need to include the libraries `libmpdec.a` and `libexpat.a`
1. the way Python loads a native module. Ideas are (not sure how feasible they are in Python):
    - we have special code in Python for `wasm-wasi` that directly reaches to that function
    - we provide a library with `dlopen` and `dlsym` with a special implementation that calls the exported WASM function via JavaScript.
    - we treat the native modules as builtin and initialize them with other builtin features.

My preferred solution would actually be our own `dlfcn.h` implementation for that special purpose.

