/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { result, own, resource, i32, ptr } from '@vscode/wasm-component-model';
import { io } from './io';

export namespace cli {
	export namespace Environment {
		export const id = 'wasi:cli/environment' as const;
		
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
		export const id = 'wasi:cli/exit' as const;
		
		/**
		 * Exit the current instance and any linked instances.
		 */
		export type exit = (status: result<void, void>) => void;
	}
	export type Exit = {
		exit: Exit.exit;
	};
	
	export namespace Run {
		export const id = 'wasi:cli/run' as const;
		
		/**
		 * Run the program.
		 */
		export type run = () => result<void, void>;
	}
	export type Run = {
		run: Run.run;
	};
	
	export namespace Stdin {
		export const id = 'wasi:cli/stdin' as const;
		
		export type InputStream = io.Streams.InputStream;
		
		export type getStdin = () => own<InputStream>;
	}
	export type Stdin = {
		getStdin: Stdin.getStdin;
	};
	
	export namespace Stdout {
		export const id = 'wasi:cli/stdout' as const;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type getStdout = () => own<OutputStream>;
	}
	export type Stdout = {
		getStdout: Stdout.getStdout;
	};
	
	export namespace Stderr {
		export const id = 'wasi:cli/stderr' as const;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type getStderr = () => own<OutputStream>;
	}
	export type Stderr = {
		getStderr: Stderr.getStderr;
	};
	
	export namespace TerminalInput {
		export const id = 'wasi:cli/terminal-input' as const;
		
		export namespace TerminalInput {
			export type Module = {
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
			};
		}
		export type TerminalInput = resource;
	}
	export type TerminalInput = {
	};
	
	export namespace TerminalOutput {
		export const id = 'wasi:cli/terminal-output' as const;
		
		export namespace TerminalOutput {
			export type Module = {
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
			};
		}
		export type TerminalOutput = resource;
	}
	export type TerminalOutput = {
	};
	
	/**
	 * An interface providing an optional `terminal-input` for stdin as a
	 * link-time authority.
	 */
	export namespace TerminalStdin {
		export const id = 'wasi:cli/terminal-stdin' as const;
		
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
		export const id = 'wasi:cli/terminal-stdout' as const;
		
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
		export const id = 'wasi:cli/terminal-stderr' as const;
		
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

export namespace cli {
	export namespace Environment.$ {
		export const getEnvironment = new $wcm.FunctionType<Environment.getEnvironment>('getEnvironment', 'get-environment', [], new $wcm.ListType<[string, string]>(new $wcm.TupleType<[string, string]>([$wcm.wstring, $wcm.wstring])));
		export const getArguments = new $wcm.FunctionType<Environment.getArguments>('getArguments', 'get-arguments', [], new $wcm.ListType<string>($wcm.wstring));
		export const initialCwd = new $wcm.FunctionType<Environment.initialCwd>('initialCwd', 'initial-cwd', [], new $wcm.OptionType<string>($wcm.wstring));
	}
	export namespace Environment._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getEnvironment, $.getArguments, $.initialCwd];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'get-environment': (result: ptr<[i32, i32]>) => void;
			'get-arguments': (result: ptr<[i32, i32]>) => void;
			'initial-cwd': (result: ptr<[i32, i32, i32]>) => void;
		};
		export function createHost(service: cli.Environment, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.Environment {
			return $wcm.Service.create<cli.Environment>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace Exit.$ {
		export const exit = new $wcm.FunctionType<Exit.exit>('exit', 'exit',[
			['status', new $wcm.ResultType<void, void>(undefined, undefined)],
		], undefined);
	}
	export namespace Exit._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.exit];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'exit': (status_case: i32) => void;
		};
		export function createHost(service: cli.Exit, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.Exit {
			return $wcm.Service.create<cli.Exit>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace Run.$ {
		export const run = new $wcm.FunctionType<Run.run>('run', 'run', [], new $wcm.ResultType<void, void>(undefined, undefined));
	}
	export namespace Run._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.run];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'run': () => i32;
		};
		export function createHost(service: cli.Run, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.Run {
			return $wcm.Service.create<cli.Run>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace Stdin.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const getStdin = new $wcm.FunctionType<Stdin.getStdin>('getStdin', 'get-stdin', [], new $wcm.OwnType<cli.Stdin.InputStream>(InputStream));
	}
	export namespace Stdin._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getStdin];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'get-stdin': () => i32;
		};
		export function createHost(service: cli.Stdin, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.Stdin {
			return $wcm.Service.create<cli.Stdin>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace Stdout.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStdout = new $wcm.FunctionType<Stdout.getStdout>('getStdout', 'get-stdout', [], new $wcm.OwnType<cli.Stdout.OutputStream>(OutputStream));
	}
	export namespace Stdout._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getStdout];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'get-stdout': () => i32;
		};
		export function createHost(service: cli.Stdout, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.Stdout {
			return $wcm.Service.create<cli.Stdout>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace Stderr.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStderr = new $wcm.FunctionType<Stderr.getStderr>('getStderr', 'get-stderr', [], new $wcm.OwnType<cli.Stderr.OutputStream>(OutputStream));
	}
	export namespace Stderr._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getStderr];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'get-stderr': () => i32;
		};
		export function createHost(service: cli.Stderr, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.Stderr {
			return $wcm.Service.create<cli.Stderr>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace TerminalInput.$ {
		export const TerminalInput = new $wcm.ResourceType('TerminalInput', 'terminal-input');
	}
	export namespace TerminalInput._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.ResourceType[] = [$.TerminalInput];
		export type WasmInterface = {
		} & cli.TerminalInput.TerminalInput.WasmInterface;
		export namespace TerminalInput  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): cli.TerminalInput.TerminalInput.Module {
				return $wcm.Module.create<cli.TerminalInput.TerminalInput.Module>($.TerminalInput, wasmInterface, context);
			}
			export function Manager(): cli.TerminalInput.TerminalInput.Manager {
				return new $wcm.ResourceManager<cli.TerminalInput.TerminalInput.Interface>();
			}
		}
		export function createHost(service: cli.TerminalInput, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.TerminalInput {
			return $wcm.Service.create<cli.TerminalInput>(functions, [], wasmInterface, context);
		}
		type ClassService = cli.TerminalInput;
		export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {
			return $wcm.Service.create<ClassService>(functions, [], wasmInterface, context);
		}
		type ModuleService = cli.TerminalInput;
		export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {
			return $wcm.Service.create<ModuleService>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace TerminalOutput.$ {
		export const TerminalOutput = new $wcm.ResourceType('TerminalOutput', 'terminal-output');
	}
	export namespace TerminalOutput._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.ResourceType[] = [$.TerminalOutput];
		export type WasmInterface = {
		} & cli.TerminalOutput.TerminalOutput.WasmInterface;
		export namespace TerminalOutput  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): cli.TerminalOutput.TerminalOutput.Module {
				return $wcm.Module.create<cli.TerminalOutput.TerminalOutput.Module>($.TerminalOutput, wasmInterface, context);
			}
			export function Manager(): cli.TerminalOutput.TerminalOutput.Manager {
				return new $wcm.ResourceManager<cli.TerminalOutput.TerminalOutput.Interface>();
			}
		}
		export function createHost(service: cli.TerminalOutput, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.TerminalOutput {
			return $wcm.Service.create<cli.TerminalOutput>(functions, [], wasmInterface, context);
		}
		type ClassService = cli.TerminalOutput;
		export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {
			return $wcm.Service.create<ClassService>(functions, [], wasmInterface, context);
		}
		type ModuleService = cli.TerminalOutput;
		export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {
			return $wcm.Service.create<ModuleService>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace TerminalStdin.$ {
		export const TerminalInput = cli.TerminalInput.$.TerminalInput;
		export const getTerminalStdin = new $wcm.FunctionType<TerminalStdin.getTerminalStdin>('getTerminalStdin', 'get-terminal-stdin', [], new $wcm.OptionType<own<cli.TerminalStdin.TerminalInput>>(new $wcm.OwnType<cli.TerminalStdin.TerminalInput>(TerminalInput)));
	}
	export namespace TerminalStdin._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getTerminalStdin];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'get-terminal-stdin': (result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: cli.TerminalStdin, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.TerminalStdin {
			return $wcm.Service.create<cli.TerminalStdin>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace TerminalStdout.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStdout = new $wcm.FunctionType<TerminalStdout.getTerminalStdout>('getTerminalStdout', 'get-terminal-stdout', [], new $wcm.OptionType<own<cli.TerminalStdout.TerminalOutput>>(new $wcm.OwnType<cli.TerminalStdout.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStdout._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getTerminalStdout];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'get-terminal-stdout': (result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: cli.TerminalStdout, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.TerminalStdout {
			return $wcm.Service.create<cli.TerminalStdout>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace TerminalStderr.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStderr = new $wcm.FunctionType<TerminalStderr.getTerminalStderr>('getTerminalStderr', 'get-terminal-stderr', [], new $wcm.OptionType<own<cli.TerminalStderr.TerminalOutput>>(new $wcm.OwnType<cli.TerminalStderr.TerminalOutput>(TerminalOutput)));
	}
	export namespace TerminalStderr._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.getTerminalStderr];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'get-terminal-stderr': (result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: cli.TerminalStderr, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): cli.TerminalStderr {
			return $wcm.Service.create<cli.TerminalStderr>(functions, [], wasmInterface, context);
		}
	}
}