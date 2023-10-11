/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { result, resource, i32, ptr } from '@vscode/wasm-component-model';
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
		export declare function getEnvironment(): [string, string][];
		
		/**
		 * Get the POSIX-style arguments to the program.
		 */
		export declare function getArguments(): string[];
		
		/**
		 * Return a path that programs should use as their initial current working
		 * directory, interpreting `.` as shorthand for this.
		 */
		export declare function initialCwd(): string | undefined;
	}
	export type Environment = Pick<typeof Environment, 'getEnvironment' | 'getArguments' | 'initialCwd'>;
	
	export namespace Exit {
		
		/**
		 * Exit the current instance and any linked instances.
		 */
		export declare function exit(status: result<void, void>): void;
	}
	export type Exit = Pick<typeof Exit, 'exit'>;
	
	export namespace Run {
		
		/**
		 * Run the program.
		 */
		export declare function run(): result<void, void>;
	}
	export type Run = Pick<typeof Run, 'run'>;
	
	export namespace Stdin {
		
		export type InputStream = io.Streams.InputStream;
		
		export declare function getStdin(): InputStream;
	}
	export type Stdin = Pick<typeof Stdin, 'getStdin'>;
	
	export namespace Stdout {
		
		export type OutputStream = io.Streams.OutputStream;
		
		export declare function getStdout(): OutputStream;
	}
	export type Stdout = Pick<typeof Stdout, 'getStdout'>;
	
	export namespace Stderr {
		
		export type OutputStream = io.Streams.OutputStream;
		
		export declare function getStderr(): OutputStream;
	}
	export type Stderr = Pick<typeof Stderr, 'getStderr'>;
	
	export namespace TerminalInput {
		
		/**
		 * The input side of a terminal.
		 */
		export type TerminalInput = resource;
	}
	export type TerminalInput = typeof TerminalInput;
	
	export namespace TerminalOutput {
		
		/**
		 * The output side of a terminal.
		 */
		export type TerminalOutput = resource;
	}
	export type TerminalOutput = typeof TerminalOutput;
	
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
		export declare function getTerminalStdin(): TerminalInput | undefined;
	}
	export type TerminalStdin = Pick<typeof TerminalStdin, 'getTerminalStdin'>;
	
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
		export declare function getTerminalStdout(): TerminalOutput | undefined;
	}
	export type TerminalStdout = Pick<typeof TerminalStdout, 'getTerminalStdout'>;
	
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
		export declare function getTerminalStderr(): TerminalOutput | undefined;
	}
	export type TerminalStderr = Pick<typeof TerminalStderr, 'getTerminalStderr'>;
	
}

export namespace cli {
	export namespace Environment.$ {
		export const getEnvironment = new $wcm.FunctionType<typeof cli.Environment.getEnvironment>('getEnvironment', 'get-environment', [], new $wcm.ListType<[string, string]>(new $wcm.TupleType<[string, string]>([$wcm.wstring, $wcm.wstring])));
		export const getArguments = new $wcm.FunctionType<typeof cli.Environment.getArguments>('getArguments', 'get-arguments', [], new $wcm.ListType<string>($wcm.wstring));
		export const initialCwd = new $wcm.FunctionType<typeof cli.Environment.initialCwd>('initialCwd', 'initial-cwd', [], new $wcm.OptionType<string>($wcm.wstring));
	}
	export namespace Environment._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getEnvironment, $.getArguments, $.initialCwd];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'get-environment': (result: ptr<[i32, i32]>) => void;
			'get-arguments': (result: ptr<[i32, i32]>) => void;
			'initial-cwd': (result: ptr<[i32, i32, i32]>) => void;
		};
		export function createHost<T extends $wcm.Host>(service: cli.Environment, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.Environment {
			return $wcm.Service.create<cli.Environment>(functions, resources, wasmInterface, context);
		}
	}
	export namespace Exit.$ {
		export const exit = new $wcm.FunctionType<typeof cli.Exit.exit>('exit', 'exit',[
			['status', new $wcm.ResultType<void, void>(undefined, undefined)],
		], undefined);
	}
	export namespace Exit._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.exit];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'exit': (status_discriminant: i32) => void;
		};
		export function createHost<T extends $wcm.Host>(service: cli.Exit, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.Exit {
			return $wcm.Service.create<cli.Exit>(functions, resources, wasmInterface, context);
		}
	}
	export namespace Run.$ {
		export const run = new $wcm.FunctionType<typeof cli.Run.run>('run', 'run', [], new $wcm.ResultType<void, void>(undefined, undefined));
	}
	export namespace Run._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.run];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'run': () => i32;
		};
		export function createHost<T extends $wcm.Host>(service: cli.Run, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.Run {
			return $wcm.Service.create<cli.Run>(functions, resources, wasmInterface, context);
		}
	}
	export namespace Stdin.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const getStdin = new $wcm.FunctionType<typeof cli.Stdin.getStdin>('getStdin', 'get-stdin', [], new $wcm.OwnType<cli.Stdin.InputStream>(InputStream));
	}
	export namespace Stdin._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getStdin];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'get-stdin': () => i32;
		};
		export function createHost<T extends $wcm.Host>(service: cli.Stdin, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.Stdin {
			return $wcm.Service.create<cli.Stdin>(functions, resources, wasmInterface, context);
		}
	}
	export namespace Stdout.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStdout = new $wcm.FunctionType<typeof cli.Stdout.getStdout>('getStdout', 'get-stdout', [], new $wcm.OwnType<cli.Stdout.OutputStream>(OutputStream));
	}
	export namespace Stdout._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getStdout];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'get-stdout': () => i32;
		};
		export function createHost<T extends $wcm.Host>(service: cli.Stdout, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.Stdout {
			return $wcm.Service.create<cli.Stdout>(functions, resources, wasmInterface, context);
		}
	}
	export namespace Stderr.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStderr = new $wcm.FunctionType<typeof cli.Stderr.getStderr>('getStderr', 'get-stderr', [], new $wcm.OwnType<cli.Stderr.OutputStream>(OutputStream));
	}
	export namespace Stderr._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getStderr];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'get-stderr': () => i32;
		};
		export function createHost<T extends $wcm.Host>(service: cli.Stderr, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.Stderr {
			return $wcm.Service.create<cli.Stderr>(functions, resources, wasmInterface, context);
		}
	}
	export namespace TerminalInput.$ {
		export const TerminalInput = new $wcm.NamespaceResourceType('TerminalInput', 'terminal-input');
	}
	export namespace TerminalInput._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.NamespaceResourceType[] = [$.TerminalInput];
		export type WasmInterface = {
		};
		export function createHost<T extends $wcm.Host>(service: cli.TerminalInput, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.TerminalInput {
			return $wcm.Service.create<cli.TerminalInput>(functions, resources, wasmInterface, context);
		}
	}
	export namespace TerminalOutput.$ {
		export const TerminalOutput = new $wcm.NamespaceResourceType('TerminalOutput', 'terminal-output');
	}
	export namespace TerminalOutput._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.NamespaceResourceType[] = [$.TerminalOutput];
		export type WasmInterface = {
		};
		export function createHost<T extends $wcm.Host>(service: cli.TerminalOutput, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.TerminalOutput {
			return $wcm.Service.create<cli.TerminalOutput>(functions, resources, wasmInterface, context);
		}
	}
	export namespace TerminalStdin.$ {
		export const TerminalInput = cli.TerminalInput.$.TerminalInput;
		export const getTerminalStdin = new $wcm.FunctionType<typeof cli.TerminalStdin.getTerminalStdin>('getTerminalStdin', 'get-terminal-stdin', [], new $wcm.OptionType<cli.TerminalStdin.TerminalInput>(new $wcm.OwnType<cli.TerminalStdin.TerminalInput>(TerminalInput)));
	}
	export namespace TerminalStdin._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getTerminalStdin];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'get-terminal-stdin': (result: ptr<[i32, i32]>) => void;
		};
		export function createHost<T extends $wcm.Host>(service: cli.TerminalStdin, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.TerminalStdin {
			return $wcm.Service.create<cli.TerminalStdin>(functions, resources, wasmInterface, context);
		}
	}
	export namespace TerminalStdout.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStdout = new $wcm.FunctionType<typeof cli.TerminalStdout.getTerminalStdout>('getTerminalStdout', 'get-terminal-stdout', [], new $wcm.OptionType<cli.TerminalStdout.TerminalOutput>(new $wcm.OwnType<cli.TerminalStdout.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStdout._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getTerminalStdout];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'get-terminal-stdout': (result: ptr<[i32, i32]>) => void;
		};
		export function createHost<T extends $wcm.Host>(service: cli.TerminalStdout, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.TerminalStdout {
			return $wcm.Service.create<cli.TerminalStdout>(functions, resources, wasmInterface, context);
		}
	}
	export namespace TerminalStderr.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStderr = new $wcm.FunctionType<typeof cli.TerminalStderr.getTerminalStderr>('getTerminalStderr', 'get-terminal-stderr', [], new $wcm.OptionType<cli.TerminalStderr.TerminalOutput>(new $wcm.OwnType<cli.TerminalStderr.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStderr._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getTerminalStderr];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'get-terminal-stderr': (result: ptr<[i32, i32]>) => void;
		};
		export function createHost<T extends $wcm.Host>(service: cli.TerminalStderr, context: $wcm.Context): T {
			return $wcm.Host.create<T>(functions, resources, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): cli.TerminalStderr {
			return $wcm.Service.create<cli.TerminalStderr>(functions, resources, wasmInterface, context);
		}
	}
}