"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = __importStar(require("path"));
const worker_threads_1 = require("worker_threads");
const vscode_1 = require("vscode");
const node_1 = require("@vscode/sync-api-common/node");
const sync_api_service_1 = require("@vscode/sync-api-service");
async function activate(_context) {
    vscode_1.commands.registerCommand('vscode-wasm-wasi-c-example.run', () => {
        const name = 'Run C Example';
        const worker = new worker_threads_1.Worker(path.join(__dirname, './worker.js'));
        const connection = new node_1.ServiceConnection(worker);
        const apiService = new sync_api_service_1.ApiService(name, connection, {
            exitHandler: (_rval) => {
                process.nextTick(() => worker.terminate());
            }
        });
        const terminal = vscode_1.window.createTerminal({ name, pty: apiService.getPty() });
        terminal.show();
        connection.signalReady();
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
