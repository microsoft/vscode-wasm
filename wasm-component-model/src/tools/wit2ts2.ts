/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
	Document, Documentation, EnumCase, EnumKind, Flag, FlagsKind, Func, Interface, Owner, Package, Param, RecordKind,
	AbstractTyPrinter, Type, TypeKind, TypeReference, VariantKind, World, BaseType, ListType, OptionType, ResultType, TupleType
} from './wit-json';
import { ResolvedOptions } from './options';
import { number } from 'yargs';

export function processDocument(document: Document, options: ResolvedOptions): void {
	const regExp = new RegExp(options.package);
	const mainCode = new Code();
	for (const pkg of document.packages) {
		if (!regExp.test(pkg.name)) {
			continue;
		}
		const visitor = new TypeScript.PackageEmitter(pkg, mainCode, document);
		const code = visitor.emit();
		const fileName = Names.asFileName(pkg);
		fs.writeFileSync(path.join(options.outDir, fileName), code.toString());
	}
	fs.writeFileSync(path.join(options.outDir, 'main.ts'), mainCode.toString());
}

class Imports {

	public readonly baseTypes: Set<string> = new Set();
	public readonly starImports = new Map<string, string>();
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

	public addStar(from: string, as: string): void {
		this.starImports.set(from, as);
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
		const starImports = this.imports.starImports;
		for (const from of Array.from(starImports.keys()).reverse()) {
			this.source.unshift(`import * as ${starImports.get(from)} from '${from}';`);
		}
		this.source.unshift(`import * as $wcm from '@vscode/wasm-component-model';`);
		this.source.unshift(' *--------------------------------------------------------------------------------------------*/');
		this.source.unshift(' *  Licensed under the MIT License. See License.txt in the project root for license information.');
		this.source.unshift(' *  Copyright (c) Microsoft Corporation. All rights reserved.');
		this.source.unshift('/*---------------------------------------------------------------------------------------------');
		return this.source.join('\n');
	}
}

type SymbolTable = Pick<Document, 'interfaces' | 'types' | 'packages' | 'worlds'>;

interface NameProvider {
	asFileName(pkg: Package): string;
	asImportName(pkg: Package): string;
	asPackageName(pkg: Package): string;
	asInterfaceName(iface: Interface): string;
	asTypeName(type: Type): string;
	asFunctionName(func: Func): string;
	asParameterName(param: Param): string;
	asEnumCaseName(c: EnumCase): string;
	asFlagName(flag: Flag): string;
	getNamespaceAndName(pkg: Package): [string | undefined, string];
}

namespace _TypeScriptNameProvider {
	const keywords: Map<string, string> = new Map<string, string>([
		['this', 'this_'],
		['in', 'in_'],
		['delete', 'delete_']
	]);

	export function asFileName(pkg: Package): string {
		return `${asPackageName(pkg)}.ts`;
	}

	export function asImportName(pkg: Package): string {
		return asPackageName(pkg);
	}

	export function asPackageName(pkg: Package): string {
		const index = pkg.name.indexOf(':');
		if (index === -1) {
			return pkg.name;
		}
		return `${pkg.name.substring(index + 1)}`;
	}

	export function asInterfaceName(iface: Interface): string {
		return _asTypeName(iface.name);
	}

	export function asTypeName(type: Type): string {
		if (type.name === null) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		return _asTypeName(type.name);
	}

	export function asFunctionName(func: Func): string {
		return _asPropertyName(func.name);
	}

	export function asParameterName(param: Param): string {
		return _asPropertyName(param.name);
	}

	export function asEnumCaseName(c: EnumCase): string {
		return _asPropertyName(c.name);
	}

	export function asFlagName(flag: Flag): string {
		return _asPropertyName(flag.name);
	}

	export function getNamespaceAndName(pkg: Package): [string | undefined, string] {
		const name = pkg.name;
		const index = name.indexOf(':');
		if (index === -1) {
			return [undefined, name];
		}
		return [name.substring(0, index), name.substring(index + 1)];
	}

	function _asTypeName(name: string): string {
		const parts = name.split('-');
		for (let i = 0; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		return parts.join('');
	}

	function _asPropertyName(name: string): string {
		const parts = name.split('-');
		for (let i = 1; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		const result = parts.join('');
		return keywords.get(result) ?? result;
	}
}
const TypeScriptNameProvider: NameProvider = _TypeScriptNameProvider;

namespace _WitNameProvider {
	const keywords: Map<string, string> = new Map<string, string>([
		['this', 'this_'],
		['in', 'in_'],
		['delete', 'delete_']
	]);

	export function asFileName(pkg: Package): string {
		return `${asPackageName(pkg)}.ts`;
	}

	export function asImportName(pkg: Package): string {
		return asPackageName(pkg);
	}

	export function asPackageName(pkg: Package): string {
		const index = pkg.name.indexOf(':');
		if (index === -1) {
			return pkg.name;
		}
		return `${pkg.name.substring(index + 1)}`;
	}

	export function asInterfaceName(iface: Interface): string {
		return toTs(iface.name);
	}

	export function asTypeName(type: Type): string {
		if (type.name === null) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		return toTs(type.name);
	}

	export function asFunctionName(func: Func): string {
		return toTs(func.name);
	}

	export function asParameterName(param: Param): string {
		return toTs(param.name);
	}

	export function asEnumCaseName(c: EnumCase): string {
		return toTs(c.name);
	}

	export function asFlagName(flag: Flag): string {
		return toTs(flag.name);
	}

	export function getNamespaceAndName(pkg: Package): [string | undefined, string] {
		const name = pkg.name;
		const index = name.indexOf(':');
		if (index === -1) {
			return [undefined, name];
		}
		return [name.substring(0, index), name.substring(index + 1)];
	}

	function toTs(name: string): string {
		let result = name.replace(/-/g, '_');
		if (result[0] === '%') {
			result = result.substring(1);
		}
		return keywords.get(result) ?? result;
	}
}
const WitNameProvider: NameProvider = _WitNameProvider;

namespace TypeScript {
	export class TyPrinter extends AbstractTyPrinter<TypeUsage> {

		private readonly nameProvider: NameProvider;
		private readonly imports: Imports;

		constructor (symbols: SymbolTable, nameProvider: NameProvider, imports: Imports) {
			super(symbols);
			this.nameProvider = nameProvider;
			this.imports = imports;
		}

		public perform(type: Type, usage: TypeUsage): string {
			return this.print(type, usage);
		}

		public print(type: Type, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.asTypeName(type);
			}
			return super.print(type, usage);
		}

		public printList(type: ListType, usage: TypeUsage): string {
			const base = type.kind.list;
			if (TypeReference.isString(base)) {
				switch (base) {
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
						return `${this.printBaseReference(base)}[]`;
				}
			} else {
				return `${this.printTypeReference(base, usage)}[]`;
			}
		}

		public printOption(type: OptionType, usage: TypeUsage): string {
			return `${this.printTypeReference(type.kind.option, usage)} | undefined`;
		}

		public printTuple(type: TupleType, usage: TypeUsage): string {
			return `[${type.kind.tuple.types.map(t => this.printTypeReference(t, usage)).join(', ')}]`;
		}

		public printResult(type: ResultType, usage: TypeUsage): string {
			let ok: string = 'void';
			const result = type.kind.result;
			if (result.ok !== null) {
				ok = this.printTypeReference(result.ok, usage);
			}
			let error: string = 'void';
			if (result.err !== null) {
				error = this.printTypeReference(result.err, usage);
			}
			this.imports.addBaseType('result');
			return `result<${ok}, ${error}>`;
		}

		public printBaseReference(base: string): string {
			switch (base) {
				case 'u8':
					this.imports.addBaseType('u8');
					return 'u8';
				case 'u16':
					this.imports.addBaseType('u16');
					return 'u16';
				case 'u32':
					this.imports.addBaseType('u32');
					return 'u32';
				case 'u64':
					this.imports.addBaseType('u64');
					return 'u64';
				case 's8':
					this.imports.addBaseType('s8');
					return 's8';
				case 's16':
					this.imports.addBaseType('s16');
					return 's16';
				case 's32':
					this.imports.addBaseType('s32');
					return 's32';
				case 's64':
					this.imports.addBaseType('s64');
					return 's64';
				case 'f32':
					this.imports.addBaseType('f32');
					return 'f32';
				case 'f64':
					this.imports.addBaseType('f64');
					return 'f64';
				case 'bool':
					return 'boolean';
				case 'string':
					return 'string';
				default:
					throw new Error(`Unknown base type ${base}`);
			}
		}
	}
}

namespace MetaModel {

	const qualifier = '$wcm';
	function qualify(name: string): string {
		return `${qualifier}.${name}`;
	}

	export class TyPrinter extends AbstractTyPrinter {

		private readonly nameProvider: NameProvider;
		private readonly imports: Imports;

		private typeParamPrinter: TypeParamPrinter;
		private usage: TypeUsage | undefined;

		constructor (symbols: SymbolTable, nameProvider: NameProvider, imports: Imports) {
			super(symbols);
			this.nameProvider = nameProvider;
			this.imports = imports;
			this.typeParamPrinter = new TypeParamPrinter(symbols, nameProvider, imports);
		}

		public perform(type: Type, usage: TypeUsage): string {
			if (this.usage !== undefined) {
				throw new Error('Printer in usage.');
			}
			try {
				this.usage = usage;
				return this.print(type);
			} finally {
				this.usage = undefined;
			}
		}

		public print(type: Type): string {
			if (this.usage === undefined) {
				throw new Error('Usage is undefined');
			}
			if (type.name !== null && (this.usage === TypeUsage.parameter || this.usage === TypeUsage.function || this.usage === TypeUsage.property)) {
				return this.nameProvider.asTypeName(type);
			}
			return super.print(type);
		}

		public printList(type: ListType): string {
			const base = type.kind.list;
			if (TypeReference.isString(base)) {
				switch (base) {
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
						return `${this.printBaseReference(base)}[]`;
				}
			} else {
				return `${this.printTypeReference(base)}[]`;
			}
		}

		public printOption(type: OptionType): string {
			return `${this.printTypeReference(type.kind.option)} | undefined`;
		}

		public printTuple(type: TupleType): string {
			return `[${type.kind.tuple.types.map(t => this.printTypeReference(t)).join(', ')}]`;
		}

		public printResult(type: ResultType): string {
			let ok: string = 'undefined';
			const result = type.kind.result;
			if (result.ok !== null) {
				ok = this.printTypeReference(result.ok);
			}
			let error: string = 'undefined';
			if (result.err !== null) {
				error = this.printTypeReference(result.err);
			}
			return `new ${qualifier}.ResultType<${this.typeParamPrinter.print(type)}>(${ok}, ${error})`;
		}

		public printBaseReference(base: string): string {
			switch (base) {
				case 'u8':
					return qualify('u8');
				case 'u16':
					return qualify('u16');
				case 'u32':
					return qualify('u32');
				case 'u64':
					return qualify('u64');
				case 's8':
					return qualify('s8');
				case 's16':
					return qualify('s16');
				case 's32':
					return qualify('s32');
				case 's64':
					return qualify('s64');
				case 'f32':
					return qualify('f32');
				case 'f64':
					return qualify('f64');
				case 'bool':
					return qualify('bool');
				case 'string':
					return qualify('wstring');
				default:
					throw new Error(`Unknown base type ${base}`);
			}
		}
	}

	class TypeParamPrinter extends AbstractTyPrinter<number> {

		private readonly nameProvider: NameProvider;
		private readonly imports: Imports;

		private typeScriptPrinter: TypeScript.TyPrinter;

		constructor(symbols: SymbolTable, nameProvider: NameProvider, imports: Imports) {
			super(symbols);
			this.nameProvider = nameProvider;
			this.imports = imports;
			this.typeScriptPrinter = new TypeScript.TyPrinter(symbols, nameProvider, imports);
		}

		public perform(type: Type): string {
			return this.print(type, 0);
		}

		public print(type: Type, depth: number): string {
			try {
				super.print(type, depth);
			} catch (err) {
				if (type.name !== null) {
					Types.getFullyQualifiedNameFromType(type, symbols);
					return this.nameProvider.asTypeName(type);
				}
			}
		}

		public printBaseReference(type: string): string {
			return this.typeScriptPrinter.printBaseReference(type);
		}

		public printList(type: ListType, depth: number): string {
			const base = type.kind.list;
			if (TypeReference.isString(base)) {
				switch (base) {
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
						const result = this.printTypeReference(type.kind.list, depth + 1);
						return depth === 0 ? result : `${result}[]`;
				}
			} else {
				const result = this.printTypeReference(type.kind.list, depth + 1);
				return depth === 0 ? result : `${result}[]`;
			}
		}

		public printOption(type: OptionType, depth: number): string {
			if (depth > 0) {
				this.imports.addBaseType('option');
			}
			const result = `${this.printTypeReference(type.kind.option, depth + 1)}`;
			return depth === 0 ? result : `option<${result}>`;
		}

		public printTuple(type: TupleType, depth: number): string {
			return `[${type.kind.tuple.types.map(t => this.printTypeReference(t, depth + 1)).join(', ')}]`;
		}

		public printResult(type: ResultType, depth: number): string {
			const result = type.kind.result;
			const ok = result.ok !== null ? this.printTypeReference(result.ok, depth + 1) : 'void';
			const error = result.err !== null ? this.printTypeReference(result.err, depth + 1) : 'void';
			if (depth > 0) {
				this.imports.addBaseType('result');
			}
			return depth === 0 ? `${ok}, ${error}` : `result<${ok}, ${error}>`;
		}
	}


	function getTypeParam(type: Type, symbols: SymbolTable, imports: Imports, depth: number): string {
		const kind = type.kind;
		if (TypeKind.isBaseType(kind)) {
			return TypeScript.TypeName.baseType(kind.type, imports);
		} else if (TypeKind.isList(kind)) {
			if (typeof kind.list === 'string') {
				switch (kind.list) {
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
						const result = getTypeParamFromReference(kind.list, symbols, imports, depth + 1);
						return depth === 0 ? result : `${result}[]`;
				}
			} else {
				const result = getTypeParamFromReference(kind.list, symbols, imports, depth + 1);
				return depth === 0 ? result : `${result}[]`;
			}
		} else if (TypeKind.isOption(kind)) {
			if (depth > 0) {
				imports.addBaseType('option');
			}
			const result = `${getTypeParamFromReference(kind.option, symbols, imports, depth + 1)}`;
			return depth === 0 ? result : `option<${result}>`;
		} else if (TypeKind.isTuple(kind)) {
			return `[${kind.tuple.types.map(t => getTypeParamFromReference(t, symbols, imports, depth + 1)).join(', ')}]`;
		} else if (TypeKind.isResult(kind)) {
			const ok = kind.result.ok !== null ? getTypeParamFromReference(kind.result.ok, symbols, imports, depth + 1) : 'void';
			const error = kind.result.err !== null ? getTypeParamFromReference(kind.result.err, symbols, imports, depth + 1) : 'void';
			if (depth > 0) {
				imports.addBaseType('result');
			}
			return depth === 0 ? `${ok}, ${error}` : `result<${ok}, ${error}>`;
		} else if (type.name !== null) {
			return Types.getFullyQualifiedNameFromType(type, symbols);
		}
		throw new Error(`Can't compute type parameter for type ${kind}`);
	}

	function getTypeParamFromReference(ref: TypeReference, symbols: SymbolTable, imports: Imports, depth: number): string {
		if (TypeReference.isString(ref)) {
			return TypeScript.TypeName.baseType(ref, imports);
		} else {
			return getTypeParam(symbols.types[ref], symbols, imports, depth);
		}
	}

}


namespace Names {

	const keywords: Map<string, string> = new Map<string, string>([
		['this', 'this_'],
		['in', 'in_'],
		['delete', 'delete_']
	]);

	export function asFileName(pkg: Package): string {
		return `${asPackageName(pkg)}.ts`;
	}

	export function asImportName(pkg: Package): string {
		return asPackageName(pkg);
	}

	export function asPackageName(pkg: Package): string {
		const index = pkg.name.indexOf(':');
		if (index === -1) {
			return pkg.name;
		}
		return `${pkg.name.substring(index + 1)}`;
	}

	export function asTypeName(name: string): string {
		const parts = name.split('-');
		for (let i = 0; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		return parts.join('');
	}

	export function asFuncName(name: string): string {
		return asPropertyName(name);
	}

	export function asParamName(name: string): string {
		return asPropertyName(name);
	}

	export function asPropertyName(name: string): string {
		const parts = name.split('-');
		for (let i = 1; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		const result = parts.join('');
		return keywords.get(result) ?? result;
	}

	export function getNamespaceAndName(pkg: Package): [string | undefined, string] {
		const name = pkg.name;
		const index = name.indexOf(':');
		if (index === -1) {
			return [undefined, name];
		}
		return [name.substring(0, index), name.substring(index + 1)];
	}
}

class Types {

	private readonly symbols: SymbolTable2;

	constructor(symbols: SymbolTable2) {
		this.symbols = symbols;
	}

	getFullyQualifiedName(type: Type | TypeReference): string {
		if (typeof type === 'string') {
			return type;
		} else if (typeof type === 'number') {
			type = this.symbols.getType(type);
		}
	}
}

class Interfaces {

	private readonly symbols: SymbolTable2;
	private readonly nameProvider: NameProvider;

	constructor(symbols: SymbolTable2, nameProvider: NameProvider) {
		this.symbols = symbols;
		this.nameProvider = nameProvider;
	}

	getFullyQualifiedName(iface: Interface | number): string {
		if (typeof iface === 'number') {
			iface = this.symbols.getInterface(iface);
		}
		const pkg = this.symbols.getPackage(iface.package);
		return `${this.nameProvider.asPackageName(pkg)}.${this.nameProvider.asTypeName(iface.name)}`;
	}
}

class SymbolTable2 {

	private readonly document: Document;

	public readonly types: Types;
	public readonly	interfaces: Interfaces;

	constructor(document: Document, nameProvider: NameProvider) {
		this.document = document;
		this.types = new Types(this);
		this.interfaces = new Interfaces(this);
	}

	public getType(ref: number): Type {
		return this.document.types[ref];
	}

	public getInterface(ref: number): Interface {
		return this.document.interfaces[ref];
	}

	public getPackage(ref: number): Package {
		return this.document.packages[ref];
	}

	public getWorld(ref: number): World {
		return this.document.worlds[ref];
	}
}

namespace Interfaces {
	export function getFullyQualifiedName(iface: Interface, symbols: SymbolTable): string {
		const pkg = symbols.packages[iface.package];
		return `${Names.asPackageName(pkg)}.${Names.asTypeName(iface.name)}`;
	}
}

namespace Types {
	export function getFullyQualifiedNameFromType(type: Type, symbols: SymbolTable): string {
		let name: string | undefined = type.name !== null ? Names.asTypeName(type.name) : undefined;
		if (name === undefined) {
			throw new Error(`Type ${type.kind} has no name.`);
		}
		if (type.owner !== null) {
			if (Owner.isInterface(type.owner)) {
				const owner = Owner.resolve(type.owner, symbols) as Interface;
				const pkg = symbols.packages[owner.package];
				return `${Names.asPackageName(pkg)}.${Names.asTypeName(owner.name)}.${name}`;
			} else {
				throw new Error(`Unsupported owner ${type.owner}`);
			}
		} else {
			return name;
		}
	}
	export function getFullyQualifiedNameFromReference(reference: TypeReference, symbols: SymbolTable): string {
		if (TypeReference.isString(reference)) {
			return reference;
		} else {
			return getFullyQualifiedNameFromType(symbols.types[reference], symbols);
		}
	}
}

enum TypeUsage {
	parameter,
	function,
	property,
	typeDeclaration
}

namespace MetaModel {

	const qualifier = '$wcm';
	function qualify(name: string): string {
		return `${qualifier}.${name}`;
	}

	export interface Emitter {
		emit(code: Code, emitted: Set<String>): void;
	}

	export interface HasDependencies {
		readonly dependencies: Set<string>;
	}

	export namespace HasDependencies {
		export function is(value: any): value is HasDependencies {
			const candidate = value as HasDependencies;
			return candidate.dependencies instanceof Set;
		}
	}

	export class TypeNameEmitter implements Emitter {

		private readonly name: string;
		private readonly reference: string;

		constructor(name: string, reference: string) {
			this.name = name;
			this.reference = reference;
		}

		public emit(code: Code, emitted: Set<String>): void {
			code.push(`export const ${this.name} = ${this.reference};`);
			emitted.add(this.name);
		}
	}

	export class RecordEmitter implements Emitter, HasDependencies {

		private readonly name: string;
		private readonly typeParam: string;
		private readonly fields: string[][];

		public readonly dependencies: Set<string>;

		constructor(name: string, typeParam: string, fields: string[][]) {
			this.name = name;
			this.typeParam = typeParam;
			this.fields = fields;
			this.dependencies = new Set();
		}

		public emit(code: Code, emitted: Set<String>): void {
			code.push(`export const ${this.name} = new $wcm.RecordType<${this.typeParam}>([`);
			code.increaseIndent();
			for (const [name, type] of this.fields) {
				code.push(`['${name}', ${type}],`);
			}
			code.decreaseIndent();
			code.push(`]);`);
			emitted.add(this.name);
		}
	}

	export class EnumerationEmitter implements Emitter {

		private readonly name: string;
		private readonly typeParam: string;
		private readonly items: number;

		constructor(name: string, typeParam: string, items: number) {
			this.name = name;
			this.typeParam = typeParam;
			this.items = items;
		}

		public emit(code: Code, emitted: Set<String>): void {
			code.push(`export const ${this.name} = new $wcm.EnumType<${this.typeParam}>(${this.items});`);
			emitted.add(this.name);
		}
	}

	export class FlagsEmitter implements Emitter {

		private readonly name: string;
		private readonly typeParam: string;
		private readonly flags: string[];

		constructor(name: string, typeParam: string, flags: string[]) {
			this.name = name;
			this.typeParam = typeParam;
			this.flags = flags;
		}

		public emit(code: Code, emitted: Set<String>): void {
			code.push(`export const ${this.name} = new $wcm.FlagsType<${this.typeParam}>([${this.flags.map(flag => `'${flag}'`).join(', ')}]);`);
			emitted.add(this.name);
		}
	}

	export class VariantEmitter implements Emitter, HasDependencies {

		private readonly name: string;
		private readonly typeParam: string;
		private readonly cases: (string | undefined)[];

		public readonly dependencies: Set<string>;

		constructor(name: string, typeParam: string, cases: (string | undefined)[]) {
			this.name = name;
			this.typeParam = typeParam;
			this.cases = cases;
			this.dependencies = new Set();
		}

		public emit(code: Code, emitted: Set<String>): void {
			code.push(`export const ${this.name} = new $wcm.VariantType<${this.typeParam}, ${this.typeParam}._ct, ${this.typeParam}._vt>([${this.cases.map(c => c !== undefined ? c : 'undefined').join(', ')}], ${this.typeParam}._ctor);`);
			emitted.add(this.name);
		}
	}


	export class FunctionEmitter implements Emitter {

		private readonly typeParam: string;
		public readonly name: string;
		private readonly witName: string;
		private readonly params: string[][];
		private readonly result: string | undefined;

		constructor(typeParam: string, name: string, witName: string, params: string[][], result: string | undefined) {
			this.typeParam = typeParam;
			this.name = name;
			this.witName = witName;
			this.params = params;
			this.result = result;
		}

		public emit(code: Code, _emitted: Set<String>): void {
			if (this.params.length === 0) {
				code.push(`export const ${this.name} = new $wcm.FunctionType<${this.typeParam}>('${this.name}', '${this.witName}', [], ${this.result});`);
			} else {
				code.push(`export const ${this.name} = new $wcm.FunctionType<${this.typeParam}>('${this.name}', '${this.witName}',[`);
				code.increaseIndent();
				for (const [name, type] of this.params) {
					code.push(`['${name}', ${type}],`);
				}
				code.decreaseIndent();
				code.push(`], ${this.result});`);
			}
		}
	}

	export namespace TypeName {

		export function fromReference(ref: TypeReference, scope: Interface | World, symbols: SymbolTable, imports: Imports, usage: TypeUsage): string {
			if (TypeReference.isString(ref)) {
				return baseType(ref);
			} else if (TypeReference.isNumber(ref)) {
				return fromType(symbols.types[ref], scope, symbols, imports, usage);
			} else {
				throw new Error(`Unknown type reference ${ref}`);
			}
		}

		export function fromType(type: Type, scope: Interface | World, symbols: SymbolTable, imports: Imports, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return Names.asTypeName(type.name);
			} else if (TypeKind.isBaseType(type.kind)) {
				return baseType(type.kind.type);
			} else if (TypeKind.isList(type.kind)) {
				if (typeof type.kind.list === 'string') {
					switch (type.kind.list) {
						case 'u8':
							return `new ${qualifier}.Uint8ArrayType()`;
						case 'u16':
							return `new ${qualifier}.Uint16ArrayType()`;
						case 'u32':
							return `new ${qualifier}.Uint32ArrayType()`;
						case 'u64':
							return `new ${qualifier}.BigUint64ArrayType()`;
						case 's8':
							return `new ${qualifier}.Int8ArrayType()`;
						case 's16':
							return `new ${qualifier}.Int16ArrayType()`;
						case 's32':
							return `new ${qualifier}.Int32ArrayType()`;
						case 's64':
							return `new ${qualifier}.BigInt64ArrayType()`;
						case 'float32':
							return `new ${qualifier}.Float32ArrayType()`;
						case 'float64':
							return `new ${qualifier}.Float64ArrayType()`;
						default:
							const typeParam = getTypeParam(type, symbols, imports, 0);
							return `new ${qualifier}.ListType<${typeParam}>(${baseType(type.kind.list)})`;
					}
				} else {
					const typeParam = getTypeParam(type, symbols, imports, 0);
					return `new ${qualifier}.ListType<${typeParam}>(${fromReference(type.kind.list, scope, symbols, imports, usage)})`;
				}
			} else if (TypeKind.isTuple(type.kind)) {
				const typeParam = getTypeParam(type, symbols, imports, 0);
				return `new ${qualifier}.TupleType<${typeParam}>([${type.kind.tuple.types.map(t => fromReference(t, scope, symbols, imports, usage)).join(', ')}])`;
			} else if (TypeKind.isOption(type.kind)) {
				const typeParam = getTypeParam(type, symbols, imports, 0);
				return `new ${qualifier}.OptionType<${typeParam}>(${fromReference(type.kind.option, scope, symbols, imports, usage)})`;
			} else if (TypeKind.isResult(type.kind)) {
				let ok: string = 'undefined';
				const result = type.kind.result;
				if (result.ok !== null) {
					ok = fromReference(result.ok, scope, symbols, imports, usage);
				}
				let error: string = 'undefined';
				if (result.err !== null) {
					error = fromReference(result.err, scope, symbols, imports, usage);
				}
				return `new ${qualifier}.ResultType<${getTypeParam(type, symbols, imports, 0)}>(${ok}, ${error})`;
			} else if (TypeKind.isTypeReference(type.kind)) {
				return fromType(symbols.types[type.kind.type], scope, symbols, imports, usage);
			}

			throw new Error(`Unknown type ${type.kind}`);
		}

		function baseType(base: string): string {
			switch (base) {
				case 'u8':
					return qualify('u8');
				case 'u16':
					return qualify('u16');
				case 'u32':
					return qualify('u32');
				case 'u64':
					return qualify('u64');
				case 's8':
					return qualify('s8');
				case 's16':
					return qualify('s16');
				case 's32':
					return qualify('s32');
				case 's64':
					return qualify('s64');
				case 'f32':
					return qualify('f32');
				case 'f64':
					return qualify('f64');
				case 'bool':
					return qualify('bool');
				case 'string':
					return qualify('wstring');
				default:
					throw new Error(`Unknown base type ${base}`);
			}
		}

		function getTypeParam(type: Type, symbols: SymbolTable, imports: Imports, depth: number): string {
			const kind = type.kind;
			if (TypeKind.isBaseType(kind)) {
				return TypeScript.TypeName.baseType(kind.type, imports);
			} else if (TypeKind.isList(kind)) {
				if (typeof kind.list === 'string') {
					switch (kind.list) {
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
							const result = getTypeParamFromReference(kind.list, symbols, imports, depth + 1);
							return depth === 0 ? result : `${result}[]`;
					}
				} else {
					const result = getTypeParamFromReference(kind.list, symbols, imports, depth + 1);
					return depth === 0 ? result : `${result}[]`;
				}
			} else if (TypeKind.isOption(kind)) {
				if (depth > 0) {
					imports.addBaseType('option');
				}
				const result = `${getTypeParamFromReference(kind.option, symbols, imports, depth + 1)}`;
				return depth === 0 ? result : `option<${result}>`;
			} else if (TypeKind.isTuple(kind)) {
				return `[${kind.tuple.types.map(t => getTypeParamFromReference(t, symbols, imports, depth + 1)).join(', ')}]`;
			} else if (TypeKind.isResult(kind)) {
				const ok = kind.result.ok !== null ? getTypeParamFromReference(kind.result.ok, symbols, imports, depth + 1) : 'void';
				const error = kind.result.err !== null ? getTypeParamFromReference(kind.result.err, symbols, imports, depth + 1) : 'void';
				if (depth > 0) {
					imports.addBaseType('result');
				}
				return depth === 0 ? `${ok}, ${error}` : `result<${ok}, ${error}>`;
			} else if (type.name !== null) {
				return Types.getFullyQualifiedNameFromType(type, symbols);
			}
			throw new Error(`Can't compute type parameter for type ${kind}`);
		}

		function getTypeParamFromReference(ref: TypeReference, symbols: SymbolTable, imports: Imports, depth: number): string {
			if (TypeReference.isString(ref)) {
				return TypeScript.TypeName.baseType(ref, imports);
			} else {
				return getTypeParam(symbols.types[ref], symbols, imports, depth);
			}
		}
	}
}

namespace TypeScript {

	function emitDocumentation(item: { docs?: Documentation }, code: Code, emitNewLine: boolean = false): void {
		if (item.docs !== undefined && item.docs.contents !== null) {
			emitNewLine && code.push('');
			code.push(`/**`);
			const lines = item.docs.contents.split('\n');
			for (const line of lines) {
				code.push(` * ${line}`);
			}
			code.push(` */`);
		}
	}

	export class PackageEmitter {

		private readonly pkg: Package;
		private readonly symbols: SymbolTable;
		private readonly mainCode: Code;
		private readonly metaModelEmitters: Map<string, MetaModel.Emitter[]>;

		constructor(pkg: Package, mainCode: Code, symbols: SymbolTable) {
			this.pkg = pkg;
			this.symbols = symbols;
			this.mainCode = mainCode;
			this.metaModelEmitters = new Map();
		}

		public emit(): Code {
			const code = new Code();
			const pkgName = Names.asPackageName(this.pkg);
			code.push(`export namespace ${pkgName} {`);
			code.increaseIndent();

			const interfaces: Map<string, Interface> = new Map();
			for (const ref of Object.values(this.pkg.interfaces)) {
				const iface = this.symbols.interfaces[ref];
				interfaces.set(Names.asTypeName(iface.name), iface);
				this.processInterface(iface, pkgName, code);
				code.push('');
			}

			code.decreaseIndent();
			code.push(`}`);

			if (this.metaModelEmitters.size > 0) {
				code.push('');
				code.push(`export namespace ${pkgName} {`);
				code.increaseIndent();
				const emitted = new Set<string>();
				for (const [jface, emitters] of this.metaModelEmitters) {
					code.push(`export namespace ${jface}.$ {`);
					code.increaseIndent();
					const functions: string[] = [];
					for (const emitter of emitters) {
						emitter.emit(code, emitted);
						if (emitter instanceof MetaModel.FunctionEmitter) {
							functions.push(emitter.name);
						}
					}
					code.decreaseIndent();
					code.push('}');

					code.push(`export namespace ${jface}._ {`);
					code.increaseIndent();

					code.push(`const allFunctions = [${functions.map(name => `$.${name}`).join(', ')}];`);
					const iface = interfaces.get(jface)!;
					const ifaceName = Interfaces.getFullyQualifiedName(iface, this.symbols);
					code.push(`export function createHost<T extends $wcm.Host>(service: ${ifaceName}, context: $wcm.Context): T {`);
					code.increaseIndent();
					code.push(`return $wcm.Host.create<T>(allFunctions, service, context);`);
					code.decreaseIndent();
					code.push(`}`);
					code.push(`export function createService<T extends ${ifaceName}>(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): T {`);
					code.increaseIndent();
					code.push(`return $wcm.Service.create<T>(allFunctions, wasmInterface, context);`);
					code.decreaseIndent();
					code.push(`}`);


					code.decreaseIndent();
					code.push('}');
				}
				code.decreaseIndent();
				code.push(`}`);
			}

			this.mainCode.push(`export { ${pkgName} } from './${Names.asImportName(this.pkg)}';`);
			return code;
		}

		private processInterface(iface: Interface, qualifier: string, code: Code): void {
			const name = Names.asTypeName(iface.name);
			const metaModelEmitters: MetaModel.Emitter[] = [];
			this.metaModelEmitters.set(name, metaModelEmitters);

			emitDocumentation(iface, code);
			code.push(`export namespace ${name} {`);
			code.increaseIndent();
			for (const t of Object.values(iface.types)) {
				code.push('');
				const type = this.symbols.types[t];
				const typeEmitter = new TypeEmitter(type, iface, `${qualifier}.${name}`, code, this.symbols);
				typeEmitter.emit();
				if (typeEmitter.metaModelEmitter !== undefined) {
					metaModelEmitters.push(typeEmitter.metaModelEmitter);
				}
			}
			const funcExports: string[] = [];
			for (const func of Object.values(iface.functions)) {
				code.push('');
				const funcEmitter = new FunctionEmitter(func, iface, `${qualifier}.${name}`, code, this.symbols);
				funcEmitter.emit();
				if (funcEmitter.metaModelEmitter !== undefined) {
					metaModelEmitters.push(funcEmitter.metaModelEmitter);
				}
				funcExports.push(Names.asFuncName(func.name));
			}
			code.decreaseIndent();
			code.push(`}`);
			code.push(`export type ${name} = Pick<typeof ${name}, ${funcExports.map(item => `'${item}'`).join(' | ')}>;`);
		}
	}

	class TypeEmitter {

		private readonly type: Type;
		private readonly scope: Interface;
		private readonly qualifier: string;
		private readonly code: Code;
		private readonly symbols: SymbolTable;
		public metaModelEmitter: MetaModel.Emitter | undefined;

		constructor(type: Type, scope: Interface, qualifier: string, code: Code, symbols: SymbolTable) {
			this.type = type;
			this.scope = scope;
			this.qualifier = qualifier;
			this.code = code;
			this.symbols = symbols;
		}

		public emit(): void {
			if (this.type.name === null) {
				throw new Error(`Type ${this.type.kind} has no name.`);
			}
			emitDocumentation(this.type, this.code);
			if (TypeKind.isRecord(this.type.kind)) {
				this.emitRecord(this.type.name, this.type.kind);
			} else if (TypeKind.isVariant(this.type.kind)) {
				this.emitVariant(this.type.name, this.type.kind);
			} else if (TypeKind.isEnum(this.type.kind)) {
				this.emitEnum(this.type.name, this.type.kind);
			} else if (TypeKind.isFlags(this.type.kind)) {
				this.emitFlags(this.type.name, this.type.kind);
			} else if (TypeKind.isTypeReference(this.type.kind)) {
				const referenced = this.symbols.types[this.type.kind.type];
				if (referenced.name !== null) {
					const qualifier = referenced.owner !== null ? this.computeQualifier(this.scope, Owner.resolve(referenced.owner, this.symbols)) : undefined;
					const typeName = qualifier !== undefined ? `${qualifier}.${Names.asTypeName(referenced.name)}` : Names.asTypeName(referenced.name);
					const tsName = Names.asTypeName(this.type.name);
					this.code.push(`export type ${tsName} = ${typeName};`);
					this.metaModelEmitter = new MetaModel.TypeNameEmitter(tsName, qualifier !== undefined ? `${qualifier}.$.${Names.asTypeName(referenced.name)}` : Names.asTypeName(referenced.name));
				} else {
					throw new Error(`Cannot reference type ${JSON.stringify(referenced)} from ${JSON.stringify(this.scope)}`);
				}
			} else {
				const name = Names.asTypeName(this.type.name);
				this.code.push(`export type ${name} = ${TypeName.fromType(this.type, this.scope, this.symbols, this.code.imports, TypeUsage.typeDeclaration)};`);
				this.metaModelEmitter = new MetaModel.TypeNameEmitter(name, MetaModel.TypeName.fromType(this.type, this.scope, this.symbols, this.code.imports, TypeUsage.typeDeclaration));
			}
		}

		private emitRecord(name: string, kind: RecordKind): void {
			const tsName = Names.asTypeName(name);
			this.code.push(`export interface ${Names.asTypeName(name)} extends $wcm.JRecord {`);
			this.code.increaseIndent();
			const metaFields: string[][] = [];
			for (const field of kind.record.fields) {
				emitDocumentation(field, this.code, true);
				const isOptional = TypeReference.isString(field.type)
					? false
					: TypeKind.isOption(this.symbols.types[field.type].kind);
				const fieldName = Names.asPropertyName(field.name);
				this.code.push(`${fieldName}${isOptional ? '?' : ''}: ${TypeName.fromReference(field.type, this.scope, this.symbols, this.code.imports, TypeUsage.property)};`);
				metaFields.push([fieldName, MetaModel.TypeName.fromReference(field.type, this.scope, this.symbols, this.code.imports, TypeUsage.property)]);
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
			this.metaModelEmitter= new MetaModel.RecordEmitter(tsName, `${this.qualifier}.${tsName}`, metaFields);
		}

		private emitVariant(name: string, kind: VariantKind): void {
			const code = this.code;
			const variantName = Names.asTypeName(name);

			this.code.push(`export namespace ${variantName} {`);
			this.code.increaseIndent();
			const names: string[] = [];
			const types: (string | undefined)[] = [];
			const metaTypes: (string | undefined)[] = [];
			for (const item of kind.variant.cases) {
				names.push(Names.asPropertyName(item.name));
				if (item.type !== null) {
					types.push(TypeName.fromReference(item.type, this.scope, this.symbols, this.code.imports, TypeUsage.property));
					metaTypes.push(MetaModel.TypeName.fromReference(item.type, this.scope, this.symbols, this.code.imports, TypeUsage.property));
				} else {
					types.push(undefined);
					metaTypes.push(undefined);
				}
			}

			for (let i = 0; i < names.length; i++) {
				emitDocumentation(kind.variant.cases[i], code, true);
				const name = names[i];
				const type = types[i];
				code.push(`export const ${name} = ${i} as const;`);
				if (type !== undefined) {
					code.push(`export type ${name} = { readonly case: typeof ${name}; readonly value: ${type} } & _common;`);
				} else {
					code.push(`export type ${name} = { readonly case: typeof ${name} } & _common;`);
				}
				code.push('');
			}
			code.push(`export type _ct = ${names.map(value => `typeof ${value}`).join(' | ')};`);
			let needsUndefined = false;
			const items: string[] = [];
			for (const type of types) {
				if (type === undefined) {
					needsUndefined = true;
				} else {
					items.push(type);
				}
			}
			if (needsUndefined) {
				items.push('undefined');
			}
			code.push(`export type _vt = ${items.join(' | ')};`);
			code.push(`type _common = Omit<VariantImpl, 'case' | 'value'>;`);
			code.push(`export function _ctor(c: _ct, v: _vt): ${variantName} {`);
			code.increaseIndent();
			code.push(`return new VariantImpl(c, v) as ${variantName};`);
			code.decreaseIndent();
			code.push(`}`);

			for (let i = 0; i < names.length; i++) {
				const name = names[i];
				const type = types[i];
				if (type !== undefined) {
					code.push(`export function _${name}(value: ${type}): ${name} {`);
					code.increaseIndent();
					code.push(`return new VariantImpl(${name}, value) as ${name};`);
					code.decreaseIndent();
					code.push(`}`);
				} else {
					code.push(`export function _${name}(): ${name} {`);
					code.increaseIndent();
					code.push(`return new VariantImpl(${name}, undefined) as ${name};`);
					code.decreaseIndent();
					code.push(`}`);
				}
			}

			code.push(`class VariantImpl {`);
			code.increaseIndent();
			code.push(`private readonly _case: _ct;`);
			code.push(`private readonly _value${needsUndefined ? '?' : ''}: _vt;`);
			code.push(`constructor(c: _ct, value: _vt) {`);
			code.increaseIndent();
			code.push(`this._case = c;`);
			code.push(`this._value = value;`);
			code.decreaseIndent();
			code.push(`}`);
			code.push(`get case(): _ct {`);
			code.increaseIndent();
			code.push(`return this._case;`);
			code.decreaseIndent();
			code.push(`}`);
			code.push(`get value(): _vt {`);
			code.increaseIndent();
			code.push(`return this._value;`);
			code.decreaseIndent();
			code.push(`}`);
			for (const name of names) {
				code.push(`${name}(): this is ${name} {`);
				code.increaseIndent();
				code.push(`return this._case === ${variantName}.${name};`);
				code.decreaseIndent();
				code.push(`}`);
			}
			// class
			code.decreaseIndent();
			code.push(`}`);
			//namespace
			code.decreaseIndent();
			code.push(`}`);

			code.push(`export type ${variantName} = ${names.map(value => `${variantName}.${value}`).join(' | ')};`);
			this.metaModelEmitter = new MetaModel.VariantEmitter(variantName, `${this.qualifier}.${variantName}`, metaTypes);
		}

		private emitEnum(name: string, kind: EnumKind): void {
			const tsName = Names.asTypeName(name);
			this.code.push(`export enum ${tsName} {`);
			this.code.increaseIndent();
			for (let i = 0; i < kind.enum.cases.length; i++) {
				const item = kind.enum.cases[i];
				this.code.push(`${Names.asPropertyName(item.name)} = ${i},`);
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
			this.metaModelEmitter = new MetaModel.EnumerationEmitter(tsName, `${this.qualifier}.${tsName}`, kind.enum.cases.length);
		}

		private emitFlags(name: string, kind: FlagsKind): void {
			const tsName = Names.asTypeName(name);
			const flags: string[] = [];
			this.code.push(`export interface ${tsName} extends $wcm.JFlags {`);
			this.code.increaseIndent();
			for (const flag of kind.flags.flags) {
				const flagName = Names.asPropertyName(flag.name);
				this.code.push(`${flagName}: boolean;`);
				flags.push(flagName);
			}
			this.code.decreaseIndent();
			this.code.push(`};`);
			this.metaModelEmitter = new MetaModel.FlagsEmitter(tsName, `${this.qualifier}.${tsName}`, flags);
		}

		private computeQualifier(scope: Interface | World, reference: Interface | World): string | undefined {
			if (scope === reference) {
				return undefined;
			}
			if (Interface.is(scope) && Interface.is(reference)) {
				if (scope.package === reference.package) {
					const referencedPackage = this.symbols.packages[reference.package];
					const [, referencePackagedName] = Names.getNamespaceAndName(referencedPackage);
					return `${referencePackagedName}.${Names.asTypeName(reference.name)}`;
				} else {
					const typePackage = this.symbols.packages[scope.package];
					const referencedPackage = this.symbols.packages[reference.package];
					const [typeNamespaceName, ] = Names.getNamespaceAndName(typePackage);
					const [referencedNamespaceName, referencePackagedName] = Names.getNamespaceAndName(referencedPackage);
					if (typeNamespaceName === referencedNamespaceName) {
						const referencedTypeName = Names.asTypeName(reference.name);
						this.code.imports.add(referencePackagedName, `./${referencePackagedName}`);
						return `${referencePackagedName}.${referencedTypeName}`;
					} else {
						throw new Error(`Cannot compute qualifier to import ${JSON.stringify(reference)} into scope  ${JSON.stringify(scope)}.`);
					}
				}
			}
			return undefined;
		}
	}

	class FunctionEmitter {

		private readonly func: Func;
		private readonly scope: Interface;
		private readonly qualifier: string;
		private readonly code: Code;
		private readonly symbols: SymbolTable;
		public metaModelEmitter: MetaModel.Emitter | undefined;

		constructor(func: Func, scope: Interface, qualifier: string, code: Code, symbols: SymbolTable) {
			this.func = func;
			this.scope = scope;
			this.qualifier = qualifier;
			this.code = code;
			this.symbols = symbols;
		}

		public emit(): void {
			emitDocumentation(this.func, this.code);
			const funcName = Names.asFuncName(this.func.name);
			const elements: string[] = [];
			const metaData: string[][] = [];
			for (const param of this.func.params) {
				const paramName = Names.asParamName(param.name);
				elements.push(`${paramName}: ${TypeName.fromReference(param.type, this.scope, this.symbols, this.code.imports, TypeUsage.parameter)}`);
				metaData.push([paramName, MetaModel.TypeName.fromReference(param.type, this.scope, this.symbols, this.code.imports, TypeUsage.parameter)]);
			}
			let returnType: string = 'void';
			let metaReturnType: string | undefined = undefined;
			if (this.func.results.length === 1) {
				returnType = TypeName.fromReference(this.func.results[0].type, this.scope, this.symbols, this.code.imports, TypeUsage.function);
				metaReturnType = MetaModel.TypeName.fromReference(this.func.results[0].type, this.scope, this.symbols, this.code.imports, TypeUsage.function);
			} else if (this.func.results.length > 1) {
				returnType = `[${this.func.results.map(r => TypeName.fromReference(r.type, this.scope, this.symbols, this.code.imports, TypeUsage.function)).join(', ')}]`;
				metaReturnType = `[${this.func.results.map(r => MetaModel.TypeName.fromReference(r.type, this.scope, this.symbols, this.code.imports, TypeUsage.function)).join(', ')}]`;
			}
			this.code.push(`export declare function ${funcName}(${elements.join(', ')}): ${returnType};`);
			this.metaModelEmitter = new MetaModel.FunctionEmitter(`typeof ${this.qualifier}.${funcName}`, funcName, this.func.name, metaData, metaReturnType);
			// this.code.push(`export type ${name} = typeof ${name};`);
		}
	}

	export namespace TypeName {

		export function fromReference(ref: TypeReference, scope: Interface | World, symbols: SymbolTable, imports: Imports, usage: TypeUsage): string {
			if (TypeReference.isString(ref)) {
				return baseType(ref, imports);
			} else if (TypeReference.isNumber(ref)) {
				return fromType(symbols.types[ref], scope, symbols, imports, usage);
			} else {
				throw new Error(`Unknown type reference ${ref}`);
			}
		}

		export function fromType(type: Type, scope: Interface | World, symbols: SymbolTable, imports: Imports, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return Names.asTypeName(type.name);
			} else if (TypeKind.isBaseType(type.kind)) {
				return baseType(type.kind.type, imports);
			} else if (TypeKind.isList(type.kind)) {
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
							return `${baseType(type.kind.list, imports)}[]`;
					}
				} else {
					return `${fromReference(type.kind.list, scope, symbols, imports, usage)}[]`;
				}
			} else if (TypeKind.isTuple(type.kind)) {
				return `[${type.kind.tuple.types.map(t => fromReference(t, scope, symbols, imports, usage)).join(', ')}]`;
			} else if (TypeKind.isOption(type.kind)) {
				return `${fromReference(type.kind.option, scope, symbols, imports, usage)} | undefined`;
			} else if (TypeKind.isResult(type.kind)) {
				let ok: string = 'void';
				const result = type.kind.result;
				if (result.ok !== null) {
					ok = fromReference(result.ok, scope, symbols, imports, usage);
				}
				let error: string = 'void';
				if (result.err !== null) {
					error = fromReference(result.err, scope, symbols, imports, usage);
				}
				imports.addBaseType('result');
				return `result<${ok}, ${error}>`;
			} else if (TypeKind.isTypeReference(type.kind)) {
				return fromType(symbols.types[type.kind.type], scope, symbols, imports, usage);
			}

			throw new Error(`Unknown type ${type.kind}`);
		}

		export function baseType(base: string, imports: Imports): string {
			switch (base) {
				case 'u8':
					imports.addBaseType('u8');
					return 'u8';
				case 'u16':
					imports.addBaseType('u16');
					return 'u16';
				case 'u32':
					imports.addBaseType('u32');
					return 'u32';
				case 'u64':
					imports.addBaseType('u64');
					return 'u64';
				case 's8':
					imports.addBaseType('s8');
					return 's8';
				case 's16':
					imports.addBaseType('s16');
					return 's16';
				case 's32':
					imports.addBaseType('s32');
					return 's32';
				case 's64':
					imports.addBaseType('s64');
					return 's64';
				case 'f32':
					imports.addBaseType('f32');
					return 'f32';
				case 'f64':
					imports.addBaseType('f64');
					return 'f64';
				case 'bool':
					return 'boolean';
				case 'string':
					return 'string';
				default:
					throw new Error(`Unknown base type ${base}`);
			}
		}
	}
}