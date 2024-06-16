/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { result, own, i32, ptr } from '@vscode/wasm-component-model';
import { random } from './random';
import { sockets } from './sockets';
import { filesystem } from './filesystem';
import { clocks } from './clocks';
import { io } from './io';

export namespace cli {
	export namespace Environment {
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
		getEnvironment: Environment.getEnvironment;
		getArguments: Environment.getArguments;
		initialCwd: Environment.initialCwd;
	};

	export namespace Exit {
		/**
		 * Exit the current instance and any linked instances.
		 */
		export type exit = (status: result<void, void>) => void;
	}
	export type Exit = {
		exit: Exit.exit;
	};

	export namespace Run {
		/**
		 * Run the program.
		 */
		export type run = () => result<void, void>;
	}
	export type Run = {
		run: Run.run;
	};

	export namespace Stdin {
		export type InputStream = io.Streams.InputStream;

		export type getStdin = () => own<InputStream>;
	}
	export type Stdin = {
		getStdin: Stdin.getStdin;
	};

	export namespace Stdout {
		export type OutputStream = io.Streams.OutputStream;

		export type getStdout = () => own<OutputStream>;
	}
	export type Stdout = {
		getStdout: Stdout.getStdout;
	};

	export namespace Stderr {
		export type OutputStream = io.Streams.OutputStream;

		export type getStderr = () => own<OutputStream>;
	}
	export type Stderr = {
		getStderr: Stderr.getStderr;
	};

	/**
	 * Terminal input.
	 * 
	 * In the future, this may include functions for disabling echoing,
	 * disabling input buffering so that keyboard events are sent through
	 * immediately, querying supported features, and so on.
	 */
	export namespace TerminalInput {
		export namespace TerminalInput {
			export interface Interface extends $wcm.Resource {
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
	export namespace TerminalOutput {
		export namespace TerminalOutput {
			export interface Interface extends $wcm.Resource {
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
	export namespace TerminalStdin {
		export type TerminalInput = cli.TerminalInput.TerminalInput;

		/**
		 * If stdin is connected to a terminal, return a `terminal-input` handle
		 * allowing further interaction with it.
		 */
		export type getTerminalStdin = () => own<TerminalInput> | undefined;
	}
	export type TerminalStdin = {
		getTerminalStdin: TerminalStdin.getTerminalStdin;
	};

	/**
	 * An interface providing an optional `terminal-output` for stdout as a
	 * link-time authority.
	 */
	export namespace TerminalStdout {
		export type TerminalOutput = cli.TerminalOutput.TerminalOutput;

		/**
		 * If stdout is connected to a terminal, return a `terminal-output` handle
		 * allowing further interaction with it.
		 */
		export type getTerminalStdout = () => own<TerminalOutput> | undefined;
	}
	export type TerminalStdout = {
		getTerminalStdout: TerminalStdout.getTerminalStdout;
	};

	/**
	 * An interface providing an optional `terminal-output` for stderr as a
	 * link-time authority.
	 */
	export namespace TerminalStderr {
		export type TerminalOutput = cli.TerminalOutput.TerminalOutput;

		/**
		 * If stderr is connected to a terminal, return a `terminal-output` handle
		 * allowing further interaction with it.
		 */
		export type getTerminalStderr = () => own<TerminalOutput> | undefined;
	}
	export type TerminalStderr = {
		getTerminalStderr: TerminalStderr.getTerminalStderr;
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
		export namespace Imports {
			export type Promisified = $wcm.$imports.Promisify<Imports>;
		}
		export namespace imports {
			export type Promisify<T> = $wcm.$imports.Promisify<T>;
		}
		export type Exports = {
			run: cli.Run;
		};
		export namespace Exports {
			export type Promisified = $wcm.$exports.Promisify<Exports>;
		}
		export namespace exports {
			export type Promisify<T> = $wcm.$exports.Promisify<T>;
		}
	}
}

export namespace cli {
	export namespace Environment.$ {
		export const getEnvironment = new $wcm.FunctionType<cli.Environment.getEnvironment>('get-environment', [], new $wcm.ListType<[string, string]>(new $wcm.TupleType<[string, string]>([$wcm.wstring, $wcm.wstring])));
		export const getArguments = new $wcm.FunctionType<cli.Environment.getArguments>('get-arguments', [], new $wcm.ListType<string>($wcm.wstring));
		export const initialCwd = new $wcm.FunctionType<cli.Environment.initialCwd>('initial-cwd', [], new $wcm.OptionType<string>($wcm.wstring));
	}
	export namespace Environment._ {
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
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace Exit.$ {
		export const exit = new $wcm.FunctionType<cli.Exit.exit>('exit',[
			['status', new $wcm.ResultType<void, void>(undefined, undefined)],
		], undefined);
	}
	export namespace Exit._ {
		export const id = 'wasi:cli/exit@0.2.0' as const;
		export const witName = 'exit' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['exit', $.exit]
		]);
		export type WasmInterface = {
			'exit': (status_case: i32) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace Run.$ {
		export const run = new $wcm.FunctionType<cli.Run.run>('run', [], new $wcm.ResultType<void, void>(undefined, undefined));
	}
	export namespace Run._ {
		export const id = 'wasi:cli/run@0.2.0' as const;
		export const witName = 'run' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['run', $.run]
		]);
		export type WasmInterface = {
			'run': () => i32;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace Stdin.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const getStdin = new $wcm.FunctionType<cli.Stdin.getStdin>('get-stdin', [], new $wcm.OwnType<cli.Stdin.InputStream>(InputStream));
	}
	export namespace Stdin._ {
		export const id = 'wasi:cli/stdin@0.2.0' as const;
		export const witName = 'stdin' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['InputStream', $.InputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStdin', $.getStdin]
		]);
		export type WasmInterface = {
			'get-stdin': () => i32;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace Stdout.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStdout = new $wcm.FunctionType<cli.Stdout.getStdout>('get-stdout', [], new $wcm.OwnType<cli.Stdout.OutputStream>(OutputStream));
	}
	export namespace Stdout._ {
		export const id = 'wasi:cli/stdout@0.2.0' as const;
		export const witName = 'stdout' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['OutputStream', $.OutputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStdout', $.getStdout]
		]);
		export type WasmInterface = {
			'get-stdout': () => i32;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace Stderr.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStderr = new $wcm.FunctionType<cli.Stderr.getStderr>('get-stderr', [], new $wcm.OwnType<cli.Stderr.OutputStream>(OutputStream));
	}
	export namespace Stderr._ {
		export const id = 'wasi:cli/stderr@0.2.0' as const;
		export const witName = 'stderr' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['OutputStream', $.OutputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStderr', $.getStderr]
		]);
		export type WasmInterface = {
			'get-stderr': () => i32;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace TerminalInput.$ {
		export const TerminalInput = new $wcm.ResourceType<cli.TerminalInput.TerminalInput>('terminal-input', 'wasi:cli@0.2.0/terminal-input/terminal-input');
		export const TerminalInput_Handle = new $wcm.ResourceHandleType('terminal-input');
		TerminalInput.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]terminal-input', [['inst', TerminalInput]]));
	}
	export namespace TerminalInput._ {
		export const id = 'wasi:cli/terminal-input@0.2.0' as const;
		export const witName = 'terminal-input' as const;
		export namespace TerminalInput {
			export type WasmInterface = {
			};
			export namespace imports {
				export type WasmInterface = TerminalInput.WasmInterface & { '[resource-drop]terminal-input': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = TerminalInput.WasmInterface & { '[dtor]terminal-input': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalInput', $.TerminalInput]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TerminalInput', $.TerminalInput]
		]);
		export type WasmInterface = {
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & TerminalInput.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & TerminalInput.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]terminal-input': (rep: i32) => i32;
					'[resource-rep]terminal-input': (handle: i32) => i32;
					'[resource-drop]terminal-input': (handle: i32) => void;
				};
			}
		}
	}

	export namespace TerminalOutput.$ {
		export const TerminalOutput = new $wcm.ResourceType<cli.TerminalOutput.TerminalOutput>('terminal-output', 'wasi:cli@0.2.0/terminal-output/terminal-output');
		export const TerminalOutput_Handle = new $wcm.ResourceHandleType('terminal-output');
		TerminalOutput.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]terminal-output', [['inst', TerminalOutput]]));
	}
	export namespace TerminalOutput._ {
		export const id = 'wasi:cli/terminal-output@0.2.0' as const;
		export const witName = 'terminal-output' as const;
		export namespace TerminalOutput {
			export type WasmInterface = {
			};
			export namespace imports {
				export type WasmInterface = TerminalOutput.WasmInterface & { '[resource-drop]terminal-output': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = TerminalOutput.WasmInterface & { '[dtor]terminal-output': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export type WasmInterface = {
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & TerminalOutput.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & TerminalOutput.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]terminal-output': (rep: i32) => i32;
					'[resource-rep]terminal-output': (handle: i32) => i32;
					'[resource-drop]terminal-output': (handle: i32) => void;
				};
			}
		}
	}

	export namespace TerminalStdin.$ {
		export const TerminalInput = cli.TerminalInput.$.TerminalInput;
		export const getTerminalStdin = new $wcm.FunctionType<cli.TerminalStdin.getTerminalStdin>('get-terminal-stdin', [], new $wcm.OptionType<own<cli.TerminalStdin.TerminalInput>>(new $wcm.OwnType<cli.TerminalStdin.TerminalInput>(TerminalInput)));
	}
	export namespace TerminalStdin._ {
		export const id = 'wasi:cli/terminal-stdin@0.2.0' as const;
		export const witName = 'terminal-stdin' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalInput', $.TerminalInput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdin', $.getTerminalStdin]
		]);
		export type WasmInterface = {
			'get-terminal-stdin': (result: ptr<own<TerminalInput> | undefined>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace TerminalStdout.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStdout = new $wcm.FunctionType<cli.TerminalStdout.getTerminalStdout>('get-terminal-stdout', [], new $wcm.OptionType<own<cli.TerminalStdout.TerminalOutput>>(new $wcm.OwnType<cli.TerminalStdout.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStdout._ {
		export const id = 'wasi:cli/terminal-stdout@0.2.0' as const;
		export const witName = 'terminal-stdout' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdout', $.getTerminalStdout]
		]);
		export type WasmInterface = {
			'get-terminal-stdout': (result: ptr<own<TerminalOutput> | undefined>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace TerminalStderr.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStderr = new $wcm.FunctionType<cli.TerminalStderr.getTerminalStderr>('get-terminal-stderr', [], new $wcm.OptionType<own<cli.TerminalStderr.TerminalOutput>>(new $wcm.OwnType<cli.TerminalStderr.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStderr._ {
		export const id = 'wasi:cli/terminal-stderr@0.2.0' as const;
		export const witName = 'terminal-stderr' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStderr', $.getTerminalStderr]
		]);
		export type WasmInterface = {
			'get-terminal-stderr': (result: ptr<own<TerminalOutput> | undefined>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}
	export namespace command.$ {
	}
	export namespace command._ {
		export const id = 'wasi:cli/command@0.2.0' as const;
		export const witName = 'command' as const;
		export namespace imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Environment', Environment._],
				['Exit', Exit._],
				['io.Error', io.Error._],
				['io.Poll', io.Poll._],
				['io.Streams', io.Streams._],
				['Stdin', Stdin._],
				['Stdout', Stdout._],
				['Stderr', Stderr._],
				['TerminalInput', TerminalInput._],
				['TerminalOutput', TerminalOutput._],
				['TerminalStdin', TerminalStdin._],
				['TerminalStdout', TerminalStdout._],
				['TerminalStderr', TerminalStderr._],
				['clocks.MonotonicClock', clocks.MonotonicClock._],
				['clocks.WallClock', clocks.WallClock._],
				['filesystem.Types', filesystem.Types._],
				['filesystem.Preopens', filesystem.Preopens._],
				['sockets.Network', sockets.Network._],
				['sockets.InstanceNetwork', sockets.InstanceNetwork._],
				['sockets.Udp', sockets.Udp._],
				['sockets.UdpCreateSocket', sockets.UdpCreateSocket._],
				['sockets.Tcp', sockets.Tcp._],
				['sockets.TcpCreateSocket', sockets.TcpCreateSocket._],
				['sockets.IpNameLookup', sockets.IpNameLookup._],
				['random.Random', random.Random._],
				['random.Insecure', random.Insecure._],
				['random.InsecureSeed', random.InsecureSeed._]
			]);
			export function create(service: command.Imports, context: $wcm.WasmContext): Imports {
				return $wcm.$imports.create<Imports>(_, service, context);
			}
			export function loop(service: command.Imports, context: $wcm.WasmContext): command.Imports {
				return $wcm.$imports.loop<command.Imports>(_, service, context);
			}
		}
		export type Imports = {
			'wasi:cli/environment@0.2.0': cli.Environment._.imports.WasmInterface;
			'wasi:cli/exit@0.2.0': cli.Exit._.imports.WasmInterface;
			'wasi:io/error@0.2.0': io.Error._.imports.WasmInterface;
			'wasi:io/poll@0.2.0': io.Poll._.imports.WasmInterface;
			'wasi:io/streams@0.2.0': io.Streams._.imports.WasmInterface;
			'wasi:cli/stdin@0.2.0': cli.Stdin._.imports.WasmInterface;
			'wasi:cli/stdout@0.2.0': cli.Stdout._.imports.WasmInterface;
			'wasi:cli/stderr@0.2.0': cli.Stderr._.imports.WasmInterface;
			'wasi:cli/terminal-input@0.2.0': cli.TerminalInput._.imports.WasmInterface;
			'wasi:cli/terminal-output@0.2.0': cli.TerminalOutput._.imports.WasmInterface;
			'wasi:cli/terminal-stdin@0.2.0': cli.TerminalStdin._.imports.WasmInterface;
			'wasi:cli/terminal-stdout@0.2.0': cli.TerminalStdout._.imports.WasmInterface;
			'wasi:cli/terminal-stderr@0.2.0': cli.TerminalStderr._.imports.WasmInterface;
			'wasi:clocks/monotonic-clock@0.2.0': clocks.MonotonicClock._.imports.WasmInterface;
			'wasi:clocks/wall-clock@0.2.0': clocks.WallClock._.imports.WasmInterface;
			'wasi:filesystem/types@0.2.0': filesystem.Types._.imports.WasmInterface;
			'wasi:filesystem/preopens@0.2.0': filesystem.Preopens._.imports.WasmInterface;
			'wasi:sockets/network@0.2.0': sockets.Network._.imports.WasmInterface;
			'wasi:sockets/instance-network@0.2.0': sockets.InstanceNetwork._.imports.WasmInterface;
			'wasi:sockets/udp@0.2.0': sockets.Udp._.imports.WasmInterface;
			'wasi:sockets/udp-create-socket@0.2.0': sockets.UdpCreateSocket._.imports.WasmInterface;
			'wasi:sockets/tcp@0.2.0': sockets.Tcp._.imports.WasmInterface;
			'wasi:sockets/tcp-create-socket@0.2.0': sockets.TcpCreateSocket._.imports.WasmInterface;
			'wasi:sockets/ip-name-lookup@0.2.0': sockets.IpNameLookup._.imports.WasmInterface;
			'wasi:random/random@0.2.0': random.Random._.imports.WasmInterface;
			'wasi:random/insecure@0.2.0': random.Insecure._.imports.WasmInterface;
			'wasi:random/insecure-seed@0.2.0': random.InsecureSeed._.imports.WasmInterface;
		};
		export namespace exports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Run', Run._]
			]);
			export function bind(exports: Exports, context: $wcm.WasmContext): command.Exports {
				return $wcm.$exports.bind<command.Exports>(_, exports, context);
			}
		}
		export type Exports = {
			'wasi:cli/run@0.2.0#run': () => i32;
		};
		export function bind(service: command.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<command.Exports>;
		export function bind(service: command.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<command.Exports.Promisified>;
		export function bind(service: command.Imports | command.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<command.Exports> | Promise<command.Exports.Promisified> {
			return $wcm.$main.bind(_, service, code, portOrContext, context);
		}
	}
}

export namespace cli._ {
	export const version = '0.2.0' as const;
	export const id = 'wasi:cli@0.2.0' as const;
	export const witName = 'cli' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Environment', Environment._],
		['Exit', Exit._],
		['Run', Run._],
		['Stdin', Stdin._],
		['Stdout', Stdout._],
		['Stderr', Stderr._],
		['TerminalInput', TerminalInput._],
		['TerminalOutput', TerminalOutput._],
		['TerminalStdin', TerminalStdin._],
		['TerminalStdout', TerminalStdout._],
		['TerminalStderr', TerminalStderr._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['command', command._],
	]);
}