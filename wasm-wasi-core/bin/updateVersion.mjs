/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs/promises';

import packJson from '../package.json' assert { type: 'json' };

const file = new URL('../src/common/version.ts', import.meta.url);
const content = await fs.readFile(file, 'utf8')
await fs.writeFile(file, content.replace(/const version = '.*?';/, `const version = '${packJson.version}';`));