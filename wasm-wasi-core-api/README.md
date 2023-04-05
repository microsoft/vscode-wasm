# VS Code Sync API Service

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

This npm module implements a service that allows accessing VS Code API in sync from from a worker different than the extension host worker. The actually implementation depends on `@vscode/syc-api-common`.

## History

### 0.8.0

Replaced fix terminal implementation with a customizable character device implementation. There are two character device default implementations:


## Example

See the [@vscode/sync-api-client Readme](https://github.com/microsoft/vscode-wasm/blob/main/sync-api-client/README.md) for an example on how to use the service module.

