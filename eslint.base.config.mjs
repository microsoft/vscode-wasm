/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import stylistic from '@stylistic/eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

const baseRules = {
	semi: 'off',
	'@stylistic/semi': 'error',
	'@stylistic/member-delimiter-style': ['error', {
		multiline: {
			delimiter: 'semi',
			requireLast: true
		},
		singleline: {
			delimiter: 'semi',
			requireLast: false
		},
		multilineDetection: 'brackets'
	}],
	'no-extra-semi': 'warn',
	curly: 'warn',
	quotes: ['error', 'single', { allowTemplateLiterals: true }],
	eqeqeq: 'error',
	indent: 'off',
	'@stylistic/indent': ['warn', 'tab', { SwitchCase: 1 }],
	'@typescript-eslint/no-floating-promises': 'error',
	'@typescript-eslint/prefer-as-const': 'error'
};

/**
 * Create a TypeScript ESLint flat configuration for a package.
 *
 * @param {object} options
 * @param {string | string[]} options.project tsconfig.json file path(s) relative to `tsconfigRootDir`.
 * @param {string} options.tsconfigRootDir Absolute path used as the base for resolving project paths.
 * @param {Record<string, unknown>} [options.rules] Additional rules merged over the base rules.
 * @param {string[]} [options.ignores] Additional ignore patterns merged with the default ignores.
 * @returns {import('eslint').Linter.Config[]}
 */
export function tsConfig({ project, tsconfigRootDir, rules = {}, ignores = [] }) {
	return [
		{
			ignores: ['**/lib/**', '**/dist/**', '**/bin/**', ...ignores]
		},
		{
			files: ['**/*.ts'],
			languageOptions: {
				parser: tsparser,
				ecmaVersion: 6,
				sourceType: 'module',
				globals: { ...globals.node },
				parserOptions: {
					project,
					tsconfigRootDir
				}
			},
			plugins: {
				'@typescript-eslint': tseslint,
				'@stylistic': stylistic
			},
			rules: { ...baseRules, ...rules }
		}
	];
}
