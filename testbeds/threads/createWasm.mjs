/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';

const content = fs.readFileSync('./out/main.wasm');

process.stdout.write('export const binary = new Uint8Array([');
for (let i = 0; i < content.length; i++) {
	process.stdout.write(content[i] + '');
	if (i < content.length - 1) {
		process.stdout.write(',');
	}
}
process.stdout.write(']);');