/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ----------------------------------------------------------------------------------------- */
import RIL from '../ril';
RIL.install();

import { Worker } from '@vscode/wasm-kit/browser';
import { WasiWorker} from '../../common/preview2/wasiWorker';

void Worker.main(WasiWorker);