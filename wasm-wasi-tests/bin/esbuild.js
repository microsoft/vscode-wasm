/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check

const esbuild = require('esbuild');
const path_browserify = require.resolve('path-browserify');

/** @type esbuild.Plugin */
const pathResolvePlugin = {
	name: 'Path Resolve',
	setup(build) {
		build.onResolve({ filter: /^path$/g }, args => {
			if (args.kind !== 'require-call') {
				return { path: args.path };
			}
			return { path: path_browserify };
		});
	},
};

const workerTests = esbuild.build({
	entryPoints: [
		'lib/workers/byteSink.js',
		'lib/workers/dirDelete.js',
		'lib/workers/dirRead.js',
		'lib/workers/dirRename.js',
		'lib/workers/dirStat.js',
		'lib/workers/fileDelete.js',
		'lib/workers/fileRead.js',
		'lib/workers/fileRename.js',
		'lib/workers/fileStat.js'
	],
	outdir: 'dist/workers',
	bundle: true,
	splitting: false,
	define: {
		process: '{"env":{}}'
	},
	plugins: [ pathResolvePlugin ],
	format: 'iife',
	target: 'es2020',
	platform: 'browser'
}).catch(console.error);

const testFixture = esbuild.build({
	entryPoints: ['lib/web/index.js'],
	outfile: 'dist/web/index.js',
	bundle: true,
	define: { process: '{"env":{}}' },
	external: ['vscode'],
	plugins: [ pathResolvePlugin ],
	format: 'cjs',
	target: 'es2020',
	platform: 'browser'
}).catch(console.error);

Promise.all([testFixture]).catch(console.error);