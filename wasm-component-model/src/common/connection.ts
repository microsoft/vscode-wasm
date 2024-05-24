/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />
import * as uuid from 'uuid';

import { Alignment, ComponentModelTrap, Memory, MemoryRange, ReadonlyMemoryRange, type MainConnection, type WasmType, type WorkerConnection, type ptr } from './componentModel';
import RAL from './ral';

class ConnectionMemory implements Memory {

	public static readonly Header = {
		sync: { offset:0, size: 4 },
		errorCode: { offset: 4, size: 4 },
		resultType: { offset: 8, size: 4 },
		result: { offset: 12, size: 8 },
		end: { offset: 20, size: 0 },
	};

	private next: ptr;

	public  buffer: SharedArrayBuffer;
	public readonly id: string;

	constructor(size: number = 64 * 1024) {
		this.id = uuid.v4();
		this.buffer = new SharedArrayBuffer(size);
		this.next = ConnectionMemory.Header.end.offset;
	}

	public reset(): void {
		this.next = ConnectionMemory.Header.end.offset;
	}

	public alloc(align: Alignment, size: number): MemoryRange {
		const result = Alignment.align(this.next, align);
		this.next = result + size;
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

	protected static loadResult(buffer: SharedArrayBuffer): WasmType {
		const view = new DataView(buffer, 0, ConnectionMemory.Header.end.offset);
		const resultType = view.getUint32(ConnectionMemory.Header.resultType.offset, true);
		switch(resultType) {
			case Connection.ParamType.float:
				return view.getFloat64(ConnectionMemory.Header.result.offset, true);
			case Connection.ParamType.signed:
				return view.getBigInt64(ConnectionMemory.Header.result.offset, true);
			case Connection.ParamType.unsigned:
				return view.getBigUint64(ConnectionMemory.Header.result.offset, true);
			default:
				throw new ComponentModelTrap(`Unexpected result type ${resultType}`);
		}
	}

	protected static storeResult(buffer: SharedArrayBuffer,result: WasmType | void | undefined): void {
		if (result === undefined) {
			return;
		}
		const view = new DataView(buffer, 0, ConnectionMemory.Header.end.offset);
		if (typeof result === 'bigint') {
			if (result < 0) {
				view.setUint32(ConnectionMemory.Header.resultType.offset, Connection.ParamType.signed, true);
				view.setBigInt64(ConnectionMemory.Header.result.offset, result, true);
			} else {
				view.setUint32(ConnectionMemory.Header.resultType.offset, Connection.ParamType.unsigned, true);
				view.setBigUint64(ConnectionMemory.Header.result.offset, result, true);
			}
		} else if (typeof result === 'number') {
			view.setUint32(ConnectionMemory.Header.resultType.offset, Connection.ParamType.float, true);
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

	export enum ParamType {
		float = 1,
		signed = 2,
		unsigned = 3
	}

	export type MainCallMessage = {
		readonly method: 'callMain';
		readonly name: string;
		readonly params: (number | string)[];
		readonly buffer: SharedArrayBuffer;
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
	};

	export type WorkerCallMessage = {
		readonly method: 'callWorker';
		readonly name: string;
		readonly params: (number | string)[];
	};

	export type WorkerMessages = InitializeWorker | WorkerCallMessage;
}

export abstract class BaseWorkerConnection extends Connection implements WorkerConnection {

	private readonly timeout: number | undefined;
	private readonly handlers: Map<string, (params: WasmType[]) => WasmType | void> ;

	constructor(timeout?: number) {
		super(new ConnectionMemory());
		this.timeout = timeout;
		this.handlers = new Map();
	}

	public dispose(): void {
		this.handlers.clear();
	}

	public on(name: string, handler: (params: WasmType[]) => WasmType | void): void {
		this.handlers.set(name, handler);
	}

	public getMemory(): Memory {
		return this.memory;
	}

	public prepareCall(): void {
		this.memory.reset();
	}

	public call(name: string, params: WasmType[]): WasmType {
		const buffer = this.memory.buffer;
		const sync = new Int32Array(buffer, ConnectionMemory.Header.sync.offset, 1);
		Atomics.store(sync, 0, 0);
		const message: Connection.MainCallMessage = {
			method: 'callMain',
			name: name,
			params: Connection.serializeParams(params),
			buffer: this.memory.buffer,
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
			
			const module = RAL().WebAssembly.instantiate(message.module, );
		} else if (message.method === 'callWorker') {
			const handler = this.handlers.get(message.name);
			if (handler === undefined) {
				this.postMessage({ method: 'reportResult', name: message.name, error: `No handler found for ${message.name}` });
				return;
			}
			try {
				const result = handler(Connection.deserializeParams(message.params));
				this.postMessage({ method: 'reportResult', name: message.name, result: Connection.serializeResult(result) });
			} catch (error) {
				this.postMessage({ method: 'reportResult', name: message.name, error: `Calling WASM function ${message.name} failed.` });
			}
		}
	}
}

type CallInfo = {
	resolve: (value: WasmType | undefined | void) => void;
	reject: (error: any) => void;
	name: string;
	params: ReadonlyArray<WasmType>;
};

export abstract class BaseMainConnection extends Connection implements MainConnection {

	private readonly handlers: Map<string, (params: WasmType[]) => WasmType | void | Promise<WasmType | void>>;
	private readonly callQueue: CallInfo[];
	private currentCall: CallInfo | undefined;

	constructor() {
		super(new ConnectionMemory());
		this.handlers = new Map();
		this.callQueue = [];
		this.currentCall = undefined;
	}

	public dispose(): void {
		this.handlers.clear();
		this.callQueue.length = 0;
		this.currentCall = undefined;
	}

	public prepareCall(): void {
		this.memory.reset();
	}

	public getMemory(): Memory {
		return this.memory;
	}

	public call(name: string, params: ReadonlyArray<WasmType>): Promise<WasmType | void> {
		return new Promise((resolve, reject) => {
			this.callQueue.push({ resolve, reject, name: name, params });
		});
	}

	private triggerNextCall(): void {
		if (this.currentCall !== undefined) {
			throw new Error(`Current call in progress: ${this.currentCall.name}`);
		}
		this.currentCall = this.callQueue.shift();
		if (this.currentCall === undefined) {
			return;
		}
		const message: Connection.WorkerCallMessage = {
			method: 'callWorker',
			name: this.currentCall.name,
			params: Connection.serializeParams(this.currentCall.params),
		};
		this.postMessage(message);
	}

	public on(id: string, handler: (params: WasmType[]) => WasmType | void | Promise<WasmType | void>): void {
		this.handlers.set(id, handler);
	}

	protected abstract postMessage(message: Connection.WorkerMessages): void;

	protected handleMessage(message: Connection.MainMessages): void {
		if (message.method === 'callMain') {
			const buffer = message.buffer;
			const sync = new Int32Array(buffer, ConnectionMemory.Header.sync.offset, 1);
			const view = new DataView(buffer, 0, ConnectionMemory.Header.end.offset);

			const handler = this.handlers.get(message.name);
			if (handler === undefined) {
				view.setUint32(ConnectionMemory.Header.errorCode.offset, Connection.ErrorCodes.noHandler, true);
				Atomics.store(sync, 0, 1);
				Atomics.notify(sync, 0);
				return;
			} else {
				const params = Connection.deserializeParams(message.params);
				const result = handler(params);
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
				}
			}
		} else if (message.method === 'reportResult') {
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
			this.triggerNextCall();
		}
	}
}