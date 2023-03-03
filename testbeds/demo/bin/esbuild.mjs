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
const webRubyWorkerOptions = {
	entryPoints: ['rubyWorker.ts'],
	outfile: 'dist/web/rubyWorker.js',
	format: 'iife',
	...sharedBrowserOptions,
};

/** @type BuildOptions */
const webPhpWorkerOptions = {
	entryPoints: ['phpWorker.ts'],
	outfile: 'dist/web/phpWorker.js',
	format: 'iife',
	...sharedBrowserOptions,
};

await Promise.all([esbuild.build(webOptions), esbuild.build(webRubyWorkerOptions), esbuild.build(webPhpWorkerOptions)]);