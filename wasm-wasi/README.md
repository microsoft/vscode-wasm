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

// Create a pseudoterminal to provide stdio to the WASM process.
const pty = wasm.createPseudoterminal();
const terminal = window.createTerminal({ name: 'Run C Example', pty, isTransient: true });
terminal.show(true);

// Load the WASM module. It is stored alongside the extension JS code.
// So we can use VS Code's file system API to load it. Makes it
// independent of whether the code runs in the desktop or the web.
try {
	const bits = await workspace.fs.readFile(Uri.joinPath(context.extensionUri, 'hello.wasm'));
	const module = await WebAssembly.compile(bits);
	// Create a WASM process.
	const process = await wasm.createProcess('hello', module, { stdio: pty.stdio });
	// Run the process and wait for its result.
	const result = await process.run();
} catch (error) {
	// Show an error message if something goes wrong.
	void window.showErrorMessage(error.message);
}
```