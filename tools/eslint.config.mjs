/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { tsConfig } from '../eslint.base.config.mjs';

export default tsConfig({
	project: ['./tsconfig.json'],
	tsconfigRootDir: import.meta.dirname,
	rules: {
		'@typescript-eslint/no-floating-promises': 'error'
	}
});
