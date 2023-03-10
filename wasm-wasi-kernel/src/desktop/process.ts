/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { MessagePort, Worker } from 'worker_threads';
import { Uri } from 'vscode';

import RAL from '../common/ral';
import { ptr, u32 } from '../common/baseTypes';
import { WasiProcess } from '../common/process';
import { WasiService, ServiceConnection, Options } from '../common/service';
import { StartMainMessage, StartThreadMessage, WasiCallMessage, WorkerReadyMessage } from '../common/connection';

class Connection extends ServiceConnection {

	private readonly port: MessagePort | Worker;
	private _workerReady: Promise<void>;

	constructor(wasiService: WasiService, port: MessagePort | Worker) {
		super(wasiService);
		let workerReadyResolve: () => void;
		this._workerReady = new Promise((resolve) => {
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

	public workerReady(): Promise<void> {
		return this._workerReady;
	}

	public postMessage(message: StartMainMessage | StartThreadMessage): void {
		this.port.postMessage(message);
	}
}

export class NodeWasiProcess extends WasiProcess {

	private readonly module: Promise<WebAssembly.Module>;

	private importsMemory: boolean | undefined;
	private readonly memoryDescriptor: WebAssembly.MemoryDescriptor | undefined;
	private memory: WebAssembly.Memory | undefined;

	private mainWorker: Worker | undefined;
	private threadWorkers: Map<u32, Worker>;

	constructor(baseUri: Uri, programName: string, bits: SharedArrayBuffer | Uri, memory: WebAssembly.MemoryDescriptor | undefined, options: Options = {}, mapWorkspaceFolders: boolean = true) {
		super(baseUri, programName, options, mapWorkspaceFolders);
		this.threadWorkers = new Map();
		this.module = WebAssembly.compile(new Uint8Array(bits as SharedArrayBuffer));
		this.memoryDescriptor = memory;
	}

	protected async startMain(wasiService: WasiService): Promise<void> {
		const filename = Uri.joinPath(this.baseUri, './lib/node/wasiMainWorker.js').fsPath;
		this.mainWorker = new Worker(filename);
		this.mainWorker.on('exit', async () => {
			this.cleanUpWorkers().catch(error => RAL().console.error(error));
		});
		const connection = new Connection(wasiService, this.mainWorker);
		await connection.workerReady();
		const module = await this.module;
		this.importsMemory = this.doesImportMemory(module);
		if (this.importsMemory) {
			if (this.memoryDescriptor === undefined) {
				throw new Error('Web assembly imports memory but no memory descriptor was provided.');
			}
			this.memory = new WebAssembly.Memory(this.memoryDescriptor);
		}
		const message: StartMainMessage = { method: 'startMain', module: await this.module, memory: this.memory };
		connection.postMessage(message);
		return Promise.resolve();
	}

	protected async startThread(wasiService: WasiService, tid: u32, start_arg: ptr): Promise<void> {
		if (this.mainWorker === undefined) {
			throw new Error('Main worker not started');
		}
		if (!this.importsMemory) {
			throw new Error('Multi threaded applications need to import shared memory.');
		}
		const filename = Uri.joinPath(this.baseUri, './lib/node/wasiThreadWorker.js').fsPath;
		const worker = new Worker(filename);
		worker.on('exit', () => {
			this.threadWorkers.delete(tid);
		});
		const connection = new Connection(wasiService, worker);
		await connection.workerReady();
		const message: StartThreadMessage = { method: 'startThread', module: await this.module, memory: this.memory!, tid, start_arg };
		connection.postMessage(message);
		this.threadWorkers.set(tid, worker);
		return Promise.resolve();
	}

	public async terminate(): Promise<number> {
		let result = 0;
		if (this.mainWorker !== undefined) {
			result = await this.mainWorker.terminate();
		}
		await this.cleanUpWorkers();
		return result;
	}

	private async cleanUpWorkers(): Promise<void> {
		for (const worker of this.threadWorkers.values()) {
			await worker.terminate();
		}
		this.threadWorkers.clear();
	}

	protected async threadEnded(tid: u32): Promise<void> {
		const worker = this.threadWorkers.get(tid);
		if (worker !== undefined) {
			this.threadWorkers.delete(tid);
			await worker.terminate();
		}
	}
}