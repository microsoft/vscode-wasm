/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import fs from 'node:fs/promises';
import yargs from 'yargs';

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

	export function validate(_options: Options): _options is ResolvedOptions {
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

	if (options.wasm === undefined) {
		process.stderr.write(`No wasm file specified.\n`);
		return 1;
	}

	try {
		const stat = await fs.stat(options.wasm, { bigint: true });
		if (!stat.isFile()) {
			process.stderr.write(`${options.wasm} is not a file.\n`);
			return 1;
		}
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			process.stderr.write(`${options.wasm} does not exist.\n`);
			return 1;
		} else {
			throw error;
		}
	}
	const bytes = await fs.readFile(options.wasm);
	const buffer: string [] = [];
	buffer.push(`/* --------------------------------------------------------------------------------------------`);
	buffer.push(` * Copyright (c) Microsoft Corporation. All rights reserved.`);
 	buffer.push(` * Licensed under the MIT License. See License.txt in the project root for license information.`);
 	buffer.push(` * ------------------------------------------------------------------------------------------ */`);
	buffer.push(``);
	buffer.push(`const bytes = new Uint8Array([`);
	let line: string[] = [];
	const lines: string[] = [];
	for (let i = 0; i < bytes.length; i++) {
		line.push(`0x${bytes[i].toString(16)}`);
		if ((i + 1) % 16 === 0) {
			lines.push(`\t${line.join(', ')}`);
			line = [];
		}
	}
	if (line.length > 0) {
		lines.push(`\t${line.join(', ')}`);
	}
	buffer.push(lines.join(',\n'));
	buffer.push(`]);`);
	buffer.push(``);
	buffer.push(`const _module = WebAssembly.compile(bytes);`);
	buffer.push(`export default _module;`);

	if (options.ts === undefined) {
		process.stdout.write(buffer.join('\n'));
	} else {
		await fs.writeFile(options.ts, buffer.join('\n'));
	}
	return 0;
}

async function main(): Promise<number> {
	yargs.
		parserConfiguration({ 'camel-case-expansion': false }).
		exitProcess(false).
		usage(`Tool to generate a TypeScript file from a WASM file.\nVersion: ${require('../package.json').version}\nUsage: wasm2ts [options] module.wasm`).
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
