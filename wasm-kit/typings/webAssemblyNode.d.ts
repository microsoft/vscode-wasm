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
/// <reference path="./webAssemblyCommon.d.ts" />

declare namespace WebAssembly {

	type BufferSource = ArrayBufferView | ArrayBuffer;

	interface CompileError extends Error {
	}

	var CompileError: {
		prototype: CompileError;
		new(message?: string): CompileError;
		(message?: string): CompileError;
	};

	/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Global) */
	interface Global<T extends ValueType = ValueType> {
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Global/value) */
		value: ValueTypeMap[T];
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Global/valueOf) */
		valueOf(): ValueTypeMap[T];
	}

	var Global: {
		prototype: Global;
		new<T extends ValueType = ValueType>(descriptor: GlobalDescriptor<T>, v?: ValueTypeMap[T]): Global<T>;
	};

	/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Instance) */
	interface Instance {
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Instance/exports) */
		readonly exports: Exports;
	}

	var Instance: {
		prototype: Instance;
		new(module: Module, importObject?: Imports): Instance;
	};

	interface LinkError extends Error {
	}

	var LinkError: {
		prototype: LinkError;
		new(message?: string): LinkError;
		(message?: string): LinkError;
	};

	/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory) */
	interface Memory {
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory/buffer) */
		readonly buffer: ArrayBuffer;
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory/grow) */
		grow(delta: number): number;
	}

	var Memory: {
		prototype: Memory;
		new(descriptor: MemoryDescriptor): Memory;
	};

	/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module) */
	interface Module {
	}

	var Module: {
		prototype: Module;
		new(bytes: BufferSource): Module;
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module/customSections) */
		customSections(moduleObject: Module, sectionName: string): ArrayBuffer[];
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module/exports) */
		exports(moduleObject: Module): ModuleExportDescriptor[];
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Module/imports) */
		imports(moduleObject: Module): ModuleImportDescriptor[];
	};

	interface RuntimeError extends Error {
	}

	var RuntimeError: {
		prototype: RuntimeError;
		new(message?: string): RuntimeError;
		(message?: string): RuntimeError;
	};

	/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table) */
	interface Table {
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table/length) */
		readonly length: number;
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table/get) */
		get(index: number): any;
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table/grow) */
		grow(delta: number, value?: any): number;
		/** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table/set) */
		set(index: number, value?: any): void;
	}

	var Table: {
		prototype: Table;
		new(descriptor: TableDescriptor, value?: any): Table;
	};

	interface GlobalDescriptor<T extends ValueType = ValueType> {
		mutable?: boolean;
		value: T;
	}

	interface MemoryDescriptor {
		initial: number;
		maximum?: number;
		shared?: boolean;
	}

	interface ModuleExportDescriptor {
		kind: ImportExportKind;
		name: string;
	}

	interface ModuleImportDescriptor {
		kind: ImportExportKind;
		module: string;
		name: string;
	}

	interface TableDescriptor {
		element: TableKind;
		initial: number;
		maximum?: number;
	}

	interface ValueTypeMap {
		anyfunc: Function;
		externref: any;
		f32: number;
		f64: number;
		i32: number;
		i64: bigint;
		v128: never;
	}

	interface WebAssemblyInstantiatedSource {
		instance: Instance;
		module: Module;
	}

    type ImportExportKind = 'function' | 'global' | 'memory' | 'table';
    type TableKind = 'anyfunc' | 'externref';
    type ExportValue = Function | Global | Memory | Table;
    type Exports = Record<string, ExportValue>;
    type ImportValue = ExportValue | number;
    type Imports = Record<string, ModuleImports>;
    type ModuleImports = Record<string, ImportValue>;
    type ValueType = keyof ValueTypeMap;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compile) */
    function compile(bytes: BufferSource): Promise<Module>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/compileStreaming) */
    // function compileStreaming(source: Response | PromiseLike<Response>): Promise<Module>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate) */
    function instantiate(bytes: BufferSource, importObject?: Imports): Promise<WebAssemblyInstantiatedSource>;
    function instantiate(moduleObject: Module, importObject?: Imports): Promise<Instance>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiateStreaming) */
    // function instantiateStreaming(source: Response | PromiseLike<Response>, importObject?: Imports): Promise<WebAssemblyInstantiatedSource>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/validate) */
    function validate(bytes: BufferSource): boolean;
}