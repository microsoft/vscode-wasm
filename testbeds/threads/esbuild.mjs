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
	entryPoints: ['extension.ts'],
	outfile: 'dist/web/extension.js',
	format: 'cjs',
	...sharedBrowserOptions,
};

/** @type BuildOptions */
const webWorkerOptions = {
	entryPoints: ['worker.ts'],
	outfile: 'dist/web/worker.js',
	format: 'iife',
	...sharedBrowserOptions,
};

await Promise.all([esbuild.build(webOptions), esbuild.build(webWorkerOptions)]);