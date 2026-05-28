/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { tsConfig } from '../eslint.base.config.mjs';

export default tsConfig({
	project: [
		'./src/common/tsconfig.json',
		'./src/common/test/tsconfig.json',
		'./src/node/tsconfig.json',
		'./src/node/test/tsconfig.json',
		'./src/browser/tsconfig.json',
		'./src/tools/tsconfig.json'
	],
	tsconfigRootDir: import.meta.dirname,
	rules: {
		'no-console': 'error',
		'@typescript-eslint/no-floating-promises': 'error'
	}
});
