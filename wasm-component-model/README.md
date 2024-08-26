# WASM Component Model

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

VS Code's implementation of the [WASM component model](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Explainer.md). Besides the implementation of the [canonical ABI](https://github.com/WebAssembly/component-model/blob/main/design/mvp/CanonicalABI.md) the npm package also contains the wit2ts tool to generate TypeScript binding from a WIT file.

Example usages of the tool and the component model can be found here:

- [wasm-component-model](https://github.com/microsoft/vscode-extension-samples/tree/main/wasm-component-model): simple example using the component model to integrate a Rust function into a VS Code extension.
- [wasm-component-model-async](https://github.com/microsoft/vscode-extension-samples/tree/main/wasm-component-model-async): same as `wasm-component-model` but executed asynchronously in a worker.
- [wasm-component-model-resource](https://github.com/microsoft/vscode-extension-samples/tree/main/wasm-component-model-resource): using resources to implement a calculator that supports the reverse Polish notation, similar to those used in Hewlett-Packard hand-held calculators.

There are also two blogs post covering VS Code's component model implementation: [Using WebAssembly for Extension Development](https://code.visualstudio.com/blogs/2024/05/08/wasm) and [Using WebAssembly for Extension Development - Part Two](https://code.visualstudio.com/blogs/2024/06/07/wasm-part2)

## History

1.0.0 - official release

0.1.0-pre.* - pre-release versions.