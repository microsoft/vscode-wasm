/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { i32 } from '@vscode/wasm-component-model';

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
			
			/**
			 * Describes messages about the values of variables and the flow of
			 * control within a program.
			 */
			trace = 'trace',
			
			/**
			 * Describes messages likely to be of interest to someone debugging a
			 * program.
			 */
			debug = 'debug',
			
			/**
			 * Describes messages likely to be of interest to someone monitoring a
			 * program.
			 */
			info = 'info',
			
			/**
			 * Describes messages indicating hazardous situations.
			 */
			warn = 'warn',
			
			/**
			 * Describes messages indicating serious errors.
			 */
			error = 'error',
			
			/**
			 * Describes messages indicating fatal errors.
			 */
			critical = 'critical',
		}
		
		/**
		 * Emit a log message.
		 * 
		 * A log message has a `level` describing what kind of message is being
		 * sent, a context, which is an uninterpreted string meant to help
		 * consumers group similar messages, and a string containing the message
		 * text.
		 */
		export type log = (level: Level, context: string, message: string) => void;
	}
	export type Logging = {
		log: Logging.log;
	};
	
}

export namespace logging {
	export namespace Logging.$ {
		export const Level = new $wcm.EnumType<Logging.Level>(['trace', 'debug', 'info', 'warn', 'error', 'critical']);
		export const log = new $wcm.FunctionType<Logging.log>('log',[
			['level', Level],
			['context', $wcm.wstring],
			['message', $wcm.wstring],
		], undefined);
	}
	export namespace Logging._ {
		export const id = 'wasi:logging/logging' as const;
		export const witName = 'logging' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Level', $.Level]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['log', $.log]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'log': (level_Level: i32, context_ptr: i32, context_len: i32, message_ptr: i32, message_len: i32) => void;
		};
		export function createHost(service: logging.Logging, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): logging.Logging {
			return $wcm.Service.create<logging.Logging>(functions, [], wasmInterface, context);
		}
	}
}

export namespace logging._ {
	export const witName = 'wasi:logging' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Logging', Logging._]
	]);
}