/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InterfaceType, PackageType, WasmInterfaces } from '@vscode/wasm-component-model';
import { AbstractHostConnection, Options, WasiHost } from '../host';
import { AbstractServiceConnection } from '../service';

// class TestHostConnection extends AbstractHostConnection {

// 	private readonly serviceConnection: TestServiceConnection;

// 	constructor(serviceConnection: TestServiceConnection) {
// 		super();
// 		this.serviceConnection = serviceConnection;
// 	}

// 	protected doCall(paramMemory: SharedArrayBuffer, heapMemory: SharedArrayBuffer): void {
// 		this.serviceConnection.call(paramMemory, heapMemory);
// 	}
// }

// class TestServiceConnection extends AbstractServiceConnection {

// 	constructor(interfaces: WasmInterfaces, metaTypes: (PackageType | InterfaceType)[]) {
// 		super(interfaces, metaTypes);
// 	}

// 	public call(paramMemory: SharedArrayBuffer, heapMemory: SharedArrayBuffer): void {
// 		this.doCall(paramMemory, heapMemory);
// 	}

// }


// export class Memory {

// 	private readonly _buffer: ArrayBuffer;

// 	constructor(buffer: ArrayBuffer) {
// 		this._buffer = buffer;
// 	}

// 	get buffer(): ArrayBuffer {
// 		return this._buffer;
// 	}

// 	public grow(_delta: number): number {
// 		throw new Error('Memory.grow not implemented');
// 	}
// }

// suite('WasiWorker', () => {
// 	const serviceConnection = new TestServiceConnection();
// 	const hostConnection = new TestHostConnection(serviceConnection);

// 	test('test', () => {
// 		const options: Options = { encoding: 'utf-8' };
// 		let host = WasiHost.create(hostConnection, options);
// 		let memory = new Memory(new ArrayBuffer(65536));
// 		host.initialize(memory);
// 		const monotonic = host['wasi:clocks/monotonic-clock']!;
// 		monotonic['subscribe-duration'](10n);
// 	});
// });