## WASI - Preview 2 design choices

### Overview

WASI preview 2 seems to be more chatty in terms of calling host API compared to preview 1. This means that the WebAssembly code calls more often into the JavaScript host code. This by itself is not problematic since the WASM runtimes available in browsers and NodeJS optimized these calls a lot, so that they in general don't take more time than calling from a JS function to another JS function.

However there are two scenarios where the host calls result in extra overhead due to constraints in the JavaScript runtime and VS code respectively.

- multi threading WASM applications: wasm threads need to be backed by the host and the only means JavaScript runtimes have are workers. This will be true even with the new [shared everything thread proposal](https://github.com/webAssembly/shared-everything-threads) for threads that will be implemented on the WASM layer (W3C). However WASM has one memory region shared between the threads but JavaScript workers all have their own memory context (e.g. a heap where they can allocate objects). To implement WASM threads correctly we need to share the host implementation state as well. Consider an example where a thread creates a stream and passes that stream to two other threads which read from the stream. To make that work the stream state in the host needs to be shared between the two JavaScript workers as well.
- VS Code: VS Code's extension host API is only available in the extension host worker. Since we shouldn't execute long running WASM code in the extension host worker (it would block the extension host) WASM code must always be executed in a separate worker. To access the API we need to call from the WASM worker into the extension host worker and transfer the result back into the WASM worker. In addition VS Code wants to support scenarios where two WASM processes share some state. An example is a WebShell where we can execute `cat app.py | more`. In this example the pipe state need to be shared between the cat process and the more process.

### Calling into the extension host

To call into the extension host from a WASM worker we basically need to do the following:

- install a function proxy on the WASM side
- when called serialize the arguments and if necessary copy data from the WASM memory into memory that is accessible from the extension host thread. The only possibility right now for this are SharedArrayBuffers.
- post a message into the extension host thread
- suspend the WASM thread. This will not be necessary anymore when WASM has async support.
- compute the necessary data in the extension host thread.
- store the result into the SharedArrayBuffer
- resume the WASM worker thread.

Calling from a worker thread into the extension host thread is quite costly. To retrieve a number from the extension host thread using the above mechanism takes for 1 million calls ~30 seconds (both in NodeJS and the browser). In comparison doing the same with SharedArrayBuffers in one thread takes 10ms for 1 million calls. The factor between the two implementations is 3000!

### Multi threading

Implementing shared state for multi threaded application can be done using the same mechanism. All state is managed in the extension host worker and hence shared between all WASM workers.

### Why is the problematic

WASI preview 2 is based on the WASM component model which introduces the concept of resources. Resources can be allocated outside of the current context. For example WASM code can allocate a resource in the JavaScript host and vice versa. Resources are afterwards manipulated by calling methods on these resources. Conceptually resources are objects and object oriented APIs are usually more chatty then pure functional APIs. An example for this can be seen with headers for http requests. These are resources allocated from WASM in the JavaScript host. Setting a value in the header is a method invocation (setter) on the header resource. Setting for example 5 headers results in 5 calls into JavaScript code. In a multi threaded environment we need to ensure that the header resource is sharable between all threads, since we don't know what the threads will do with the header. If we implement this with the above approach of having a single worker (e.g. the extension host thread) managing the shared state we have 5 context switches between workers. So instead of spending 0.00005ms for those calls we will spent 0.15ms.

### What can we do

#### Ignore the problem

We can ignore the problem for now and stick with the context switch implementation, which we actually use for preview 1. However preview 1 is a pure functional API (posix) and doesn't have so many host calls. And with the component model getting more and more adoption more of the resource object will be introduced. So IMO we will sooner or later run into performance problems.

#### Shared memory

One solution is to provide shared memory between all WASM workers and the extension host worker. When a WASM thread creates a resource (for example a http header) we create it in shared memory. All calls to set a header field would set it in shared memory. When an http request is issued we would do the call in the extension host thread and read the headers out of the shared memory. So sending an http request with 5 header fields would take 0.03005ms instead of 0.18ms.

However this sounds simpler than it is. Although there are SharedArrayBuffers, JavaScript can't allocate JavaScript objects in SharedArrayBuffers. So we need to have our own memory management functionality together with our own data types (e.g. lists, maps, ...). There are two possible implementations:

- we do all in JavaScript. This means we need to implement data types and memory management functionality in JavaScript. The tricky part will be the memory management.
- we use C/C++ or Rust memory management and data type libraries and compile them to WebAssembly using shared memory. When we need to access the data types in shared memory we use the WebAssembly code from the worker where we need to read the shared resources. The only thing we need to ensure is to be able to grow the shared memory since we would need to reuse the same library in all contexts. This needs to be verified via a prototype implementation.

#### State synchronization

We could only create the resource in the memory of the thread that actually calls the constructor. As long as only one thread references the resource it stays thread local. As soon as a second thread references the resource we would copy the resource into the memory of the second thread and start synchronizing the state between the two. It is hard to say how the performance of such an implementation will look like since it highly depends on the threading behavior of the application.

### Recommendation

The shared memory approach will guarantee best performance for a higher implementation cost. We should try the approach of reusing existing C/C++ or Rust code to provide the implementation.
