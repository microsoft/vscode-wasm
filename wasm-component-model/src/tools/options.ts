/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export type Options = {
	help: boolean;
	version: boolean;
	outDir: string | undefined;
	filter: string | undefined;
	input: string | undefined;
	target: 'ts';
	nameStyle: 'ts' | 'wit';
	stdin: boolean;
	structure: 'auto' | 'package' | 'namespace';
	worker: boolean;
	singleWorld: boolean;
};

export type ResolvedOptions = Required<Options> & { input: string; outDir: string };

export namespace Options {
	export const defaults: Options = {
		help: false,
		version: false,
		outDir: undefined,
		filter: undefined,
		input: undefined,
		target: 'ts',
		nameStyle: 'ts',
		stdin: false,
		structure: 'auto',
		worker: false,
		singleWorld: false
	};

	export function validate(options: Options): options is ResolvedOptions {
		if (options.stdin === false && !options.input) {
			process.stderr.write('Missing file argument.\n');
			return false;
		}
		if (!options.outDir) {
			process.stderr.write('Missing outDir argument.\n');
			return false;
		}
		return true;
	}
}