use once_cell::sync::Lazy;
use vscode::example::window;
// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "calculator",
});

struct MyType;

static CHANNEL: Lazy<window::OutputChannel> = Lazy::new(|| window::create_output_channel("Rust Calculator", Some("plaintext")));

impl Guest for MyType {

	fn add(a: u32, b: u32) -> u32 {
        a + b
    }
    fn calc(op: Operation) -> u32 {
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