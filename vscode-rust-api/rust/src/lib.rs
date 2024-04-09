/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "all"
});

pub mod commands;
pub mod window;
pub mod workspace;
pub mod languages;
mod common;

pub type OutputChannel = host::api::types::OutputChannel;
pub type TextDocument = host::api::types::TextDocument;
pub type TextDocumentChangeEvent = host::api::types::TextDocumentChangeEvent;
pub type DocumentFilter = host::api::types::DocumentFilter;
pub type DocumentSelector = host::api::types::DocumentSelector;

pub struct Disposables {
	disposables: Vec<Box<dyn Fn()>>
}

impl Disposables {
	pub fn new() -> Self {
		Disposables {
			disposables: Vec::new()
		}
	}

	pub fn push<F>(&mut self, disposable: F)
	where
		F: Fn() + 'static,
	{
		self.disposables.push(Box::new(disposable));
	}

	pub fn dispose(&mut self) {
		for disposable in self.disposables.drain(..) {
			disposable();
		}
	}
}

struct Implementation;

impl exports::host::api::callbacks::Guest for Implementation {
	fn execute_command(command: String) {
		commands::execute_command(&command);
  	}
	fn did_change_text_document(event: host::api::types::TextDocumentChangeEvent) {
		workspace::fire_did_change_text_document(&event);
	}
}

export!(Implementation);