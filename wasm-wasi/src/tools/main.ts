/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable no-console */

import { BigIntStats, Dir } from 'node:fs';
import * as paths from 'node:path';
import * as fs from 'node:fs/promises';

import * as yargs from 'yargs';

type FileNode = {
	kind: 'file';
	name: string;
	size: bigint;
	ctime: bigint;
	atime: bigint;
	mtime: bigint;
};

type DirectoryNode =  {
	kind: 'directory';
	name: string;
	size: bigint;
	ctime: bigint;
	atime: bigint;
	mtime: bigint;
	children: { [key: string]: Node };
};

type Node = FileNode | DirectoryNode;

export type Options = {
	help: boolean;
	version: boolean;
	stdout: boolean;
	out: string | undefined;
	directory: string | undefined;
};

export namespace Options {
	export const defaults: Options = {
		help: false,
		version: false,
		stdout: false,
		out: undefined,
		directory: undefined
	};
}

async function readDirectory(path: string, stat: BigIntStats): Promise<DirectoryNode> {
	const name = paths.basename(path);
	if (!stat.isDirectory()) {
		throw new Error(`${path} is not a directory`);
	}
	const result: DirectoryNode = {
		kind: 'directory',
		name,
		size: stat.size,
		ctime: stat.ctimeNs,
		atime: stat.atimeNs,
		mtime: stat.mtimeNs,
		children: Object.create(null)
	};

	const dir: Dir = await fs.opendir(path);
	for await (const entry of dir) {
		const entryPath = paths.join(path, entry.name);
		const stat = await fs.stat(entryPath, { bigint: true });
		if (stat.isDirectory()) {
			result.children[entry.name] = await readDirectory(entryPath, stat);
		} else if (stat.isFile()) {
			result.children[entry.name] = {
				kind: 'file',
				size: stat.size,
				name: entry.name,
				ctime: stat.ctimeNs,
				atime: stat.atimeNs,
				mtime: stat.mtimeNs
			};
		} else {
			throw new Error(`${entryPath} is not a file or directory`);
		}
	}
	return result;
}

async function run(options: Options): Promise<number> {
	if (options.help) {
		yargs.showHelp();
		return 0;
	}

	if (options.version) {
		console.log(require('../../package.json').version);
		return 0;
	}

	if (!options.directory) {
		console.error('Missing directory argument.');
		yargs.showHelp();
		return 1;
	}

	try {
		const stat = await fs.stat(options.directory, { bigint: true });
		if (!stat.isDirectory()) {
			console.error(`${options.directory} is not a directory`);
			return 1;
		}

		const directory = await readDirectory(options.directory, stat);
		directory.name = '/';
		const dump = JSON.stringify(directory, (_key, value) => typeof value === 'bigint' ? value.toString() : value, '\t');
		if (options.out) {
			await fs.writeFile(options.out, dump);
		} else if (options.stdout) {
			process.stdout.write(dump);
		} else {
			console.error('No output specified.');
			yargs.showHelp();
			return 1;
		}
		return 0;
	} catch (error) {
		console.error(`Creating dump failed`, error);
		return 1;
	}
}

export async function main(): Promise<number> {
	yargs.
		parserConfiguration({ 'camel-case-expansion': false }).
		exitProcess(false).
		usage(`Tool to generate a directory content for accessing in vscode.dev\nVersion: ${require('../../package.json').version}\nUsage: dir-dump [options] directory`).
		example(`dir-dump --stdout .`, `Create a directory dump for the current directory and print it to stdout.`).
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
	options.directory = parsed._[0] as string;
	return run(options);
}

if (module === require.main) {
	main().then((exitCode) => process.exitCode = exitCode).catch((error) => { process.exitCode = 1; console.error(error); });
}