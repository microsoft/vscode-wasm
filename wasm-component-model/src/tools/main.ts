/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs/promises';
import * as cp from 'node:child_process';

import * as yargs from 'yargs';

import semverParse = require('semver/functions/parse');
import semverGte = require('semver/functions/gte');

import { Document } from './wit-json';
import { processDocument } from './wit2ts';
import { Options } from './options';
import path from 'node:path';

async function run(options: Options): Promise<number> {
	if (options.help) {
		return 0;
	}

	if (options.version) {
		process.stdout.write(`${require('../../package.json').version}\n`);
		return 0;
	}

	if (!Options.validate(options)) {
		yargs.showHelp();
		return 1;
	} else {
	}

	try {
		if (options.stdin) {
			let data: string = '';
			process.stdin.on('data', async (chunk) => {
				data = data + chunk.toString();
			});
			process.stdin.on('end', async () => {
				const content: Document = JSON.parse(data);
				processDocument(content, options);
			});
		} else {
			const stat = await fs.stat(options.file, { bigint: true });
			if (stat.isFile()) {
				if (path.extname(options.file) === '.json') {
					const content: Document = JSON.parse(await fs.readFile(options.file, { encoding: 'utf8' }));
					processDocument(content, options);
				} else {
					process.stderr.write(`${options.file} is not a JSON file.\n`);
					return 1;
				}
			} else if (stat.isDirectory()) {
				try {
					const output = cp.execFileSync('wasm-tools', ['--version'], { shell: true, encoding: 'utf8' });
					const version = output.trim().split(' ')[1];
					const semVersion = semverParse(version);
					if (semVersion === null) {
						process.stderr.write(`wasm-tools --version didn't provide a parsable version number. Output was ${output}.\n`);
						return 1;
					} else if (!semverGte(semVersion, '1.200.0')) {
						process.stderr.write(`wit2ts required wasm-tools >= 1.200.0, but found version ${version}.\n`);
						return 1;
					}
					try {
						const data = cp.execFileSync('wasm-tools', ['component', 'wit', '--json', options.file], { shell: true, encoding: 'utf8' });
						const content: Document = JSON.parse(data);
						processDocument(content, options);
					} catch (error: any) {
						// The wasm-tools reported an error and wrote to output to stderr. So
						// we simply return a failure.
						return 1;
					}
				} catch (error: any) {
				}
			} else {
				process.stderr.write(`${options.file} doesn't exist.\n`);
				return 1;
			}
		}

		return 0;
	} catch (error:any) {
		process.stderr.write(`Creating TypeScript file failed\n${error.toString()}\n`);
		return 1;
	}
}

export async function main(): Promise<number> {
	yargs.
		parserConfiguration({ 'camel-case-expansion': false }).
		exitProcess(false).
		usage(`Tool to generate a TypeScript file and the corresponding meta data from a WIT JSON file.\nVersion: ${require('../../package.json').version}\nUsage: wit2ts [options] wasi.json`).
		example(`wit2ts --outDir . wasi.json`, `Creates a TypeScript file for the given Wit JSON file and writes the files into the provided output directory.`).
		example(`wit2ts --outDir . ./wit`, `Creates a TypeScript file for the files in the given wit directory and writes the files into the provided output directory. Requires a wasm-tools installation.`).
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

		}).
		option('outDir', {
			description: 'The directory the TypeScript files are written to.',
			string: true
		}).
		option('package', {
			description: 'A regular expression to filter the packages to be included.',
			string: true
		}).
		option('target', {
			description: 'The target language. Currently only TypeScript is supported.',
			enum: ['ts'],
			default: 'ts'
		}).
		option('nameStyle', {
			description: 'The style of the generated names.',
			enum: ['ts', 'wit'],
			default: 'ts'
		}).
		option('stdin', {
			description: 'Read the input from stdin.',
			boolean: true,
			default: false
		}).
		option('hoist', {
			description: 'Hoist all interface name into the package namespace for easier access.',
			boolean: true,
			default: false
		}).
		option('noMain', {
			description: 'Do not generate a main entry point file.',
			boolean: true,
			default: false
		});

	const parsed = await yargs.argv;
	const options: Options = Object.assign({}, Options.defaults, parsed);
	options.file = parsed._[0] as string;
	return run(options);
}

if (module === require.main) {
	main().then((exitCode) => process.exitCode = exitCode).catch((error) => { process.exitCode = 1; process.stderr.write(`${error.toString()}`); });
}