// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "test",
});

struct MyType;

impl Guest for MyType {

	fn run() {
		let resource = vscode::example::window::create_test_resource();
		for i in 1 .. 1000000 {
			resource.call(i);
		}
	}
}

export!(MyType);