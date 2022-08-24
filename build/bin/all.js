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

const folders = ['sync-api-common', 'sync-api-client', 'sync-api-service', 'sync-api-node-tests', 'wasm-wasi', 'testbeds'];

for (const folder of folders) {
	child_process.spawnSync(`npm ${args.join(' ')}`, { cwd: path.join(root, folder), shell: true, stdio: 'inherit' });
}