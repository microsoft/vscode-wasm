# WASM WASI Core Extension

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

This VS Code library extension provides API to run [WASM](https://webassembly.org/) binaries in VS Code's extension host both in the desktop and the Web. The WASM file needs to be created with a [WASI](https://github.com/WebAssembly/WASI) compliant tool chain like the [WASI-SDK](https://github.com/WebAssembly/wasi-sdk) or [Rust](https://www.rust-lang.org/) using the `wasm32-wasi` target.

The library extension supports the following WASI specifications:

- [wasi_snapshot_preview1](https://github.com/WebAssembly/WASI/blob/snapshot-01/phases/snapshot/docs.md)
- [thread support](https://github.com/WebAssembly/wasi-threads)

Please note that WASI is work in progress. As a result, newer versions of this extension might not be backwards compatible with older WASI standards.

There is also an additional npm module `@vscode/wasm-wasi` that eases the API access to the extension.

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
const wasm: Wasm = await Wasm.load();

const pty = wasm.createPseudoterminal();
const terminal = window.createTerminal({ name: 'My Example', pty, isTransient: true });
terminal.show(true);
const module = await WebAssembly.compile(await fs.readFile(...);
const process = await wasm.createProcess('hello', module, { stdio: pty.stdio });
await process.run();
```