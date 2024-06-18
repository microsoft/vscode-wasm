#!/usr/bin/env node
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check

'use strict';

const path = require('path');
const child_process = require('child_process');

const root = path.dirname(path.dirname(__dirname));
const args = process.argv.slice(2);

const folders = [
	'sync-api-common',
	'sync-api-client',
	'sync-api-service',
	'sync-api-tests',
	'wasm-component-model',
	'wasi',
	'rust-api',
	'wasm-wasi',
	'wasm-kit',
	'wasm-wasi-core',
	'wasm-wasi-lsp',
	'webshell',
	'tools',
	'testbeds'
];

function main() {
	// When we install in a package pipeline then we don't want to call install in
	// the project directories since we need to call install there to ensure proper
	// dependency management.
	if (args[0] === 'install' && process.env['npm_config_root_only'] === 'true') {
		return;
	}

	for (const folder of folders) {
		console.log(`==> ${path.join(root, folder)} <==`);
		child_process.spawnSync(`npm ${args.join(' ')}`, { cwd: path.join(root, folder), shell: true, stdio: 'inherit' });
		console.log('');
	}
}

if (require.main === module) {
	main();
}