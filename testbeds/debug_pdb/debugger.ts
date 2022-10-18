import * as path from 'path';
import * as vscode from 'vscode';
import { DebugProtocol } from '@vscode/debugprotocol';
import { TextDecoder, TextEncoder } from 'util';
import { ProcessEnvOptions, ChildProcess, spawn } from 'child_process';

const StackFrameRegex = /^[>,\s]+(.+)\((\d+)\)(.*)\(\)$/;
const ScrapeOutputRegex = /(.*)\r*\n\(Pdb\)\s*$/;
const BreakpointRegex = /Breakpoint (\d+) at (.+):(\d+)/;


class DebugAdapter implements vscode.DebugAdapter {
	private _pythonFile: string | undefined;
	private _textDecoder = new TextDecoder();
	private _sequence = 0;
	private _debuggee: ChildProcess | undefined;
	private _outputChain: Promise<string> | undefined;
	private _outputEmitter = new vscode.EventEmitter<string>();
	private _stopped = true;
	private _stopOnEntry = false;
	private _workspaceFolder: vscode.WorkspaceFolder | undefined;
	private _boundBreakpoints: DebugProtocol.Breakpoint[] = [];

	private _didSendMessageEmitter: vscode.EventEmitter<DebugProtocol.Response | DebugProtocol.Event> =
		new vscode.EventEmitter<DebugProtocol.Response | DebugProtocol.Event>();

	constructor(
		readonly session: vscode.DebugSession,
		readonly context: vscode.ExtensionContext
	) {
		this._pythonFile = session.configuration.program;
		this._stopOnEntry = session.configuration.stopOnEntry;
		this._workspaceFolder = session.workspaceFolder ||
			(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined);
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

			case 'setBreakpoints':
				void this._handleSetBreakpointsRequest(message as DebugProtocol.SetBreakpointsRequest);
				break;

			case 'configurationDone':
				this._handleConfigurationDone(message as DebugProtocol.ConfigurationDoneRequest);
				break;

			case 'continue':
				this._handleContinue(message as DebugProtocol.ContinueRequest);
				break;

			default:
				console.log(`Unknown debugger command ${message.command}`);
				break;
		}
	}

	_handleStdout(data: Buffer) {
		const str = this._textDecoder.decode(data);
		this._outputEmitter.fire(str);
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

	_sendStoppedEvent(reason: string, breakpointHit?: DebugProtocol.Breakpoint) {
		if (breakpointHit && breakpointHit.id) {
			this._sendEvent<DebugProtocol.StoppedEvent>({
				type: 'event',
				seq: 1,
				event: 'stopped',
				body: {
					reason: 'breakpoint',
					threadId: 1,
					allThreadsStopped: true,
					hitBreakpointIds: [breakpointHit.id]
				}
			});
		} else {
			this._sendEvent<DebugProtocol.StoppedEvent>({
				type: 'event',
				seq: 1,
				event: 'stopped',
				body: {
					reason,
					threadId: 1,
					allThreadsStopped: true,
				}
			});
		}
	}

	async _handleLaunch(message: DebugProtocol.LaunchRequest) {
		if (this._pythonFile && !this._debuggee) {
			// Startup pdb for the main file

			// Wait for debuggee to emit first bit of output before continuing
			await this._waitForPdbOutput(this._launchpdb.bind(this));

			// PDB should have stopped at the entry point and printed out the first line

			// Show in the debugger that we are debugging
			this._sendOutputEvent(`python -m pdb ${this._pythonFile}`);

			// Send back the response
			this._sendResponse<DebugProtocol.LaunchResponse>({
				type: 'response',
				request_seq: message.seq,
				success: !this._debuggee!.killed,
				command: message.command,
				seq: 1
			});
		}
	}

	_terminate() {
		if (this._debuggee) {
			this._debuggee.stdin?.write(`exit\n`);
			this._debuggee = undefined;
		}
	}

	_handleDisconnect(message: DebugProtocol.DisconnectRequest) {
		this._terminate();
		this._sendResponse<DebugProtocol.DisconnectResponse>({
			type: 'response',
			request_seq: message.seq,
			success: true,
			command: message.command,
			seq: 1,
		});
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
				supportsConditionalBreakpoints: true,
				supportsConfigurationDoneRequest: true
			}
		});

		// Send back the initialized event to indicate ready to receive breakpoint requests
		this._sendEvent<DebugProtocol.InitializedEvent>({
			type: 'event',
			event: 'initialized',
			seq: 1
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

	async _waitForStopped() {
		if (!this._stopped && this._outputChain) {
			// If we're not currently stopped, then we must be waiting for output
			return this._outputChain;
		}
		return undefined;
	}

	_waitForPdbOutput(generator: () => void): Promise<string> {
		const current = this._outputChain ?? Promise.resolve('');
		this._outputChain = current.then(() => {
			return new Promise<string>((resolve, reject) => {
				const disposable = this._outputEmitter.event((str) => {
					// We are finished when the output ends with `(Pdb) `
					if (str.includes(`(Pdb) `)) {
						disposable.dispose();
						this._stopped = true;
						resolve(str);
					} else {
						// Otherwise actual output from the process, send to the debug console
						this._sendOutputEvent(str);
					}
				});
				this._stopped = false;
				generator();
			});
		});
		return this._outputChain;
	}

	_parseStackFrames(frames: string): DebugProtocol.StackFrame[] {
		const result: DebugProtocol.StackFrame[] = [];

		// Split frames into lines
		const lines = frames.replace(/\r/g, '').split('\n');

		// Go through each line
		lines.forEach((line, index) => {
			const frameParts = StackFrameRegex.exec(line);
			if (frameParts) {
				// Insert at the front so last frame is on front of list
				result.splice(0, 0, {
					id: lines.length - index,
					source: {
						name: path.basename(frameParts[1]),
						path: frameParts[1],
						sourceReference: 0 // Don't retrieve source from pdb
					},
					name: frameParts[3],
					line: parseInt(frameParts[2]),
					column: 0
				});
			}
		});
		return result;
	}

	async _handleStackTrace(message: DebugProtocol.StackTraceRequest) {
		// Ask PDB for the current frame
		const frames = await this._sendtopdb('where');

		// Parse the frames
		const stackFrames = this._parseStackFrames(frames);

		// Return the stack trace
		this._sendResponse<DebugProtocol.StackTraceResponse>({
			success: true,
			command: message.command,
			type: 'response',
			seq: 1,
			request_seq: message.seq,
			body: {
				totalFrames: stackFrames.length,
				stackFrames
			}
		});
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

	_handleConfigurationDone(message: DebugProtocol.ConfigurationDoneRequest) {
		this._sendResponse<DebugProtocol.ConfigurationDoneResponse>({
			success: true,
			command: message.command,
			type: 'response',
			seq: 1,
			request_seq: message.seq,
		});

		if (this._stopOnEntry) {
			// Send back the stopped location. This should cause
			// VS code to ask for the stack frame
			this._sendStoppedEvent('entry');
		} else if (this._stopped) {
			// Not stopping, tell pdb to continue. We should have
			// gotten any breakpoint requests already
			void this._continue();
		}

	}

	async _handleSetBreakpointsRequest(message: DebugProtocol.SetBreakpointsRequest) {
		// Need to not be running in order to set breakpoints. Wait for being stopped
		await this._waitForStopped();

		const results: DebugProtocol.Breakpoint[] = [];

		// Use the 'b' command to create breakpoints
		if (message.arguments.breakpoints) {
			await Promise.all(message.arguments.breakpoints.map(async (b) => {
				const result = await this._sendtopdb(`b ${message.arguments.source.path}:${b.line}`);
				const parsed = BreakpointRegex.exec(result);
				if (parsed) {
					const breakpoint: DebugProtocol.Breakpoint = {
						id: parseInt(parsed[1]),
						line: parseInt(parsed[3]),
						source: {
							path: parsed[2]
						},
						verified: true
					};
					this._boundBreakpoints.push(breakpoint);
					results.push(breakpoint);
				}
			}));
		}

		this._sendResponse<DebugProtocol.SetBreakpointsResponse>({
			success: true,
			command: message.command,
			type: 'response',
			seq: 1,
			request_seq: message.seq,
			body: {
				breakpoints: results
			}
		});
	}

	_launchpdb() {
		this._debuggee = spawn(`python` , ['-m' ,'pdb', this._pythonFile!], { cwd: path.dirname(this._pythonFile!)});
		this._debuggee!.stdout?.on('data', this._handleStdout.bind(this));
		this._debuggee!.stderr?.on('data', this._handleStderr.bind(this));
		this._debuggee!.on('exit', (code) => {
			this._sendOutputEvent(`Process exited with ${code}`);
			this._sendStoppedEvent('exit');
		});

	}

	_isMyCode(file: string): boolean {
		// Determine if this file is in the current workspace or not
		if (this._workspaceFolder) {
			const root = this._workspaceFolder.uri.fsPath.toLowerCase();
			return file.toLowerCase().startsWith(root);
		} else {
			// Otherwise no workspace folder and just a loose file. Use the starting file
			const root = path.dirname(this._pythonFile!).toLowerCase();
			return file.toLowerCase().startsWith(root);
		}
	}

	_handleProgramFinished() {
		// Program finished. Disconnect
		this._terminate();
		this._sendEvent<DebugProtocol.TerminatedEvent>({
			type: 'event',
			event: 'terminated',
			seq: 1,
		});
	}

	_handleUncaughtException() {
		this._sendStoppedEvent('exception');
	}

	async _handleStopped(output: string) {
		// Parse the output. It should have the frames in it
		const frames = this._parseStackFrames(output);

		// The topmost frame needs to be 'my code' or we should step
		if (frames.length > 0 && !this._isMyCode(frames[0].source!.path!)) {
			return this._executerun('s');
		}

		// Otherwise we stopped. See if this location matches one of
		// our current breakpoints
		const match = this._boundBreakpoints.find(
			b => b.line === frames[0].line && b.source?.path === frames[0].source?.path);
		this._sendStoppedEvent('step', match);
	}

	async _executerun(runcommand: string) {
		const output = await this._sendtopdb(runcommand);

		// We should be stopped now. Depends upon why
		if (output.includes('The program finished and will be restarted')) {
			this._handleProgramFinished();
		} else if (output.includes('Uncaught exception. Entering post mortem debugging')) {
			this._handleUncaughtException();
		} else {
			await this._handleStopped(output);
		}
	}

	async _stepInto() {

	}

	async _stepOver() {

	}

	async _stepOutOf() {

	}

	_handleContinue(message: DebugProtocol.ContinueRequest) {
		this._sendResponse<DebugProtocol.ContinueResponse>({
			success: true,
			command: message.command,
			type: 'response',
			seq: 1,
			request_seq: message.seq,
			body: {
				allThreadsContinued: true
			}
		});
		void this._continue();
	}

	async _continue() {
		// Send a continue command. Waiting for the first output.
		return this._executerun('c');
	}

	_sendtopdb(command: string): Promise<string> {
		// Chain requests together
		return this._waitForPdbOutput(() => {
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
				output: `${data}\n`
			}
		});
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
