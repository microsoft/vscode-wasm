/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { Document, Func, Interface, Owner, Package, Type, TypeKind, TypeReference } from './wit-json';

class Imports {

	public readonly baseTypes: Set<string> = new Set();
	private readonly imports: Map<string, Set<string>> = new Map();
	private uniqueName: number = 1;

	constructor() {
	}

	public get size(): number {
		return this.imports.size;
	}

	public getUniqueName(): string {
		return `$${this.uniqueName++}`;
	}

	public addBaseType(name: string): void {
		this.baseTypes.add(name);
	}

	public add(value: string, from: string): void {
		let values = this.imports.get(from);
		if (values === undefined) {
			values = new Set();
			this.imports.set(from, values);
		}
		values.add(value);
	}

	public entries(): IterableIterator<[string, Set<string>]> {
		return this.imports.entries();
	}

	public [Symbol.iterator](): IterableIterator<[string, Set<string>]> {
		return this.imports[Symbol.iterator]();
	}
}

class Code {

	public readonly imports: Imports;
	private readonly source: string[];
	private indent: number;

	constructor() {
		this.imports = new Imports();
		this.source = [];
		this.indent = 0;
	}

	public increaseIndent(): void {
		this.indent += 1;
	}

	public decreaseIndent(): void {
		this.indent -= 1;
	}

	public push(content?: string): void {
		if (content !== undefined) {
			this.source.push(`${new Array(this.indent).fill('\t').join('')}${content}`);
		} else {
			this.source.push('');
		}
	}

	public toString(): string {
		this.source.unshift('');
		for (const [from, values] of this.imports) {
			this.source.unshift(`import { ${Array.from(values).join(', ')} } from '${from}';`);
		}
		if (this.imports.baseTypes.size > 0) {
			this.source.unshift(`import type { ${Array.from(this.imports.baseTypes).join(', ')} } from '@vscode/wasm-component-model';`);
		}
		// this.source.unshift(`import * as $wcm from '@vscode/wasm-component-model';`);
		return this.source.join('\n');
	}
}

type SymbolTable = Pick<Document, 'interfaces' | 'types' | 'packages'>;

namespace Names {
	export function fileName(pkg: Package): string {
		const index = pkg.name.indexOf(':');
		if (index === -1) {
			return pkg.name;
		}
		return `${pkg.name.substring(index + 1)}.ts`;
	}

	export function asTypeName(name: string): string {
		const parts = name.split('-');
		for (let i = 0; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		return parts.join('');
	}

	export function asPropertyName(name: string): string {
		const parts = name.split('-');
		for (let i = 1; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		return parts.join('');
	}

	export function getNamespaceAndName(name: string): [string | undefined, string] {
		const index = name.indexOf(':');
		if (index === -1) {
			return [undefined, name];
		}
		return [name.substring(0, index), name.substring(index + 1)];
	}
}

namespace TypeScript {

	namespace TypeName {

		export function fromReference(ref: TypeReference, symbols: SymbolTable, imports: Imports): string {
			if (typeof ref === 'string') {
				return baseType(ref);
			} else if (typeof ref === 'number') {
				return fromType(symbols.types[ref], symbols, imports);
			} else {
				throw new Error(`Unknown type reference ${ref}`);
			}
		}

		export function fromType(type: Type, symbols: SymbolTable, imports: Imports): string {
			if (TypeKind.isTypeReferenceObject(type.kind)) {
				const referenced = symbols.types[type.kind.type];
				let qualifier = computeQualifier(type.owner, referenced.owner, symbols, imports);
				const name = type.name === null ? fromType(referenced, symbols, imports) : Names.asTypeName(type.name);
				if (qualifier !== undefined) {
					return `${qualifier}.${name}`;
				} else {
					return name;
				}
			}
			if (TypeKind.isBaseType(type.kind)) {
				return baseType(type.kind.type);
			}
			if (TypeKind.isList(type.kind)) {
				if (typeof type.kind.list === 'string') {
					switch (type.kind.list) {
						case 'u8':
							return 'Uint8Array';
						case 'u16':
							return 'Uint16Array';
						case 'u32':
							return 'Uint32Array';
						case 'u64':
							return 'BigUint64Array';
						case 's8':
							return 'Int8Array';
						case 's16':
							return 'Int16Array';
						case 's32':
							return 'Int32Array';
						case 's64':
							return 'BigInt64Array';
						case 'float32':
							return 'Float32Array';
						case 'float64':
							return 'Float64Array';
						default:
							return `${type.kind.list}[]`;
					}
				} else {
					return `${fromReference(type.kind.list, symbols, imports)}[]`;
				}
			} else if (TypeKind.isTuple(type.kind)) {
				return `[${type.kind.tuple.types.map(t => fromReference(t, symbols, imports)).join(', ')}]`;
			} else if (TypeKind.isOption(type.kind)) {
				return `${fromReference(type.kind.option, symbols, imports)} | undefined`;
			} else if (type.name !== null) {
				return type.name;
			}
			throw new Error(`Unknown type ${type.kind}`);
		}

		function computeQualifier(type: Owner | null, reference: Owner | null, symbols: SymbolTable, imports: Imports): string | undefined {
			if (type === null || reference === null) {
				return undefined;
			}
			if (Owner.isInterface(type) && Owner.isInterface(reference)) {
				if (type.interface === reference.interface) {
					return undefined;
				}
				const typeInterface = symbols.interfaces[type.interface];
				const referenceInterface = symbols.interfaces[reference.interface];
				if (typeInterface.package === referenceInterface.package) {
					return `${Names.asTypeName(referenceInterface.name)}`;
				} else {
					const typePackage = symbols.packages[typeInterface.package];
					const referencedPackage = symbols.packages[referenceInterface.package];
					const [typeNamespace, ] = Names.getNamespaceAndName(typePackage.name);
					const [referenceNamespace, referenceName] = Names.getNamespaceAndName(referencedPackage.name);
					if (typeNamespace === referenceNamespace) {
						imports.add(Names.asTypeName(referenceName), `./${referenceName}`);
						return Names.asTypeName(referenceName);
					} else {
						throw new Error(`Cannot compute qualifier for ${JSON.stringify(type)} and ${JSON.stringify(reference)}`);
					}
				}
			}
			return undefined;
		}

		function baseType(base: string): string {
			switch (base) {
				case 'u8':
				case 'u16':
				case 'u32':
				case 's8':
				case 's16':
				case 's32':
					return 'number';
				case 'u64':
				case 's64':
					return 'bigint';
				case 'f32':
					return 'number';
				case 'f64':
					return 'bigint';
				case 'bool':
					return 'boolean';
				case 'string':
					return 'string';
				default:
					throw new Error(`Unknown base type ${base}`);
			}
		}
	}

	export class PackageEmitter {

		private readonly pkg: Package;
		private readonly symbols: SymbolTable;
		private readonly code: Code;

		constructor(pkg: Package, symbols: SymbolTable) {
			this.pkg = pkg;
			this.symbols = symbols;
			this.code = new Code();
		}

		public emit(): Code {
			for (const iface of Object.values(this.pkg.interfaces)) {
				this.processInterface(this.symbols.interfaces[iface]);
				this.code.push('');
			}
			return this.code;
		}

		private processInterface(iface: Interface): void {
			this.code.push(`export namespace ${Names.asTypeName(iface.name)} {`);
			this.code.increaseIndent();
			for (const t of Object.values(iface.types)) {
				const type = this.symbols.types[t];
				(new TypeEmitter(type, this.code, this.symbols)).emit();
			}
			for (const func of Object.values(iface.functions)) {
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
		}
	}

	class TypeEmitter {

		private readonly type: Type;
		private readonly code: Code;
		private readonly symbols: SymbolTable;

		constructor(type: Type, code: Code, symbols: SymbolTable) {
			this.type = type;
			this.code = code;
			this.symbols = symbols;
		}

		public emit(): void {
			if (this.type.name === null) {
				throw new Error(`Type ${this.type.kind} has no name.`);
			}
			if (TypeKind.isRecord(this.type.kind)) {
				this.code.push(`export interface ${Names.asTypeName(this.type.name)} {`);
				this.code.increaseIndent();
				for (const field of this.type.kind.record.fields) {
					this.code.push(`${Names.asPropertyName(field.name)}: ${TypeName.fromReference(field.type, this.symbols, this.code.imports)};`);
				}
				this.code.decreaseIndent();
				this.code.push(`};`);
			} else if (TypeKind.isVariant(this.type.kind)) {
				this.code.push(`export namespace ${Names.asTypeName(this.type.name)} {`);
				this.code.increaseIndent();
				this.code.decreaseIndent();
				this.code.push(`};`);
			} else if (TypeKind.isEnum(this.type.kind)) {
				this.code.push(`export enum ${Names.asTypeName(this.type.name)} {`);
				this.code.increaseIndent();
				for (let i = 0; i < this.type.kind.enum.cases.length; i++) {
					const item = this.type.kind.enum.cases[i];
					this.code.push(`${Names.asPropertyName(item.name)} = ${i},`);
				}
				this.code.decreaseIndent();
				this.code.push(`};`);
			} else if (TypeKind.isFlags(this.type.kind)) {
				this.code.push(`export interface ${Names.asTypeName(this.type.name)} {`);
				this.code.increaseIndent();
				for (const flag of this.type.kind.flags.flags) {
					this.code.push(`${Names.asPropertyName(flag.name)}: boolean;`);
				}
				this.code.decreaseIndent();
				this.code.push(`};`);
			} else {
				this.code.push(`export type ${Names.asTypeName(this.type.name)} = ${TypeName.fromType(this.type, this.symbols, this.code.imports)};`);
			}
		}
	}

	class FunctionEmitter {

		private readonly func: Func;
		private readonly code: Code;
		private readonly symbols: SymbolTable;

		constructor(func: Func, code: Code, symbols: SymbolTable) {
			this.func = func;
			this.code = code;
			this.symbols = symbols;
		}

	}
}

export function processDocument(document: Document, outDir: string): void {
	for (const pkg of document.packages) {
		const visitor = new TypeScript.PackageEmitter(pkg, document);
		const code = visitor.emit();
		const fileName = Names.fileName(pkg);
		fs.writeFileSync(path.join(outDir, fileName), code.toString());
	}
}