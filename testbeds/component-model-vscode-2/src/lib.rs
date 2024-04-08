/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::rc::Rc;

#[export_name = "activate"]
pub fn activate() {
	let mut disposables: vscode::Disposables = vscode::Disposables::new();
	let channel: Rc<vscode::OutputChannel> = Rc::new(vscode::window::create_output_channel("Rust Extension", Some("plaintext")));
	for document in vscode::workspace::text_documents() {
		channel.append_line(&format!("Document: {} {}", document.uri(), document.handle()));
	}
	let channel_clone = channel.clone();
	disposables.push(vscode::commands::register_command("testbed-component-model-vscode.run", move || {
		channel_clone.append_line("Hello World!");
		let documents = vscode::workspace::text_documents();
		for document in documents {
			channel_clone.append_line(&format!("Document: {} {}", document.uri(), document.handle()));
		}
	}));

	let channel_clone2 = channel.clone();
	disposables.push(vscode::workspace::on_did_change_text_document(move |event: &vscode::TextDocumentChangeEvent| {
		let selector = vscode::DocumentSelector("rust");
		if vscode::languages::match_selector(&selector, event.document) != 0 {
			channel_clone2.append_line("Rust document changed!");
		}
		channel_clone2.append_line(&format!("Document: {} {}", event.document.uri(), event.document.handle()));
	}));
	channel.append_line("Extension activated!");
}

#[export_name = "deactivate"]
pub fn deactivate() {
}