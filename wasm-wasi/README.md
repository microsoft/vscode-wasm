# WASM WASI Core API

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

This npm module implements an API facade for the WASM WASI Core VS Code extension.

## History

### 0.11.0

With release version `0.11.0` the implementation details of the WASM support for VS Code has changed. This npm module is now a facade around the `wasm-wasi-core` VS Code extension.

## Example

The source code of the example can be found [here](https://github.com/microsoft/vscode-wasi/blob/dbaeumer/expected-baboon-red/wasm-wasi/example/package.json)

First we need to define a `package.json` for the extension that wants to execute a WASM process:

```jsonc
{
	"name": "...",
	...
	// depend on the wasm-wasi-core extension
	"extensionDependencies": [
		"ms-vscode.wasm-wasi-core"
	],
	// Depend on the wasm-wasi facade npm module to get easier API access to the
	// core extension.
	"dependencies": {
		"@vscode/wasm-wasi": "..."
	},
}
```

The actual source code to execute a WASM process looks like this

```typescript
// Load the WASM API
const wasm: Wasm = await Wasm.api();

const pty = wasm.createPseudoterminal();
const terminal = window.createTerminal({ name: 'My Example', pty, isTransient: true });
terminal.show(true);
const module = await WebAssembly.compile(await fs.readFile(...);
const process = await wasm.createProcess('hello', module, { stdio: pty.stdio });
await process.run();
```