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
	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'wasm-wasi-core', node_modules, '@vscode', 'wasm-component-model'));
	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'wasm-kit', node_modules, '@vscode', 'wasm-component-model'));
	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'testbeds', 'component-model', node_modules, '@vscode', 'wasm-component-model'));
	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'testbeds', 'component-model-async', node_modules, '@vscode', 'wasm-component-model'));
	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'testbeds', 'component-model-performance', node_modules, '@vscode', 'wasm-component-model'));
	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'testbeds', 'component-model-vscode', node_modules, '@vscode', 'wasm-component-model'));
	ln.softLink(path.join(root, 'wasm-component-model'), path.join(root, 'rust-api', node_modules, '@vscode', 'wasm-component-model'));

	ln.softLink(path.join(root, 'wasi'), path.join(root, 'wasm-wasi-core', node_modules, '@vscode', 'wasi'));

	ln.softLink(path.join(root, 'wasm-kit'), path.join(root, 'wasm-wasi-core', node_modules, '@vscode', 'wasm-kit'));
	ln.softLink(path.join(root, 'wasm-kit'), path.join(root, 'rust-api', node_modules, '@vscode', 'wasm-kit'));

	ln.softLink(path.join(root, 'rust-api'), path.join(root, 'testbeds', 'component-model-vscode-2', node_modules, '@vscode', 'rust-api'));

	ln.softLink(path.join(root, 'wasm-wasi-lsp'), path.join(root, 'testbeds', 'lsp-rust', 'client', node_modules, '@vscode', 'wasm-wasi-lsp'));
})();