use vscode::example::types::OpCode;

// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "calculator",
});

struct MyType;

impl Guest for MyType {
	fn add(a: u32, b: u32) -> u32 {
        a + b
    }
    fn calc(op: Operation) -> u32 {
		match op.code {
			OpCode::Add => op.a + op.b,
			OpCode::Sub => op.a - op.b,
			OpCode::Mul => op.a * op.b,
			OpCode::Div => op.a / op.b
		}
    }
}

export!(MyType);