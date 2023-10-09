/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { ResolvedOptions } from './options';
import {
	Document, Documentation, EnumCase, Flag, Func, Interface, Owner, Package, Param, Type, TypeKind, TypeReference,
	World, BaseType, ListType, OptionType, ResultType, TupleType, ReferenceType, RecordType, VariantType, VariantCase,
	EnumType, FlagsType, Field
} from './wit-json';

export function processDocument(document: Document, options: ResolvedOptions): void {
	const regExp = new RegExp(options.package);
	const mainCode = new Code();
	const nameProvider = options.nameStyle === 'wit' ? WitNameProvider : TypeScriptNameProvider;
	for (const pkg of document.packages) {
		if (!regExp.test(pkg.name)) {
			continue;
		}

		const symbols = new SymbolTable(document, nameProvider);
		const visitor = new TypeScript.PackageEmitter(pkg, mainCode, symbols, nameProvider);
		const code = visitor.emit();
		const fileName = nameProvider.asFileName(pkg);
		fs.writeFileSync(path.join(options.outDir, fileName), code.toString());
	}
	if (!options.noMain) {
		fs.writeFileSync(path.join(options.outDir, 'main.ts'), mainCode.toString());
	}
}

interface Printers {
	typeScript: TypeScript.TypePrinter;
	metaModel: MetaModel.TypePrinter;
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

interface NameProvider {
	asFileName(pkg: Package): string;
	asImportName(pkg: Package): string;
	asPackageName(pkg: Package): string;
	asNamespaceName(iface: Interface): string;
	asTypeName(type: Type): string;
	asFunctionName(func: Func): string;
	asParameterName(param: Param): string;
	asEnumCaseName(c: EnumCase): string;
	asVariantCaseName(c: VariantCase): string;
	asFlagName(flag: Flag): string;
	asFieldName(field: Field): string;
	getNamespaceAndName(pkg: Package): [string | undefined, string];
	typeAsParameterName(type: Type): string;
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

	export function asNamespaceName(iface: Interface): string {
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

	export function asVariantCaseName(c: VariantCase): string {
		return _asPropertyName(c.name);
	}

	export function asFlagName(flag: Flag): string {
		return _asPropertyName(flag.name);
	}

	export function asFieldName(field: Field): string {
		return _asPropertyName(field.name);
	}

	export function getNamespaceAndName(pkg: Package): [string | undefined, string] {
		const name = pkg.name;
		const index = name.indexOf(':');
		if (index === -1) {
			return [undefined, name];
		}
		return [name.substring(0, index), name.substring(index + 1)];
	}

	export function typeAsParameterName(type: Type): string {
		if (type.name === null) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		return _asTypeName(type.name);
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

	export function asNamespaceName(iface: Interface): string {
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

	export function asVariantCaseName(c: VariantCase): string {
		return toTs(c.name);
	}

	export function asFlagName(flag: Flag): string {
		return toTs(flag.name);
	}

	export function asFieldName(field: Field): string {
		return toTs(field.name);
	}

	export function getNamespaceAndName(pkg: Package): [string | undefined, string] {
		const name = pkg.name;
		const index = name.indexOf(':');
		if (index === -1) {
			return [undefined, name];
		}
		return [name.substring(0, index), name.substring(index + 1)];
	}

	export function typeAsParameterName(type: Type): string {
		if (type.name === null) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		return toTs(type.name);
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

class Types {

	private readonly symbols: SymbolTable;
	private readonly nameProvider: NameProvider;

	constructor(symbols: SymbolTable, nameProvider: NameProvider) {
		this.symbols = symbols;
		this.nameProvider = nameProvider;
	}

	getFullyQualifiedName(type: Type | TypeReference): string {
		if (typeof type === 'string') {
			return type;
		} else if (typeof type === 'number') {
			type = this.symbols.getType(type);
		}

		let name: string | undefined = type.name !== null ? this.nameProvider.asTypeName(type) : undefined;
		if (name === undefined) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		if (type.owner !== null) {
			if (Owner.isInterface(type.owner)) {
				const iface = this.symbols.getInterface(type.owner.interface);
				return `${this.symbols.interfaces.getFullyQualifiedName(iface)}.${name}`;
			} else {
				throw new Error(`Unsupported owner ${type.owner}`);
			}
		} else {
			return name;
		}
	}
}

class Interfaces {

	private readonly symbols: SymbolTable;
	private readonly nameProvider: NameProvider;

	constructor(symbols: SymbolTable, nameProvider: NameProvider) {
		this.symbols = symbols;
		this.nameProvider = nameProvider;
	}

	getFullyQualifiedName(iface: Interface | number): string {
		if (typeof iface === 'number') {
			iface = this.symbols.getInterface(iface);
		}
		const pkg = this.symbols.getPackage(iface.package);
		return `${this.nameProvider.asPackageName(pkg)}.${this.nameProvider.asNamespaceName(iface)}`;
	}
}

class SymbolTable {

	private readonly document: Document;

	public readonly	interfaces: Interfaces;
	public readonly types: Types;

	constructor(document: Document, nameProvider: NameProvider) {
		this.document = document;
		this.interfaces = new Interfaces(this, nameProvider);
		this.types = new Types(this, nameProvider);
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

	public resolveOwner(owner: Owner): Interface | World {
		if (Owner.isWorld(owner)) {
			return this.getWorld(owner.world);
		} else if (Owner.isInterface(owner)) {
			return this.getInterface(owner.interface);
		} else {
			throw new Error(`Unknown owner kind ${JSON.stringify(owner)}`);
		}
	}
}

abstract class AbstractTypePrinter<C = undefined> {

	protected readonly symbols: SymbolTable;

	constructor(symbols: SymbolTable) {
		this.symbols = symbols;
	}

	public print(type: Type, context: C): string {
		if (Type.isBaseType(type)) {
			return this.printBase(type, context);
		} else if (Type.isReferenceType(type)) {
			return this.printReference(type, context);
		} else if (Type.isListType(type)) {
			return this.printList(type, context);
		} else if (Type.isOptionType(type)) {
			return this.printOption(type, context);
		} else if (Type.isTupleType(type)) {
			return this.printTuple(type, context);
		} else if (Type.isResultType(type)) {
			return this.printResult(type, context);
		} else if (Type.isRecordType(type)) {
			return this.printRecord(type, context);
		} else if (Type.isEnumType(type)) {
			return this.printEnum(type, context);
		} else if (Type.isFlagsType(type)) {
			return this.printFlags(type, context);
		} else if (Type.isVariantType(type)) {
			return this.printVariant(type, context);
		}
		throw new Error(`Unknown type kind ${JSON.stringify(type)}`);
	}

	public printReference(type: ReferenceType, context: C): string {
		return this.print(this.resolve(type), context);
	}
	public printBase(type: BaseType, context: C): string {
		return this.printBaseReference(type.kind.type, context);
	}
	public abstract printList(type: ListType, context: C): string;
	public abstract printOption(type: OptionType, context: C): string;
	public abstract printTuple(type: TupleType, context: C): string;
	public abstract printResult(type: ResultType, context: C): string;
	public abstract printRecord(type: RecordType, context: C): string;
	public abstract printEnum(type: EnumType, context: C): string;
	public abstract printFlags(type: FlagsType, context: C): string;
	public abstract printVariant(type: VariantType, context: C): string;

	public printTypeReference(type: TypeReference, context: C): string {
		if (TypeReference.isNumber(type)) {
			return this.print(this.symbols.getType(type), context);
		} else {
			return this.printBaseReference(type, context);
		}
	}
	public abstract printBaseReference(type: string, context: C): string;

	public resolve(type: ReferenceType): Type {
		return this.symbols.getType(type.kind.type);
	}
}

namespace TypeScript {
}

enum TypeUsage {
	parameter = 'parameter',
	function = 'function',
	property = 'property',
	typeDeclaration = 'typeDeclaration'
}

namespace MetaModel {

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

	const qualifier = '$wcm';
	function qualify(name: string): string {
		return `${qualifier}.${name}`;
	}

	export class TypePrinter extends AbstractTypePrinter<TypeUsage> {

		private readonly nameProvider: NameProvider;

		private typeParamPrinter: TypeParamPrinter;

		constructor (symbols: SymbolTable, nameProvider: NameProvider, imports: Imports) {
			super(symbols);
			this.nameProvider = nameProvider;
			this.typeParamPrinter = new TypeParamPrinter(symbols, nameProvider, imports);
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

		public printReference(type: ReferenceType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.asTypeName(type);
			}
			return super.printReference(type, usage);
		}

		public printBase(type: BaseType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.asTypeName(type);
			}
			return super.printBase(type, usage);
		}

		public printList(type: ListType, usage: TypeUsage): string {
			const base = type.kind.list;
			if (TypeReference.isString(base)) {
				switch (base) {
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
						const typeParam = this.typeParamPrinter.perform(type);
						return `new ${qualifier}.ListType<${typeParam}>(${this.printTypeReference(type.kind.list, usage)})`;
				}
			} else {
				const typeParam = this.typeParamPrinter.perform(type);
				return `new ${qualifier}.ListType<${typeParam}>(${this.printTypeReference(type.kind.list, usage)})`;
			}
		}

		public printOption(type: OptionType, usage: TypeUsage): string {
			const typeParam = this.typeParamPrinter.perform(type);
			return `new ${qualifier}.OptionType<${typeParam}>(${this.printTypeReference(type.kind.option, usage)})`;
		}

		public printTuple(type: TupleType, usage: TypeUsage): string {
			const typeParam = this.typeParamPrinter.perform(type);
			return `new ${qualifier}.TupleType<${typeParam}>([${type.kind.tuple.types.map(t => this.printTypeReference(t, usage)).join(', ')}])`;
		}

		public printResult(type: ResultType, usage: TypeUsage): string {
			let ok: string = 'undefined';
			const result = type.kind.result;
			if (result.ok !== null) {
				ok = this.printTypeReference(result.ok, usage);
			}
			let error: string = 'undefined';
			if (result.err !== null) {
				error = this.printTypeReference(result.err, usage);
			}
			return `new ${qualifier}.ResultType<${this.typeParamPrinter.perform(type)}>(${ok}, ${error})`;
		}

		public printRecord(type: RecordType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printEnum(type: EnumType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printFlags(type: FlagsType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printVariant(type: VariantType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
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

	class TypeParamPrinter extends AbstractTypePrinter<number> {

		private readonly imports: Imports;
		private typeScriptPrinter: TypeScript.TypePrinter;

		constructor(symbols: SymbolTable, nameProvider: NameProvider, imports: Imports) {
			super(symbols);
			this.imports = imports;
			this.typeScriptPrinter = new TypeScript.TypePrinter(symbols, nameProvider, imports);
		}

		public perform(type: Type): string {
			return this.print(type, 0);
		}

		public printReference(type: ReferenceType, depth: number): string {
			if (type.name !== null) {
				return this.symbols.types.getFullyQualifiedName(type);
			}
			return super.printReference(type, depth);
		}

		public printBase(type: BaseType, _depth: number): string {
			if (type.name !== null) {
				return this.symbols.types.getFullyQualifiedName(type);
			}
			return this.typeScriptPrinter.printBase(type, TypeUsage.property);
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

		public printRecord(type: RecordType, _depth: number): string {
			return this.symbols.types.getFullyQualifiedName(type);
		}

		public printEnum(type: EnumType, _depth: number): string {
			return this.symbols.types.getFullyQualifiedName(type);
		}

		public printFlags(type: FlagsType, _depth: number): string {
			return this.symbols.types.getFullyQualifiedName(type);
		}

		public printVariant(type: VariantType, _depth: number): string {
			return this.symbols.types.getFullyQualifiedName(type);
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
		private readonly mainCode: Code;
		private readonly symbols: SymbolTable;
		private readonly nameProvider: NameProvider;
		private readonly metaModelEmitters: Map<string, MetaModel.Emitter[]>;

		private static MAX_FLAT_PARAMS = 16;
		private static MAX_FLAT_RESULTS = 1;

		constructor(pkg: Package, mainCode: Code, symbols: SymbolTable, nameProvider: NameProvider) {
			this.pkg = pkg;
			this.mainCode = mainCode;
			this.symbols = symbols;
			this.nameProvider = nameProvider;
			this.metaModelEmitters = new Map();
		}

		public emit(): Code {
			const code = new Code();
			const printers: Printers = {
				typeScript: new TypeScript.TypePrinter(this.symbols, this.nameProvider, code.imports),
				metaModel: new MetaModel.TypePrinter(this.symbols, this.nameProvider, code.imports)
			};

			const pkgName = this.nameProvider.asPackageName(this.pkg);
			code.push(`export namespace ${pkgName} {`);
			code.increaseIndent();

			const interfaces: Map<string, Interface> = new Map();
			for (const ref of Object.values(this.pkg.interfaces)) {
				const iface = this.symbols.getInterface(ref);
				interfaces.set(this.nameProvider.asNamespaceName(iface), iface);
				this.processInterface(iface, pkgName, code, printers);
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
					const ifaceName = this.symbols.interfaces.getFullyQualifiedName(iface);
					code.push(`export type WasmInterface = {`);
					code.increaseIndent();
					const typeFlattener = new TypeFlattener(this.symbols, this.nameProvider, code.imports);
					let variantParam: boolean = false;
					for (const func of Object.values(iface.functions)) {
						let params;
						try {
							params = typeFlattener.flattenParams(func);
						} catch (err) {
							if (err instanceof VariantError) {
								code.imports.addBaseType('i32');
								code.imports.addBaseType('i64');
								code.imports.addBaseType('f32');
								code.imports.addBaseType('f64');
								params = [{ name: '...args', type: '(i32 | i64 | f32 | f64)[]'}];
								variantParam = true;
							} else {
								throw err;
							}
						}
						let returnType: string;
						try {
							const results = typeFlattener.flattenResult(func);
							if (results.length === PackageEmitter.MAX_FLAT_RESULTS) {
								returnType = results[0];
							} else {
								returnType = 'void';
								code.imports.addBaseType('ptr');
								params.push({ name: 'result', type: `ptr<[${results.join(', ')}]>`});
							}
						} catch (err) {
							if (err instanceof VariantError) {
								returnType = 'void';
								code.imports.addBaseType('i32');
								code.imports.addBaseType('i64');
								code.imports.addBaseType('f32');
								code.imports.addBaseType('f64');
								code.imports.addBaseType('ptr');
								params = [{ name: 'result', type: 'ptr<(i32 | i64 | f32 | f64)[]>'}];
							} else {
								throw err;
							}
						}
						if (params.length <= PackageEmitter.MAX_FLAT_PARAMS) {
							code.push(`'${func.name}': (${params.map(p => `${p.name}: ${p.type}`).join(', ')}) => ${returnType};`);
						} else {
							code.imports.addBaseType('ptr');
							if (variantParam) {
								code.push(`'${func.name}': (args: ptr<(i32 | i64 | f32 | f64)[]>) => ${returnType};`);
							} else {
								code.push(`'${func.name}': (args: ptr<[${params.map(p => p.type).join(', ')}]>) => ${returnType};`);
							}
						}
					}
					code.decreaseIndent();
					code.push(`};`);
					code.push(`export function createHost<T extends $wcm.Host>(service: ${ifaceName}, context: $wcm.Context): T {`);
					code.increaseIndent();
					code.push(`return $wcm.Host.create<T>(allFunctions, service, context);`);
					code.decreaseIndent();
					code.push(`}`);
					code.push(`export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): ${ifaceName} {`);
					code.increaseIndent();
					code.push(`return $wcm.Service.create<${ifaceName}>(allFunctions, wasmInterface, context);`);
					code.decreaseIndent();
					code.push(`}`);


					code.decreaseIndent();
					code.push('}');
				}
				code.decreaseIndent();
				code.push(`}`);
			}

			this.mainCode.push(`export { ${pkgName} } from './${this.nameProvider.asImportName(this.pkg)}';`);
			return code;
		}

		private processInterface(iface: Interface, qualifier: string, code: Code, printers: Printers): void {
			const name = this.nameProvider.asNamespaceName(iface);
			const metaModelEmitters: MetaModel.Emitter[] = [];
			this.metaModelEmitters.set(name, metaModelEmitters);

			emitDocumentation(iface, code);
			code.push(`export namespace ${name} {`);
			code.increaseIndent();
			for (const t of Object.values(iface.types)) {
				code.push('');
				const type = this.symbols.getType(t);
				const typeEmitter = new TypeEmitter(type, iface, `${qualifier}.${name}`, code, this.symbols, printers, this.nameProvider);
				typeEmitter.emit();
				if (typeEmitter.metaModelEmitter !== undefined) {
					metaModelEmitters.push(typeEmitter.metaModelEmitter);
				}
			}
			const funcExports: string[] = [];
			for (const func of Object.values(iface.functions)) {
				code.push('');
				const funcEmitter = new FunctionEmitter(func, iface, `${qualifier}.${name}`, code, this.symbols, printers, this.nameProvider);
				funcEmitter.emit();
				if (funcEmitter.metaModelEmitter !== undefined) {
					metaModelEmitters.push(funcEmitter.metaModelEmitter);
				}
				funcExports.push(this.nameProvider.asFunctionName(func));
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
		private readonly printers: Printers;
		private readonly nameProvider: NameProvider;
		public metaModelEmitter: MetaModel.Emitter | undefined;

		constructor(type: Type, scope: Interface, qualifier: string, code: Code, symbols: SymbolTable, printers: Printers, nameProvider: NameProvider) {
			this.type = type;
			this.scope = scope;
			this.qualifier = qualifier;
			this.code = code;
			this.symbols = symbols;
			this.printers = printers;
			this.nameProvider = nameProvider;
		}

		public emit(): void {
			if (this.type.name === null) {
				throw new Error(`Type ${this.type.kind} has no name.`);
			}
			emitDocumentation(this.type, this.code);
			if (Type.isRecordType(this.type)) {
				this.emitRecord(this.type);
			} else if (Type.isVariantType(this.type)) {
				this.emitVariant(this.type);
			} else if (Type.isEnumType(this.type)) {
				this.emitEnum(this.type);
			} else if (Type.isFlagsType(this.type)) {
				this.emitFlags(this.type);
			} else if (TypeKind.isTypeReference(this.type.kind)) {
				const referenced = this.symbols.getType(this.type.kind.type);
				if (referenced.name !== null) {
					const referencedName = this.nameProvider.asTypeName(referenced);
					const qualifier = referenced.owner !== null ? this.computeQualifier(this.symbols.resolveOwner(referenced.owner)) : undefined;
					const typeName = qualifier !== undefined ? `${qualifier}.${referencedName}` : referencedName;
					const tsName = this.nameProvider.asTypeName(this.type);
					this.code.push(`export type ${tsName} = ${typeName};`);
					this.metaModelEmitter = new MetaModel.TypeNameEmitter(tsName, qualifier !== undefined ? `${qualifier}.$.${referencedName}` : referencedName);
				} else {
					throw new Error(`Cannot reference type ${JSON.stringify(referenced)} from ${JSON.stringify(this.scope)}`);
				}
			} else {
				const name = this.nameProvider.asTypeName(this.type);
				this.code.push(`export type ${name} = ${this.printers.typeScript.print(this.type, TypeUsage.typeDeclaration)};`);
				this.metaModelEmitter = new MetaModel.TypeNameEmitter(name, this.printers.metaModel.print(this.type, TypeUsage.typeDeclaration));
			}
		}

		private emitRecord(type: RecordType): void {
			const kind = type.kind;
			const tsName = this.nameProvider.asTypeName(type);
			this.code.push(`export interface ${tsName} extends $wcm.JRecord {`);
			this.code.increaseIndent();
			const metaFields: string[][] = [];
			for (const field of kind.record.fields) {
				emitDocumentation(field, this.code, true);
				const isOptional = TypeReference.isString(field.type)
					? false
					: Type.isOptionType(this.symbols.getType(field.type));
				const fieldName = this.nameProvider.asFieldName(field);
				this.code.push(`${fieldName}${isOptional ? '?' : ''}: ${this.printers.typeScript.printTypeReference(field.type, TypeUsage.property)};`);
				metaFields.push([fieldName, this.printers.metaModel.printTypeReference(field.type, TypeUsage.property)]);
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
			this.metaModelEmitter= new MetaModel.RecordEmitter(tsName, `${this.qualifier}.${tsName}`, metaFields);
		}

		private emitVariant(type: VariantType): void {
			const code = this.code;
			const kind = type.kind;
			const variantName = this.nameProvider.asTypeName(type);

			this.code.push(`export namespace ${variantName} {`);
			this.code.increaseIndent();
			const names: string[] = [];
			const types: (string | undefined)[] = [];
			const metaTypes: (string | undefined)[] = [];
			for (const item of kind.variant.cases) {
				names.push(this.nameProvider.asVariantCaseName(item));
				if (item.type !== null) {
					types.push(this.printers.typeScript.printTypeReference(item.type, TypeUsage.property));
					metaTypes.push(this.printers.metaModel.printTypeReference(item.type, TypeUsage.property));
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

		private emitEnum(type: EnumType): void {
			const kind = type.kind;
			const tsName = this.nameProvider.asTypeName(type);
			this.code.push(`export enum ${tsName} {`);
			this.code.increaseIndent();
			for (let i = 0; i < kind.enum.cases.length; i++) {
				const item = kind.enum.cases[i];
				this.code.push(`${this.nameProvider.asEnumCaseName(item)} = ${i},`);
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
			this.metaModelEmitter = new MetaModel.EnumerationEmitter(tsName, `${this.qualifier}.${tsName}`, kind.enum.cases.length);
		}

		private emitFlags(type: FlagsType): void {
			const kind = type.kind;
			const tsName = this.nameProvider.asTypeName(type);
			const flags: string[] = [];
			this.code.push(`export interface ${tsName} extends $wcm.JFlags {`);
			this.code.increaseIndent();
			for (const flag of kind.flags.flags) {
				const flagName = this.nameProvider.asFlagName(flag);
				this.code.push(`${flagName}: boolean;`);
				flags.push(flagName);
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
			this.metaModelEmitter = new MetaModel.FlagsEmitter(tsName, `${this.qualifier}.${tsName}`, flags);
		}

		private computeQualifier(reference: Interface | World): string | undefined {
			const scope = this.scope;
			if (scope === reference) {
				return undefined;
			}
			if (Interface.is(scope) && Interface.is(reference)) {
				if (scope.package === reference.package) {
					const referencedPackage = this.symbols.getPackage(reference.package);
					const [, referencePackagedName] = this.nameProvider.getNamespaceAndName(referencedPackage);
					return `${referencePackagedName}.${this.nameProvider.asNamespaceName(reference)}`;
				} else {
					const typePackage = this.symbols.getPackage(scope.package);
					const referencedPackage = this.symbols.getPackage(reference.package);
					const [typeNamespaceName, ] = this.nameProvider.getNamespaceAndName(typePackage);
					const [referencedNamespaceName, referencePackagedName] = this.nameProvider.getNamespaceAndName(referencedPackage);
					if (typeNamespaceName === referencedNamespaceName) {
						const referencedTypeName = this.nameProvider.asNamespaceName(reference);
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
		private readonly qualifier: string;
		private readonly code: Code;
		private readonly printers: Printers;
		private readonly nameProvider: NameProvider;
		public metaModelEmitter: MetaModel.Emitter | undefined;

		constructor(func: Func, _scope: Interface, qualifier: string, code: Code, _symbols: SymbolTable, printers: Printers, nameProvider: NameProvider) {
			this.func = func;
			this.qualifier = qualifier;
			this.code = code;
			this.printers = printers;
			this.nameProvider = nameProvider;
		}

		public emit(): void {
			emitDocumentation(this.func, this.code);
			const funcName = this.nameProvider.asFunctionName(this.func);
			const elements: string[] = [];
			const metaData: string[][] = [];
			for (const param of this.func.params) {
				const paramName = this.nameProvider.asParameterName(param);
				elements.push(`${paramName}: ${this.printers.typeScript.printTypeReference(param.type, TypeUsage.parameter)}`);
				metaData.push([paramName, this.printers.metaModel.printTypeReference(param.type, TypeUsage.parameter)]);
			}
			let returnType: string = 'void';
			let metaReturnType: string | undefined = undefined;
			if (this.func.results.length === 1) {
				returnType = this.printers.typeScript.printTypeReference(this.func.results[0].type, TypeUsage.function);
				metaReturnType = this.printers.metaModel.printTypeReference(this.func.results[0].type, TypeUsage.function);
			} else if (this.func.results.length > 1) {
				returnType = `[${this.func.results.map(r => this.printers.typeScript.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
				metaReturnType = `[${this.func.results.map(r => this.printers.metaModel.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
			}
			this.code.push(`export declare function ${funcName}(${elements.join(', ')}): ${returnType};`);
			this.metaModelEmitter = new MetaModel.FunctionEmitter(`typeof ${this.qualifier}.${funcName}`, funcName, this.func.name, metaData, metaReturnType);
			// this.code.push(`export type ${name} = typeof ${name};`);
		}
	}

	export class TypePrinter extends AbstractTypePrinter<TypeUsage> {

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

		public printReference(type: ReferenceType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.asTypeName(type);
			}
			return super.printReference(type, usage);
		}

		public printBase(type: BaseType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.asTypeName(type);
			}
			return super.printBase(type, usage);
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

		public printRecord(type: RecordType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printEnum(type: EnumType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printFlags(type: FlagsType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printVariant(type: VariantType, _context: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
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


	type WasmTypeName = 'i32' | 'i64' | 'f32' | 'f64';

	interface FlattendParam {
		name: string;
		type: WasmTypeName;
	}

	class VariantError extends Error {
		constructor () {
			super('Variant detected');
		}
	}

	class TypeFlattener  {

		private readonly symbols: SymbolTable;
		private readonly nameProvider: NameProvider;
		private readonly imports: Imports;

		private static readonly baseTypes: Map<string, WasmTypeName> = new Map([
			['u8', 'i32'],
			['u16', 'i32'],
			['u32', 'i32'],
			['u64', 'i64'],
			['s8', 'i32'],
			['s16', 'i32'],
			['s32', 'i32'],
			['s64', 'i64'],
			['f32', 'f32'],
			['f64', 'f64'],
			['bool', 'i32'],
		]);

		constructor (symbols: SymbolTable, nameProvider: NameProvider, imports: Imports) {
			this.symbols = symbols;
			this.nameProvider = nameProvider;
			this.imports = imports;
		}

		public flattenParams(func: Func): FlattendParam[] {
			const result: FlattendParam[] = [];
			for (const param of func.params) {
				this.flattenParam(result, param);
			}
			return result;
		}

		public flattenResult(func: Func): string[] {
			const result: string[] = [];
			if (func.results.length === 0) {
				result.push('void');
			} else {
				for (const r of func.results) {
					this.flattenResultType(result, r.type);
				}
			}
			return result;
		}

		private flattenParam(result: FlattendParam[], param: Param): void {
			this.flattenParamType(result, param.type, this.nameProvider.asParameterName(param));
		}

		private flattenParamType(result: FlattendParam[], type: Type | TypeReference, prefix: string): void {
			if (TypeReference.is(type)) {
				if (TypeReference.isString(type)) {
					this.handleParamBaseType(result, type, prefix);
				} else if (TypeReference.isNumber(type)) {
					const ref = this.symbols.getType(type);
					this.flattenParamType(result, ref, prefix);
				}
			} else if (Type.isBaseType(type)) {
				this.handleParamBaseType(result, type.kind.type, prefix);
			} else if (Type.isReferenceType(type)) {
				const ref = this.symbols.getType(type.kind.type);
				this.flattenParamType(result, ref, this.prefix(type, prefix));
			} else if (Type.isListType(type)) {
				result.push({ name: `${prefix}_ptr`, type: 'i32' });
				result.push({ name: `${prefix}_len`, type: 'i32' });
			} else if (Type.isTupleType(type)) {
				for (let i = 0; i < type.kind.tuple.types.length; i++) {
					this.flattenParamType(result, type.kind.tuple.types[i], `${prefix}_${i}`);
				}
			} else if (Type.isOptionType(type)) {
				throw new VariantError();
			} else if (Type.isResultType(type)) {
				throw new VariantError();
			} else if (Type.isVariantType(type)) {
				throw new VariantError();
			} else if (Type.isEnumType(type)) {
				this.imports.addBaseType('i32');
				result.push({ name: `${prefix}_${this.nameProvider.typeAsParameterName(type)}`, type: 'i32' });
			} else if (Type.isFlagsType(type)) {
				const flatTypes = TypeFlattener.flagsFlatTypes(type.kind.flags.flags.length);
				if (flatTypes.length > 0) {
					this.imports.addBaseType(flatTypes[0]);
				}
				for (let i = 0; i < flatTypes.length; i++) {
					result.push({ name: `${prefix}_${i}`, type: flatTypes[i] });
				}
			} else if (Type.isRecordType(type)) {
				for (const field of type.kind.record.fields) {
					this.flattenParamType(result, field.type, `${prefix}_${this.nameProvider.asFieldName(field)}`);
				}
			}
		}

		private handleParamBaseType(result: FlattendParam[], type: string, prefix: string): void {
			if (type === 'string') {
				result.push({ name: `${prefix}_ptr`, type: 'i32' });
				result.push({ name: `${prefix}_len`, type: 'i32' });
				this.imports.addBaseType('i32');
			} else {
				const t = TypeFlattener.baseTypes.get(type);
				if (t === undefined) {
					throw new Error(`Unknown base type ${type}`);
				}
				this.imports.addBaseType(t);
				result.push({ name: prefix, type: t });
			}
		}

		private flattenResultType(result: string[], type: Type | TypeReference): void {
			if (TypeReference.is(type)) {
				if (TypeReference.isString(type)) {
					this.handleResultBaseType(result, type);
				} else if (TypeReference.isNumber(type)) {
					const ref = this.symbols.getType(type);
					this.flattenResultType(result, ref);
				}
			} else if (Type.isBaseType(type)) {
				this.handleResultBaseType(result, type.kind.type);
			} else if (Type.isReferenceType(type)) {
				const ref = this.symbols.getType(type.kind.type);
				this.flattenResultType(result, ref);
			} else if (Type.isListType(type)) {
				this.imports.addBaseType('ptr');
				this.imports.addBaseType('i32');
				result.push('ptr<i32>', 'i32');
			} else if (Type.isTupleType(type)) {
				for (let i = 0; i < type.kind.tuple.types.length; i++) {
					this.flattenResultType(result, type.kind.tuple.types[i]);
				}
			} else if (Type.isOptionType(type)) {
				throw new VariantError();
			} else if (Type.isResultType(type)) {
				throw new VariantError();
			} else if (Type.isVariantType(type)) {
				throw new VariantError();
			} else if (Type.isEnumType(type)) {
				this.imports.addBaseType('i32');
				result.push('i32');
			} else if (Type.isFlagsType(type)) {
				const flatTypes = TypeFlattener.flagsFlatTypes(type.kind.flags.flags.length);
				if (flatTypes.length > 0) {
					this.imports.addBaseType(flatTypes[0]);
				}
				result.push(...flatTypes);
			} else if (Type.isRecordType(type)) {
				for (const field of type.kind.record.fields) {
					this.flattenResultType(result, field.type);
				}
			}
		}

		private handleResultBaseType(result: string[], type: string): void {
			if (type === 'string') {
				this.imports.addBaseType('ptr');
				this.imports.addBaseType('i32');
				result.push('ptr<i32>', 'i32');
			} else {
				const t = TypeFlattener.baseTypes.get(type);
				if (t === undefined) {
					throw new Error(`Unknown base type ${type}`);
				}
				this.imports.addBaseType(t);
				result.push(t);
			}
		}

		private prefix(type: Type, prefix: string): string {
			if (type.name !== null) {
				return `${prefix}_${this.nameProvider.typeAsParameterName(type)}`;
			} else {
				return prefix;
			}
		}

		private static flagsFlatTypes(fields: number): 'i32'[] {
			return new Array(this.num32Flags(fields)).fill('i32');
		}

		private static num32Flags(fields: number): number {
			return Math.ceil(fields / 32);
		}
	}
}