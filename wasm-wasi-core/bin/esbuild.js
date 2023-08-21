/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check
const esbuild = require('esbuild');
const path = require('path');
const browser_assert = path.resolve(__dirname, '../node_modules/assert/build/assert.js');

/** @type esbuild.Plugin */
const assertResolvePlugin = {
	name: 'Assert Resolve',
	setup(build) {
		build.onResolve({ filter: /^assert$/g }, args => {
			if (args.kind === 'require-call' || args.kind === 'import-statement') {
				return { path: browser_assert };
			}
			return { path: args.path };
		});
	},
};


/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/** @type BuildOptions */
const sharedWebOptions = {
	bundle: true,
	external: ['vscode'],
	target: 'es2020',
	platform: 'browser',
	sourcemap: true,
};

/** @type BuildOptions */
const webOptions = {
	entryPoints: ['src/web/extension.ts'],
	outfile: 'dist/web/extension.js',
	format: 'cjs',
	...sharedWebOptions,
};

/** @type BuildOptions */
const webMainWorkerOptions = {
	entryPoints: ['src/web/mainWorker.ts'],
	outfile: 'dist/web/mainWorker.js',
	format: 'iife',
	...sharedWebOptions,
};

/** @type BuildOptions */
const webThreadWorkerOptions = {
	entryPoints: ['src/web/threadWorker.ts'],
	outfile: 'dist/web/threadWorker.js',
	format: 'iife',
	...sharedWebOptions,
};

/** @type BuildOptions */
const webTestsIndexOptions = {
	entryPoints: ['src/web/test/index.ts'],
	outfile: 'dist/web/test/index.js',
	define: {
		process: '{"env":{}}'
	},
	plugins: [ assertResolvePlugin ],
	format: 'cjs',
	...sharedWebOptions
}

/** @type BuildOptions */
const webTestWorkerOptions = {
	entryPoints: ['src/web/test/testWorker.ts'],
	outfile: 'dist/web/test/testWorker.js',
	define: {
		process: '{"env":{}}'
	},
	plugins: [ assertResolvePlugin ],
	format: 'iife',
	...sharedWebOptions
}

/** @type BuildOptions */
const sharedDesktopOptions = {
	bundle: true,
	external: ['vscode'],
	target: 'es2020',
	platform: 'node',
	sourcemap: true,
};

/** @type BuildOptions */
const desktopOptions = {
	entryPoints: ['src/desktop/extension.ts'],
	outfile: 'dist/desktop/extension.js',
	format: 'cjs',
	...sharedDesktopOptions,
};

/** @type BuildOptions */
const desktopMainWorkerOptions = {
	entryPoints: ['src/desktop/mainWorker.ts'],
	outfile: 'dist/desktop/mainWorker.js',
	format: 'iife',
	...sharedDesktopOptions,
};

/** @type BuildOptions */
const desktopThreadWorkerOptions = {
	entryPoints: ['src/desktop/threadWorker.ts'],
	outfile: 'dist/desktop/threadWorker.js',
	format: 'iife',
	...sharedDesktopOptions,
};

function createContexts() {
	return Promise.all([
		esbuild.context(webOptions),
		esbuild.context(webMainWorkerOptions),
		esbuild.context(webThreadWorkerOptions),
		esbuild.context(webTestsIndexOptions),
		esbuild.context(webTestWorkerOptions),
		esbuild.context(desktopOptions),
		esbuild.context(desktopMainWorkerOptions),
		esbuild.context(desktopThreadWorkerOptions)
	]);
}

createContexts().then(contexts => {
	if (process.argv[2] === '--watch') {
		const promises = [];
		for (const context of contexts) {
			promises.push(context.watch());
		}
		return Promise.all(promises).then(() => { return undefined; });
	} else {
		const promises = [];
		for (const context of contexts) {
			promises.push(context.rebuild());
		}
		Promise.all(promises).then(() => {
			for (const context of contexts) {
				context.dispose();
			}
		}).then(() => { return undefined; });
	}
}).catch(console.error);
