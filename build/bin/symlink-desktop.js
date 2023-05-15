/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check

'use strict';

require('./symlink');
const path = require('path');
const ln = require('./linking');

const root = path.dirname(path.dirname(__dirname));

(async function main() {
	ln.softLink(path.join(root, 'wasm-wasi-core', 'lib', 'desktop'), path.join(root, 'wasm-wasi-core', 'dist', 'desktop'));
	ln.softLink(path.join(root, 'webshell', 'lib', 'desktop'), path.join(root, 'webshell', 'dist', 'desktop'));
})();