/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" preserve="true"/>
import * as uuid from 'uuid';

import { $exports, $imports, Alignment, ComponentModelTrap, Memory, MemoryRange, ReadonlyMemoryRange, WasmContext, type Code, type JType, type MainConnection, type Options, type WasmType, type WorkerConnection, type WorldType } from './componentModel';
import { CapturedPromise } from './promises';
import RAL from './ral';
import { Semaphore } from './semaphore';

class ConnectionMemory implements Memory {

	public static readonly Header = {
		sync: { offset:0, size: 4 },
		errorCode: { offset: 4, size: 4 },
		resultType: { offset: 8, size: 4 },
		result: { offset: 12, size: 8 },
		next: { offset: 20, size: 4 },
		end: { offset: 24, size: 0 },
	};

	public  buffer: SharedArrayBuffer;
	public readonly id: string;

	private next: Uint32Array;

	constructor();
	constructor(size: number);
	constructor(buffer: SharedArrayBuffer, id: string);
	constructor(sizeOrBuffer?: number | SharedArrayBuffer | undefined, id?: string) {
		if (sizeOrBuffer === undefined) {
			sizeOrBuffer = 64 * 1024;
		}
		if (typeof sizeOrBuffer === 'number') {
			this.id = uuid.v4();
			this.buffer = new SharedArrayBuffer(sizeOrBuffer);
			this.next = new Uint32Array(this.buffer, ConnectionMemory.Header.next.offset, 1);
			this.next[0] = ConnectionMemory.Header.end.offset;
		} else {
			this.buffer = sizeOrBuffer;
			this.id = id!;
			this.next = new Uint32Array(this.buffer, ConnectionMemory.Header.next.offset, 1);
		}
	}

	public reset(): void {
		const view = new Uint8Array(this.buffer, 0, ConnectionMemory.Header.end.offset);
		view.fill(0);
		this.next[0] = ConnectionMemory.Header.end.offset;
	}

	public alloc(align: Alignment, size: number): MemoryRange {
		const next = this.next[0];
		const result = Alignment.align(next, align);
		this.next[0] = result + size;
		return new MemoryRange(this, result, size);
	}

	public realloc(): MemoryRange {
		throw new ComponentModelTrap('ConnectionMemory does not support realloc');
	}

	public preAllocated(ptr: number, size: number): MemoryRange {
		return new MemoryRange(this, ptr, size);
	}

	public readonly(ptr: number, size: number): ReadonlyMemoryRange {
		return new ReadonlyMemoryRange(this, ptr, size);
	}
}

export abstract class Connection {

	public static createWorker(world: WorldType, port?: RAL.ConnectionPort, timeout?: number): Promise<WorkerConnection> {
		return RAL().Connection.createWorker(port, world, timeout);
	}

	protected readonly memory: ConnectionMemory;

	constructor(memory: ConnectionMemory) {
		this.memory = memory;
	}

	protected static serializeParams(params: readonly WasmType[]): (number | string)[] {
		const result: (number | string)[] = [];
		for (const param of params) {
			if (typeof param === 'number') {
				result.push(param);
			} else {
				result.push(param.toString());
			}
		}
		return result;
	}

	protected static deserializeParams(params: readonly (string | number)[]): WasmType[] {
		const result: WasmType[] = [];
		for (const param of params) {
			if (typeof param === 'string') {
				result.push(BigInt(param));
			} else {
				result.push(param);
			}
		}
		return result;
	}

	protected static serializeResult(result: WasmType | undefined | void): number | string | undefined {
		if (typeof result === 'bigint') {
			return result.toString();
		} else if (typeof result === 'number') {
			return result;
		}
		return undefined;
	}

	protected static deserializeResult(result: string | number | undefined): WasmType | void {
		if (result === undefined) {
			return;
		}
		return typeof result === 'number' ? result : BigInt(result);
	}

	protected static loadResult(buffer: SharedArrayBuffer): WasmType | void | undefined {
		const view = new DataView(buffer, 0, ConnectionMemory.Header.end.offset);
		const resultType = view.getUint32(ConnectionMemory.Header.resultType.offset, true);
		switch(resultType) {
			case Connection.WasmTypeKind.undefined:
				return;
			case Connection.WasmTypeKind.float:
				return view.getFloat64(ConnectionMemory.Header.result.offset, true);
			case Connection.WasmTypeKind.signed:
				return view.getBigInt64(ConnectionMemory.Header.result.offset, true);
			case Connection.WasmTypeKind.unsigned:
				return view.getBigUint64(ConnectionMemory.Header.result.offset, true);
			default:
				throw new ComponentModelTrap(`Unexpected result type ${resultType}`);
		}
	}

	protected static storeResult(buffer: SharedArrayBuffer, result: WasmType | void | undefined): void {
		const view = new DataView(buffer, 0, ConnectionMemory.Header.end.offset);
		if (result === undefined) {
			view.setUint32(ConnectionMemory.Header.resultType.offset, Connection.WasmTypeKind.undefined, true);
		} else if (typeof result === 'bigint') {
			if (result < 0) {
				view.setUint32(ConnectionMemory.Header.resultType.offset, Connection.WasmTypeKind.signed, true);
				view.setBigInt64(ConnectionMemory.Header.result.offset, result, true);
			} else {
				view.setUint32(ConnectionMemory.Header.resultType.offset, Connection.WasmTypeKind.unsigned, true);
				view.setBigUint64(ConnectionMemory.Header.result.offset, result, true);
			}
		} else if (typeof result === 'number') {
			view.setUint32(ConnectionMemory.Header.resultType.offset, Connection.WasmTypeKind.float, true);
			view.setFloat64(ConnectionMemory.Header.result.offset, result, true);
		} else {
			throw new ComponentModelTrap(`Unexpected result type ${result}`);
		}
	}
}

export namespace Connection {

	export enum ErrorCodes {
		noHandler = 1,
		promiseRejected = 2,
	}

	export enum WasmTypeKind {
		undefined = 0,
		float = 1,
		signed = 2,
		unsigned = 3
	}

	export type MainCallMessage = {
		readonly method: 'callMain';
		readonly name: string;
		readonly params: (number | string)[];
		readonly memory: { buffer: SharedArrayBuffer; id: string };
	};

	export type ReportResultMessage = {
		readonly method: 'reportResult';
		readonly name: string;
		readonly result?: number | string;
		readonly error?: string;
	};

	export type MainMessages = MainCallMessage | ReportResultMessage;

	export type InitializeWorker = {
		method: 'initializeWorker';
		readonly module: WebAssembly_.Module;
		readonly memory?: WebAssembly_.Memory;
		readonly options: Options;
	};

	export type WorkerCallMessage = {
		readonly method: 'callWorker';
		readonly name: string;
		readonly params: (number | string)[];
		readonly memory: { buffer: SharedArrayBuffer; id: string };
	};

	export type WorkerMessages = InitializeWorker | WorkerCallMessage;
}

export abstract class BaseWorkerConnection extends Connection implements WorkerConnection {

	private readonly world: WorldType;
	private readonly timeout: number | undefined;
	private readonly handlers: Map<string, (memory: Memory, params: WasmType[]) => WasmType | void> ;

	constructor(world: WorldType, timeout?: number) {
		super(new ConnectionMemory());
		this.world = world;
		this.timeout = timeout;
		this.handlers = new Map();
	}

	public dispose(): void {
		this.handlers.clear();
	}

	public on(name: string, handler: (memory: Memory, params: WasmType[]) => WasmType | void): void {
		this.handlers.set(name, handler);
	}

	public getMemory(): Memory {
		return this.memory;
	}

	public prepareCall(): void {
		this.memory.reset();
	}

	public callMain(name: string, params: WasmType[]): WasmType | void {
		const buffer = this.memory.buffer;
		const sync = new Int32Array(buffer, ConnectionMemory.Header.sync.offset, 1);
		Atomics.store(sync, 0, 0);
		const message: Connection.MainCallMessage = {
			method: 'callMain',
			name: name,
			params: Connection.serializeParams(params),
			memory: { buffer: this.memory.buffer, id: this.memory.id }
		};
		this.postMessage(message);
		// Wait for the answer
		const result = Atomics.wait(sync, 0, 0, this.timeout);
		switch (result) {
			case 'timed-out':
				throw new ComponentModelTrap(`Call ${name} to main thread timed out`);
			case 'not-equal':
				const value = Atomics.load(sync, 0);
				// If the value === 1 the service has already provided the result.
				// Otherwise we actually don't know what happened :-(.
				if (value !== 1) {
					throw new ComponentModelTrap(`Unexpected value ${value} in sync object`);
				}
		}
		return Connection.loadResult(buffer);
	}

	protected abstract postMessage(message: Connection.MainMessages): void;

	protected handleMessage(message: Connection.WorkerMessages): void {
		if (message.method === 'initializeWorker') {
			const wasmContext = new WasmContext.Default(message.options);
			const imports = $imports.worker.create(this, this.world, wasmContext);
			if (message.memory !== undefined) {
				(imports as any).env.memory = message.memory;
			}
			RAL().WebAssembly.instantiate(message.module, imports).then((instance) => {
				wasmContext.initialize(new Memory.Default(instance.exports));
				$exports.worker.bind(this, this.world, instance.exports as any, wasmContext);
				this.postMessage({ method: 'reportResult', name: '$initializeWorker', result: 'success' });
			}).catch((error) => {
				this.postMessage({ method: 'reportResult', name: '$initializeWorker', error: error.toString() });
			});

		} else if (message.method === 'callWorker') {
			const handler = this.handlers.get(message.name);
			if (handler === undefined) {
				this.postMessage({ method: 'reportResult', name: message.name, error: `No handler found for ${message.name}` });
				return;
			}
			try {
				const memory: Memory = new ConnectionMemory(message.memory.buffer, message.memory.id);
				const result = handler(memory, Connection.deserializeParams(message.params));
				this.postMessage({ method: 'reportResult', name: message.name, result: Connection.serializeResult(result) });
			} catch (error) {
				this.postMessage({ method: 'reportResult', name: message.name, error: `Calling WASM function ${message.name} failed.` });
			}
		}
	}

	public abstract listen(): void;
}

export abstract class BaseMainConnection extends Connection implements MainConnection {

	private initializeCall: { resolve: () => void; reject: (error: any) => void } | undefined;
	private readonly handlers: Map<string, (memory: Memory, params: WasmType[]) => WasmType | void | Promise<WasmType | void>>;
	private readonly callQueue: Semaphore<JType>;
	private currentCall: CapturedPromise<WasmType | void> | undefined;

	constructor() {
		super(new ConnectionMemory());
		this.handlers = new Map();
		this.callQueue = new Semaphore(1);
		this.currentCall = undefined;
	}

	public dispose(): void {
		this.handlers.clear();
		this.callQueue.dispose();
	}

	public lock(thunk: () => Promise<JType>): Promise<JType> {
		return this.callQueue.lock(thunk);
	}

	public prepareCall(): void {
		this.memory.reset();
	}

	public getMemory(): Memory {
		return this.memory;
	}

	public async initialize(code: Code, options: Options): Promise<void> {
		type literal = { module: WebAssembly_.Module; memory?: WebAssembly_.Memory };
		let module: WebAssembly_.Module;
		let memory: WebAssembly_.Memory | undefined = undefined;
		if ((code as literal).module !== undefined) {
			module = (code as literal).module;
			memory = (code as literal).memory;
		} else {
			module = code;
		}
		return new Promise((resolve, reject) => {
			const message: Connection.InitializeWorker = {
				method: 'initializeWorker',
				module: module,
				memory: memory,
				options: options,
			};
			this.initializeCall = { resolve, reject };
			this.postMessage(message);
		});
	}

	public callWorker(name: string, params: WasmType[]): Promise<WasmType | void> {
		if (this.currentCall !== undefined) {
			throw new ComponentModelTrap('Call already in progress');
		}
		this.currentCall = CapturedPromise.create();
		const message: Connection.WorkerCallMessage = {
			method: 'callWorker',
			name: name,
			params: Connection.serializeParams(params),
			memory: { buffer: this.memory.buffer, id: this.memory.id }
		};
		this.postMessage(message);
		return this.currentCall.promise;
	}

	public on(id: string, handler: (memory: Memory, params: WasmType[]) => WasmType | void | Promise<WasmType | void>): void {
		this.handlers.set(id, handler);
	}

	protected abstract postMessage(message: Connection.WorkerMessages): void;

	protected handleMessage(message: Connection.MainMessages): void {
		if (message.method === 'callMain') {
			const buffer = message.memory.buffer;
			const sync = new Int32Array(buffer, ConnectionMemory.Header.sync.offset, 1);
			const view = new DataView(buffer, 0, ConnectionMemory.Header.end.offset);

			const handler = this.handlers.get(message.name);
			if (handler === undefined) {
				view.setUint32(ConnectionMemory.Header.errorCode.offset, Connection.ErrorCodes.noHandler, true);
				Atomics.store(sync, 0, 1);
				Atomics.notify(sync, 0);
				return;
			} else {
				const memory = new ConnectionMemory(buffer, message.memory.id);
				const params = Connection.deserializeParams(message.params);
				const result = handler(memory, params);
				if (result instanceof Promise) {
					result.then((value) => {
						Connection.storeResult(buffer, value);
					}).catch(() => {
						view.setUint32(ConnectionMemory.Header.errorCode.offset, Connection.ErrorCodes.promiseRejected, true);
					}).finally(() => {
						Atomics.store(sync, 0, 1);
						Atomics.notify(sync, 0);
					});
				} else {
					Connection.storeResult(buffer, result);
					Atomics.store(sync, 0, 1);
					Atomics.notify(sync, 0);
				}
			}
		} else if (message.method === 'reportResult') {
			if (message.name === '$initializeWorker') {
				if (this.initializeCall === undefined) {
					// Need to think about logging this.
					return;
				}
				if (message.error !== undefined) {
					this.initializeCall.reject(new Error(message.error));
				} else {
					this.initializeCall.resolve();
				}
				this.initializeCall = undefined;
			} else  {
				if (this.currentCall === undefined) {
					// Need to think about logging this.
					return;
				}
				if (message.error !== undefined) {
					this.currentCall.reject(new Error(message.error));
				} else {
					const result = Connection.deserializeResult(message.result);
					this.currentCall.resolve(result);
				}
				this.currentCall = undefined;
			}
		}
	}

	public abstract listen(): void;
}