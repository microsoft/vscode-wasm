/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */
//@ts-check

'use strict';

const path = require('path');
const httpServer = require('http-server');

async function runServer() {
	return new Promise((resolve, reject) => {
		const root = path.join(__dirname, '..', '..');
		const server = httpServer.createServer({
			root: root,
			showDir: true,
			headers: {
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Cross-Origin-Embedder-Policy': 'require-corp'
			},
			cache: 0
		});
		server.listen(8080, '127.0.0.1');
	});
}

runServer().catch(console.error);