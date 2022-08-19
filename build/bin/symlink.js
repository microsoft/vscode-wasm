/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
 "use strict";
const { join } = require('path');
//@ts-check

const path = require('path');
const ln = require('./linking');

const root = path.dirname(path.dirname(__dirname));
const node_modules = 'node_modules';

(async function main() {
	console.log('Symlinking node modules for development setup');

	ln.softLink(path.join(root, 'vscode-sync-api-common'), path.join(root, 'vscode-sync-api-client', node_modules, '@vscode', 'sync-api-common'));
	ln.softLink(path.join(root, 'vscode-sync-api-common'), path.join(root, 'vscode-sync-api-service', node_modules, '@vscode', 'sync-api-common'));
	ln.softLink(path.join(root, 'vscode-sync-api-client'), path.join(root, 'wasi', node_modules, '@vscode', 'sync-api-client'));

	ln.softLink(path.join(root, 'wasi'), path.join(root, 'testbeds', node_modules, '@vscode', 'wasi'));
	ln.softLink(path.join(root, 'vscode-sync-api-common'), path.join(root, 'testbeds', node_modules, '@vscode', 'sync-api-common'));
	ln.softLink(path.join(root, 'vscode-sync-api-client'), path.join(root, 'testbeds', node_modules, '@vscode', 'sync-api-client'));
	ln.softLink(path.join(root, 'vscode-sync-api-service'), path.join(root, 'testbeds', node_modules, '@vscode', 'sync-api-service'));

})();