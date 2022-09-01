/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import * as dirDelete from './dirDelete';
import * as dirRead from './dirRead';
import * as dirRename from './dirRename';
import * as dirStat from './dirStat';
import * as fileDelete from './fileDelete';
import * as fileRead from './fileRead';
import * as fileRename from './fileRename';

const tests: Map<string, { run: () => Promise<void> }> = new Map([
	['dirDelete', dirDelete],
	['dirRead', dirRead],
	['dirRename', dirRename],
	['dirStat', dirStat],
	['fileDelete', fileDelete],
	['fileRead', fileRead],
	['fileRename', fileRename],
]);

export function run(): void {
	const workerTest = RAL().$testing.testCase as TestRequests['method'];
	tests.get(workerTest)?.run();
}