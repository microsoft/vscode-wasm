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

	disposables.push(vscode::workspace::on_did_change_text_document(move |event| {
		let document = event.document();
		let filter: vscode::DocumentFilter = vscode::DocumentFilter {
			language: Some("python".to_string()),
			scheme: None,
			pattern: None,
			notebook_type: None
		};
		let selector = vscode::DocumentSelector::Single(filter);
		let channel_clone2 = channel.clone();
		if vscode::languages::match_selector(&selector, document) != 0 {
			let document2 = event.document();
			channel_clone2.append_line(&format!("Document: {} {}", document2.uri(), document2.handle()));
		}
	}));
}

#[export_name = "deactivate"]
pub fn deactivate() {
}