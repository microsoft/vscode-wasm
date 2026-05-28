/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { tsConfig } from '../eslint.base.config.mjs';

export default tsConfig({
	project: [
		'./cpp/tsconfig.json',
		'./lsp-rust/client/tsconfig.json',
		'./python/tsconfig.json',
		'./php/tsconfig.json',
		'./ruby/tsconfig.json',
		'./rust/tsconfig.json',
		'./rust-threads/tsconfig.json',
		'./threads/tsconfig.json',
		'./malloc/tsconfig.json',
		'./performance/tsconfig.json',
		'./big-buffer-write/tsconfig.json'
	],
	tsconfigRootDir: import.meta.dirname,
	rules: {
		'@typescript-eslint/no-floating-promises': 'error'
	}
});
