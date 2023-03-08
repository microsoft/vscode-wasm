/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
//@ts-check
import * as esbuild from 'esbuild'

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/** @type BuildOptions */
const sharedBrowserOptions = {
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
	...sharedBrowserOptions,
};

/** @type BuildOptions */
const webMainWorkerOptions = {
	entryPoints: ['src/web/mainWorker.ts'],
	outfile: 'dist/web/mainWorker.js',
	format: 'iife',
	...sharedBrowserOptions,
};

/** @type BuildOptions */
const webThreadWorkerOptions = {
	entryPoints: ['src/web/threadWorker.ts'],
	outfile: 'dist/web/threadWorker.js',
	format: 'iife',
	...sharedBrowserOptions,
};

await Promise.all([esbuild.build(webOptions), esbuild.build(webMainWorkerOptions), esbuild.build(webThreadWorkerOptions)]);