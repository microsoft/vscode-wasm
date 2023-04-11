/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

declare namespace WebAssembly {

	interface CompileError extends Error {
	}

	var CompileError: {
		prototype: CompileError;
		new(message?: string): CompileError;
		(message?: string): CompileError;
	};

	interface LinkError extends Error {
	}

	var LinkError: {
		prototype: LinkError;
		new(message?: string): LinkError;
		(message?: string): LinkError;
	};

	interface MemoryDescriptor {
		initial: number;
		maximum?: number;
		shared?: boolean;
	}

	interface Memory {
		readonly buffer: ArrayBuffer;
		grow(delta: number): number;
	}

	var Memory: {
		prototype: Memory;
		new(descriptor: MemoryDescriptor): Memory;
	};

	interface Module {
	}

	interface RuntimeError extends Error {
	}

	var RuntimeError: {
		prototype: RuntimeError;
		new(message?: string): RuntimeError;
		(message?: string): RuntimeError;
	};
}