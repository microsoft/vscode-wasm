/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use once_cell::sync::Lazy;

use crate::host::api::{
	types,
	workspace
};
use crate::common::{ Event, EventEmitter };

#[allow(non_upper_case_globals)]
pub const text_documents: fn() -> Vec<super::TextDocument> = workspace::text_documents;

impl Event for types::TextDocumentChangeEvent {
	fn get_type(&self) -> &'static str {
		"TextDocumentChangeEvent"
	}
}

static mut ON_DID_CHANGE_TEXT_DOCUMENT: Lazy<EventEmitter<types::TextDocumentChangeEvent>> = Lazy::new(|| EventEmitter::new(Box::new(workspace::register_on_did_change_text_document), Box::new(workspace::unregister_on_did_change_text_document)));

pub fn on_did_change_text_document(listener: Box<dyn Fn(&types::TextDocumentChangeEvent)>) -> Box<dyn Fn()> {
	unsafe {
		ON_DID_CHANGE_TEXT_DOCUMENT.on(listener)
	}
}