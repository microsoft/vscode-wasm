/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'fs';

import * as wit from './wit';

const document = wit.parse(fs.readFileSync('./src/timezone.wit', 'utf8'));
console.log(JSON.stringify(document, (prop: string, value: any) => {
	if (prop === 'parent') {
		return undefined;
	}
	return value;
}, 4));