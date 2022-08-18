# VSCode Sync RPC

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

This npm module implements a sync communication mechanism from a web worker to the VS Code extension host worker running either in Node or in a Browser. This for example allows to access async VS Code API from another worker in sync form.