/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { result, own, i32, ptr } from '@vscode/wasm-component-model';
import { random } from './random';
import { sockets } from './sockets';
import { filesystem } from './filesystem';
import { clocks } from './clocks';
import { io } from './io';

export namespace cli {
	export namespace environment {
		/**
		 * Get the POSIX-style environment variables.
		 * 
		 * Each environment variable is provided as a pair of string variable names
		 * and string value.
		 * 
		 * Morally, these are a value import, but until value imports are available
		 * in the component model, this import function should return the same
		 * values each time it is called.
		 */
		export type getEnvironment = () => [string, string][];

		/**
		 * Get the POSIX-style arguments to the program.
		 */
		export type getArguments = () => string[];

		/**
		 * Return a path that programs should use as their initial current working
		 * directory, interpreting `.` as shorthand for this.
		 */
		export type initialCwd = () => string | undefined;
	}
	export type Environment = {
		getEnvironment: environment.getEnvironment;
		getArguments: environment.getArguments;
		initialCwd: environment.initialCwd;
	};

	export namespace exit {
		/**
		 * Exit the current instance and any linked instances.
		 */
		export type exit = (status: result<void, void>) => void;
	}
	export type Exit = {
		exit: exit.exit;
	};

	export namespace run {
		/**
		 * Run the program.
		 */
		export type run = () => result<void, void>;
	}
	export type Run = {
		run: run.run;
	};

	export namespace stdin {
		export type InputStream = io.streams.InputStream;

		export type getStdin = () => own<InputStream>;
	}
	export type Stdin = {
		getStdin: stdin.getStdin;
	};

	export namespace stdout {
		export type OutputStream = io.streams.OutputStream;

		export type getStdout = () => own<OutputStream>;
	}
	export type Stdout = {
		getStdout: stdout.getStdout;
	};

	export namespace stderr {
		export type OutputStream = io.streams.OutputStream;

		export type getStderr = () => own<OutputStream>;
	}
	export type Stderr = {
		getStderr: stderr.getStderr;
	};

	/**
	 * Terminal input.
	 * 
	 * In the future, this may include functions for disabling echoing,
	 * disabling input buffering so that keyboard events are sent through
	 * immediately, querying supported features, and so on.
	 */
	export namespace terminalInput {
		export namespace TerminalInput {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;
				$drop?(): void;

			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type TerminalInput = TerminalInput.Interface;
	}
	export type TerminalInput = {
	};

	/**
	 * Terminal output.
	 * 
	 * In the future, this may include functions for querying the terminal
	 * size, being notified of terminal size changes, querying supported
	 * features, and so on.
	 */
	export namespace terminalOutput {
		export namespace TerminalOutput {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;
				$drop?(): void;

			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type TerminalOutput = TerminalOutput.Interface;
	}
	export type TerminalOutput = {
	};

	/**
	 * An interface providing an optional `terminal-input` for stdin as a
	 * link-time authority.
	 */
	export namespace terminalStdin {
		export type TerminalInput = cli.terminalInput.TerminalInput;

		/**
		 * If stdin is connected to a terminal, return a `terminal-input` handle
		 * allowing further interaction with it.
		 */
		export type getTerminalStdin = () => own<TerminalInput> | undefined;
	}
	export type TerminalStdin = {
		getTerminalStdin: terminalStdin.getTerminalStdin;
	};

	/**
	 * An interface providing an optional `terminal-output` for stdout as a
	 * link-time authority.
	 */
	export namespace terminalStdout {
		export type TerminalOutput = cli.terminalOutput.TerminalOutput;

		/**
		 * If stdout is connected to a terminal, return a `terminal-output` handle
		 * allowing further interaction with it.
		 */
		export type getTerminalStdout = () => own<TerminalOutput> | undefined;
	}
	export type TerminalStdout = {
		getTerminalStdout: terminalStdout.getTerminalStdout;
	};

	/**
	 * An interface providing an optional `terminal-output` for stderr as a
	 * link-time authority.
	 */
	export namespace terminalStderr {
		export type TerminalOutput = cli.terminalOutput.TerminalOutput;

		/**
		 * If stderr is connected to a terminal, return a `terminal-output` handle
		 * allowing further interaction with it.
		 */
		export type getTerminalStderr = () => own<TerminalOutput> | undefined;
	}
	export type TerminalStderr = {
		getTerminalStderr: terminalStderr.getTerminalStderr;
	};
	export namespace command {
		export type Imports = {
			environment: cli.Environment;
			exit: cli.Exit;
			error: io.Error;
			poll: io.Poll;
			streams: io.Streams;
			stdin: cli.Stdin;
			stdout: cli.Stdout;
			stderr: cli.Stderr;
			terminalInput: cli.TerminalInput;
			terminalOutput: cli.TerminalOutput;
			terminalStdin: cli.TerminalStdin;
			terminalStdout: cli.TerminalStdout;
			terminalStderr: cli.TerminalStderr;
			monotonicClock: clocks.MonotonicClock;
			wallClock: clocks.WallClock;
			types: filesystem.Types;
			preopens: filesystem.Preopens;
			network: sockets.Network;
			instanceNetwork: sockets.InstanceNetwork;
			udp: sockets.Udp;
			udpCreateSocket: sockets.UdpCreateSocket;
			tcp: sockets.Tcp;
			tcpCreateSocket: sockets.TcpCreateSocket;
			ipNameLookup: sockets.IpNameLookup;
			random: random.Random;
			insecure: random.Insecure;
			insecureSeed: random.InsecureSeed;
		};
		export type Exports = {
			run: cli.Run;
		};
	}
}

export namespace cli {
	export namespace environment.$ {
		export const getEnvironment = new $wcm.FunctionType<cli.environment.getEnvironment>('get-environment', [], new $wcm.ListType<[string, string]>(new $wcm.TupleType<[string, string]>([$wcm.wstring, $wcm.wstring])));
		export const getArguments = new $wcm.FunctionType<cli.environment.getArguments>('get-arguments', [], new $wcm.ListType<string>($wcm.wstring));
		export const initialCwd = new $wcm.FunctionType<cli.environment.initialCwd>('initial-cwd', [], new $wcm.OptionType<string>($wcm.wstring));
	}
	export namespace environment._ {
		export const id = 'wasi:cli/environment@0.2.0' as const;
		export const witName = 'environment' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getEnvironment', $.getEnvironment],
			['getArguments', $.getArguments],
			['initialCwd', $.initialCwd]
		]);
		export type WasmInterface = {
			'get-environment': (result: ptr<[string, string][]>) => void;
			'get-arguments': (result: ptr<string[]>) => void;
			'initial-cwd': (result: ptr<string | undefined>) => void;
		};
		export function createImports(service: cli.Environment, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Environment {
			return $wcm.Exports.bind<cli.Environment>(functions, [], wasmInterface, context);
		}
	}

	export namespace exit.$ {
		export const exit = new $wcm.FunctionType<cli.exit.exit>('exit',[
			['status', new $wcm.ResultType<void, void>(undefined, undefined)],
		], undefined);
	}
	export namespace exit._ {
		export const id = 'wasi:cli/exit@0.2.0' as const;
		export const witName = 'exit' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['exit', $.exit]
		]);
		export type WasmInterface = {
			'exit': (status_case: i32) => void;
		};
		export function createImports(service: cli.Exit, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Exit {
			return $wcm.Exports.bind<cli.Exit>(functions, [], wasmInterface, context);
		}
	}

	export namespace run.$ {
		export const run = new $wcm.FunctionType<cli.run.run>('run', [], new $wcm.ResultType<void, void>(undefined, undefined));
	}
	export namespace run._ {
		export const id = 'wasi:cli/run@0.2.0' as const;
		export const witName = 'run' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['run', $.run]
		]);
		export type WasmInterface = {
			'run': () => i32;
		};
		export function createImports(service: cli.Run, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Run {
			return $wcm.Exports.bind<cli.Run>(functions, [], wasmInterface, context);
		}
	}

	export namespace stdin.$ {
		export const InputStream = io.streams.$.InputStream;
		export const getStdin = new $wcm.FunctionType<cli.stdin.getStdin>('get-stdin', [], new $wcm.OwnType<cli.stdin.InputStream>(InputStream));
	}
	export namespace stdin._ {
		export const id = 'wasi:cli/stdin@0.2.0' as const;
		export const witName = 'stdin' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['InputStream', $.InputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStdin', $.getStdin]
		]);
		export type WasmInterface = {
			'get-stdin': () => i32;
		};
		export function createImports(service: cli.Stdin, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Stdin {
			return $wcm.Exports.bind<cli.Stdin>(functions, [], wasmInterface, context);
		}
	}

	export namespace stdout.$ {
		export const OutputStream = io.streams.$.OutputStream;
		export const getStdout = new $wcm.FunctionType<cli.stdout.getStdout>('get-stdout', [], new $wcm.OwnType<cli.stdout.OutputStream>(OutputStream));
	}
	export namespace stdout._ {
		export const id = 'wasi:cli/stdout@0.2.0' as const;
		export const witName = 'stdout' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutputStream', $.OutputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStdout', $.getStdout]
		]);
		export type WasmInterface = {
			'get-stdout': () => i32;
		};
		export function createImports(service: cli.Stdout, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Stdout {
			return $wcm.Exports.bind<cli.Stdout>(functions, [], wasmInterface, context);
		}
	}

	export namespace stderr.$ {
		export const OutputStream = io.streams.$.OutputStream;
		export const getStderr = new $wcm.FunctionType<cli.stderr.getStderr>('get-stderr', [], new $wcm.OwnType<cli.stderr.OutputStream>(OutputStream));
	}
	export namespace stderr._ {
		export const id = 'wasi:cli/stderr@0.2.0' as const;
		export const witName = 'stderr' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutputStream', $.OutputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStderr', $.getStderr]
		]);
		export type WasmInterface = {
			'get-stderr': () => i32;
		};
		export function createImports(service: cli.Stderr, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Stderr {
			return $wcm.Exports.bind<cli.Stderr>(functions, [], wasmInterface, context);
		}
	}

	export namespace terminalInput.$ {
		export const TerminalInput = new $wcm.ResourceType<cli.terminalInput.TerminalInput>('terminal-input', 'wasi:cli/terminal-input/terminal-input');
		export const TerminalInput_Handle = new $wcm.ResourceHandleType('terminal-input');
		TerminalInput.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]terminal-input', [['inst', TerminalInput]]));
	}
	export namespace terminalInput._ {
		export const id = 'wasi:cli/terminal-input@0.2.0' as const;
		export const witName = 'terminal-input' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalInput', $.TerminalInput]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TerminalInput', $.TerminalInput]
		]);
		export namespace TerminalInput {
			export type WasmInterface = {
				'[resource-drop]terminal-input': (self: i32) => void;
			};
			type ObjectModule = {
				$drop(self: TerminalInput): void;
			};
			class Impl extends $wcm.Resource implements cli.terminalInput.TerminalInput.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public $drop(): void {
					return this._om.$drop(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.terminalInput.TerminalInput.Class {
				const resource = cli.terminalInput.$.TerminalInput;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
				};
			}
		}
		export type WasmInterface = {
		} & TerminalInput.WasmInterface;
		export function createImports(service: cli.TerminalInput, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(undefined, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, undefined, resources, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalInput {
			return $wcm.Exports.bind<cli.TerminalInput>(undefined, [['TerminalInput', $.TerminalInput, TerminalInput.Class]], wasmInterface, context);
		}
	}

	export namespace terminalOutput.$ {
		export const TerminalOutput = new $wcm.ResourceType<cli.terminalOutput.TerminalOutput>('terminal-output', 'wasi:cli/terminal-output/terminal-output');
		export const TerminalOutput_Handle = new $wcm.ResourceHandleType('terminal-output');
		TerminalOutput.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]terminal-output', [['inst', TerminalOutput]]));
	}
	export namespace terminalOutput._ {
		export const id = 'wasi:cli/terminal-output@0.2.0' as const;
		export const witName = 'terminal-output' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export namespace TerminalOutput {
			export type WasmInterface = {
				'[resource-drop]terminal-output': (self: i32) => void;
			};
			type ObjectModule = {
				$drop(self: TerminalOutput): void;
			};
			class Impl extends $wcm.Resource implements cli.terminalOutput.TerminalOutput.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public $drop(): void {
					return this._om.$drop(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.terminalOutput.TerminalOutput.Class {
				const resource = cli.terminalOutput.$.TerminalOutput;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
				};
			}
		}
		export type WasmInterface = {
		} & TerminalOutput.WasmInterface;
		export function createImports(service: cli.TerminalOutput, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(undefined, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, undefined, resources, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalOutput {
			return $wcm.Exports.bind<cli.TerminalOutput>(undefined, [['TerminalOutput', $.TerminalOutput, TerminalOutput.Class]], wasmInterface, context);
		}
	}

	export namespace terminalStdin.$ {
		export const TerminalInput = cli.terminalInput.$.TerminalInput;
		export const getTerminalStdin = new $wcm.FunctionType<cli.terminalStdin.getTerminalStdin>('get-terminal-stdin', [], new $wcm.OptionType<own<cli.terminalStdin.TerminalInput>>(new $wcm.OwnType<cli.terminalStdin.TerminalInput>(TerminalInput)));
	}
	export namespace terminalStdin._ {
		export const id = 'wasi:cli/terminal-stdin@0.2.0' as const;
		export const witName = 'terminal-stdin' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalInput', $.TerminalInput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdin', $.getTerminalStdin]
		]);
		export type WasmInterface = {
			'get-terminal-stdin': (result: ptr<own<TerminalInput> | undefined>) => void;
		};
		export function createImports(service: cli.TerminalStdin, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalStdin {
			return $wcm.Exports.bind<cli.TerminalStdin>(functions, [], wasmInterface, context);
		}
	}

	export namespace terminalStdout.$ {
		export const TerminalOutput = cli.terminalOutput.$.TerminalOutput;
		export const getTerminalStdout = new $wcm.FunctionType<cli.terminalStdout.getTerminalStdout>('get-terminal-stdout', [], new $wcm.OptionType<own<cli.terminalStdout.TerminalOutput>>(new $wcm.OwnType<cli.terminalStdout.TerminalOutput>(TerminalOutput)));
	}
	export namespace terminalStdout._ {
		export const id = 'wasi:cli/terminal-stdout@0.2.0' as const;
		export const witName = 'terminal-stdout' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdout', $.getTerminalStdout]
		]);
		export type WasmInterface = {
			'get-terminal-stdout': (result: ptr<own<TerminalOutput> | undefined>) => void;
		};
		export function createImports(service: cli.TerminalStdout, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalStdout {
			return $wcm.Exports.bind<cli.TerminalStdout>(functions, [], wasmInterface, context);
		}
	}

	export namespace terminalStderr.$ {
		export const TerminalOutput = cli.terminalOutput.$.TerminalOutput;
		export const getTerminalStderr = new $wcm.FunctionType<cli.terminalStderr.getTerminalStderr>('get-terminal-stderr', [], new $wcm.OptionType<own<cli.terminalStderr.TerminalOutput>>(new $wcm.OwnType<cli.terminalStderr.TerminalOutput>(TerminalOutput)));
	}
	export namespace terminalStderr._ {
		export const id = 'wasi:cli/terminal-stderr@0.2.0' as const;
		export const witName = 'terminal-stderr' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStderr', $.getTerminalStderr]
		]);
		export type WasmInterface = {
			'get-terminal-stderr': (result: ptr<own<TerminalOutput> | undefined>) => void;
		};
		export function createImports(service: cli.TerminalStderr, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, cli._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalStderr {
			return $wcm.Exports.bind<cli.TerminalStderr>(functions, [], wasmInterface, context);
		}
	}
	export namespace command.$ {
	}
	export namespace command._ {
		export const id = 'wasi:cli/command@0.2.0' as const;
		export const witName = 'command' as const;
		export namespace Imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['environment', environment._],
				['exit', exit._],
				['io.error', io.error._],
				['io.poll', io.poll._],
				['io.streams', io.streams._],
				['stdin', stdin._],
				['stdout', stdout._],
				['stderr', stderr._],
				['terminalInput', terminalInput._],
				['terminalOutput', terminalOutput._],
				['terminalStdin', terminalStdin._],
				['terminalStdout', terminalStdout._],
				['terminalStderr', terminalStderr._],
				['clocks.monotonicClock', clocks.monotonicClock._],
				['clocks.wallClock', clocks.wallClock._],
				['filesystem.types', filesystem.types._],
				['filesystem.preopens', filesystem.preopens._],
				['sockets.network', sockets.network._],
				['sockets.instanceNetwork', sockets.instanceNetwork._],
				['sockets.udp', sockets.udp._],
				['sockets.udpCreateSocket', sockets.udpCreateSocket._],
				['sockets.tcp', sockets.tcp._],
				['sockets.tcpCreateSocket', sockets.tcpCreateSocket._],
				['sockets.ipNameLookup', sockets.ipNameLookup._],
				['random.random', random.random._],
				['random.insecure', random.insecure._],
				['random.insecureSeed', random.insecureSeed._]
			]);
		}
		export type Imports = {
			'wasi:cli/environment@0.2.0': cli.environment._.WasmInterface;
			'wasi:cli/exit@0.2.0': cli.exit._.WasmInterface;
			'wasi:io/error@0.2.0': io.error._.WasmInterface;
			'wasi:io/poll@0.2.0': io.poll._.WasmInterface;
			'wasi:io/streams@0.2.0': io.streams._.WasmInterface;
			'wasi:cli/stdin@0.2.0': cli.stdin._.WasmInterface;
			'wasi:cli/stdout@0.2.0': cli.stdout._.WasmInterface;
			'wasi:cli/stderr@0.2.0': cli.stderr._.WasmInterface;
			'wasi:cli/terminal-input@0.2.0': cli.terminalInput._.WasmInterface;
			'wasi:cli/terminal-output@0.2.0': cli.terminalOutput._.WasmInterface;
			'wasi:cli/terminal-stdin@0.2.0': cli.terminalStdin._.WasmInterface;
			'wasi:cli/terminal-stdout@0.2.0': cli.terminalStdout._.WasmInterface;
			'wasi:cli/terminal-stderr@0.2.0': cli.terminalStderr._.WasmInterface;
			'wasi:clocks/monotonic-clock@0.2.0': clocks.monotonicClock._.WasmInterface;
			'wasi:clocks/wall-clock@0.2.0': clocks.wallClock._.WasmInterface;
			'wasi:filesystem/types@0.2.0': filesystem.types._.WasmInterface;
			'wasi:filesystem/preopens@0.2.0': filesystem.preopens._.WasmInterface;
			'wasi:sockets/network@0.2.0': sockets.network._.WasmInterface;
			'wasi:sockets/instance-network@0.2.0': sockets.instanceNetwork._.WasmInterface;
			'wasi:sockets/udp@0.2.0': sockets.udp._.WasmInterface;
			'wasi:sockets/udp-create-socket@0.2.0': sockets.udpCreateSocket._.WasmInterface;
			'wasi:sockets/tcp@0.2.0': sockets.tcp._.WasmInterface;
			'wasi:sockets/tcp-create-socket@0.2.0': sockets.tcpCreateSocket._.WasmInterface;
			'wasi:sockets/ip-name-lookup@0.2.0': sockets.ipNameLookup._.WasmInterface;
			'wasi:random/random@0.2.0': random.random._.WasmInterface;
			'wasi:random/insecure@0.2.0': random.insecure._.WasmInterface;
			'wasi:random/insecure-seed@0.2.0': random.insecureSeed._.WasmInterface;
		};
		export namespace Exports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['run', run._]
			]);
		}
		export type Exports = {
			'wasi:cli/run@0.2.0#run': () => i32;
		};
		export function createImports(service: command.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['wasi:cli/environment@0.2.0'] = cli.environment._.createImports(service.environment, context);
			result['wasi:cli/exit@0.2.0'] = cli.exit._.createImports(service.exit, context);
			result['wasi:io/error@0.2.0'] = io.error._.createImports(service.error, context);
			result['wasi:io/poll@0.2.0'] = io.poll._.createImports(service.poll, context);
			result['wasi:io/streams@0.2.0'] = io.streams._.createImports(service.streams, context);
			result['wasi:cli/stdin@0.2.0'] = cli.stdin._.createImports(service.stdin, context);
			result['wasi:cli/stdout@0.2.0'] = cli.stdout._.createImports(service.stdout, context);
			result['wasi:cli/stderr@0.2.0'] = cli.stderr._.createImports(service.stderr, context);
			result['wasi:cli/terminal-input@0.2.0'] = cli.terminalInput._.createImports(service.terminalInput, context);
			result['wasi:cli/terminal-output@0.2.0'] = cli.terminalOutput._.createImports(service.terminalOutput, context);
			result['wasi:cli/terminal-stdin@0.2.0'] = cli.terminalStdin._.createImports(service.terminalStdin, context);
			result['wasi:cli/terminal-stdout@0.2.0'] = cli.terminalStdout._.createImports(service.terminalStdout, context);
			result['wasi:cli/terminal-stderr@0.2.0'] = cli.terminalStderr._.createImports(service.terminalStderr, context);
			result['wasi:clocks/monotonic-clock@0.2.0'] = clocks.monotonicClock._.createImports(service.monotonicClock, context);
			result['wasi:clocks/wall-clock@0.2.0'] = clocks.wallClock._.createImports(service.wallClock, context);
			result['wasi:filesystem/types@0.2.0'] = filesystem.types._.createImports(service.types, context);
			result['wasi:filesystem/preopens@0.2.0'] = filesystem.preopens._.createImports(service.preopens, context);
			result['wasi:sockets/network@0.2.0'] = sockets.network._.createImports(service.network, context);
			result['wasi:sockets/instance-network@0.2.0'] = sockets.instanceNetwork._.createImports(service.instanceNetwork, context);
			result['wasi:sockets/udp@0.2.0'] = sockets.udp._.createImports(service.udp, context);
			result['wasi:sockets/udp-create-socket@0.2.0'] = sockets.udpCreateSocket._.createImports(service.udpCreateSocket, context);
			result['wasi:sockets/tcp@0.2.0'] = sockets.tcp._.createImports(service.tcp, context);
			result['wasi:sockets/tcp-create-socket@0.2.0'] = sockets.tcpCreateSocket._.createImports(service.tcpCreateSocket, context);
			result['wasi:sockets/ip-name-lookup@0.2.0'] = sockets.ipNameLookup._.createImports(service.ipNameLookup, context);
			result['wasi:random/random@0.2.0'] = random.random._.createImports(service.random, context);
			result['wasi:random/insecure@0.2.0'] = random.insecure._.createImports(service.insecure, context);
			result['wasi:random/insecure-seed@0.2.0'] = random.insecureSeed._.createImports(service.insecureSeed, context);
			return result;
		}
		export function bindExports(exports: Exports, context: $wcm.WasmContext): command.Exports {
			const result: command.Exports = Object.create(null);
			result.run = cli.run._.bindExports(cli.run._.filterExports(exports, context), context);
			return result;
		}
	}
}

export namespace cli._ {
	export const version = '0.2.0' as const;
	export const id = 'wasi:cli@0.2.0' as const;
	export const witName = 'cli' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['environment', environment._],
		['exit', exit._],
		['run', run._],
		['stdin', stdin._],
		['stdout', stdout._],
		['stderr', stderr._],
		['terminalInput', terminalInput._],
		['terminalOutput', terminalOutput._],
		['terminalStdin', terminalStdin._],
		['terminalStdout', terminalStdout._],
		['terminalStderr', terminalStderr._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['command', command._],
	]);
}