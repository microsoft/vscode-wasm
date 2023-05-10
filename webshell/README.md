# Web Shell

[![Build Status](https://dev.azure.com/vscode/vscode-wasm/_apis/build/status/microsoft.vscode-wasm?branchName=main)](https://dev.azure.com/vscode/vscode-wasm/_build/latest?definitionId=47&branchName=main)

A web shell implementation for VS Code for the Web based on WASM technology to execute Unix commands like ls or cat.

The extension also defines its own extension points which allow other extension to contribute commands and file systems, store inside the extension location folder into the web shell.

## Extension point: webShellMountPoints

The webShellMountPoints extension point allows to mount file systems into the web shell's root directory. An example that provides a python command inside the web shell looks like this:

```json
	"contributes": {
		"webShellMountPoints": [
			{
				"mountPoint": "/usr/local/lib/python3.11",
				"path": "wasm/lib"
			}
		]
	}
```

The mount point mounts the directory `wasm/lib` included inside the extension location under `/usr/local/lib/python3.11` into the web shells file system.

It also support mounting VS Code commands into `/usr/bin` so that they can be executed inside the web shell. An example that adds a python command looks like this:

```json
	"contributes": {
		"webShellMountPoints": [
			{
				"mountPoint": "/usr/bin/python",
				"command": "testbed-python.webshell.python"
			}
		]
	}
```

Executing `python` inside the web shell will trigger the command `python-example.webshell.python`. The signature of the command handler looks like this:

```ts
import type { MountPointDescriptor, Stdio } from '@vscode/wasm-wasi';

export type CommandHandler = (command: string, args: string[], cwd: string, stdio: Stdio, mountPoints?: MountPointDescriptor[] | undefined) => Promise<number>;
```

A command handler implementation that executed the python.wasm binaries compiled for wasm32-wasi is:

```ts
commands.registerCommand('testbed-python.webshell.python', async (_command: string, args: string[], _cwd: string, stdio: Stdio, mountPoints?: MountPointDescriptor[] | undefined): Promise<number> => {
	const options: ProcessOptions = {
		stdio,
		mountPoints: (mountPoints ?? []).concat([
			{ kind: 'workspaceFolder' },
			{ kind: 'extensionLocation', extension: context, path: 'wasm/lib', mountPoint: '/usr/local/lib/python3.11' }
		]),
		env: {
			PYTHONPATH: '/workspace'
		},
		args: ['-B', '-X', 'utf8', ...args]
	};
	const filename = Uri.joinPath(context.extensionUri, 'wasm', 'bin', 'python.wasm');
	const bits = await workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);
	const process = await wasm.createProcess('python', module, options);
	const result = await process.run();
	return result;
});
```

The full example can be found [here](https://insiders.vscode.dev/github/microsoft/vscode-wasi/blob/main/testbeds/python/package.json#L1).