"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const v1_1 = require("@vscode/wasm-wasi/v1");
const vscode_1 = require("vscode");
async function activate(context) {
    // Load the WASM API
    const wasm = await v1_1.Wasm.load();
    // Register a command that runs the C example
    vscode_1.commands.registerCommand('wasm-wasi-c-example.run', async () => {
        // Create a pseudoterminal to provide stdio to the WASM process.
        const pty = wasm.createPseudoterminal();
        const terminal = vscode_1.window.createTerminal({ name: 'Run C Example', pty, isTransient: true });
        terminal.show(true);
        // Load the WASM module. It is stored alongside the extension JS code.
        // So we can use VS Code's file system API to load it. Makes it
        // independent of whether the code runs in the desktop or the web.
        try {
            const bits = await vscode_1.workspace.fs.readFile(vscode_1.Uri.joinPath(context.extensionUri, 'hello.wasm'));
            const module = await WebAssembly.compile(bits);
            // Create a WASM process.
            const process = await wasm.createProcess('hello', module, { stdio: pty.stdio });
            // Run the process and wait for its result.
            const result = await process.run();
        }
        catch (error) {
            // Show an error message if something goes wrong.
            void vscode_1.window.showErrorMessage(error.message);
        }
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
