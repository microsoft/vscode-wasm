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
		match op {
			Operation::Add(operands) => operands.left + operands.right,
			Operation::Sub(operands) => operands.left - operands.right,
			Operation::Mul(operands) => operands.left * operands.right,
			Operation::Div(operands) => operands.left / operands.right,
		}
	}
}

export!(MyType);