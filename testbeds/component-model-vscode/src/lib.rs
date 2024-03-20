use std::rc::Rc;
use std::cell::RefCell;
use std::sync::Arc;
use std::collections::HashMap;
use std::iter::Once;
use std::sync::Mutex;
use lazy_static::lazy_static;


use once_cell::sync::OnceCell;

use ms::vscode::types::{ TextDocumentChangeEvent };
use ms::vscode::window;
use exports::ms::vscode::{ workspace_events, commands_events };

// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "api",
});


trait Event: 'static {
	fn get_type(&self) -> &'static str;
}

struct EventEmitter<E: Event> {
	listeners: Vec<Box<dyn Fn(&E)>>
}

impl<E: Event> EventEmitter<E> {
	fn new() -> Self {
		EventEmitter {
			listeners: Vec::new()
		}
	}

	fn on(&mut self, listener: Box<dyn Fn(&E)>) {
		self.listeners.push(listener);
	}

	fn emit(&self, event: E) {
		for listener in &self.listeners {
			listener(&event);
		}
	}
}

impl Event for TextDocumentChangeEvent {
	fn get_type(&self) -> &'static str {
		"TextDocumentChangeEvent"
	}
}
pub mod vscode {
	pub mod commands {
		use std::collections::HashMap;
		use once_cell::unsync::OnceCell;
		use crate::ms::vscode::commands;
		// use crate::lazy_static;

		// lazy_static! {
		// 	static ref HANDLERS: super::super::HashMap<String, Box<dyn Fn()>> = super::super::HashMap::new();
		// }

		static mut HANDLERS: OnceCell<HashMap<String, Box<dyn Fn()>>> = OnceCell::new();


		pub fn register_command(command: &str, callback: Box<dyn Fn()>) {
			unsafe {
				if HANDLERS.get().is_none() {
					HANDLERS.set(HashMap::new()).unwrap_or_else(|_| panic!("Failed to set hash map to manage command handlers."));
				}
				HANDLERS.get_mut().unwrap().insert(command.to_string(), callback);
			}
			commands::register_command(command);
		}

		pub fn execute_command(command: &str) {
			unsafe {
				if HANDLERS.get().is_none() {
					return;
				} else {
					if let Some(handler) = HANDLERS.get().unwrap().get(command) {
						handler();
					}
				}
			}
		}
	}

	pub mod window {
		use crate::ms::vscode::window;
		use crate::ms::vscode::types;

		pub fn create_output_channel(name: &str, language_id: Option<&str>) -> types::OutputChannel {
			window::create_output_channel(name, language_id)
		}
	}
}


struct Extension;

impl commands_events::Guest for Extension {
	fn execute_command(command: String) {
		vscode::commands::execute_command(&command);
	}
}

impl workspace_events::Guest for Extension {
	fn did_change_text_document(id: String, event: TextDocumentChangeEvent) {
	}
}

impl Guest for Extension {

    fn activate() {
    	let channel = Rc::new(vscode::window::create_output_channel("Rust Extension", Some("plaintext")));
		let channel_clone = channel.clone();
		vscode::commands::register_command("extension.sayHello", Box::new(move || {
			channel_clone.append_line("Hello World!");
		}));
		channel.append_line("Extension activated!");
	}

	fn deactivate() {
	}
}

export!(Extension);