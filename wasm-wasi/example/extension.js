"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const vscode_1 = require("vscode");
const wasm_wasi_1 = require("@vscode/wasm-wasi");
async function activate(_context) {
    const wasm = await wasm_wasi_1.Wasm.api();
    vscode_1.commands.registerCommand('vscode-wasm-wasi-c-example.run', async () => {
        const pty = wasm.createPseudoterminal();
        const terminal = vscode_1.window.createTerminal({ name: 'Run C Example', pty, isTransient: true });
        terminal.show(true);
        const module = await WebAssembly.compile(await promises_1.default.readFile(node_path_1.default.join(__dirname, 'hello.wasm')));
        const process = await wasm.createProcess('hello', module, { stdio: pty.stdio });
        await process.run();
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
