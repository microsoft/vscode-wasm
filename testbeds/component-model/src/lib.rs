mod calculator;
use calculator::{Guest, Operation};


struct MyType;

impl Guest for MyType {

    fn calc(op: Operation) -> u32 {
		let result = match op {
			Operation::Add(operands) => operands.left + operands.right,
			Operation::Sub(operands) => operands.left - operands.right,
			Operation::Mul(operands) => operands.left * operands.right,
			Operation::Div(operands) => operands.left / operands.right,
		};
		return result;
	}

	fn msg() -> String {
		return calculator::generate();
	}
}

calculator::export!(MyType with_types_in calculator);