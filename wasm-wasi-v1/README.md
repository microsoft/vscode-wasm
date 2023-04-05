# VS Code WASI Implementation

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

This npm module implements the WASI specification against the VS Code extension host API. This allows a WASM to read and write files from the workspace as well as reading from and writing to the terminal using stdin and stdout.

## Example

The following example is written for the Desktop version of VS Code since it is easier to execute and test. Main reason is that  WebAssembly execution for the browser needs cross origin isolation to be enabled.

To enable this for the browser version of [VS Code](https://vscode.dev) add the query string `?vscode-coi=` to the URL.

### The C file

```c
#include <stdio.h>

int main(void)
{
    printf("Hello, World\n");
    return 0;
}
```

This file needs to be compiled to the `wasm-wasi` target. This is best done using the [WASI-SDK](https://github.com/WebAssembly/wasi-sdk). When installed use the following command to compile it

```bash
clang hello.c -o hello.wasm
```

### The WASM worker

Web assembly execution in VS Code is only supported when executing the web assembly in a separate worker. I can't be executed in the same worker as the extension code is running. A corresponding worker looks like this:

```ts
import * as fs from 'fs';
import * as path from 'path';
import { parentPort  } from 'worker_threads';

import { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, Requests } from '@vscode/sync-api-client';
import { WASI } from '@vscode/wasm-wasi/node';

if (parentPort === null) {
	process.exit();
}

// A special connection that allows the worker to talk to the
// extension host API using sync API.
const connection = new ClientConnection<Requests>(parentPort);
connection.serviceReady().then(async (params) => {
	const name = 'Run C Example';
	// A client that provides sync VS Code API
	const apiClient = new ApiClient(connection);
	const exitHandler = (rval: number): void => {
		apiClient.process.procExit(rval);
	};
	// The WASI implementation.
	const wasi = WASI.create(name, apiClient, exitHandler, {
		mapDir: []
	});
	// The file contain the web assembly code
	const wasmFile = path.join(__dirname, 'hello.wasm');
	const binary = fs.readFileSync(wasmFile);
	// Create a web assembly instance from the wasm file using the
	// provided WASI implementation.
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize(instance);
	// Run the web assembly
	(instance.exports._start as Function)();
	apiClient.process.procExit(0);
}).catch(console.error);
```

### The actual extension code

The actual extension sets up the sync version of the VS Code api and starts the worker thread executing the web assembly code.

```ts
import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, window } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/node';
import { ApiService, Requests } from '@vscode/sync-api-service';

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('vscode-wasm-wasi-c-example.run', () => {
		const name = 'Run C Example';
		// The worker to execute the web assembly
		const worker = new Worker(path.join(__dirname, './worker.js'));
		// A special connection that allows the worker to talk to the
		// extension host API using sync API.
		const connection = new ServiceConnection<Requests>(worker);
		// The actual sync implementation of parts of the VS Code API
		const apiService = new ApiService(name, connection, {
			exitHandler: (_rval) => {
				process.nextTick(() => worker.terminate());
			}
		});
		// A terminal to show the output of the web assembly execution
		const terminal = window.createTerminal({ name, pty: apiService.getPty() });
		terminal.show();

		connection.signalReady();
	});
}

export function deactivate() {
}
```

The complete example, include a `package.json` and a `tsconfig.json` file, can be found [here](https://github.com/microsoft/vscode-wasi/blob/main/wasm-wasi/example)