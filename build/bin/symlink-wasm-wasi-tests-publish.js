/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check

'use strict';

const path = require('path');
const ln = require('./linking');

const root = path.dirname(path.dirname(__dirname));
const node_modules = 'node_modules';

(async function main() {
	console.log('Symlinking node modules for sync-api-tests');

	ln.softLink(path.join(root, 'wasm-wasi'), path.join(root, 'wasm-wasi-tests', node_modules, '@vscode', 'wasm-wasi'));
})();