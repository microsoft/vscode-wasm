import * as path from 'path';
import * as vscode from 'vscode';
import { DebugProtocol } from '@vscode/debugprotocol';
import { TextDecoder, TextEncoder } from 'util';
import { ProcessEnvOptions, ChildProcess, spawn } from 'child_process';

const StackFrameRegex = /^[>,\s]+(.+)\((\d+)\)(.*)$/;
const ScrapeOutputRegex = /(.*)\r*\n\(Pdb\)\s*$/;

class DebugTerminal implements vscode.Pseudoterminal {
	_writeEventEmitter = new vscode.EventEmitter<string>();
	public get onDidWrite(): vscode.Event<string> {
		return this._writeEventEmitter.event;
	}
	onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
	onDidClose?: vscode.Event<number | void> | undefined;
	onDidChangeName?: vscode.Event<string> | undefined;
	open(initialDimensions: vscode.TerminalDimensions | undefined): void {

	}
	close(): void {

	}
	writeOutput(output: string): void {
		this._writeEventEmitter.fire(`${output}\r\n`);
	}
}

class DebugAdapter implements vscode.DebugAdapter {
	private _pythonFile: string | undefined;
	private _textDecoder = new TextDecoder();
	private _sequence = 0;
	private static _terminal: vscode.Terminal | undefined;
	private static _debugTerminal: DebugTerminal | undefined;
	private _debuggee: ChildProcess | undefined;
	private _outputChain: Promise<string> | undefined;
	private _outputQueue: ((s: string) => void)[] = [];

	private _didSendMessageEmitter: vscode.EventEmitter<DebugProtocol.Response | DebugProtocol.Event> =
		new vscode.EventEmitter<DebugProtocol.Response | DebugProtocol.Event>();

	constructor(
		private readonly session: vscode.DebugSession,
		private readonly context: vscode.ExtensionContext
	) {
		this._pythonFile = session.configuration.program;
		DebugAdapter.createTerminalIfNecessary();
	}
	get onDidSendMessage(): vscode.Event<DebugProtocol.ProtocolMessage> {
		return this._didSendMessageEmitter.event;
	}
	handleMessage(message: DebugProtocol.ProtocolMessage): void {
		if (message.type === 'request') {
			this._handleRequest(message as DebugProtocol.Request);
		}
	}
	dispose() {
		// Should close down the worker
		// Disconnect from session
	}
	_handleRequest(message: DebugProtocol.Request) {
		switch (message.command) {
			case 'launch':
				void this._handleLaunch(message as DebugProtocol.LaunchRequest);
				break;

			case 'disconnect':
				this._handleDisconnect(message as DebugProtocol.DisconnectRequest);

			case 'initialize':
				this._handleInitialize(message as DebugProtocol.InitializeRequest);
				break;

			case 'threads':
				this._handleThreads(message as DebugProtocol.ThreadsRequest);
				break;

			case 'stackTrace':
				void this._handleStackTrace(message as DebugProtocol.StackTraceRequest);
				break;

			case 'scopes':
				this._handleScopesRequest(message as DebugProtocol.ScopesRequest);
				break;

			case 'variables':
				void this._handleVariablesRequest(message as DebugProtocol.VariablesRequest);
				break;

			default:
				console.log(`Unknown debugger command ${message.command}`);
				break;
		}
	}
	static createTerminalIfNecessary() {
		if (!DebugAdapter._terminal) {
			DebugAdapter._debugTerminal = new DebugTerminal();
			DebugAdapter._terminal = vscode.window.createTerminal({ name: 'Python PDB', isTransient: true, pty: DebugAdapter._debugTerminal });
		}
		DebugAdapter._terminal.show();
	}

	_handleStdout(data: Buffer) {
		const str = this._textDecoder.decode(data);
		const resolveFunc = this._outputQueue.shift();
		if (resolveFunc) {
			resolveFunc(str);
		} else {
			this._sendOutputEvent(str);
		}
	}

	_handleStderr(data: Buffer) {
		// Both handled the same for now.
		return this._handleStdout(data);
	}

	_sendResponse<T extends DebugProtocol.Response>(response: T) {
		this._sequence += 1;
		this._didSendMessageEmitter.fire({...response, seq: this._sequence});
	}

	_sendEvent<T extends DebugProtocol.Event>(event: T) {
		this._sequence += 1;
		this._didSendMessageEmitter.fire({...event, seq: this._sequence});
	}

	async _handleLaunch(message: DebugProtocol.LaunchRequest) {
		if (this._pythonFile && !this._debuggee) {
			// Startup pdb for the main file
			DebugAdapter.writeOutput(`python -m pdb ${this._pythonFile}`);

			// Wait for debuggee to emit first bit of output before continuing
			await this.waitForOutput(this._launchpdb.bind(this));

			// PDB should have stopped at the entry point and printed out the first line

			// Show in the debugger that we are debugging
			this._sendOutputEvent(`python ${this._pythonFile}`);

			// Send back the response
			this._sendResponse<DebugProtocol.LaunchResponse>({
				type: 'response',
				request_seq: message.seq,
				success: !this._debuggee!.killed,
				command: message.command,
				seq: 1
			});

			// Send back the stopped location. This should cause
			// VS code to ask for the stack frame
			this._sendEvent<DebugProtocol.StoppedEvent>({
				type: 'event',
				seq: 1,
				event: 'stopped',
				body: {
					reason: 'entry',
					threadId: 1,
					allThreadsStopped: true
				}
			});

		} else {
			DebugAdapter.writeOutput(`Cannot start debugging as no python file or debugger already running`);
		}
	}

	_handleDisconnect(message: DebugProtocol.DisconnectRequest) {
		if (this._debuggee) {
			this._debuggee.stdin?.write(`exit\n`);
			this._debuggee = undefined;
		}
	}

	_handleInitialize(message: DebugProtocol.InitializeRequest) {
		// Send back the initialize response
		this._sendResponse<DebugProtocol.InitializeResponse>({
			type: 'response',
			request_seq: message.seq,
			success: true,
			command: message.command,
			seq: 1,
			body: {
				supportsBreakpointLocationsRequest: true,
				supportsConditionalBreakpoints: true,
				supportsSingleThreadExecutionRequests: true
			}
		});
	}

	_handleThreads(message: DebugProtocol.ThreadsRequest) {
		// PDB doesn't handle threads, (see https://github.com/python/cpython/issues/85743)
		// Just respond with a single thread
		this._sendResponse<DebugProtocol.ThreadsResponse>({
			type: 'response',
			request_seq: message.seq,
			success: true,
			command: message.command,
			seq: 1,
			body: {
				threads: [
					{
						id: 1,
						name: 'Main Thread'
					}
				]
			}
		});
	}

	async waitForOutput(generator: () => void): Promise<string> {
		if (this._outputChain) {
			await this._outputChain;
		}
		this._outputChain = new Promise<string>((resolve, reject) => {
			this._outputQueue.push(resolve);
			generator();
		});
		return this._outputChain;
	}

	async _handleStackTrace(message: DebugProtocol.StackTraceRequest) {
		// Ask PDB for the current frame
		const frames = await this._sendtopdb('where');

		// Split frames into lines
		const lines = frames.replace(/\r/g, '').split('\n');

		// Find the line with the > on it
		const current = lines.find(l => l.startsWith('> '));
		const frameParts = current ? StackFrameRegex.exec(current): null;

		if (current && frameParts) {
			// Return the stack trace
			this._sendResponse<DebugProtocol.StackTraceResponse>({
				success: true,
				command: message.command,
				type: 'response',
				seq: 1,
				request_seq: message.seq,
				body: {
					totalFrames: 1,
					stackFrames: [
						{
							id: 1,
							source: {
								name: path.basename(frameParts[1]),
								path: frameParts[1],
								sourceReference: 0 // Don't retrieve source from pdb
							},
							name: frameParts[3],
							line: parseInt(frameParts[2]),
							column: 0
						}
					]
				}
			});
		}
	}

	_handleScopesRequest(message: DebugProtocol.ScopesRequest) {
		// For now have just a single scope all the time. PDB doesn't
		// really have a way other than asking for 'locals()' or 'globals()'
		// but then we have to figure out the difference.
		this._sendResponse<DebugProtocol.ScopesResponse>({
			success: true,
			command: message.command,
			type: 'response',
			seq: 1,
			request_seq: message.seq,
			body: {
				scopes: [
					{
						name: 'Global',
						variablesReference: 1,
						expensive: false
					}
				]
			}
		});
	}

	async _handleVariablesRequest(message: DebugProtocol.VariablesRequest) {
		// Use the dir() python command to get back the list of current variables
		const dir = await this._sendtopdb('dir()');
		const scrappedDir = ScrapeOutputRegex.exec(dir);

		// Go backwards through this list until we get something that starts without
		// a double underscore
		const entries = scrappedDir ?
			scrappedDir[1].slice(1, scrappedDir[1].length-1)
			              .split(',')
						  .map(s => s.trim())
						  .map(s => s.slice(1, s.length-1))
						  .filter(e => !e.startsWith('__') || e === '__file__') : [];

		// For each entry we need to make a request to pdb to get its value. This might take a while
		// TODO: Handle limits here
		const variables = await Promise.all(entries.map(async (e) => {
			const value = await this._sendtopdb(`p ${e}`);
			const result: DebugProtocol.Variable = {
				name: e,
				value,
				variablesReference: 0
			};
			return result;
		}));

		this._sendResponse<DebugProtocol.VariablesResponse>({
			success: true,
			command: message.command,
			type: 'response',
			seq: 1,
			request_seq: message.seq,
			body: {
				variables
			}
		});
	}

	_launchpdb() {
		this._debuggee = spawn(`python` , ['-m' ,'pdb', this._pythonFile!], { cwd: path.dirname(this._pythonFile!)});
		this._debuggee!.stdout?.on('data', this._handleStdout.bind(this));
		this._debuggee!.stderr?.on('data', this._handleStderr.bind(this));
		this._debuggee!.on('exit', (code) => {
			DebugAdapter.writeOutput(`process exited with ${code}`);
			this._sendEvent({event: 'stopped', seq: 1, type: 'event', body: { description: 'Process exited'}});
		});

	}

	_sendtopdb(command: string): Promise<string> {
		// Chain requests together
		return this.waitForOutput(() => {
			// Write command to stdin
			const result = this._debuggee?.stdin?.write(`${command}\n`);
			if (!result) {
				// Need to wait for drain
				this._debuggee?.stdin?.once('drain', () => {
					this._debuggee?.stdin?.write(`${command}\n`);
				});
			}
		});
	}

	_sendOutputEvent(data: string) {
		this._sendEvent<DebugProtocol.OutputEvent>({
			type: 'event',
			seq: 1,
			event: 'output',
			body: {
				output: data
			}
		});
	}

	static writeOutput(output: string) {
		DebugAdapter.createTerminalIfNecessary();
		DebugAdapter._debugTerminal?.writeOutput(output);
	}
}

export class DebugAdapterDescriptorFactory
implements vscode.DebugAdapterDescriptorFactory
{
	constructor(private readonly context: vscode.ExtensionContext) {}
	async createDebugAdapterDescriptor(
		session: vscode.DebugSession
	): Promise<vscode.DebugAdapterDescriptor> {
		return new vscode.DebugAdapterInlineImplementation(
			new DebugAdapter(session, this.context)
		);
	}
}

export class DebugConfigurationProvider implements DebugConfigurationProvider {
	/**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
	async resolveDebugConfiguration(
		folder: vscode.WorkspaceFolder | undefined,
		config: vscode.DebugConfiguration,
		token?: vscode.CancellationToken
	): Promise<vscode.DebugConfiguration | undefined> {
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'python') {
				config.type = 'python-pdb';
				config.name = 'Launch';
				config.request = 'launch';
				config.program = '${file}';
				config.stopOnEntry = true;
			}
		}

		if (!config.program) {
			await vscode.window.showInformationMessage(
				'Cannot find a Python file to debug'
			);
			return undefined;
		}

		return config;
	}
}

export async function debugFile(file: string) {
	return vscode.debug.startDebugging(undefined, {
		type: 'python-pdb',
		program: file,
		name: 'Debug python using pdb',
		stopOnEntry: true,
		request: 'launch',
		console: 'integratedTerminal',
	});
}
