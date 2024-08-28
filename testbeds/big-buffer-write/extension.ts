/**
 * Copied from https://github.com/lambdageek/big-buffer-write.git
 */
import { ProcessOptions, Wasm } from '@vscode/wasm-wasi';
import { commands, ExtensionContext, LogOutputChannel, Uri, window, workspace } from 'vscode';


export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();
	let out: LogOutputChannel = window.createOutputChannel('big-buffer-write', { log: true });
	let conv = new TextDecoder('utf-8');

	commands.registerCommand('big-buffer-write.run-full', async (n: number) => {
		await commands.executeCommand('workbench.output.action.switchBetweenOutputs', 'lambdageek.big-buffer-write.big-buffer-write');
		try {
			const rootFileSystem = await wasm.createRootFileSystem([
				{ kind: 'workspaceFolder' }
			]);
			const options: ProcessOptions = {
				stdio: {
					in: { 'kind': 'pipeIn' },
					out: { 'kind': 'pipeOut' },
					err: { 'kind': 'pipeOut' },
				},
				rootFileSystem,
				args: [n.toString()]
			};
			const path = Uri.joinPath(context.extensionUri, 'dist', 'program-wasi.wasm');
			const wasiWasm = await workspace.fs.readFile(path);
			const module = await WebAssembly.compile(wasiWasm);
			const process = await wasm.createProcess('program-wasi', module, options);
			process.stderr?.onData((buf) => {
				out.error(`stderr: ${conv.decode(buf)}`);
			});
			process.stdout?.onData((buf) => {
				out.info(`// stdout received ${buf.byteLength} bytes`);
				if (buf.byteLength < 1024) {
					out.trace(`stdout: ${conv.decode(buf)}`);
				}
			});
			const exitCode = await process.run();
			out.info(`process terminated with exit code ${exitCode}`);
		} catch (err: any) {
			out.error(err.message);
		}
	});
	commands.registerCommand('big-buffer-write.run', async () => {
		const items = [20, 16383, 16384, 16385, 32767];
		const qp = await window.showQuickPick(items.map((v) => { return { label: `${v.toString()} - ${v <= 16384 ? 'good' : 'bad'}`, value: v }; }), {
			title: 'buffer size',
		});
		await commands.executeCommand('big-buffer-write.run-full', qp?.value);
	});
}

export function deactivate() {
}
