/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Memory, ptr, s32 } from '@vscode/wasm-component-model';
import { MemoryLocation, SharedObject } from './sobject';

type _MessageType = {
	method: string;
	params?: object | undefined;
};

type _AsyncCallType = _MessageType & {
	result?: null | undefined | void | any;
	error?: undefined;
};
type _AsyncCallHandler = (params: any) => Promise<any>;

type _ResultDescriptor = {
	new (location: MemoryLocation): SharedObject;
	alloc(): ptr;
};
type _SyncCallType = _MessageType & {
	result?: undefined | _ResultDescriptor;
};
type _SyncCallHandler = (params: any, result?: MemoryLocation) => number | undefined;
type SyncCallParams = {
	$sync: MemoryLocation;
	$result: MemoryLocation;
};
namespace SyncCallParams {
	export function is(value: any): value is SyncCallParams {
		const candidate: SyncCallParams = value;
		return candidate !== undefined && candidate !== null && MemoryLocation.is(candidate.$sync) && MemoryLocation.is(candidate.$result);
	}
}

type _NotifyType = _MessageType;
type _NotifyHandler = (params: any) => void;


interface AbstractMessage {
	method: string;
	params?: null | undefined | object;
}

interface _Request extends AbstractMessage {
	id: number;
}
namespace _Request {
	export function is(value: any): value is _Request {
		const candidate: _Request = value;
		return candidate !== undefined && candidate !== null && typeof candidate.id === 'number' && typeof candidate.method === 'string';
	}
}

interface _Response {
	id: number;
	result?: any;
	error?: any;
}
namespace _Response {
	export function is(value: any): value is _Response {
		const candidate: _Response = value;
		return candidate !== undefined && candidate !== null && typeof candidate.id === 'number' && (candidate.error !== undefined || candidate.result !== undefined);
	}
}

interface _Notification extends AbstractMessage {
}
namespace _Notification {
	export function is(value: any): value is _NotifyType {
		const candidate: _NotifyType & { id: undefined } = value;
		return candidate !== undefined && candidate !== null && typeof candidate.method === 'string' && candidate.id === undefined;
	}
}

type _Message = _Request | _Notification | _Response;

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

type _AsyncCallSignatures<AsyncCalls extends _AsyncCallType, TLI> = UnionToIntersection<{
 	[call in AsyncCalls as call['method']]: call['params'] extends undefined | void
	 	? (method: call['method']) => Promise<call['result'] extends unknown | undefined | void ? void : call['result']>
		: (method: call['method'], params: call['params'], transferList?: ReadonlyArray<TLI>) => Promise<call['result'] extends unknown | undefined | void ? void : call['result']>;
}[keyof MethodKeys<AsyncCalls>]>;

type AsyncCallSignatures<AsyncCalls extends _AsyncCallType | undefined, TLI> = [AsyncCalls] extends [_AsyncCallType] ? _AsyncCallSignatures<AsyncCalls, TLI> : undefined;

type _AsyncCallHandlerSignatures<AsyncCalls extends _AsyncCallType> = UnionToIntersection<{
 	[call in AsyncCalls as call['method']]: call['params'] extends undefined | void
	 	? (method: call['method'], handler: () => Promise<call['result'] extends unknown | undefined | void ? void : call['result']>) => void
		: (method: call['method'], handler: (params: call['params']) => Promise<call['result'] extends unknown | undefined | void ? void : call['result']>) => void
}[keyof MethodKeys<AsyncCalls>]>;

type AsyncCallHandlerSignatures<AsyncCalls extends _AsyncCallType | undefined> = [AsyncCalls] extends [_AsyncCallType] ?_AsyncCallHandlerSignatures<AsyncCalls> : undefined;

type _SyncCallSignatures<SyncCalls extends _SyncCallType, TLI> = UnionToIntersection<{
 	[call in SyncCalls as call['method']]: call['params'] extends undefined | void
	 	? call['result'] extends object
			? (method: call['method'], resultDescriptor: _ResultDescriptor, timeout?: number | undefined) => InstanceType<call['result']>
			: (method: call['method'], timeout?: number | undefined) => void
		: call['result'] extends object
			? (method: call['method'], params: call['params'], resultDescriptor: _ResultDescriptor, timeout?: number | undefined, transferList?: ReadonlyArray<TLI>) => InstanceType<call['result']>
			: (method: call['method'], params: call['params'], timeout?: number | undefined, transferList?: ReadonlyArray<TLI>) => void;
}[keyof MethodKeys<SyncCalls>]>;

type SyncCallSignatures<SyncCalls extends _SyncCallType | undefined, TLI> = [SyncCalls] extends [_SyncCallType] ? _SyncCallSignatures<SyncCalls, TLI> : undefined;

type _SyncCallHandlerSignatures<SyncCalls extends _SyncCallType> = UnionToIntersection<{
 	[call in SyncCalls as call['method']]: call['params'] extends undefined | void
	 	? call['result'] extends object
			? (method: call['method'], handler: (result: MemoryLocation) => number) => void
			: (method: call['method'], handler: () => void) => void
		: call['result'] extends object
		 ? (method: call['method'], handler: (params: call['params'], result: MemoryLocation) => number) => void
		 : (method: call['method'], handler: (params: call['params']) => void) => void
}[keyof MethodKeys<SyncCalls>]>;

type SyncCallHandlerSignatures<SyncCalls extends _SyncCallType | undefined> = [SyncCalls] extends [_SyncCallType] ? _SyncCallHandlerSignatures<SyncCalls> : undefined;

type _NotifySignatures<Notifications extends _NotifyType, TLI> = UnionToIntersection<{
	[N in Notifications as N['method']]: N['params'] extends unknown | undefined | void
		? (method: N['method']) => void
		: (method: N['method'], params: N['params'], transferList?: ReadonlyArray<TLI>) => void;
}[keyof MethodKeys<Notifications>]>;

type NotifySignatures<Notifications extends _NotifyType | undefined, TLI> = [Notifications] extends [_NotifyType] ? _NotifySignatures<Notifications, TLI> : undefined;

type _NotifyHandlerSignatures<Notifications extends _NotifyType> = UnionToIntersection<{
	[N in Notifications as N['method']]: N['params'] extends unknown | undefined | void
		? (method: N['method'], handler: () => void) => void
		: (method: N['method'], handler: (params: N['params']) => void) => void;
}[keyof MethodKeys<Notifications>]>;

type NotifyHandlerSignatures<Notifications extends _NotifyType | undefined> = [Notifications] extends [_NotifyType] ? _NotifyHandlerSignatures<Notifications> : undefined;


export class TimeoutError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TimeoutError';
	}
}

export abstract class BaseConnection<AsyncCalls extends _AsyncCallType | undefined, SyncCalls extends _SyncCallType | undefined, Notifications extends _NotifyType | undefined, AsyncCallHandlers extends _AsyncCallType | undefined = undefined, SyncCallHandlers extends _SyncCallType | undefined = undefined, NotifyHandlers extends _NotifyType | undefined = undefined, TLI = unknown> {

	private static sync: number = 0;
	private static error: number = 1;

	private id: number;
	private readonly asyncCallResultPromises: Map<number, ResultPromise>;
	private readonly asyncCallHandlers: Map<string, _AsyncCallHandler>;

	private memory: Memory | undefined;
	private syncCallBuffer: Int32Array | undefined;
	private readonly syncCallHandlers: Map<string, _SyncCallHandler>;

	private readonly notifyHandlers: Map<string, _NotifyHandler>;

	constructor() {
		this.id = 1;
		this.asyncCallResultPromises = new Map();
		this.asyncCallHandlers = new Map();

		this.memory = undefined;
		this.syncCallBuffer = undefined;
		this.syncCallHandlers = new Map();

		this.notifyHandlers = new Map();
	}

	public readonly callAsync: AsyncCallSignatures<AsyncCalls, TLI> = this._callAsync as AsyncCallSignatures<AsyncCalls, TLI>;

	private _callAsync(method: string, params?: any, transferList?: ReadonlyArray<TLI>): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = this.id++;
			const request: _Request = { id, method };
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

	public initializeSyncCall(memory: Memory): void {
		this.memory = memory;
		const ptr: ptr = memory.alloc(s32.alignment, 2 * s32.size);
		this.syncCallBuffer = new Int32Array(memory.buffer, ptr, 2);
		Atomics.store(this.syncCallBuffer, BaseConnection.sync, 0);
		Atomics.store(this.syncCallBuffer, BaseConnection.error, 0);
	}

	public readonly callSync: SyncCallSignatures<SyncCalls, TLI> = this._callSync as SyncCallSignatures<SyncCalls, TLI>;

	private _callSync(method: string, params: any, result?: _ResultDescriptor | undefined, timeout?: number | undefined, transferList?: ReadonlyArray<TLI>): any {
		if (this.syncCallBuffer === undefined) {
			throw new Error('Sync calls are not initialized with shared memory.');
		}
		const call: _Notification = { method };
		let $result: MemoryLocation | undefined;
		if (result !== undefined && result !== null) {
			$result = { value: result.alloc() };
		}
		call.params = { ...params, $sync: MemoryLocation.create(this.syncCallBuffer.byteOffset), $result: $result};
		this.postMessage(call, transferList);
		this.syncCallBuffer[BaseConnection.error] = 0;
		Atomics.store(this.syncCallBuffer, BaseConnection.sync, 0);
		const wait = Atomics.wait(this.syncCallBuffer, BaseConnection.sync, 0, timeout);
		switch (wait) {
			case 'ok':
				const error = this.syncCallBuffer[BaseConnection.error];
				if (error === 0) {
					return (result === undefined || result === null || $result === undefined) ? undefined : new result($result);
				} else {
					throw new Error(`Sync call ${method} failed with error code ${error}`);
				}
			case 'timed-out':
				throw new TimeoutError(`Sync call ${method} timed out after ${timeout}ms`);
			case 'not-equal':
				const current = Atomics.load(this.syncCallBuffer, BaseConnection.sync);
				if (current === 1) {
					return (result === undefined || result === null || $result === undefined) ? undefined : new result($result);
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
		const notification: _Notification = { method };
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

	protected abstract postMessage(message: _Message | _Response, transferList?: ReadonlyArray<TLI>): void;

	protected async handleMessage(message: _Message): Promise<void> {
		if (_Request.is(message)) {
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
		} else if (_Notification.is(message)) {
			if (SyncCallParams.is(message.params)) {
				const handler = this.syncCallHandlers.get(message.method);
				if (handler !== undefined) {
					if (this.memory === undefined || this.syncCallBuffer === undefined) {
						throw new Error('Sync calls are not initialized with shared memory.');
					}
					const params = Object.assign(Object.create(null), message.params);
					delete params.$sync;
					delete params.$result;
					let errorCode: number = 0;
					try {
						errorCode = handler(params, message.params.$result) ?? 0;
					} catch (error: any) {
						if (typeof error.code === 'number') {
							errorCode = error.code;
						} else {
							errorCode = -1;
						}
					} finally {
						const syncCallBuffer = new Int32Array(this.memory.buffer, message.params.$sync.value, 2);
						syncCallBuffer[BaseConnection.error] = errorCode;
						Atomics.store(this.syncCallBuffer, BaseConnection.sync, 1);
						Atomics.notify(this.syncCallBuffer, BaseConnection.sync, 1);
					}
				}
			} else {
				const handler = this.notifyHandlers.get(message.method);
				if (handler !== undefined) {
					try {
						handler(message.params);
					} catch (error: any) {
						// console.error(`Notification handler for ${message.method} failed with error ${error.message}`);
					}
				}
			}
		} else if (_Response.is(message)) {
			const id = message.id;
			const promise = this.asyncCallResultPromises.get(id);
			if (promise !== undefined) {
				this.asyncCallResultPromises.delete(id);
				if (message.result !== undefined) {
					promise.resolve(message.result);
				} else if (message.error !== undefined) {
					promise.reject(typeof message.error === 'string' ? new Error(message.error) : message.error);
				} else {
					promise.reject(new Error('Response has neither a result nor an error value'));
				}
			}
		}
	}

	private sendResultResponse(id: number, result: any): void {
		const response: _Response =  { id, result: result === undefined ? null : result };
		this.postMessage(response);
	}

	private sendErrorResponse(id: number, error: any): void {
		const response: _Response =  { id, error: error === undefined ? 'Unknown error' : error instanceof Error ? error.message : error };
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
	export type Request = _Request;
	export const Request = _Request;
	export type Notification = _Notification;
	export const Notification = _Notification;
	export type Response = _Response;
	export const Response = _Response;
	export type Message = _Message;
}

type AsyncCalls = {
	method: 'timeout';
	params: { ms: number };
	result: number;
};

type SyncCalls = {
	method: 'timeout';
	params: { ms: number };
	result: undefined;
};

type Notifications = {
	method: 'exit';
};

let connection!: BaseConnection<AsyncCalls, SyncCalls, Notifications, AsyncCalls, SyncCalls, Notifications>;

connection.callSync('timeout', { ms: 1000 });

connection.onSyncCall('timeout', (params) => {
});

connection.onNotify('exit', () => {
});

connection.notify('exit');
