/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { result, i32, ptr } from '@vscode/wasm-component-model';
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
		export type run = () => void;
	}
	export type Run = {
		run: Run.run;
	};

	export namespace Stdin {
		export type InputStream = io.Streams.InputStream;

		export type getStdin = () => InputStream;
	}
	export type Stdin = {
		getStdin: Stdin.getStdin;
	};

	export namespace Stdout {
		export type OutputStream = io.Streams.OutputStream;

		export type getStdout = () => OutputStream;
	}
	export type Stdout = {
		getStdout: Stdout.getStdout;
	};

	export namespace Stderr {
		export type OutputStream = io.Streams.OutputStream;

		export type getStderr = () => OutputStream;
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
		export type getTerminalStdin = () => TerminalInput | undefined;
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
		export type getTerminalStdout = () => TerminalOutput | undefined;
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
		export type getTerminalStderr = () => TerminalOutput | undefined;
	}
	export type TerminalStderr = {
		getTerminalStderr: TerminalStderr.getTerminalStderr;
	};
	export namespace command {
		export type Imports = {
		};
		export namespace Imports {
			export type Promisified = $wcm.$imports.Promisify<Imports>;
		}
		export namespace imports {
			export type Promisify<T> = $wcm.$imports.Promisify<T>;
		}
		export type Exports = {
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
		export const id = 'wasi:cli/environment@0.2.1' as const;
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
		export const id = 'wasi:cli/exit@0.2.1' as const;
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
		export const id = 'wasi:cli/run@0.2.1' as const;
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
		export const id = 'wasi:cli/stdin@0.2.1' as const;
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
		export const id = 'wasi:cli/stdout@0.2.1' as const;
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
		export const id = 'wasi:cli/stderr@0.2.1' as const;
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
		export const TerminalInput = new $wcm.ResourceType<cli.TerminalInput.TerminalInput>('terminal-input', 'wasi:cli@0.2.1/terminal-input/terminal-input');
		export const TerminalInput_Handle = new $wcm.ResourceHandleType('terminal-input');
		TerminalInput.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]terminal-input', [['inst', TerminalInput]]));
	}
	export namespace TerminalInput._ {
		export const id = 'wasi:cli/terminal-input@0.2.1' as const;
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
		export const TerminalOutput = new $wcm.ResourceType<cli.TerminalOutput.TerminalOutput>('terminal-output', 'wasi:cli@0.2.1/terminal-output/terminal-output');
		export const TerminalOutput_Handle = new $wcm.ResourceHandleType('terminal-output');
		TerminalOutput.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]terminal-output', [['inst', TerminalOutput]]));
	}
	export namespace TerminalOutput._ {
		export const id = 'wasi:cli/terminal-output@0.2.1' as const;
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
		export const getTerminalStdin = new $wcm.FunctionType<cli.TerminalStdin.getTerminalStdin>('get-terminal-stdin', [], new $wcm.OptionType<cli.TerminalStdin.TerminalInput>(new $wcm.OwnType<cli.TerminalStdin.TerminalInput>(TerminalInput)));
	}
	export namespace TerminalStdin._ {
		export const id = 'wasi:cli/terminal-stdin@0.2.1' as const;
		export const witName = 'terminal-stdin' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalInput', $.TerminalInput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdin', $.getTerminalStdin]
		]);
		export type WasmInterface = {
			'get-terminal-stdin': (result: ptr<TerminalInput | undefined>) => void;
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
		export const getTerminalStdout = new $wcm.FunctionType<cli.TerminalStdout.getTerminalStdout>('get-terminal-stdout', [], new $wcm.OptionType<cli.TerminalStdout.TerminalOutput>(new $wcm.OwnType<cli.TerminalStdout.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStdout._ {
		export const id = 'wasi:cli/terminal-stdout@0.2.1' as const;
		export const witName = 'terminal-stdout' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdout', $.getTerminalStdout]
		]);
		export type WasmInterface = {
			'get-terminal-stdout': (result: ptr<TerminalOutput | undefined>) => void;
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
		export const getTerminalStderr = new $wcm.FunctionType<cli.TerminalStderr.getTerminalStderr>('get-terminal-stderr', [], new $wcm.OptionType<cli.TerminalStderr.TerminalOutput>(new $wcm.OwnType<cli.TerminalStderr.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStderr._ {
		export const id = 'wasi:cli/terminal-stderr@0.2.1' as const;
		export const witName = 'terminal-stderr' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStderr', $.getTerminalStderr]
		]);
		export type WasmInterface = {
			'get-terminal-stderr': (result: ptr<TerminalOutput | undefined>) => void;
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
		export const id = 'wasi:cli/command@0.2.1' as const;
		export const witName = 'command' as const;
		export function bind(service: command.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<command.Exports>;
		export function bind(service: command.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<command.Exports.Promisified>;
		export function bind(service: command.Imports | command.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<command.Exports> | Promise<command.Exports.Promisified> {
			return $wcm.$main.bind(_, service, code, portOrContext, context);
		}
	}
}

export namespace cli._ {
	export const version = '0.2.1' as const;
	export const id = 'wasi:cli@0.2.1' as const;
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