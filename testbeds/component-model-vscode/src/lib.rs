use once_cell::sync::Lazy;

use vscode::example::window;
use exports::vscode::example::{ workspace_events, commands_events };

// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "calculator",
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

impl Event for vscode::example::types::TextDocumentChangeEvent {
	fn get_type(&self) -> &'static str {
		"TextDocumentChangeEvent"
	}
}

struct MyType;

static CHANNEL: Lazy<window::OutputChannel> = Lazy::new(|| window::create_output_channel("Rust Calculator", Some("plaintext")));

impl commands_events::Guest for MyType {
	fn execute(_command: String) {
	}
}

impl workspace_events::Guest for MyType {
	fn did_change_text_document(_uri: String) {
	}
}

impl Guest for MyType {

    fn calc(op: Operation) -> u32 {
		vscode::example::commands::register("command");
		CHANNEL.show();
		CHANNEL.append_line("calc started");
		let result = match op {
			Operation::Add(operands) => operands.left + operands.right,
			Operation::Sub(operands) => operands.left - operands.right,
			Operation::Mul(operands) => operands.left * operands.right,
			Operation::Div(operands) => operands.left / operands.right,
		};
		CHANNEL.append_line("calc ended");
		return result;
	}
}

export!(MyType);