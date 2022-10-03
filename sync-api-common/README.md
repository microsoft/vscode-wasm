# VSCode API Common

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

This npm module implements a sync communication mechanism between two web workers, include the main worker running either in Node or in a Browser. This for example allows to access async API from another worker in sync form.

The implementation depends on `SharedArrayBuffers` and `Atomics`. So you need a decent version of Node. On the browser side various headers need to be enabled. Please check [MDN](https://developer.mozilla.org/en-US/) for the corresponding details. Also note that the code works best if typed arrays are transferred (e.g. Uint8Array, ...) since they can easily be mapped into shared arrays. JSON structures might need two calls to the service (done by the library) to receive the data.

## Example

Main worker offers an API `getValue(arg: number): Promise<string>` which you want to access from another worker which solely has sync API. The setup for code running under node looks as follows:

A common file were the sync RPC requests are defined (e.g. `requests.ts`).

```ts
import { VariableResult } from '@vscode/sync-api-common';

export type Requests = {
	method: 'getValue';
	params: {
		arg: number;
	};
	result: VariableResult<{ value: string }>;
}
```

The setup in the worker looks like this:

```ts
import { ClientConnection } from '@vscode/sync-api-common/browser';
import { Requests } from './requests';

const connection = new ClientConnection<Requests>(parentPort);
await connection.serviceReady();

// Note that this is a sync call with no await needed.
const requestResult = connection.sendRequest('getValue', { arg: 10 }, new VariableResult('json'));
// An error has occurred.
if (requestResult.errno !== 0) {

}
// Get the actual data
const value = requestResult.data.value;
```

The main side looks like this:

```ts
import { ServiceConnection } from '@vscode/sync-api-common';
import { Requests } from './requests';

// The worker to access API in sync from.
const worker = new Worker('...');

const connection = new ServiceConnection<Requests>(worker);
// The request handler for getValue
connection.onRequest('getValue', async (params) => {
	const str = await getValue(params.arg);
	return { errno: 0, data: { value: str } };
});

// Signal connection ready so that the worker can call
// sync API.
connection.signalReady();
```

For code executed in the desktop exchange the import `@vscode/sync-api-common/browser` with `@vscode/sync-api-common/node`.