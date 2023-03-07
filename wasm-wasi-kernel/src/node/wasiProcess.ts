/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { MessagePort, Worker } from 'worker_threads';

import RAL from '../common/ral';
import { WasiProcess } from '../common/wasiProcess';
import { WasiService, ServiceConnection, StartMainMessage, StartThreadMessage, Options } from '../common/wasiService';
import { Uri } from 'vscode';
import { ptr, u32 } from '../common/baseTypes';
import { DeviceDrivers } from '../common/deviceDriver';

class Connection extends ServiceConnection {

	private readonly port: MessagePort | Worker;

	constructor(wasiService: WasiService, port: MessagePort | Worker) {
		super(wasiService);
		this.port = port;
		this.port.on('message', (buffers: [SharedArrayBuffer, SharedArrayBuffer]) => {
			try {
				this.handleMessage(buffers);
			} catch (error) {
				RAL().console.error(error);
			}
		});
	}
}

export class NodeWasiProcess extends WasiProcess {

	private mainWorker: Worker | undefined;
	private threadWorkers: Map<u32, Worker>;

	constructor(deviceDrivers: DeviceDrivers, baseUri: Uri, programName: string, bits: SharedArrayBuffer | Uri, options: Options = {}, mapWorkspaceFolders: boolean = true) {
		super(deviceDrivers, baseUri, programName, bits, options,mapWorkspaceFolders);
		this.threadWorkers = new Map();
	}

	public async terminate(): Promise<number> {
		let result = 0;
		if (this.mainWorker !== undefined) {
			result = await this.mainWorker.terminate();
		}
		for (const worker of this.threadWorkers.values()) {
			await worker.terminate();
		}
		this.threadWorkers.clear();
		return result;
	}

	protected startMain(wasiService: WasiService, bits: SharedArrayBuffer | Uri): Promise<void> {
		const filename = Uri.joinPath(this.baseUri, './wasiMainWorker.js').toString();
		this.mainWorker = new Worker(filename);
		new Connection(wasiService, this.mainWorker);
		const message: StartMainMessage = { method: 'startMain', bits };
		this.mainWorker.postMessage(message);
		return Promise.resolve();
	}

	protected startThread(wasiService: WasiService, bits: SharedArrayBuffer | Uri, tid: u32, start_arg: ptr): Promise<void> {
		const filename = Uri.joinPath(this.baseUri, './wasiThreadWorker.js').toString();
		const worker = new Worker(filename);
		new Connection(wasiService, worker);
		const message: StartThreadMessage = { method: 'startThread', bits, tid, start_arg };
		worker.postMessage(message);
		this.threadWorkers.set(tid, worker);
		return Promise.resolve();
	}

	protected async threadEnded(tid: u32): Promise<void> {
		const worker = this.threadWorkers.get(tid);
		if (worker !== undefined) {
			this.threadWorkers.delete(tid);
			await worker.terminate();
		}
	}
}