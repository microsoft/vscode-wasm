/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { result, own, i32, ptr } from '@vscode/wasm-component-model';
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
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

			}
			export type Statics = {
				$drop(inst: Interface): void;
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
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

			}
			export type Statics = {
				$drop(inst: Interface): void;
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

}
export type cli = {
	Environment?: cli.Environment;
	Exit?: cli.Exit;
	Run?: cli.Run;
	Stdin?: cli.Stdin;
	Stdout?: cli.Stdout;
	Stderr?: cli.Stderr;
	TerminalInput?: cli.TerminalInput;
	TerminalOutput?: cli.TerminalOutput;
	TerminalStdin?: cli.TerminalStdin;
	TerminalStdout?: cli.TerminalStdout;
	TerminalStderr?: cli.TerminalStderr;
};

export namespace cli {
	export namespace Environment.$ {
		export const getEnvironment = new $wcm.FunctionType<cli.Environment.getEnvironment>('get-environment', [], new $wcm.ListType<[string, string]>(new $wcm.TupleType<[string, string]>([$wcm.wstring, $wcm.wstring])));
		export const getArguments = new $wcm.FunctionType<cli.Environment.getArguments>('get-arguments', [], new $wcm.ListType<string>($wcm.wstring));
		export const initialCwd = new $wcm.FunctionType<cli.Environment.initialCwd>('initial-cwd', [], new $wcm.OptionType<string>($wcm.wstring));
	}
	export namespace Environment._ {
		export const id = 'wasi:cli/environment' as const;
		export const witName = 'environment' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getEnvironment', $.getEnvironment],
			['getArguments', $.getArguments],
			['initialCwd', $.initialCwd]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'get-environment': (result: ptr<[string, string][]>) => void;
			'get-arguments': (result: ptr<string[]>) => void;
			'initial-cwd': (result: ptr<string | undefined>) => void;
		};
		export function createHost(service: cli.Environment, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Environment {
			return $wcm.Service.create<cli.Environment>(functions, [], wasmInterface, context);
		}
	}

	export namespace Exit.$ {
		export const exit = new $wcm.FunctionType<cli.Exit.exit>('exit',[
			['status', new $wcm.ResultType<void, void>(undefined, undefined)],
		], undefined);
	}
	export namespace Exit._ {
		export const id = 'wasi:cli/exit' as const;
		export const witName = 'exit' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['exit', $.exit]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'exit': (status_case: i32) => void;
		};
		export function createHost(service: cli.Exit, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Exit {
			return $wcm.Service.create<cli.Exit>(functions, [], wasmInterface, context);
		}
	}

	export namespace Run.$ {
		export const run = new $wcm.FunctionType<cli.Run.run>('run', [], new $wcm.ResultType<void, void>(undefined, undefined));
	}
	export namespace Run._ {
		export const id = 'wasi:cli/run' as const;
		export const witName = 'run' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['run', $.run]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'run': () => i32;
		};
		export function createHost(service: cli.Run, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Run {
			return $wcm.Service.create<cli.Run>(functions, [], wasmInterface, context);
		}
	}

	export namespace Stdin.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const getStdin = new $wcm.FunctionType<cli.Stdin.getStdin>('get-stdin', [], new $wcm.OwnType<cli.Stdin.InputStream>(InputStream));
	}
	export namespace Stdin._ {
		export const id = 'wasi:cli/stdin' as const;
		export const witName = 'stdin' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['InputStream', $.InputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStdin', $.getStdin]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'get-stdin': () => i32;
		};
		export function createHost(service: cli.Stdin, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Stdin {
			return $wcm.Service.create<cli.Stdin>(functions, [], wasmInterface, context);
		}
	}

	export namespace Stdout.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStdout = new $wcm.FunctionType<cli.Stdout.getStdout>('get-stdout', [], new $wcm.OwnType<cli.Stdout.OutputStream>(OutputStream));
	}
	export namespace Stdout._ {
		export const id = 'wasi:cli/stdout' as const;
		export const witName = 'stdout' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutputStream', $.OutputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStdout', $.getStdout]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'get-stdout': () => i32;
		};
		export function createHost(service: cli.Stdout, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Stdout {
			return $wcm.Service.create<cli.Stdout>(functions, [], wasmInterface, context);
		}
	}

	export namespace Stderr.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStderr = new $wcm.FunctionType<cli.Stderr.getStderr>('get-stderr', [], new $wcm.OwnType<cli.Stderr.OutputStream>(OutputStream));
	}
	export namespace Stderr._ {
		export const id = 'wasi:cli/stderr' as const;
		export const witName = 'stderr' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutputStream', $.OutputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getStderr', $.getStderr]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'get-stderr': () => i32;
		};
		export function createHost(service: cli.Stderr, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.Stderr {
			return $wcm.Service.create<cli.Stderr>(functions, [], wasmInterface, context);
		}
	}

	export namespace TerminalInput.$ {
		export const TerminalInput = new $wcm.ResourceType<cli.TerminalInput.TerminalInput>('terminal-input', 'wasi:cli/terminal-input/terminal-input');
		export const TerminalInput_Handle = new $wcm.ResourceHandleType('terminal-input');
		TerminalInput.addCallable('$drop', new $wcm.DestructorType<cli.TerminalInput.TerminalInput.Statics['$drop']>('[resource-drop]terminal-input', [['inst', TerminalInput]]));
	}
	export namespace TerminalInput._ {
		export const id = 'wasi:cli/terminal-input' as const;
		export const witName = 'terminal-input' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalInput', $.TerminalInput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TerminalInput', $.TerminalInput]
		]);
		export namespace TerminalInput {
			export type WasmInterface = {
				'[resource-drop]terminal-input': (self: i32) => void;
			};
			type ClassModule = {
				$drop(self: TerminalInput): void;
			};
			class Impl extends $wcm.Resource implements cli.TerminalInput.TerminalInput.Interface {
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalInput.TerminalInput.Class {
				const resource = cli.TerminalInput.$.TerminalInput;
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					public static $drop(self: TerminalInput): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
		} & TerminalInput.WasmInterface;
		export function createHost(service: cli.TerminalInput, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalInput {
			return $wcm.Service.create<cli.TerminalInput>(functions, [['TerminalInput', $.TerminalInput, TerminalInput.Class]], wasmInterface, context);
		}
	}

	export namespace TerminalOutput.$ {
		export const TerminalOutput = new $wcm.ResourceType<cli.TerminalOutput.TerminalOutput>('terminal-output', 'wasi:cli/terminal-output/terminal-output');
		export const TerminalOutput_Handle = new $wcm.ResourceHandleType('terminal-output');
		TerminalOutput.addCallable('$drop', new $wcm.DestructorType<cli.TerminalOutput.TerminalOutput.Statics['$drop']>('[resource-drop]terminal-output', [['inst', TerminalOutput]]));
	}
	export namespace TerminalOutput._ {
		export const id = 'wasi:cli/terminal-output' as const;
		export const witName = 'terminal-output' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export namespace TerminalOutput {
			export type WasmInterface = {
				'[resource-drop]terminal-output': (self: i32) => void;
			};
			type ClassModule = {
				$drop(self: TerminalOutput): void;
			};
			class Impl extends $wcm.Resource implements cli.TerminalOutput.TerminalOutput.Interface {
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalOutput.TerminalOutput.Class {
				const resource = cli.TerminalOutput.$.TerminalOutput;
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					public static $drop(self: TerminalOutput): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
		} & TerminalOutput.WasmInterface;
		export function createHost(service: cli.TerminalOutput, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalOutput {
			return $wcm.Service.create<cli.TerminalOutput>(functions, [['TerminalOutput', $.TerminalOutput, TerminalOutput.Class]], wasmInterface, context);
		}
	}

	export namespace TerminalStdin.$ {
		export const TerminalInput = cli.TerminalInput.$.TerminalInput;
		export const getTerminalStdin = new $wcm.FunctionType<cli.TerminalStdin.getTerminalStdin>('get-terminal-stdin', [], new $wcm.OptionType<own<cli.TerminalStdin.TerminalInput>>(new $wcm.OwnType<cli.TerminalStdin.TerminalInput>(TerminalInput)));
	}
	export namespace TerminalStdin._ {
		export const id = 'wasi:cli/terminal-stdin' as const;
		export const witName = 'terminal-stdin' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalInput', $.TerminalInput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdin', $.getTerminalStdin]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'get-terminal-stdin': (result: ptr<own<TerminalInput> | undefined>) => void;
		};
		export function createHost(service: cli.TerminalStdin, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalStdin {
			return $wcm.Service.create<cli.TerminalStdin>(functions, [], wasmInterface, context);
		}
	}

	export namespace TerminalStdout.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStdout = new $wcm.FunctionType<cli.TerminalStdout.getTerminalStdout>('get-terminal-stdout', [], new $wcm.OptionType<own<cli.TerminalStdout.TerminalOutput>>(new $wcm.OwnType<cli.TerminalStdout.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStdout._ {
		export const id = 'wasi:cli/terminal-stdout' as const;
		export const witName = 'terminal-stdout' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStdout', $.getTerminalStdout]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'get-terminal-stdout': (result: ptr<own<TerminalOutput> | undefined>) => void;
		};
		export function createHost(service: cli.TerminalStdout, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalStdout {
			return $wcm.Service.create<cli.TerminalStdout>(functions, [], wasmInterface, context);
		}
	}

	export namespace TerminalStderr.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStderr = new $wcm.FunctionType<cli.TerminalStderr.getTerminalStderr>('get-terminal-stderr', [], new $wcm.OptionType<own<cli.TerminalStderr.TerminalOutput>>(new $wcm.OwnType<cli.TerminalStderr.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStderr._ {
		export const id = 'wasi:cli/terminal-stderr' as const;
		export const witName = 'terminal-stderr' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TerminalOutput', $.TerminalOutput]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getTerminalStderr', $.getTerminalStderr]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
			'get-terminal-stderr': (result: ptr<own<TerminalOutput> | undefined>) => void;
		};
		export function createHost(service: cli.TerminalStderr, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli.TerminalStderr {
			return $wcm.Service.create<cli.TerminalStderr>(functions, [], wasmInterface, context);
		}
	}
}

export namespace cli._ {
	export const id = 'wasi:cli' as const;
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
	export type WasmInterface = {
		'wasi:cli/environment'?: Environment._.WasmInterface;
		'wasi:cli/exit'?: Exit._.WasmInterface;
		'wasi:cli/run'?: Run._.WasmInterface;
		'wasi:cli/stdin'?: Stdin._.WasmInterface;
		'wasi:cli/stdout'?: Stdout._.WasmInterface;
		'wasi:cli/stderr'?: Stderr._.WasmInterface;
		'wasi:cli/terminal-input'?: TerminalInput._.WasmInterface;
		'wasi:cli/terminal-output'?: TerminalOutput._.WasmInterface;
		'wasi:cli/terminal-stdin'?: TerminalStdin._.WasmInterface;
		'wasi:cli/terminal-stdout'?: TerminalStdout._.WasmInterface;
		'wasi:cli/terminal-stderr'?: TerminalStderr._.WasmInterface;
	};
	export function createHost(service: cli, context: $wcm.WasmContext): WasmInterface {
		const result: WasmInterface = Object.create(null);
		if (service.Environment !== undefined) {
			result['wasi:cli/environment'] = Environment._.createHost(service.Environment, context);
		}
		if (service.Exit !== undefined) {
			result['wasi:cli/exit'] = Exit._.createHost(service.Exit, context);
		}
		if (service.Run !== undefined) {
			result['wasi:cli/run'] = Run._.createHost(service.Run, context);
		}
		if (service.Stdin !== undefined) {
			result['wasi:cli/stdin'] = Stdin._.createHost(service.Stdin, context);
		}
		if (service.Stdout !== undefined) {
			result['wasi:cli/stdout'] = Stdout._.createHost(service.Stdout, context);
		}
		if (service.Stderr !== undefined) {
			result['wasi:cli/stderr'] = Stderr._.createHost(service.Stderr, context);
		}
		if (service.TerminalInput !== undefined) {
			result['wasi:cli/terminal-input'] = TerminalInput._.createHost(service.TerminalInput, context);
		}
		if (service.TerminalOutput !== undefined) {
			result['wasi:cli/terminal-output'] = TerminalOutput._.createHost(service.TerminalOutput, context);
		}
		if (service.TerminalStdin !== undefined) {
			result['wasi:cli/terminal-stdin'] = TerminalStdin._.createHost(service.TerminalStdin, context);
		}
		if (service.TerminalStdout !== undefined) {
			result['wasi:cli/terminal-stdout'] = TerminalStdout._.createHost(service.TerminalStdout, context);
		}
		if (service.TerminalStderr !== undefined) {
			result['wasi:cli/terminal-stderr'] = TerminalStderr._.createHost(service.TerminalStderr, context);
		}
		return result;
	}
	export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): cli {
		const result: cli = Object.create(null);
		if (wasmInterface['wasi:cli/environment'] !== undefined) {
			result.Environment = Environment._.createService(wasmInterface['wasi:cli/environment'], context);
		}
		if (wasmInterface['wasi:cli/exit'] !== undefined) {
			result.Exit = Exit._.createService(wasmInterface['wasi:cli/exit'], context);
		}
		if (wasmInterface['wasi:cli/run'] !== undefined) {
			result.Run = Run._.createService(wasmInterface['wasi:cli/run'], context);
		}
		if (wasmInterface['wasi:cli/stdin'] !== undefined) {
			result.Stdin = Stdin._.createService(wasmInterface['wasi:cli/stdin'], context);
		}
		if (wasmInterface['wasi:cli/stdout'] !== undefined) {
			result.Stdout = Stdout._.createService(wasmInterface['wasi:cli/stdout'], context);
		}
		if (wasmInterface['wasi:cli/stderr'] !== undefined) {
			result.Stderr = Stderr._.createService(wasmInterface['wasi:cli/stderr'], context);
		}
		if (wasmInterface['wasi:cli/terminal-input'] !== undefined) {
			result.TerminalInput = TerminalInput._.createService(wasmInterface['wasi:cli/terminal-input'], context);
		}
		if (wasmInterface['wasi:cli/terminal-output'] !== undefined) {
			result.TerminalOutput = TerminalOutput._.createService(wasmInterface['wasi:cli/terminal-output'], context);
		}
		if (wasmInterface['wasi:cli/terminal-stdin'] !== undefined) {
			result.TerminalStdin = TerminalStdin._.createService(wasmInterface['wasi:cli/terminal-stdin'], context);
		}
		if (wasmInterface['wasi:cli/terminal-stdout'] !== undefined) {
			result.TerminalStdout = TerminalStdout._.createService(wasmInterface['wasi:cli/terminal-stdout'], context);
		}
		if (wasmInterface['wasi:cli/terminal-stderr'] !== undefined) {
			result.TerminalStderr = TerminalStderr._.createService(wasmInterface['wasi:cli/terminal-stderr'], context);
		}
		return result;
	}
}