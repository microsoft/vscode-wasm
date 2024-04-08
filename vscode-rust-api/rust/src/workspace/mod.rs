/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use once_cell::sync::Lazy;

use crate::host::api::{
	types,
	workspace
};
use crate::common::EventEmitter;

#[allow(non_upper_case_globals)]
pub const text_documents: fn() -> Vec<super::TextDocument> = workspace::text_documents;

static mut ON_DID_CHANGE_TEXT_DOCUMENT: Lazy<EventEmitter<types::TextDocumentChangeEvent>> = Lazy::new(|| EventEmitter::new(workspace::register_on_did_change_text_document, workspace::unregister_on_did_change_text_document));

pub fn on_did_change_text_document<F>(listener: F) -> impl Fn() + 'static
where
		F: Fn(&types::TextDocumentChangeEvent) + 'static,
{
	unsafe {
		ON_DID_CHANGE_TEXT_DOCUMENT.on(listener)
	}
}

pub fn fire_did_change_text_document(event: &types::TextDocumentChangeEvent) {
	unsafe {
		ON_DID_CHANGE_TEXT_DOCUMENT.fire(event)
	}
}