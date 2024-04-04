/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::rc::Rc;

#[export_name = "activate"]
pub fn activate() {
	let channel: Rc<vscode::OutputChannel> = Rc::new(vscode::window::create_output_channel("Rust Extension", Some("plaintext")));
	for document in vscode::workspace::text_documents() {
		channel.append_line(&format!("Document: {} {}", document.uri(), document.handle()));
	}
	let channel_clone = channel.clone();
	vscode::commands::register_command("testbed-component-model-vscode.run", Box::new(move || {
		channel_clone.append_line("Hello World!");
		let documents = vscode::workspace::text_documents();
		for document in documents {
			channel_clone.append_line(&format!("Document: {} {}", document.uri(), document.handle()));
		}
	}));
	channel.append_line("Extension activated!");
}

#[export_name = "deactivate"]
pub fn deactivate() {
}