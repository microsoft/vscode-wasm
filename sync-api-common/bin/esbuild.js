/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check

const esbuild = require('esbuild');

const workerTests = esbuild.build({
	entryPoints: ['lib/browser/test/workers/main.js'],
	outfile: 'dist/workerMain.js',
	bundle: true,
	define: { process: '{"env":{}}' },
	target: 'es2020'
}).catch(console.error);

const testFixture = esbuild.build({
	entryPoints: ['lib/browser/test/connection.test.js'],
	outfile: 'dist/connection.test.js',
	bundle: true,
	define: { process: '{"env":{}}' },
	target: 'es2020'
}).catch(console.error);

Promise.all([workerTests, testFixture]).catch(console.error);