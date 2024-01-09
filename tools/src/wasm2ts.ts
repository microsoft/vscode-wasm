/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as yargs from 'yargs';

type Options = {
	help: boolean;
	version: boolean;
	wasm?: string;
	ts?: string;
};

export type ResolvedOptions = Required<Options> & { file: string; outDir: string };

export namespace Options {
	export const defaults: Pick<Options, 'help' | 'version'> = {
		help: false,
		version: false,
	};

	export function validate(options: Options): options is ResolvedOptions {
		return true;
	}
}

export async function run(options: Options): Promise<number> {
	if (options.help) {
		return 0;
	}

	if (options.version) {
		process.stdout.write(`${require('../package.json').version}\n`);
		return 0;
	}

	return 0;
}

async function main(): Promise<number> {
	yargs.
		parserConfiguration({ 'camel-case-expansion': false }).
		exitProcess(false).
		usage(`Tool to generate a TypeScript file from a WASM file.\nVersion: ${require('../package.json').version}\nUsage: wit2wasm [options] module.wasm`).
		example(`wasm2ts module.wasm`, `Creates a TypeScript file module.ts for the given WASM file.`).
		version(false).
		wrap(Math.min(100, yargs.terminalWidth())).
		option('v', {
			alias: 'version',
			description: 'Output the version number',
			boolean: true
		}).
		option('h', {
			alias: 'help',
			description: 'Output usage information',
			boolean: true,

		}).option('ts', {
			alias: 't',
			description: 'The TypeScript file to write',
			string: true
		});

	const parsed = await yargs.argv;
	const options: Options = Object.assign({}, Options.defaults, parsed);
	options.wasm = parsed._[0] as string;

	return run(options);
}

if (module === require.main) {
	main().then((exitCode) => process.exitCode = exitCode).catch((error) => { process.exitCode = 1; process.stderr.write(`${error.toString()}`); });
}
