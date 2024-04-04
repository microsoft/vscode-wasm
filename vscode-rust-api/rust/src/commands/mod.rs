/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

use std::collections::HashMap;
use once_cell::sync::Lazy;
use crate::host::api::commands;

static mut HANDLERS: Lazy<HashMap<String, Box<dyn Fn()>>> = Lazy::new(|| HashMap::new());

pub fn register_command(command: &str, callback: Box<dyn Fn()>) {
	unsafe {
		HANDLERS.insert(command.to_string(), callback);
	}
	commands::register_command(command);
}

pub fn execute_command(command: &str) {
	let handler;
	unsafe {
		handler = HANDLERS.get(command);
	}
	if handler.is_some() {
		handler.unwrap()();
	}
}