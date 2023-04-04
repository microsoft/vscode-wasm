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

type BufferSource = ArrayBufferView | ArrayBuffer;
declare namespace WebAssembly {

    type ImportExportKind = 'function' | 'global' | 'memory' | 'table';
    type TableKind = 'anyfunc' | 'externref';
    type ValueType = 'anyfunc' | 'externref' | 'f32' | 'f64' | 'i32' | 'i64' | 'v128';
    type ExportValue = Function | Global | Memory | Table;
    type Exports = Record<string, ExportValue>;
    type ImportValue = ExportValue | number;
    type Imports = Record<string, ModuleImports>;
    type ModuleImports = Record<string, ImportValue>;

    interface GlobalDescriptor {
    	mutable?: boolean;
    	value: ValueType;
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

    interface Table {
    	readonly length: number;
    	get(index: number): any;
    	grow(delta: number, value?: any): number;
    	set(index: number, value?: any): void;
    }

    var Table: {
    	prototype: Table;
    	new(descriptor: TableDescriptor, value?: any): Table;
    };

    interface Global {
    	value: any;
    	valueOf(): any;
    }

    var Global: {
    	prototype: Global;
    	new(descriptor: GlobalDescriptor, v?: any): Global;
    };

    interface Instance {
    	readonly exports: Exports;
    }

    var Instance: {
    	prototype: Instance;
    	new(module: Module, importObject?: Imports): Instance;
    };

    var Module: {
    	prototype: Module;
    	new(bytes: BufferSource): Module;
    	customSections(moduleObject: Module, sectionName: string): ArrayBuffer[];
    	exports(moduleObject: Module): ModuleExportDescriptor[];
    	imports(moduleObject: Module): ModuleImportDescriptor[];
    };

    interface WebAssemblyInstantiatedSource {
    	instance: Instance;
    	module: Module;
    }

    function compile(bytes: BufferSource): Promise<Module>;
    function instantiate(bytes: BufferSource, importObject?: Imports): Promise<WebAssemblyInstantiatedSource>;
    function instantiate(moduleObject: Module, importObject?: Imports): Promise<Instance>;
    function validate(bytes: BufferSource): boolean;
}