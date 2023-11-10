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
	console.log('Symlinking node modules for development setup');

	ln.softLink(path.join(root, 'sync-api-common'), path.join(root, 'sync-api-client', node_modules, '@vscode', 'sync-api-common'));
	ln.softLink(path.join(root, 'sync-api-common'), path.join(root, 'sync-api-service', node_modules, '@vscode', 'sync-api-common'));

	ln.softLink(path.join(root, 'sync-api-common'), path.join(root, 'sync-api-tests', node_modules, '@vscode', 'sync-api-common'));
	ln.softLink(path.join(root, 'sync-api-client'), path.join(root, 'sync-api-tests', node_modules, '@vscode', 'sync-api-client'));
	ln.softLink(path.join(root, 'sync-api-service'), path.join(root, 'sync-api-tests', node_modules, '@vscode', 'sync-api-service'));

	ln.softLink(path.join(root, 'wasm-wasi'), path.join(root, 'testbeds', node_modules, '@vscode', 'wasm-wasi'));
	ln.softLink(path.join(root, 'wasm-wasi'), path.join(root, 'wasm-wasi', 'example', node_modules, '@vscode', 'wasm-wasi'));
	ln.softLink(path.join(root, 'wasm-wasi'), path.join(root, 'webshell', node_modules, '@vscode', 'wasm-wasi'));

	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'wasi', node_modules, '@vscode', 'wasm-component-model'));
})();