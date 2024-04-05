/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::rc::Rc;
use indexmap::IndexMap;

pub trait Event: 'static {
	fn get_type(&self) -> &'static str;
}

pub struct EventEmitter<E: Event> {
	next_id: u32,
	hook: Box<dyn Fn()>,
	unhook: Box<dyn Fn()>,
	listeners: IndexMap<u32, Box<dyn Fn(&E)>>
}

impl<E: Event> EventEmitter<E> {
	pub fn new(hook: Box<dyn Fn()>, unhook: Box<dyn Fn()>) -> Self {
		EventEmitter {
			next_id: 1,
			hook,
			unhook,
			listeners: IndexMap::new()
		}
	}

	pub fn on<'a>(self: &'a Rc<Self>, listener: Box<dyn Fn(&E)>) -> Box<dyn Fn() + 'a> {
		let id = self.next_id;
		self.next_id += 1;
		self.listeners.insert(id, listener);
		return Box::new(move || {
			self.remove(id);
		});
	}

	pub fn fire(&self, event: E) {
		for listener in self.listeners.values() {
			listener(&event);
		}
	}

	pub fn len(&self) -> usize {
		self.listeners.len()
	}

	fn remove(&mut self, id: u32) {
		self.listeners.remove(&id);
	}
}