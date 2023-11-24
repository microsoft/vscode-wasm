/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { io } from '@vscode/wasi';
import { Promisify, Resource, borrow } from '@vscode/wasm-component-model';

export class Pollable extends Resource implements Promisify<io.Poll.Pollable> {

	public readonly promise: Promise<boolean>;
	private _ready: boolean = false;

	constructor(promise: Promise<boolean>) {
		super();
		this.promise = promise;
		// @spec what should ready return if the pollable errors.
		promise.then(ready => this._ready = ready).catch(() => this._ready = false);
	}

	public ready(): Promise<boolean> {
		return Promise.resolve(this._ready);
	}

	public async block(): Promise<void> {
		await this.promise;
	}

	public isReady(): boolean {
		return this._ready;
	}
}

const Poll: Promisify<io.Poll> = {
	Pollable: Pollable,
	poll: async (in_): Promise<Uint32Array> =>  {
		const isReady: number[] = [];
		for (const pollable of in_) {
			if ((pollable as Pollable).isReady) {
				isReady.push(pollable.__handle!);
			}
		}
	}
};

let x: Promisify<string>;