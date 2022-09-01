/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check

const esbuild = require('esbuild');

const workerTests = esbuild.build({
	entryPoints: ['lib/workers/dirDelete.js', 'lib/workers/dirRead.js'],
	outdir: 'dist/workers',
	bundle: true,
	format: 'esm',
	splitting: true,
	define: { process: '{"env":{}}' },
	target: 'es2020'
}).catch(console.error);

const testFixture = esbuild.build({
	entryPoints: ['lib/web/index.js'],
	outfile: 'dist/web/index.js',
	bundle: true,
	format: 'cjs',
	define: { process: '{"env":{}}' },
	target: 'es2020',
}).catch(console.error);

Promise.all([testFixture]).catch(console.error);