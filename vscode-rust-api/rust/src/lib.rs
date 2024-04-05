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
mod common;

pub type OutputChannel = host::api::types::OutputChannel;
pub type TextDocument = host::api::types::TextDocument;


struct Implementation;

impl exports::host::api::callbacks::Guest for Implementation {
	fn execute_command(command: String) {
		commands::execute_command(&command);
  	}
	fn did_change_text_document(_event: host::api::types::TextDocumentChangeEvent) {
	}
}

export!(Implementation);