/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../typings/webAssemblyNode.d.ts" preserve="true" />

import { MessagePort, Worker } from 'node:worker_threads';

import { LogOutputChannel, Uri } from 'vscode';

import { ProcessOptions } from '../common/api';
import { ptr, u32 } from '../common/baseTypes';
import type { ServiceMessage, StartMainMessage, StartThreadMessage, WorkerMessage } from '../common/connection';
import { WasiProcess } from '../common/process';
import RAL from '../common/ral';
import { ServiceConnection, WasiService } from '../common/service';

export class NodeServiceConnection extends ServiceConnection {

	private readonly port: MessagePort | Worker;

	constructor(wasiService: WasiService, port: MessagePort | Worker, logChannel?: LogOutputChannel | undefined) {
		super(wasiService, logChannel);
		this.port = port;
		this.port.on('message', (message: WorkerMessage) => {
			this.handleMessage(message).catch(RAL().console.error);
		});
	}

	public postMessage(message: ServiceMessage): void {
		this.port.postMessage(message);
	}
}

export class NodeWasiProcess extends WasiProcess {

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

	protected async startMain(wasiService: WasiService): Promise<void> {
		const filename = Uri.joinPath(this.baseUri, './dist/desktop/mainWorker.js').fsPath;
		this.mainWorker = new Worker(filename);
		this.mainWorker.on('exit', async (exitCode: number) => {
			this.cleanUpWorkers().catch(error => RAL().console.error(error));
			this.cleanupFileDescriptors().catch(error => RAL().console.error(error));
			// We might be in proc_exit state.
			if (this.state !== 'exiting') {
				this.resolveRunPromise(exitCode);
			}
		});
		const connection = new NodeServiceConnection(wasiService, this.mainWorker, this.options.trace);
		await connection.workerReady();
		const module = await this.module;
		this.importsMemory = this.doesImportMemory(module);
		if (this.importsMemory) {
			if (this.memoryDescriptor === undefined) {
				throw new Error('Web assembly imports memory but no memory descriptor was provided.');
			}
			this.memory = new WebAssembly.Memory(this.memoryDescriptor);
		}
		const message: StartMainMessage = { method: 'startMain', module: await this.module, memory: this.memory, trace: this.options.trace !== undefined };
		connection.postMessage(message);
		return Promise.resolve();
	}

	protected async startThread(wasiService: WasiService, tid: u32, start_arg: ptr): Promise<void> {
		if (this.mainWorker === undefined) {
			throw new Error('Main worker not started');
		}
		if (!this.importsMemory || this.memory === undefined) {
			throw new Error('Multi threaded applications need to import shared memory.');
		}
		const filename = Uri.joinPath(this.baseUri, './dist/desktop/threadWorker.js').fsPath;
		const worker = new Worker(filename);
		worker.on('exit', () => {
			this.threadWorkers.delete(tid);
		});
		const connection = new NodeServiceConnection(wasiService, worker, this.options.trace);
		await connection.workerReady();
		const message: StartThreadMessage = { method: 'startThread', module: await this.module, memory: this.memory!, tid, start_arg, trace: this.options.trace !== undefined };
		connection.postMessage(message);
		this.threadWorkers.set(tid, worker);
		return Promise.resolve();
	}

	protected async procExit(): Promise<void> {
		await this.mainWorker?.terminate();
		await this.cleanUpWorkers();
		await this.destroyStreams();
		await this.cleanupFileDescriptors();
	}

	public async terminate(): Promise<number> {
		let result = 0;
		if (this.mainWorker !== undefined) {
			result = await this.mainWorker.terminate();
		}
		await this.cleanUpWorkers();
		await this.destroyStreams();
		await this.cleanupFileDescriptors();
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