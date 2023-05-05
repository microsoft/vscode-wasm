/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Uri } from 'vscode';

interface _Path {
	dirname(path: string): string;
	normalize(path: string): string;
	isAbsolute(path: string): boolean;
	join(...paths: string[]): string;
	basename(path: string, ext?: string): string;
	extname(path: string): string;
	sep: string;
	delimiter: string;
}


interface RAL {
	readonly path: _Path;
	readonly webAssembly: {
		compile(uri: Uri): Promise<WebAssembly.Module>;
	};
}

let _ral: RAL | undefined;

function RAL(): RAL {
	if (_ral === undefined) {
		throw new Error(`No runtime abstraction layer installed`);
	}
	return _ral;
}

namespace RAL {
	export type Path = _Path;
	export function install(ral: RAL): void {
		if (ral === undefined) {
			throw new Error(`No runtime abstraction layer provided`);
		}
		_ral = ral;
	}
	export function isInstalled(): boolean {
		return _ral !== undefined;
	}
}

export default RAL;