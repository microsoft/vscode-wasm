/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { RAL as _RAL} from '@vscode/wasm-component-model';
import RAL from '../common/ral';

import { Memory } from '../common/sobject';
import bytes from '../common/malloc';
import type * as commonConnection from '../common/connection';
import type { WorkerClient, WorkerClientBase } from '../common/workerClient';

import { AnyConnection } from './connection';
import { WorkerClient  as _WorkerClient } from './workerClient';

interface RIL extends RAL {
}

const _ril: RIL = Object.freeze<RIL>(Object.assign({}, _RAL(), {
	Memory: Object.freeze({
		module: (): Promise<WebAssembly.Module> => {
			return WebAssembly.compile(bytes);
		},
		create: async (module: WebAssembly.Module, memory: WebAssembly.Memory): Promise<Memory> => {
			const instance = new WebAssembly.Instance(module, {
				env: {
					memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return Memory.create(module, memory, instance.exports as unknown as Memory.Exports);
		}
	}),
	MessageChannel: Object.freeze({
		create: async (): Promise<[commonConnection.ConnectionPort, commonConnection.ConnectionPort]> => {
			const channel = new MessageChannel();
			return [channel.port1, channel.port2];
		}
	}),
	WorkerClient<C>(base: new () => WorkerClientBase, module: string): (new () => WorkerClient & C) {
		return _WorkerClient(base, module);
	},
	Worker: Object.freeze({
		getArgs: () => {
			// remove the ?
			const search = self.location.search.slice(1);
			return search.split('&').map(part => { return part.split('=')[1]; });
		}
	}),
	Connection: Object.freeze({
		create: (port: any): commonConnection.AnyConnection => {
			if (!(port instanceof MessagePort)) {
				throw new Error(`Expected MessagePort`);
			}
			return new AnyConnection(port) as commonConnection.AnyConnection;
		}
	})
}));

function RIL(): RIL {
	return _ril;
}

namespace RIL {
	export function install(): void {
		if (!RAL.isInstalled()) {
			RAL.install(_ril);
		}
	}
}

if (!RAL.isInstalled()) {
	RAL.install(_ril);
}
export default RIL;