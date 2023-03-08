/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { MessagePort, Worker } from 'worker_threads';
import { Uri } from 'vscode';

import RAL from '../common/ral';
import { ptr, u32 } from '../common/baseTypes';
import { WasiProcess } from '../common/wasiProcess';
import { WasiService, ServiceConnection, StartMainMessage, StartThreadMessage, Options, WorkerReadyMessage, WasiCallMessage } from '../common/wasiService';

class Connection extends ServiceConnection {

	private readonly port: MessagePort | Worker;
	private workerReady: Promise<void>;

	constructor(wasiService: WasiService, port: MessagePort | Worker) {
		super(wasiService);
		let workerReadyResolve: () => void;
		this.workerReady = new Promise((resolve) => {
			workerReadyResolve = resolve;
		});
		this.port = port;
		this.port.on('message', async (message: WorkerReadyMessage | WasiCallMessage) => {
			if (WasiCallMessage.is(message)) {
				try {
					await this.handleMessage(message);
				} catch (error) {
					RAL().console.error(error);
				}
			} else if (WorkerReadyMessage.is(message)) {
				workerReadyResolve();
			}
		});
	}

	public onWorkerReady(): Promise<void> {
		return this.workerReady;
	}
}

export class NodeWasiProcess extends WasiProcess {

	private mainWorker: Worker | undefined;
	private threadWorkers: Map<u32, Worker>;

	constructor(baseUri: Uri, programName: string, bits: SharedArrayBuffer | Uri, options: Options = {}, mapWorkspaceFolders: boolean = true) {
		super(baseUri, programName, bits, options,mapWorkspaceFolders);
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
		const filename = Uri.joinPath(this.baseUri, './lib/node/wasiMainWorker.js').fsPath;
		this.mainWorker = new Worker(filename);
		new Connection(wasiService, this.mainWorker);
		const message: StartMainMessage = { method: 'startMain', bits };
		this.mainWorker.postMessage(message);
		return Promise.resolve();
	}

	protected startThread(wasiService: WasiService, bits: SharedArrayBuffer | Uri, tid: u32, start_arg: ptr): Promise<void> {
		const filename = Uri.joinPath(this.baseUri, './lib/node/wasiThreadWorker.js').toString();
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