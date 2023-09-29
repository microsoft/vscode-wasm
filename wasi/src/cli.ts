import * as $wcm from '@vscode/wasm-component-model';
import type { result, u32 } from '@vscode/wasm-component-model';
import { Streams } from './io';

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

export namespace Exit {
	
	/**
	 * Exit the current instance and any linked instances.
	 */
	export declare function exit(status: result<void, void>): void;
}

export namespace Run {
	
	/**
	 * Run the program.
	 */
	export declare function run(): result<void, void>;
}

export namespace Stdin {
	
	type InputStream = Streams.InputStream;
	
	export declare function getStdin(): InputStream;
}

export namespace Stdout {
	
	type OutputStream = Streams.OutputStream;
	
	export declare function getStdout(): OutputStream;
}

export namespace Stderr {
	
	type OutputStream = Streams.OutputStream;
	
	export declare function getStderr(): OutputStream;
}

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

/**
 * An interface providing an optional `terminal-input` for stdin as a
 * link-time authority.
 */
export namespace TerminalStdin {
	
	type TerminalInput = TerminalInput.TerminalInput;
	
	/**
	 * If stdin is connected to a terminal, return a `terminal-input` handle
	 * allowing further interaction with it.
	 */
	export declare function getTerminalStdin(): TerminalInput | undefined;
}

/**
 * An interface providing an optional `terminal-output` for stdout as a
 * link-time authority.
 */
export namespace TerminalStdout {
	
	type TerminalOutput = TerminalOutput.TerminalOutput;
	
	/**
	 * If stdout is connected to a terminal, return a `terminal-output` handle
	 * allowing further interaction with it.
	 */
	export declare function getTerminalStdout(): TerminalOutput | undefined;
}

/**
 * An interface providing an optional `terminal-output` for stderr as a
 * link-time authority.
 */
export namespace TerminalStderr {
	
	type TerminalOutput = TerminalOutput.TerminalOutput;
	
	/**
	 * If stderr is connected to a terminal, return a `terminal-output` handle
	 * allowing further interaction with it.
	 */
	export declare function getTerminalStderr(): TerminalOutput | undefined;
}
