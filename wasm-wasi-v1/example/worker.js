"use strict";
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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const worker_threads_1 = require("worker_threads");
const node_1 = require("@vscode/sync-api-common/node");
const sync_api_client_1 = require("@vscode/sync-api-client");
const node_2 = require("@vscode/wasm-wasi/node");
if (worker_threads_1.parentPort === null) {
    process.exit();
}
const connection = new node_1.ClientConnection(worker_threads_1.parentPort);
connection.serviceReady().then(async (params) => {
    const name = 'Run C Example';
    const apiClient = new sync_api_client_1.ApiClient(connection);
    const exitHandler = (rval) => {
        apiClient.process.procExit(rval);
    };
    const wasi = node_2.WASI.create(name, apiClient, exitHandler, {
        mapDir: []
    });
    const wasmFile = path.join(__dirname, 'hello.wasm');
    const binary = fs.readFileSync(wasmFile);
    const { instance } = await WebAssembly.instantiate(binary, {
        wasi_snapshot_preview1: wasi
    });
    wasi.initialize(instance);
    instance.exports._start();
    apiClient.process.procExit(0);
}).catch(console.error);
