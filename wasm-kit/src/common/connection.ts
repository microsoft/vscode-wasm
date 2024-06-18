/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { s32, type MemoryRange } from '@vscode/wasm-component-model';
import RAL from './ral';
import { MemoryLocation, SharedMemory, SharedObject } from './sharedObject';

export interface ConnectionPort {
	postMessage(message: any, ...args: any[]): void;
	on?(event: 'message', listener: (value: any) => void): this;
	onmessage?: ((this: any, ev: any) => any) | null;
}

export type TransferItems = ArrayBuffer | ConnectionPort;

type HandlerResult<T> = T | Promise<T>;

type _MessageType = {
	method: string;
	params?: object | undefined;
};

type _AsyncCallType = _MessageType & {
	result: void | null | any;
	error?: undefined;
};
type _AsyncCallHandler = (params: any) => HandlerResult<any>;

type _SharedObjectResult = {
	new (location: MemoryRange): SharedObject;
	alloc(memory: SharedMemory): MemoryRange;
};
namespace _SharedObjectResult {
	export function is(value: any): value is _SharedObjectResult {
		const candidate: _SharedObjectResult = value;
		return candidate !== undefined && candidate !== null && typeof candidate.alloc === 'function';
	}
}

type _SyncCallType = _MessageType & {
	result: void | _SharedObjectResult;
};
type _SyncCallHandler = (params: any, result?: MemoryRange) => HandlerResult<number | undefined>;

type _NotifyType = _MessageType;
type _NotifyHandler = (params: any) => void;


const enum MessageKind {
	AsyncCall = 1,
	AsyncResponse = 2,
	SyncCall = 3,
	Notification = 4
}

interface AbstractMessage {
	kind: MessageKind;
	method: string;
	params?: null | undefined | object;
}

interface _AsyncCall extends AbstractMessage {
	kind: MessageKind.AsyncCall;
	id: number;
}
namespace _AsyncCall {
	export function is(value: _Message): value is _AsyncCall {
		return value.kind === MessageKind.AsyncCall;
	}
}

interface _AsyncResponse {
	kind: MessageKind.AsyncResponse;
	id: number;
	result?: any;
	error?: any;
}
namespace _AsyncResponse {
	export function is(value: _Message): value is _AsyncResponse {
		return value.kind === MessageKind.AsyncResponse;
	}
}

interface _SyncCall extends AbstractMessage {
	kind: MessageKind.SyncCall;
	sync: MemoryLocation;
	result?: MemoryLocation;
}
namespace _SyncCall {
	export function is(value: _Message): value is _SyncCall {
		return value.kind === MessageKind.SyncCall;
	}
}

interface _Notification extends AbstractMessage {
	kind: MessageKind.Notification;
}
namespace _Notification {
	export function is(value: _Message): value is _Notification {
		return value.kind === MessageKind.Notification;
	}
}

type _Message = _AsyncCall | _AsyncResponse | _SyncCall | _Notification;

type ResultPromise = {
	method: string;
	resolve: (response: any) => void;
	reject: (error: any) => void;
};

type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type MethodKeys<Messages extends _MessageType> = {
	[M in Messages as M['method']]: M['method'];
};

type _AsyncCallSignatures<AsyncCalls extends _AsyncCallType, TLI = TransferItems> = UnionToIntersection<{
 	[call in AsyncCalls as call['method']]: call['params'] extends object
		? (method: call['method'], params: call['params'], transferList?: ReadonlyArray<TLI>) => Promise<call['result'] extends undefined | void ? void : call['result']>
	 	: (method: call['method']) => Promise<call['result'] extends undefined | void ? void : call['result']>
}[keyof MethodKeys<AsyncCalls>]>;

type AsyncCallSignatures<AsyncCalls extends _AsyncCallType | undefined, TLI> = [AsyncCalls] extends [_AsyncCallType] ? _AsyncCallSignatures<AsyncCalls, TLI> : undefined;

type _AsyncCallHandlerSignatures<AsyncCalls extends _AsyncCallType> = UnionToIntersection<{
 	[call in AsyncCalls as call['method']]: call['params'] extends object
		? (method: call['method'], handler: (params: call['params']) => HandlerResult<call['result'] extends undefined | void ? void : call['result']>) => void
	 	: (method: call['method'], handler: () => HandlerResult<call['result'] extends undefined | void ? void : call['result']>) => void;
}[keyof MethodKeys<AsyncCalls>]>;

type AsyncCallHandlerSignatures<AsyncCalls extends _AsyncCallType | undefined> = [AsyncCalls] extends [_AsyncCallType] ?_AsyncCallHandlerSignatures<AsyncCalls> : undefined;

type _SyncCallSignatures<SyncCalls extends _SyncCallType, TLI = TransferItems> = UnionToIntersection<{
 	[call in SyncCalls as call['method']]: call['params'] extends object
		? call['result'] extends _SharedObjectResult
			? (method: call['method'], params: call['params'], resultDescriptor: _SharedObjectResult, timeout?: number | undefined, transferList?: ReadonlyArray<TLI>) => InstanceType<call['result']>
			: (method: call['method'], params: call['params'], timeout?: number | undefined, transferList?: ReadonlyArray<TLI>) => void
	 	: call['result'] extends _SharedObjectResult
			? (method: call['method'], resultDescriptor: _SharedObjectResult, timeout?: number | undefined) => InstanceType<call['result']>
			: (method: call['method'], timeout?: number | undefined) => void;
}[keyof MethodKeys<SyncCalls>]>;

type SyncCallSignatures<SyncCalls extends _SyncCallType | undefined, TLI= TransferItems> = [SyncCalls] extends [_SyncCallType] ? _SyncCallSignatures<SyncCalls, TLI> : undefined;

type _SyncCallHandlerSignatures<SyncCalls extends _SyncCallType> = UnionToIntersection<{
 	[call in SyncCalls as call['method']]: call['params'] extends object
		? call['result'] extends _SharedObjectResult
			? (method: call['method'], handler: (params: call['params'], result: MemoryRange) => HandlerResult<number | void>) => void
			: (method: call['method'], handler: (params: call['params']) => HandlerResult<number | void>) => void
	 	: call['result'] extends _SharedObjectResult
			? (method: call['method'], handler: (result: MemoryRange) => HandlerResult<number | void>) => void
			: (method: call['method'], handler: () => HandlerResult<number | void>) => void;
}[keyof MethodKeys<SyncCalls>]>;

type SyncCallHandlerSignatures<SyncCalls extends _SyncCallType | undefined> = [SyncCalls] extends [_SyncCallType] ? _SyncCallHandlerSignatures<SyncCalls> : undefined;

type _NotifySignatures<Notifications extends _NotifyType, TLI= TransferItems> = UnionToIntersection<{
	[N in Notifications as N['method']]: N['params'] extends object
		? (method: N['method'], params: N['params'], transferList?: ReadonlyArray<TLI>) => void
		: (method: N['method']) => void;
}[keyof MethodKeys<Notifications>]>;

type NotifySignatures<Notifications extends _NotifyType | undefined, TLI = TransferItems> = [Notifications] extends [_NotifyType] ? _NotifySignatures<Notifications, TLI> : undefined;

type _NotifyHandlerSignatures<Notifications extends _NotifyType> = UnionToIntersection<{
	[N in Notifications as N['method']]: N['params'] extends object
		? (method: N['method'], handler: (params: N['params']) => void) => void
		: (method: N['method'], handler: () => void) => void;
}[keyof MethodKeys<Notifications>]>;

type NotifyHandlerSignatures<Notifications extends _NotifyType | undefined> = [Notifications] extends [_NotifyType] ? _NotifyHandlerSignatures<Notifications> : undefined;


export class TimeoutError extends Error {
	public readonly method: string;
	public readonly timeout: number;
	constructor(message: string, method: string, timeout: number) {
		super(message);
		this.name = 'TimeoutError';
		this.method = method;
		this.timeout = timeout;
	}
}

export class SyncCallError extends Error {
	public readonly method: string;
	public readonly errorCode: number;
	constructor(message: string, method: string, errorCode: number) {
		super(message);
		this.name = 'SyncCallError';
		this.method = method;
		this.errorCode = errorCode;
	}
}

export abstract class BaseConnection<AsyncCalls extends _AsyncCallType | undefined, SyncCalls extends _SyncCallType | undefined, Notifications extends _NotifyType | undefined, AsyncCallHandlers extends _AsyncCallType | undefined = undefined, SyncCallHandlers extends _SyncCallType | undefined = undefined, NotifyHandlers extends _NotifyType | undefined = undefined, TLI = TransferItems> {

	private static sync: number = 0;
	private static error: number = 1;

	private id: number;
	private readonly asyncCallResultPromises: Map<number, ResultPromise>;
	private readonly asyncCallHandlers: Map<string, _AsyncCallHandler>;

	private memory: SharedMemory | undefined;
	private syncMemoryRange: MemoryRange | undefined;
	private syncLocation: MemoryLocation | undefined;
	private readonly syncCallHandlers: Map<string, _SyncCallHandler>;

	private readonly notifyHandlers: Map<string, _NotifyHandler>;

	constructor() {
		this.id = 1;
		this.asyncCallResultPromises = new Map();
		this.asyncCallHandlers = new Map();

		this.memory = undefined;
		this.syncMemoryRange = undefined;
		this.syncCallHandlers = new Map();

		this.notifyHandlers = new Map();
	}

	public dispose(): void {
		this.memory = undefined;
		this.syncMemoryRange = undefined;
		this.asyncCallResultPromises.clear();
		this.asyncCallHandlers.clear();
		this.syncCallHandlers.clear();
		this.notifyHandlers.clear();
	}

	public readonly callAsync: AsyncCallSignatures<AsyncCalls, TLI> = this._callAsync as AsyncCallSignatures<AsyncCalls, TLI>;

	private _callAsync(method: string, params?: any, transferList?: ReadonlyArray<TLI>): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = this.id++;
			const request: _AsyncCall = { kind: MessageKind.AsyncCall, id, method };
			if (params !== undefined) {
				request.params = params;
			}
			this.asyncCallResultPromises.set(id, { resolve, reject, method: request.method});
			this.postMessage(request, transferList);
		});
	}

	public readonly onAsyncCall: AsyncCallHandlerSignatures<AsyncCallHandlers> = this._onAsyncCall as AsyncCallHandlerSignatures<AsyncCallHandlers>;

	private _onAsyncCall(method: string, handler: _AsyncCallHandler): void {
		this.asyncCallHandlers.set(method, handler);
	}

	public initializeSyncCall(memory: SharedMemory): void {
		if (this.memory !== undefined && this.memory.isSame(memory)) {
			return;
		}
		if (this.memory !== undefined) {
			throw new Error('Memory is already initialized.');
		}
		if (!(memory.buffer instanceof SharedArrayBuffer)) {
			throw new Error('Memory is not a shared memory.');
		}
		this.memory = memory;
		this.syncMemoryRange = memory.alloc(s32.alignment, 2 * s32.size);
		const syncCallBuffer = this.syncMemoryRange.getInt32View(0);
		Atomics.store(syncCallBuffer, BaseConnection.sync, 0);
		Atomics.store(syncCallBuffer, BaseConnection.error, 0);
		this.syncLocation = { memory: { id: memory.id }, ptr: this.syncMemoryRange.ptr, size: this.syncMemoryRange.size };
	}

	public getSharedMemory(): SharedMemory {
		if (this.memory === undefined) {
			throw new Error('Memory is not initialized.');
		}
		return this.memory;
	}

	public readonly callSync: SyncCallSignatures<SyncCalls, TLI> = this._callSync as SyncCallSignatures<SyncCalls, TLI>;

	private _callSync(method: string, params?: any, result?: _SharedObjectResult | undefined, timeout?: number | undefined, transferList?: ReadonlyArray<TLI>): any {
		if (this.syncMemoryRange === undefined || this.syncLocation === undefined || this.memory === undefined) {
			throw new Error('Sync calls are not initialized with shared memory.');
		}
		const syncCallBuffer = this.syncMemoryRange.getInt32View(0);
		const memory = this.memory;
		const call: _SyncCall = { kind: MessageKind.SyncCall, method, sync: this.syncLocation };
		if (params !== undefined) {
			call.params = params;
		}
		let resultRange: MemoryRange | undefined;
		if (result !== undefined && result !== null) {
			resultRange = result.alloc(this.memory);
			call.result = MemoryLocation.from(resultRange);
		}
		this.postMessage(call, transferList);
		syncCallBuffer[BaseConnection.error] = 0;
		Atomics.store(syncCallBuffer, BaseConnection.sync, 0);
		const wait = Atomics.wait(syncCallBuffer, BaseConnection.sync, 0, timeout);
		const handleResult = (): SharedObject | undefined => {
			const error = syncCallBuffer[BaseConnection.error];
			if (error === 0) {
				if (result === undefined || result === null || resultRange === undefined) {
					return undefined;
				} else {
					if (resultRange.memory.id !== memory!.id) {
						throw new Error('Memory mismatch');
					}
					return new result(resultRange);
				}
			} else {
				throw new SyncCallError(`Sync call ${method} failed with error code ${error}`, method, error);
			}
		};
		switch (wait) {
			case 'ok':
				return handleResult();
			case 'timed-out':
				throw new TimeoutError(`Sync call ${method} timed out after ${timeout}ms`, method, timeout!);
			case 'not-equal':
				const current = Atomics.load(syncCallBuffer, BaseConnection.sync);
				if (current === 1) {
					return handleResult();
				} else {
					throw new Error(`Sync call ${method} failed with unexpected value ${current}`);
				}
		}
	}

	public readonly onSyncCall: SyncCallHandlerSignatures<SyncCallHandlers> = this._onSyncCall as SyncCallHandlerSignatures<SyncCallHandlers>;

	private _onSyncCall(method: string, handler: _SyncCallHandler): void {
		if (this.memory === undefined) {
			throw new Error('Sync calls are not initialized with shared memory.');
		}
		this.syncCallHandlers.set(method, handler);
	}

	public readonly notify: NotifySignatures<Notifications, TLI> = this._notify as NotifySignatures<Notifications, TLI>;

	private _notify(method: string, params?: any, transferList?: ReadonlyArray<TLI>): void {
		const notification: _Notification = { kind: MessageKind.Notification, method };
		if (params !== undefined) {
			notification.params = params;
		}
		this.postMessage(notification, transferList);
	}

	public readonly onNotify: NotifyHandlerSignatures<NotifyHandlers> = this._onNotify as NotifyHandlerSignatures<NotifyHandlers>;

	private _onNotify(method?: string, handler?: _NotifyHandler): void {
		if (method === undefined || handler === undefined) {
			return;
		}
		this.notifyHandlers.set(method, handler);
	}

	public abstract listen(): void;

	protected abstract postMessage(message: _Message | _AsyncResponse, transferList?: ReadonlyArray<TLI>): void;

	protected async handleMessage(message: _Message): Promise<void> {
		if (_AsyncCall.is(message)) {
			const id = message.id;
			const handler = this.asyncCallHandlers.get(message.method);
			if (handler !== undefined) {
				try {
					const result = await handler(message.params);
					this.sendResultResponse(id, result);
				} catch(error) {
					this.sendErrorResponse(id, error);
				}
			}
		} else if (_AsyncResponse.is(message)) {
			const id = message.id;
			const promise = this.asyncCallResultPromises.get(id);
			if (promise !== undefined) {
				this.asyncCallResultPromises.delete(id);
				if (message.error !== undefined) {
					promise.reject(typeof message.error === 'string' ? new Error(message.error) : message.error);
				} else {
					promise.resolve(message.result);
				}
			}
		} else if (_SyncCall.is(message)) {
			const handler = this.syncCallHandlers.get(message.method);
			if (handler !== undefined) {
				if (this.memory === undefined || this.syncMemoryRange === undefined) {
					throw new Error('Sync calls are not initialized with shared memory.');
				}
				const syncCallBuffer = this.syncMemoryRange.getInt32View(0);
				let errorCode: number = 0;
				try {
					errorCode = await handler(message.params, message.result ? this.memory.range.fromLocation(message.result) : undefined) ?? 0;
				} catch (error: any) {
					if (typeof error.code === 'number') {
						errorCode = error.code;
					} else {
						errorCode = -1;
					}
				} finally {
					syncCallBuffer[BaseConnection.error] = errorCode;
					Atomics.store(syncCallBuffer, BaseConnection.sync, 1);
					Atomics.notify(syncCallBuffer, BaseConnection.sync, 1);
				}
			}
		} else if (_Notification.is(message)) {
			const handler = this.notifyHandlers.get(message.method);
			if (handler !== undefined) {
				try {
					handler(message.params);
				} catch (error: any) {
					// console.error(`Notification handler for ${message.method} failed with error ${error.message}`);
				}
			}
		}
	}

	private sendResultResponse(id: number, result: any): void {
		const response: _AsyncResponse =  { kind: MessageKind.AsyncResponse, id, result: result };
		this.postMessage(response);
	}

	private sendErrorResponse(id: number, error: any): void {
		const response: _AsyncResponse =  { kind: MessageKind.AsyncResponse, id, error: error === undefined ? 'Unknown error' : error instanceof Error ? error.message : error };
		this.postMessage(response);
	}
}

export namespace BaseConnection {
	export type MessageType  = _MessageType;
	export type AsyncCallType = _AsyncCallType;
	export type AsyncCallHandler = _AsyncCallHandler;
	export type SyncCallType = _SyncCallType;
	export type SyncCallHandler = _SyncCallHandler;
	export type NotifyType = _NotifyType;
	export type NotifyHandler = _NotifyHandler;
	export type Request = _AsyncCall;
	export const Request = _AsyncCall;
	export type Notification = _Notification;
	export const Notification = _Notification;
	export type Response = _AsyncResponse;
	export const Response = _AsyncResponse;
	export type Message = _Message;
}

export type AnyConnection = BaseConnection<AnyConnection.AsyncCall, AnyConnection.SyncCall, AnyConnection.Notification, AnyConnection.AsyncCall, AnyConnection.SyncCall, AnyConnection.Notification>;
export namespace AnyConnection {
	export type AsyncCall = { method: string; params: any; result: any };
	export type SyncCall = { method: string; params: any; result: void };
	export type Notification = { method: string; params: any };
	export function cast<T>(connection: AnyConnection): T {
		return connection as unknown as T;
	}
	export function create<T = AnyConnection>(port: ConnectionPort): T {
		return RAL().AnyConnection.create(port) as unknown as T;
	}
	export function createPorts(): [ConnectionPort, ConnectionPort] {
		return RAL().MessageChannel.create();
	}
}