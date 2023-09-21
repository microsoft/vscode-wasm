/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { LogOutputChannel, Uri } from 'vscode';

import RAL from '../common/ral';

import { WasiProcess } from '../common/process';
import { WasiService, ServiceConnection } from '../common/service';
import type { ptr, u32 } from '../common/baseTypes';
import type { ServiceMessage, StartMainMessage, StartThreadMessage, WorkerMessage } from '../common/connection';
import type { ProcessOptions } from '../common/api';

export class BrowserServiceConnection extends ServiceConnection {

	private readonly port: MessagePort | Worker;

	constructor(wasiService: WasiService, port: MessagePort | Worker, logChannel?: LogOutputChannel | undefined) {
		super(wasiService, logChannel);
		this.port = port;
		this.port.onmessage = ((event: MessageEvent<WorkerMessage>) => {
			this.handleMessage(event.data).catch((error) => RAL().console.error(error));
		});
	}

	public postMessage(message: ServiceMessage): void {
		try {
			this.port.postMessage(message);
		} catch (error) {
			RAL().console.error(error);
		}
	}
}

export class BrowserWasiProcess extends WasiProcess {

	private readonly baseUri: Uri;
	private readonly module: Promise<WebAssembly.Module>;

	private importsMemory: boolean | undefined;
	private readonly memoryDescriptor: WebAssembly.MemoryDescriptor | undefined;
	private memory: WebAssembly.Memory | undefined;

	private mainWorker: Worker | undefined;
	private threadWorkers: Map<u32, Worker>;

	constructor(baseUri: Uri, programName: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.Memory | WebAssembly.MemoryDescriptor | undefined, options: ProcessOptions = {}) {
		super(programName, options);
		this.baseUri = baseUri;
		this.threadWorkers = new Map();
		this.module = module instanceof WebAssembly.Module
			? Promise.resolve(module)
			: module;
		if (memory instanceof WebAssembly.Memory) {
			this.memory = memory;
		} else {
			this.memoryDescriptor = memory;
		}
	}

	protected async procExit(): Promise<void> {
		if (this.mainWorker !== undefined) {
			this.mainWorker.terminate();
		}
		await this.cleanUpWorkers();
		await this.destroyStreams();
		await this.cleanupFileDescriptors();
	}

	public async terminate(): Promise<number> {
		const result = 0;
		await this.procExit();

		// when terminated, web workers silently exit, and there are no events
		// to hook on to know when they are done. To ensure that the run promise resolves,
		// we call it here so callers awaiting `process.run()` will get a result.
		this.resolveRunPromise(result);
		return result;
	}

	protected async startMain(wasiService: WasiService): Promise<void> {
		const filename = Uri.joinPath(this.baseUri, './dist/web/mainWorker.js').toString();
		this.mainWorker = new Worker(filename);
		const connection = new BrowserServiceConnection(wasiService, this.mainWorker, this.options.trace);
		await connection.workerReady();
		const module = await this.module;
		this.importsMemory = this.doesImportMemory(module);
		if (this.importsMemory && this.memory === undefined) {
			if (this.memoryDescriptor === undefined) {
				throw new Error('Web assembly imports memory but no memory descriptor was provided.');
			}
			this.memory = new WebAssembly.Memory(this.memoryDescriptor);
		}
		const message: StartMainMessage = { method: 'startMain', module: await this.module, memory: this.memory, trace: this.options.trace !== undefined };
		connection.postMessage(message);
		connection.workerDone().then(async () => {
			await this.cleanUpWorkers();
			await this.cleanupFileDescriptors();
			this.resolveRunPromise(0);

		}).catch((error) => { RAL().console.error(error); });
		return Promise.resolve();
	}

	protected async startThread(wasiService: WasiService, tid: u32, start_arg: ptr): Promise<void> {
		if (this.mainWorker === undefined) {
			throw new Error('Main worker not started');
		}
		if (!this.importsMemory || this.memory === undefined) {
			throw new Error('Multi threaded applications need to import shared memory.');
		}
		const filename = Uri.joinPath(this.baseUri, './dist/web/threadWorker.js').toString();
		const worker = new Worker(filename);
		const connection = new BrowserServiceConnection(wasiService, worker, this.options.trace);
		await connection.workerReady();
		const message: StartThreadMessage = { method: 'startThread', module: await this.module, memory: this.memory!, tid, start_arg, trace: this.options.trace !== undefined };
		connection.postMessage(message);
		this.threadWorkers.set(tid, worker);
		return Promise.resolve();
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
			worker.terminate();
		}
	}

	private doesImportMemory(module: WebAssembly.Module): boolean {
		const imports = WebAssembly.Module.imports(module);
		for (const item of imports) {
			if (item.kind === 'memory' && item.name === 'memory') {
				return true;
			}
		}
		return false;
	}
}