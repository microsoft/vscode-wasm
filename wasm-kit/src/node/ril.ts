/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyNode.d.ts" />
import RAL from '../common/ral';

import { MessageChannel, MessagePort, Worker, parentPort } from 'worker_threads';

import { RAL as _RAL } from '@vscode/wasm-component-model';
import type { URI } from 'vscode-uri';

import type * as commonConnection from '../common/connection';
import * as malloc from '../common/malloc';
import { SharedMemory } from '../common/sharedObject';
import type { WorkerClient, WorkerClientBase } from '../common/workerClient';

import { AnyConnection } from './connection';
import { WorkerClient as _WorkerClient } from './workerClient';

interface RIL extends RAL {
}

const _ril: RIL = Object.freeze<RIL>(Object.assign({}, _RAL(), {
	Memory: Object.freeze({
		async create(constructor: SharedMemory.Constructor): Promise<SharedMemory> {
			const memory = new WebAssembly.Memory(malloc.descriptor);
			const module = await WebAssembly.compile(malloc.bytes);
			const instance = new WebAssembly.Instance(module, {
				env: {
					memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return new constructor(module, memory, instance.exports as unknown as SharedMemory.Exports, malloc.descriptor.maximum * 65536);
		},
		async createFrom(constructor: SharedMemory.Constructor, transferable: SharedMemory.Transferable): Promise<SharedMemory> {
			const instance = new WebAssembly.Instance(transferable.module, {
				env: {
					memory: transferable.memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return new constructor(transferable.module, transferable.memory, instance.exports as unknown as SharedMemory.Exports, transferable.size, transferable.id, transferable.counter);
		}
	}),
	MessageChannel: Object.freeze({
		create(): [commonConnection.ConnectionPort, commonConnection.ConnectionPort] {
			const channel = new MessageChannel();
			return [channel.port1, channel.port2];
		}
	}),
	WorkerClient<C>(base: new () => WorkerClientBase, workerLocation: URI, args?: string[]): (new () => WorkerClient & C) {
		return _WorkerClient(base, workerLocation, args);
	},
	AnyConnection: Object.freeze({
		create(port: any): commonConnection.AnyConnection {
			if (!(port instanceof MessagePort) && !(port instanceof Worker)) {
				throw new Error(`Expected MessagePort or Worker`);
			}
			return new AnyConnection(port) as commonConnection.AnyConnection;
		}
	}),
	Worker: Object.freeze({
		getPort(): commonConnection.ConnectionPort {
			return parentPort!;
		},
		getArgs(): string[] {
			return process.argv.slice(2);
		},
		get exitCode(): number | undefined {
			return process.exitCode;
		},
		set exitCode(value: number | undefined) {
			process.exitCode = value;
		}
	}),
	WebAssembly: Object.freeze({
		compile(bytes: ArrayBufferView | ArrayBuffer): Promise<WebAssembly.Module> {
			return WebAssembly.compile(bytes);
		},
		instantiate(module: WebAssembly.Module, imports: Record<string, any>): Promise<WebAssembly.Instance> {
			return WebAssembly.instantiate(module, imports);
		}
	})
}));

function RIL(): RIL {
	return _ril;
}

namespace RIL {
	export function install(): void {
		if (!RAL.isInstalled()) {
			RAL.install(_ril);
		}
	}
}

if (!RAL.isInstalled()) {
	RAL.install(_ril);
}
export default RIL;