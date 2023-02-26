/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { args_get, args_sizes_get, clock_res_get, clock_time_get, environ_get, environ_sizes_get, errno, Errno, fd_advise, fd_allocate, fd_close, WasiError } from './wasi';
import { Offsets } from './connection';
import { FunctionSignature, Signatures } from './wasiMeta';

export interface WasiService {
	args_sizes_get: args_sizes_get.ServiceSignature;
	args_get: args_get.ServiceSignature;
	clock_res_get: clock_res_get.ServiceSignature;
	clock_time_get: clock_time_get.ServiceSignature;
	environ_sizes_get: environ_sizes_get.ServiceSignature;
	environ_get: environ_get.ServiceSignature;
	fd_advise: fd_advise.ServiceSignature;
	fd_allocate: fd_allocate.ServiceSignature;
	fd_close: fd_close.ServiceSignature;
	[name: string]: (memory: ArrayBuffer, ...args: (number & bigint)[]) => Promise<errno>;
}


export abstract class ServiceConnection {

	private readonly wasiService: WasiService;

	constructor(wasiService: WasiService) {
		this.wasiService = wasiService;
	}

	protected async handleMessage(buffers: [SharedArrayBuffer, SharedArrayBuffer]): Promise<void> {
		const [paramBuffer, wasmMemory] = buffers;
		const paramView = new DataView(paramBuffer);
		try {

			const method = paramView.getUint32(Offsets.method_index, true);
			const signature = Signatures.signatureAt(method);
			if (signature === undefined) {
				throw new WasiError(Errno.inval);
			}
			const params = this.getParams(signature, paramBuffer);
			const result = await this.wasiService[signature.name](wasmMemory, ...params);
			paramView.setUint16(Offsets.errno_index, result, true);
		} catch (err) {
			if (err instanceof WasiError) {
				paramView.setUint16(Offsets.errno_index, err.errno, true);
			} else {
				paramView.setUint16(Offsets.errno_index, Errno.inval, true);
			}
		}

		const sync = new Int32Array(paramBuffer, 0, 1);
		Atomics.store(sync, 0, 1);
		Atomics.notify(sync, 0);
	}

	private getParams(signature: FunctionSignature, paramBuffer: SharedArrayBuffer): (number & bigint)[] {
		const paramView = new DataView(paramBuffer);
		const params: (number | bigint)[] = [];
		let offset = Offsets.header_size;
		for (let i = 0; i < signature.params.length; i++) {
			const param = signature.params[i];
			params.push(param.getter(paramView, offset));
			offset += Param.getSize(param.kind);
		}
		return params as (number & bigint)[];
	}
}
