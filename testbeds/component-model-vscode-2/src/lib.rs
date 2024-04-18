/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::rc::Rc;

#[export_name = "activate"]
pub fn activate() -> vscode::Disposables {
	let mut disposables: vscode::Disposables = vscode::Disposables::new();

	// Create an output channel.
	let channel: Rc<vscode::OutputChannel> = Rc::new(vscode::window::create_output_channel("Rust Extension", Some("plaintext")));
	let channel_clone = channel.clone();
	disposables.push(vscode::commands::register_command("testbed-component-model-vscode.run", move || {
		channel_clone.append_line("Hello World!");
		for document in vscode::workspace::text_documents() {
			channel_clone.append_line(&format!("Document: {} {}", document.uri(), document.handle()));
		}
	}));
	return disposables;
}

#[export_name = "deactivate"]
pub fn deactivate() {
}