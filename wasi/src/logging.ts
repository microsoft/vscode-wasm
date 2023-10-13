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
		export const id = 'wasi:logging/logging' as const;
		
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
		export type log = (level: Level, context: string, message: string) => void;
	}
	export type Logging = {
		log: Logging.log;
	};
	
}

export namespace logging {
	export namespace Logging.$ {
		export const Level = new $wcm.EnumType<logging.Logging.Level>(6);
		export const log = new $wcm.FunctionType<logging.Logging.log>('log', 'log',[
			['level', Level],
			['context', $wcm.wstring],
			['message', $wcm.wstring],
		], undefined);
	}
	export namespace Logging._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.log];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'log': (level_Level: i32, context_ptr: i32, context_len: i32, message_ptr: i32, message_len: i32) => void;
		};
		export function createHost(service: logging.Logging, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): logging.Logging {
			return $wcm.Service.create<logging.Logging>(functions, resources, wasmInterface, context);
		}
	}
}