/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

use std::rc::Rc;
use exports::host::api::callbacks;

pub mod vscode;

// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "all"
});


// trait Event: 'static {
// 	fn get_type(&self) -> &'static str;
// }

// struct EventEmitter<E: Event> {
// 	listeners: Vec<Box<dyn Fn(&E)>>
// }

// impl<E: Event> EventEmitter<E> {
// 	fn new() -> Self {
// 		EventEmitter {
// 			listeners: Vec::new()
// 		}
// 	}

// 	fn on(&mut self, listener: Box<dyn Fn(&E)>) {
// 		self.listeners.push(listener);
// 	}

// 	fn emit(&self, event: E) {
// 		for listener in &self.listeners {
// 			listener(&event);
// 		}
// 	}
// }

// impl Event for ms::vscode::types::TextDocumentChangeEvent {
// 	fn get_type(&self) -> &'static str {
// 		"TextDocumentChangeEvent"
// 	}
// }


struct Extension;

impl callbacks::Guest for Extension {
	fn execute_command(command: String) {
		vscode::commands::execute_command(&command);
	}
	fn did_change_text_document(_event: host::api::types::TextDocumentChangeEvent) {
	}
}

impl Guest for Extension {

    fn activate() {
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

	fn deactivate() {
	}
}

export!(Extension);