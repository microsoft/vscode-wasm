import * as $wcm from '@vscode/wasm-component-model';

export namespace logging {
	/**
	 * WASI Logging is a logging API intended to let users emit log messages with
	 * simple priority levels and context values.
	 */
	export namespace Logging {
		
		/**
		 * A log level, describing a kind of message.
		 */
		export enum Level {
			trace = 0,
			debug = 1,
			info = 2,
			warn = 3,
			error = 4,
			critical = 5,
		}
		
		/**
		 * Emit a log message.
		 * 
		 * A log message has a `level` describing what kind of message is being
		 * sent, a context, which is an uninterpreted string meant to help
		 * consumers group similar messages, and a string containing the message
		 * text.
		 */
		export declare function log(level: Level, context: string, message: string): void;
	}
	export type Logging = Pick<typeof Logging, 'log'>;
	
}