/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ----------------------------------------------------------------------------------------- */
import { Worker } from '@vscode/wasm-component-model-std/node';
import { WasiWorker} from '../../common/preview2/wasiWorker';

void Worker.main(WasiWorker);