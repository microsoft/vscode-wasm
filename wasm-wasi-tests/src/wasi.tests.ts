/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import assert from 'assert';

import { WASI } from '@vscode/wasm-wasi';
import { URI } from 'vscode-uri';

import { TestApi } from './testApi';

suite('Configurations', () => {

	test('Argv', () => {
		const consoleUri = URI.from({ scheme: 'console', authority: 'developerTools' });
		const wasi = WASI.create('test', new TestApi(), (_rval) => { }, [
			{ kind: 'fileSystem', uri: URI.parse('file:///tmp/wasi'), mountPoint: '/' },
			{ kind: 'console', uri:  consoleUri }
		], {
			stdin: { kind: 'console', uri: consoleUri },
			stdout: { kind: 'console', uri: consoleUri },
			stderr: { kind: 'console', uri: consoleUri },
		}, {
			args: ['arg1', 'arg2', 'arg3']
		});
		const buffer = new ArrayBuffer(65536);
		const memory = new DataView(buffer);
		wasi.initialize({ exports: { memory: {
			buffer: buffer,
			grow: () => { return 65536; }
		}}});

		wasi.args_sizes_get(0, 1024);
		const value = memory.getUint32(0, true);
		assert.strictEqual(value, 3);
	});

});