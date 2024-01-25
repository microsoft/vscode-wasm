/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from '../common/ral';

import { Memory } from '../common/sobject';
import bytes from '../common/malloc';

interface RIL extends RAL {
}

const _ril: RIL = Object.freeze<RIL>({
	Memory: Object.freeze({
		create: async (memory: WebAssembly.Memory): Promise<Memory> => {
			const module = await WebAssembly.compile(bytes);
			const instance = new WebAssembly.Instance(module, {
				env: {
					memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return Memory.create(memory, instance.exports as unknown as Memory.Exports);
		}
	})
});

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