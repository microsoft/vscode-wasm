/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs/promises';

import * as yargs from 'yargs';

import * as wit from './wit';
import { DocumentVisitor } from './wit2ts';

export type Options = {
	help: boolean;
	version: boolean;
	stdout: boolean;
	out: string | undefined;
	file: string | undefined;
};

export namespace Options {
	export const defaults: Options = {
		help: false,
		version: false,
		stdout: false,
		out: undefined,
		file: undefined
	};
}

async function run(options: Options): Promise<number> {
	if (options.help) {
		yargs.showHelp();
		return 0;
	}

	if (options.version) {
		process.stdout.write(`${require('../../package.json').version}\n`);
		return 0;
	}

	if (!options.file) {
		process.stderr.write('Missing file argument.\n');
		yargs.showHelp();
		return 1;
	}

	try {
		const stat = await fs.stat(options.file, { bigint: true });
		if (!stat.isFile()) {
			process.stderr.write(`${options.file} is not a file.\n`);
			return 1;
		}

		const content = await fs.readFile(options.file, { encoding: 'utf8' });
		const document = wit.parse(content);

		const visitor = new DocumentVisitor();
		document.visit(visitor, document);
		const code = visitor.getCode();
		if (options.stdout) {
			process.stdout.write(code.toString());
		} else {
			await fs.writeFile(options.out!, code.toString());
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
		usage(`Tool to generate a TypeScript file and the corresponding meta data from a Wit file.\nVersion: ${require('../../package.json').version}\nUsage: wit2ts [options] file.wit`).
		example(`wit2ts --stdout test.wit`, `Creates a TypeScript file for the given Wit file and prints it to stdout.`).
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
			boolean: true
		}).
		option('out', {
			description: 'The output file the dump is save to.',
			string: true
		}).
		option('stdout', {
			description: 'Writes the dump to stdout.',
			boolean: true
		});

	const parsed = await yargs.argv;
	const options: Options = Object.assign({}, Options.defaults, parsed);
	options.file = parsed._[0] as string;
	return run(options);
}

if (module === require.main) {
	main().then((exitCode) => process.exitCode = exitCode).catch((error) => { process.exitCode = 1; console.error(error); });
}