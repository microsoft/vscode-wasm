/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::cell::RefCell;
mod calculator;
use calculator::exports::vscode::example::reverse_notation;
use calculator::exports::vscode::example::reverse_notation::{ GuestEngine, Operation};
use calculator::vscode::example::types;

struct EngineImpl {
	left: Option<u32>,
	right: Option<u32>,
}

impl EngineImpl {
	fn new() -> Self {
		EngineImpl {
			left: None,
			right: None,
		}
	}

	fn push_operand(&mut self, operand: u32) {
		if self.left == None {
			self.left = Some(operand);
		} else {
			self.right = Some(operand);
		}
	}

	fn push_operation(&mut self, operation: Operation) {
        let left = self.left.unwrap();
        let right = self.right.unwrap();
        self.left = Some(match operation {
			Operation::Add => left + right,
			Operation::Sub => left - right,
			Operation::Mul => left * right,
			Operation::Div => left / right,
		});
	}

	fn execute(&mut self) -> u32 {
		self.left.unwrap()
	}
}

struct CalcEngine {
	stack: RefCell<EngineImpl>,
}

impl GuestEngine for CalcEngine {

	fn new() -> Self {
		CalcEngine {
			stack: RefCell::new(EngineImpl::new())
		}
	}

	fn push_operand(&self, operand: u32) {
		self.stack.borrow_mut().push_operand(operand);
	}

	fn push_operation(&self, operation: Operation) {
		self.stack.borrow_mut().push_operation(operation);
	}

	fn execute(&self) -> u32 {
		return self.stack.borrow_mut().execute();
	}
}

struct Implementation;
impl reverse_notation::Guest for Implementation {
	type Engine = CalcEngine;
}

impl calculator::Guest for Implementation {
    fn calc(op: types::Operation) -> u32 {
		calculator::log(&format!("Starting calculation: {:?}", op));
		let result = match op {
			types::Operation::Add(operands) => operands.left + operands.right,
			types::Operation::Sub(operands) => operands.left - operands.right,
			types::Operation::Mul(operands) => operands.left * operands.right,
			types::Operation::Div(operands) => operands.left / operands.right,
		};
		calculator::log(&format!("Finished calculation: {:?}", op));
		return result;
	}
	fn msg() -> String {
		calculator::generate()
		// return "Hello from Rust".to_string();
	}
}

calculator::export!(Implementation with_types_in calculator);