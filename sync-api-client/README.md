# VSCode Sync API Client

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

This npm module implements a client that allows accessing VS Code API in sync from from a worker different than the extension host worker. The actually implementation
depends on `@vscode/syc-api-common`.

## Example

Extension host worker that offers access to VS Code extension host API. The setup in the extension host code looks like this:

```ts
import { ServiceConnection } from '@vscode/sync-api-common/browser';
import { APIRequests, ApiService } from '@vscode/sync-api-service';

const worker = new Worker(...);
const connection = new ServiceConnection<APIRequests>(worker);
const apiService = new ApiService('Worker Name', connection);

// A terminal in case the worker write to one.
const terminal = window.createTerminal({ name: 'Worker name', pty: apiService.getPty() });
terminal.show();


connection.signalReady();
```

The worker side looks as follows:

```ts
import { ClientConnection } from '@vscode/sync-api-common/browser';
import { ApiClient, APIRequests } from '@vscode/sync-api-client';

const connection = new ClientConnection<APIRequests>(parentPort);
await connection.serviceReady();

const apiClient = new ApiClient(connection);
// Get the current workspace folders.
const workspaceFolders = apiClient.vscode.workspace.workspaceFolders;

// Read a file for a given uri
const content = apiClient.vscode.workspace.filesystem.readFile(uri);
```

For code executed in the desktop exchange the import `@vscode/sync-api-common/browser` with `@vscode/sync-api-common/node`.