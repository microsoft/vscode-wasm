/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

type _MessageType = {
	method: string;
	params?: null | object;
};

type _RequestType = _MessageType & {
	result: null | undefined | void | any;
	error?: undefined;
};

type _NotificationType = _MessageType;

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

type RequestHandler = (params: any) => Promise<any>;

interface _Notification extends AbstractMessage {
}

namespace _Notification {
	export function is(value: any): value is _NotificationType {
		const candidate: _NotificationType & { id: undefined } = value;
		return candidate !== undefined && candidate !== null && typeof candidate.method === 'string' && candidate.id === undefined;
	}
}

type NotificationHandler = (params: any) => void;

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

type _Message = _Request | _Notification | _Response;

type ResponsePromise = {
	method: string;
	resolve: (response: any) => void;
	reject: (error: any) => void;
};

type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type MethodKeys<Messages extends _MessageType> = {
	[M in Messages as M['method']]: M['method'];
};

type _SendRequestSignatures<Requests extends _RequestType, TLI> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined | void
	 	? (method: R['method']) => Promise<R['result'] extends null | undefined ? void : R['result']>
		: (method: R['method'], params: R['params'], transferList?: ReadonlyArray<TLI>) => Promise<R['result'] extends null | undefined ? void : R['result']>;
}[keyof MethodKeys<Requests>]>;

type SendRequestSignatures<Requests extends _RequestType | undefined, TLI> = [Requests] extends [_RequestType] ? _SendRequestSignatures<Requests, TLI> : undefined;

type _HandleRequestSignatures<Requests extends _RequestType> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined | void
	 	? (method: R['method'], handler: () => Promise<R['result'] extends null | undefined ? void : R['result']>) => void
		: (method: R['method'], handler: (params: R['params']) => Promise<R['result'] extends null | undefined ? void : R['result']>) => void;
}[keyof MethodKeys<Requests>]>;

type HandleRequestSignatures<Requests extends _RequestType | undefined> = [Requests] extends [_RequestType] ?_HandleRequestSignatures<Requests> : undefined;

type _SendNotificationSignatures<Notifications extends _NotificationType, TLI> = UnionToIntersection<{
	[N in Notifications as N['method']]: N['params'] extends null | undefined | void
		? (method: N['method']) => void
		: (method: N['method'], params: N['params'], transferList?: ReadonlyArray<TLI>) => void;
}[keyof MethodKeys<Notifications>]>;

type SendNotificationSignatures<Notifications extends _NotificationType | undefined, TLI> = [Notifications] extends [_NotificationType] ? _SendNotificationSignatures<Notifications, TLI> : undefined;

type _HandleNotificationSignatures<Notifications extends _NotificationType> = UnionToIntersection<{
	[N in Notifications as N['method']]: N['params'] extends null | undefined | void
		? (method: N['method'], handler: () => void) => void
		: (method: N['method'], handler: (params: N['params']) => void) => void;
}[keyof MethodKeys<Notifications>]>;

type HandleNotificationSignatures<Notifications extends _NotificationType | undefined> = [Notifications] extends [_NotificationType] ? _HandleNotificationSignatures<Notifications> : undefined;

export abstract class BaseMessageConnection<Requests extends _RequestType | undefined, Notifications extends _NotificationType | undefined, RequestHandlers extends _RequestType | undefined = undefined, NotificationHandlers extends _NotificationType | undefined = undefined, TLI = unknown> {

	private id: number;
	private readonly responsePromises: Map<number, ResponsePromise>;
	private readonly requestHandlers: Map<string, RequestHandler>;
	private readonly notificationHandlers: Map<string, NotificationHandler>;

	constructor() {
		this.id = 1;
		this.responsePromises = new Map();
		this.requestHandlers = new Map();
		this.notificationHandlers = new Map();
	}

	public readonly sendRequest: SendRequestSignatures<Requests, TLI> = this._sendRequest as SendRequestSignatures<Requests, TLI>;

	private _sendRequest(method?: string, params?: any, transferList?: ReadonlyArray<TLI>): Promise<any> {
		if (method === undefined) {
			return Promise.resolve();
		}
		return new Promise((resolve, reject) => {
			const id = this.id++;
			const request: _Request = { id, method };
			if (params !== undefined) {
				request.params = params;
			}
			this.responsePromises.set(id, { resolve, reject, method: request.method});
			this.postMessage(request, transferList);
		});
	}

	public readonly onRequest: HandleRequestSignatures<RequestHandlers> = this._onRequest as HandleRequestSignatures<RequestHandlers>;

	private _onRequest(method?: string, handler?: RequestHandler): void {
		if (method === undefined || handler === undefined) {
			return;
		}
		this.requestHandlers.set(method, handler);
	}

	public readonly sendNotification: SendNotificationSignatures<Notifications, TLI> = this._sendNotification as SendNotificationSignatures<Notifications, TLI>;

	private _sendNotification(method?: string, params?: any, transferList?: ReadonlyArray<TLI>): void {
		if (method === undefined) {
			return;
		}
		const notification: _Notification = { method };
		if (params !== undefined) {
			notification.params = params;
		}
		this.postMessage(notification, transferList);
	}

	public readonly onNotification: HandleNotificationSignatures<NotificationHandlers> = this._onNotification as HandleNotificationSignatures<NotificationHandlers>;

	private _onNotification(method?: string, handler?: NotificationHandler): void {
		if (method === undefined || handler === undefined) {
			return;
		}
		this.notificationHandlers.set(method, handler);
	}

	public abstract listen(): void;

	protected abstract postMessage(message: _Message | _Response, transferList?: ReadonlyArray<TLI>): void;

	protected async handleMessage(message: _Message): Promise<void> {
		if (_Request.is(message)) {
			const id = message.id;
			const handler = this.requestHandlers.get(message.method);
			if (handler !== undefined) {
				try {
					const result = await handler(message.params);
					this.sendResultResponse(id, result);
				} catch(error) {
					this.sendErrorResponse(id, error);
				}
			}
		} else if (_Notification.is(message)) {
			const handler = this.notificationHandlers.get(message.method);
			if (handler !== undefined) {
				handler(message.params);
			}
		} else if (_Response.is(message)) {
			const id = message.id;
			const promise = this.responsePromises.get(id);
			if (promise !== undefined) {
				this.responsePromises.delete(id);
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

export namespace BaseMessageConnection {
	export type MessageType  = _MessageType;
	export type RequestType = _RequestType;
	export type NotificationType = _NotificationType;
	export type Request = _Request;
	export const Request = _Request;
	export type Notification = _Notification;
	export const Notification = _Notification;
	export type Response = _Response;
	export const Response = _Response;
	export type Message = _Message;
}