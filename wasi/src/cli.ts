import * as $wcm from '@vscode/wasm-component-model';
import type { result, u32 } from '@vscode/wasm-component-model';
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
		 * 
		 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
		 */
		export type TerminalInput = u32;
		
		/**
		 * Dispose of the specified terminal-input after which it may no longer
		 * be used.
		 */
		export declare function dropTerminalInput(this_: TerminalInput): void;
	}
	export type TerminalInput = Pick<typeof TerminalInput, 'dropTerminalInput'>;
	
	export namespace TerminalOutput {
		
		/**
		 * The output side of a terminal.
		 * 
		 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
		 */
		export type TerminalOutput = u32;
		
		/**
		 * Dispose of the specified terminal-output, after which it may no longer
		 * be used.
		 */
		export declare function dropTerminalOutput(this_: TerminalOutput): void;
	}
	export type TerminalOutput = Pick<typeof TerminalOutput, 'dropTerminalOutput'>;
	
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
	export namespace Exit.$ {
		export const exit = new $wcm.FunctionType<typeof cli.Exit.exit>('exit', 'exit',[
			['status', new $wcm.ResultType<void, void>(undefined, undefined)],
		], undefined);
	}
	export namespace Run.$ {
		export const run = new $wcm.FunctionType<typeof cli.Run.run>('run', 'run', [], new $wcm.ResultType<void, void>(undefined, undefined));
	}
	export namespace Stdin.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const getStdin = new $wcm.FunctionType<typeof cli.Stdin.getStdin>('getStdin', 'get-stdin', [], InputStream);
	}
	export namespace Stdout.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStdout = new $wcm.FunctionType<typeof cli.Stdout.getStdout>('getStdout', 'get-stdout', [], OutputStream);
	}
	export namespace Stderr.$ {
		export const OutputStream = io.Streams.$.OutputStream;
		export const getStderr = new $wcm.FunctionType<typeof cli.Stderr.getStderr>('getStderr', 'get-stderr', [], OutputStream);
	}
	export namespace TerminalInput.$ {
		export const TerminalInput = $wcm.u32;
		export const dropTerminalInput = new $wcm.FunctionType<typeof cli.TerminalInput.dropTerminalInput>('dropTerminalInput', 'drop-terminal-input',[
			['this_', TerminalInput],
		], undefined);
	}
	export namespace TerminalOutput.$ {
		export const TerminalOutput = $wcm.u32;
		export const dropTerminalOutput = new $wcm.FunctionType<typeof cli.TerminalOutput.dropTerminalOutput>('dropTerminalOutput', 'drop-terminal-output',[
			['this_', TerminalOutput],
		], undefined);
	}
	export namespace TerminalStdin.$ {
		export const TerminalInput = cli.TerminalInput.$.TerminalInput;
		export const getTerminalStdin = new $wcm.FunctionType<typeof cli.TerminalStdin.getTerminalStdin>('getTerminalStdin', 'get-terminal-stdin', [], new $wcm.OptionType<cli.TerminalStdin.TerminalInput>(TerminalInput));
	}
	export namespace TerminalStdout.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStdout = new $wcm.FunctionType<typeof cli.TerminalStdout.getTerminalStdout>('getTerminalStdout', 'get-terminal-stdout', [], new $wcm.OptionType<cli.TerminalStdout.TerminalOutput>(TerminalOutput));
	}
	export namespace TerminalStderr.$ {
		export const TerminalOutput = cli.TerminalOutput.$.TerminalOutput;
		export const getTerminalStderr = new $wcm.FunctionType<typeof cli.TerminalStderr.getTerminalStderr>('getTerminalStderr', 'get-terminal-stderr', [], new $wcm.OptionType<cli.TerminalStderr.TerminalOutput>(TerminalOutput));
	}
}