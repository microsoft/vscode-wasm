/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import globals from 'globals';

export default [
	{
		files: ['**/*.{js,mjs,cjs}'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'commonjs',
			globals: {
				...globals.node,
				...globals.commonjs
			}
		},
		rules: {
			semi: 'error',
			'no-extra-semi': 'warn',
			curly: 'warn',
			quotes: ['error', 'single', { allowTemplateLiterals: true }],
			eqeqeq: 'error',
			indent: ['warn', 'tab', { SwitchCase: 1 }]
		}
	}
];
