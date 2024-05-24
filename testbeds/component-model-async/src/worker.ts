/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Connection } from '@vscode/wasm-component-model';
import { calculator } from './calculator';

const connection = Connection.createWorker(calculator._);
connection.listen()