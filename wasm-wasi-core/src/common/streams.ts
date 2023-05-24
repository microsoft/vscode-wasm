/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, EventEmitter } from 'vscode';
import RAL from './ral';
import type { Readable, Writable } from './api';
import type { size } from './baseTypes';

export class DestroyError extends Error {
	constructor() {
		super('Pipe got destroyed');
	}
}

export abstract class Stream {

	private static BufferSize = 16384;

	protected chunks: Uint8Array[];
	protected fillLevel: number;

	private _targetFillLevel: number;
	private _awaitFillLevel: (() => void) | undefined;
	private _awaitFillLevelReject: ((err: Error) => void) | undefined;

	constructor() {
		this.chunks = [];
		this.fillLevel = 0;
		this._targetFillLevel = Stream.BufferSize;
	}

	public async write(chunk: Uint8Array): Promise<void> {
		// We have enough space
		if (this.fillLevel + chunk.byteLength <= Stream.BufferSize) {
			this.chunks.push(chunk);
			this.fillLevel += chunk.byteLength;
			this.signalData();
			return;
		}
		// What for the necessary space.
		const targetFillLevel = Math.max(0, Stream.BufferSize - chunk.byteLength);
		try {
			await this.awaitFillLevel(targetFillLevel);
			if (this.fillLevel > targetFillLevel) {
				throw new Error(`Invalid state: fillLevel should be <= ${targetFillLevel}`);
			}
			this.chunks.push(chunk);
			this.fillLevel += chunk.byteLength;
			this.signalData();
			return;
		} catch (error) {
			if (error instanceof DestroyError) {
				return;
			}
			throw error;
		}
	}

	public async destroy(): Promise<void> {
		this.chunks = [];
		this.fillLevel = 0;
		this._targetFillLevel = Stream.BufferSize;
		this._awaitFillLevel = undefined;
		if (this._awaitFillLevelReject !== undefined) {
			this._awaitFillLevelReject(new DestroyError());
			this._awaitFillLevelReject = undefined;
		}
	}

	private awaitFillLevel(targetFillLevel: number): Promise<void> {
		this._targetFillLevel = targetFillLevel;
		return new Promise<void>((resolve, reject) => {
			this._awaitFillLevel = resolve;
			this._awaitFillLevelReject = reject;
		});
	}

	protected signalSpace(): void {
		if (this._awaitFillLevel === undefined) {
			return;
		}
		// Not enough space.
		if (this.fillLevel > this._targetFillLevel) {
			return;
		}
		this._awaitFillLevel();
		this._awaitFillLevel = undefined;
		this._targetFillLevel = Stream.BufferSize;
	}

	protected abstract signalData(): void;

}

export class WritableStream extends Stream implements Writable {

	private readonly encoding: 'utf-8';
	private readonly encoder: RAL.TextEncoder;

	private _awaitData: (() => void) | undefined;
	private _awaitDataReject: ((err: Error) => void) | undefined;

	constructor(encoding?: 'utf-8') {
		super();
		this.encoding = encoding ?? 'utf-8';
		this.encoder = RAL().TextEncoder.create(this.encoding);
	}

	public async write(chunk: Uint8Array | string): Promise<void> {
		return super.write(typeof chunk === 'string' ? this.encoder.encode(chunk) : chunk);
	}

	public async read(maxBytes: size): Promise<Uint8Array> {
		if (this.chunks.length === 0) {
			try {
				await this.awaitData();
			} catch (error) {
				if (error instanceof DestroyError) {
					return new Uint8Array(0);
				}
				throw error;
			}
		}
		if (this.chunks.length === 0) {
			throw new Error('Invalid state: no bytes available after awaiting data');
		}
		// No max bytes or all data fits into the result.
		if (maxBytes === undefined || maxBytes > this.fillLevel) {
			const result = new Uint8Array(this.fillLevel);
			let offset = 0;
			for (const chunk of this.chunks) {
				result.set(chunk, offset);
				offset += chunk.byteLength;
			}
			this.chunks = [];
			this.fillLevel = 0;
			this.signalSpace();
			return result;
		}

		const chunk = this.chunks[0];
		// The first chunk is bigger than the maxBytes. Although not optimal we need
		// to split it up
		if (chunk.byteLength > maxBytes) {
			const result = chunk.subarray(0, maxBytes);
			this.chunks[0] = chunk.subarray(maxBytes);
			this.fillLevel -= maxBytes;
			this.signalSpace();
			return result;
		} else {
			let resultSize = chunk.byteLength;
			for (let i = 1; i < this.chunks.length; i++) {
				if (resultSize + this.chunks[i].byteLength > maxBytes) {
					break;
				}
			}
			const result = new Uint8Array(resultSize);
			let offset = 0;
			for (let i = 0; i < this.chunks.length; i++) {
				const chunk = this.chunks.shift()!;
				if (offset + chunk.byteLength > maxBytes) {
					break;
				}
				result.set(chunk, offset);
				offset += chunk.byteLength;
				this.fillLevel -= chunk.byteLength;
			}
			this.signalSpace();
			return result;
		}
	}

	public async destroy(): Promise<void> {
		if (this._awaitDataReject !== undefined) {
			this._awaitDataReject(new DestroyError());
			this._awaitDataReject = undefined;
		}
		return super.destroy();
	}

	private awaitData(): Promise<void> {
		return new Promise<void>((resolve) => {
			this._awaitData = resolve;
		});
	}

	protected signalData(): void {
		if (this._awaitData === undefined) {
			return;
		}
		this._awaitData();
		this._awaitData = undefined;
	}
}

export class ReadableStream extends Stream implements Readable {

	private readonly _onData = new EventEmitter<Uint8Array>();

	constructor() {
		super();
		this._onData = new EventEmitter();
	}

	public get onData(): Event<Uint8Array> {
		return this._onData.event;
	}

	public destroy(): Promise<void> {
		if (this.chunks.length > 0) {
			for (const chunk of this.chunks) {
				this._onData.fire(chunk);
			}
		}
		return super.destroy();
	}

	protected signalData(): void {
		RAL().timer.setImmediate(() => this.triggerData());
	}

	triggerData() {
		if (this.chunks.length === 0) {
			return;
		}
		const chunk = this.chunks.shift()!;
		this.fillLevel -= chunk.byteLength;
		this._onData.fire(chunk);
		this.signalSpace();
		if (this.chunks.length > 0) {
			RAL().timer.setImmediate(() => this.triggerData());
		}
	}
}