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
	EnumType, FlagsType, Field, Callable, ResourceType, BorrowHandleType, OwnHandleType, Method, AbstractType, Constructor, StaticMethod
} from './wit-json';

export function processDocument(document: Document, options: ResolvedOptions): void {
	const regExp = new RegExp(options.package);
	const mainCode = new Code();

	const nameProvider = options.nameStyle === 'wit' ? WitNameProvider : TypeScriptNameProvider;
	for (const pkg of document.packages) {
		if (!regExp.test(pkg.name)) {
			continue;
		}

		const code = new Code();
		const symbols = new SymbolTable(document, nameProvider);
		const printers: Printers = {
			typeScript: new TypeScript.TypePrinter(symbols, nameProvider, code.imports),
			metaModel: new MetaModel.TypePrinter(symbols, nameProvider, code.imports)
		};
		const typeFlattener = new TypeFlattener(symbols, nameProvider, code.imports);
		const config: EmitterConfig = { symbols, printers, nameProvider, typeFlattener, options};

		const pkgEmitter = new PackageEmitter(pkg, config);
		pkgEmitter.build();
		pkgEmitter.emit(code);
		const pkgName = nameProvider.asPackageName(pkg);
		mainCode.push(`export { ${pkgName} } from './${nameProvider.asImportName(pkg)}';`);
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

	public readonly starImports = new Map<string, string>();
	private readonly baseTypes: Map<string, number> = new Map();
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
		const value = this.baseTypes.get(name);
		if (value === undefined) {
			this.baseTypes.set(name, 1);
		} else {
			this.baseTypes.set(name, value + 1);
		}
	}

	public removeBaseType(name: string): void {
		let value = this.baseTypes.get(name);
		if (value === undefined) {
			return;
		}
		value -= 1;
		if (value === 0) {
			this.baseTypes.delete(name);
		} else {
			this.baseTypes.set(name, value);
		}
	}

	public getBaseTypes(): readonly string[] {
		return Array.from(this.baseTypes.keys());
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

	constructor(code?: Code) {
		this.imports = code !== undefined ? code.imports : new Imports();
		this.source = [];
		this.indent = code !== undefined ? code.indent : 0;
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
		const baseTypes = this.imports.getBaseTypes();
		if (baseTypes.length > 0) {
			this.source.unshift(`import type { ${baseTypes.join(', ')} } from '@vscode/wasm-component-model';`);
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

	public append(code: Code): void {
		this.source.push(...code.source);
	}
}

interface NameProvider {
	asFileName(pkg: Package): string;
	asImportName(pkg: Package): string;
	asPackageName(pkg: Package): string;
	asNamespaceName(iface: Interface): string;
	asTypeName(type: Type | VariantCase): string;
	asFunctionName(func: Func): string;
	asMethodName(method: Method): string;
	asStaticMethodName(method: StaticMethod): string;
	asConstructorName(method: Constructor): string;
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
			return _asPropertyName(pkg.name);
		}
		return _asPropertyName(pkg.name.substring(index + 1));
	}

	export function asNamespaceName(iface: Interface): string {
		return _asTypeName(iface.name);
	}

	export function asTypeName(type: Type | VariantCase): string {
		if (type.name === null) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		return _asTypeName(type.name);
	}

	export function asFunctionName(func: Func): string {
		return _asPropertyName(func.name);
	}

	export function asMethodName(method: Method): string {
		return _asMethodName(method.name);
	}

	export function asStaticMethodName(method: StaticMethod): string {
		return _asMethodName(method.name);
	}

	export function asConstructorName(method: Constructor): string {
		return _asMethodName(method.name);
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

	function _asMethodName(name: string): string {
		if (name.startsWith('[constructor]')) {
			return 'constructor';
		}
		const index = name.indexOf('.');
		if (index === -1) {
			return _asPropertyName(name);
		} else {
			return _asPropertyName(name.substring(index + 1));
		}
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
		return toTs(pkg.name.substring(index + 1));
	}

	export function asNamespaceName(iface: Interface): string {
		return toTs(iface.name);
	}

	export function asTypeName(type: Type | VariantCase): string {
		if (type.name === null) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		return toTs(type.name);
	}

	export function asFunctionName(func: Func): string {
		return toTs(func.name);
	}

	export function asMethodName(method: Method): string {
		return _asMethodName(method.name);
	}

	export function asStaticMethodName(method: StaticMethod): string {
		return _asMethodName(method.name);
	}

	export function asConstructorName(method: Constructor): string {
		return _asMethodName(method.name);
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

	function _asMethodName(name: string): string {
		const index = name.indexOf('.');
		if (index === -1) {
			return toTs(name);
		} else {
			return toTs(name.substring(index + 1));
		}
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
	private readonly methods: Map<AbstractType, (Method | StaticMethod | Constructor)[]>;

	public readonly	interfaces: Interfaces;
	public readonly types: Types;


	constructor(document: Document, nameProvider: NameProvider) {
		this.document = document;
		this.methods = new Map();
		this.interfaces = new Interfaces(this, nameProvider);
		this.types = new Types(this, nameProvider);
		for (const iface of document.interfaces) {
			for (const callable of Object.values(iface.functions)) {
				if (Callable.isMethod(callable) || Callable.isStaticMethod(callable) || Callable.isConstructor(callable)) {
					const type = this.getType(Callable.containingType(callable));
					let values = this.methods.get(type);
					if (values === undefined) {
						values = [];
						this.methods.set(type, values);
					}
					values.push(callable);
				}
			}
		}
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

	public getMethods(type: ResourceType): (Method | Constructor | StaticMethod)[] | undefined {
		return this.methods.get(type);
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
		} else if (Type.isResourceType(type)) {
			return this.printResource(type, context);
		} else if (Type.isBorrowHandleType(type)) {
			return this.printBorrowHandle(type, context);
		} else if (Type.isOwnHandleType(type)) {
			return this.printOwnHandle(type, context);
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
	public abstract printResource(type: ResourceType, context: C): string;
	public abstract printBorrowHandle(type: BorrowHandleType, context: C): string;
	public abstract printOwnHandle(type: OwnHandleType, context: C): string;

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

enum TypeUsage {
	parameter = 'parameter',
	function = 'function',
	property = 'property',
	typeDeclaration = 'typeDeclaration'
}

namespace MetaModel {


	export const qualifier = '$wcm';
	export function qualify(name: string): string {
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

		public printBorrowHandle(type: BorrowHandleType, usage: TypeUsage): string {
			const typeParam = this.typeParamPrinter.perform(type);
			return `new ${qualifier}.BorrowType<${typeParam}>(${this.printTypeReference(type.kind.handle.borrow, usage)})`;
		}

		public printOwnHandle(type: OwnHandleType, usage: TypeUsage): string {
			const typeParam = this.typeParamPrinter.perform(type);
			return `new ${qualifier}.OwnType<${typeParam}>(${this.printTypeReference(type.kind.handle.own, usage)})`;
		}

		public printRecord(type: RecordType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printEnum(type: EnumType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printFlags(type: FlagsType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printVariant(type: VariantType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printResource(type: ResourceType, _usage: TypeUsage): string {
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
				case 'float32':
					return qualify('float32');
				case 'float64':
					return qualify('float64');
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
			const result = this.printTypeReference(type.kind.option, depth + 1);
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

		public printBorrowHandle(type: BorrowHandleType, depth: number): string {
			const borrowed = this.printTypeReference(type.kind.handle.borrow, depth + 1);
			this.imports.addBaseType('borrow');
			return depth === 0 ? borrowed : `borrow<${borrowed}>`;
		}

		public printOwnHandle(type: OwnHandleType, depth: number): string {
			const owned = this.printTypeReference(type.kind.handle.own, depth + 1);
			this.imports.addBaseType('own');
			return depth === 0 ? owned : `own<${owned}>`;
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

		public printResource(type: ResourceType, _depth: number): string {
			return this.symbols.types.getFullyQualifiedName(type);
		}
	}
}

namespace TypeScript {

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

		public printBorrowHandle(type: BorrowHandleType, usage: TypeUsage): string {
			const borrowed = this.printTypeReference(type.kind.handle.borrow, usage);
			this.imports.addBaseType('borrow');
			return `borrow<${borrowed}>`;
		}

		public printOwnHandle(type: OwnHandleType, usage: TypeUsage): string {
			const owned = this.printTypeReference(type.kind.handle.own, usage);
			this.imports.addBaseType('own');
			return `own<${owned}>`;
		}

		public printRecord(type: RecordType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printEnum(type: EnumType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printFlags(type: FlagsType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printVariant(type: VariantType, _usage: TypeUsage): string {
			return this.nameProvider.asTypeName(type);
		}

		public printResource(type: ResourceType, _usage: TypeUsage): string {
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
				case 'float32':
					this.imports.addBaseType('float32');
					return 'float32';
				case 'float64':
					this.imports.addBaseType('float64');
					return 'float64';
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

type WasmTypeName = 'i32' | 'i64' | 'f32' | 'f64';

interface FlattenedParam {
	name: string;
	type: string;
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
		['float32', 'f32'],
		['float64', 'f64'],
		['bool', 'i32'],
	]);

	constructor (symbols: SymbolTable, nameProvider: NameProvider, imports: Imports) {
		this.symbols = symbols;
		this.nameProvider = nameProvider;
		this.imports = imports;
	}

	public flattenParams(callable: Callable): FlattenedParam[] {
		const result: FlattenedParam[] = [];
		for (const param of callable.params) {
			this.flattenParam(result, param);
		}
		return result;
	}

	public flattenResult(callable: Callable): string[] {
		const result: string[] = [];
		if (callable.results.length === 0) {
			result.push('void');
		} else {
			for (const r of callable.results) {
				this.flattenResultType(result, r.type);
			}
		}
		return result;
	}

	private flattenParam(result: FlattenedParam[], param: Param): void {
		this.flattenParamType(result, param.type, this.nameProvider.asParameterName(param));
	}

	private flattenParamType(result: FlattenedParam[], type: Type | TypeReference, prefix: string): void {
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
			this.imports.addBaseType('i32');
			result.push({ name: `${prefix}_case`, type: 'i32' });
			this.flattenParamType(result, type.kind.option, `${prefix}_option`);
		} else if (Type.isResultType(type)) {
			const cases: (TypeReference | undefined)[] = [];
			cases.push(type.kind.result.ok === null ? undefined : type.kind.result.ok);
			cases.push(type.kind.result.err === null ? undefined : type.kind.result.err);
			this.flattenParamVariantType(result, cases, prefix);
		} else if (Type.isVariantType(type)) {
			const cases: (TypeReference | undefined)[] = [];
			for (const c of type.kind.variant.cases) {
				cases.push(c.type === null ? undefined : c.type);
			}
			this.flattenParamVariantType(result, cases, prefix);
		} else if (Type.isEnumType(type)) {
			this.imports.addBaseType('i32');
			result.push({ name: `${prefix}_${this.nameProvider.typeAsParameterName(type)}`, type: 'i32' });
		} else if (Type.isFlagsType(type)) {
			const flatTypes = TypeFlattener.flagsFlatTypes(type.kind.flags.flags.length);
			if (flatTypes.length > 0) {
				this.imports.addBaseType(flatTypes[0]);
			}
			if (flatTypes.length === 1) {
				result.push({ name: `${prefix}`, type: flatTypes[0] });
			} else {
				for (let i = 0; i < flatTypes.length; i++) {
					result.push({ name: `${prefix}_${i}`, type: flatTypes[i] });
				}
			}
		} else if (Type.isRecordType(type)) {
			for (const field of type.kind.record.fields) {
				this.flattenParamType(result, field.type, `${prefix}_${this.nameProvider.asFieldName(field)}`);
			}
		} else if (Type.isResourceType(type)) {
			this.imports.addBaseType('i32');
			result.push({ name: `${prefix}`, type: 'i32' });
		} else if (Type.isBorrowHandleType(type)) {
			this.imports.addBaseType('i32');
			result.push({ name: `${prefix}`, type: 'i32' });
		} else if (Type.isOwnHandleType(type)) {
			this.imports.addBaseType('i32');
			result.push({ name: `${prefix}`, type: 'i32' });
		} else {
			throw new Error(`Unexpected type ${JSON.stringify(type)}.`);
		}
	}

	private flattenParamVariantType(result: FlattenedParam[], cases: (TypeReference | undefined)[], prefix: string): void {
		this.imports.addBaseType('i32');
		result.push({ name: `${prefix}_case`, type: 'i32' });
		const variantResult: FlattenedParam[] = [];
		for (const c of cases) {
			if (c === undefined) {
				continue;
			}
			const caseFlatTypes: FlattenedParam[] = [];
			this.flattenParamType(caseFlatTypes, c, '');
			for (let i = 0; i < caseFlatTypes.length; i++) {
				const want = caseFlatTypes[i];
				if (i < variantResult.length) {
					const currentWasmType = this.assertWasmTypeName(variantResult[i].type);
					const wantWasmType = this.assertWasmTypeName(want.type);
					const use = TypeFlattener.joinFlatType(currentWasmType, wantWasmType);
					this.imports.addBaseType(use);
					this.imports.removeBaseType(currentWasmType);
					this.imports.removeBaseType(wantWasmType);
					variantResult[i].type = use;
				} else {
					this.imports.addBaseType(want.type);
					variantResult.push({ name: `${prefix}_${i}`, type: want.type});
				}
			}
		}
		result.push(...variantResult);
	}

	private handleParamBaseType(result: FlattenedParam[], type: string, prefix: string): void {
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
			this.imports.addBaseType('i32');
			result.push('i32', 'i32');
		} else if (Type.isTupleType(type)) {
			for (let i = 0; i < type.kind.tuple.types.length; i++) {
				this.flattenResultType(result, type.kind.tuple.types[i]);
			}
		} else if (Type.isOptionType(type)) {
			this.imports.addBaseType('i32');
			result.push('i32' );
			this.flattenResultType(result, type.kind.option);
		} else if (Type.isResultType(type)) {
			const cases: (TypeReference | undefined)[] = [];
			cases.push(type.kind.result.ok === null ? undefined : type.kind.result.ok);
			cases.push(type.kind.result.err === null ? undefined : type.kind.result.err);
			this.flattenResultVariantType(result, cases);
		} else if (Type.isVariantType(type)) {
			const cases: (TypeReference | undefined)[] = [];
			for (const c of type.kind.variant.cases) {
				cases.push(c.type === null ? undefined : c.type);
			}
			this.flattenResultVariantType(result, cases);
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
		} else if (Type.isResourceType(type)) {
			this.imports.addBaseType('i32');
			result.push('i32');
		} else if (Type.isBorrowHandleType(type)) {
			this.imports.addBaseType('i32');
			result.push('i32');
		} else if (Type.isOwnHandleType(type)) {
			this.imports.addBaseType('i32');
			result.push('i32');
		}  else {
			throw new Error(`Unexpected type ${JSON.stringify(type)}.`);
		}
	}

	private flattenResultVariantType(result: string[], cases: (TypeReference | undefined)[]): void {
		this.imports.addBaseType('i32');
		result.push('i32');
		const variantResult: string[] = [];
		for (const c of cases) {
			if (c === undefined) {
				continue;
			}
			const caseFlatTypes: string[] = [];
			this.flattenResultType(caseFlatTypes, c);
			for (let i = 0; i < caseFlatTypes.length; i++) {
				const want = caseFlatTypes[i];
				if (i < variantResult.length) {
					const currentWasmType = this.assertWasmTypeName(variantResult[i]);
					const wantWasmType = this.assertWasmTypeName(want);
					const use = TypeFlattener.joinFlatType(currentWasmType, wantWasmType);
					this.imports.addBaseType(use);
					this.imports.removeBaseType(currentWasmType);
					this.imports.removeBaseType(wantWasmType);
					variantResult[i] = use;
				} else {
					this.imports.addBaseType(want);
					variantResult.push(want);
				}
			}
		}
		result.push(...variantResult);
	}

	private assertWasmTypeName(type: string): WasmTypeName {
		if (type === 'i32' || type === 'i64' || type === 'f32' || type === 'f64') {
			return type;
		}
		throw new Error(`Type ${type} is not a wasm type name.`);
	}

	private handleResultBaseType(result: string[], type: string): void {
		if (type === 'string') {
			this.imports.addBaseType('i32');
			result.push('i32', 'i32');
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

	private static joinFlatType(a: WasmTypeName, b: WasmTypeName) : WasmTypeName {
		if (a === b) {
			return a;
		}
		if ((a === 'i32' && b === 'f32') || (a === 'f32' && b === 'i32')) {
			return 'i32';
		}
		return 'i64';
	}
}

class TypeParamNameGenerator  {

	private readonly used: Set<string>;

	constructor() {
		this.used = new Set();
	}

	public generate(name: string): string {
		let candidate = this.makeTypeParamName(name);
		if (!this.used.has(candidate)) {
			this.used.add(candidate);
			return candidate;
		}
		let counter: number = 0;
		let next: string;
		do {
			counter++;
			next = `${candidate}${counter}`;
		} while (this.used.has(next));
		return next;
	}

	private makeTypeParamName(name: string): string {
		const result: string[] = [];
		for (const c of name) {
			if (c.toUpperCase() === c) {
				result.push(c);
			}
		}
		if (result.length === 0) {
			return name[0].toUpperCase();
		} else {
			return result.join('');
		}
	}

}

type EmitterConfig = {
	readonly symbols: SymbolTable;
	readonly printers: Printers;
	readonly nameProvider: NameProvider;
	readonly typeFlattener: TypeFlattener;
	readonly options: ResolvedOptions;
};

abstract class Emitter {

	protected readonly config: EmitterConfig;

	constructor(config: EmitterConfig) {
		this.config = config;
	}

	protected emitDocumentation(item: { docs?: Documentation }, code: Code, emitNewLine: boolean = false): void {
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

	public emitNamespace(_code: Code) : void {
	}

	public emitTypeDeclaration(_code: Code) : void {
	}

	public emitMetaModel(_code: Code) : void {
	}

	public emitWasmInterface(_code: Code) : void {
	}

	public emitHost(_code: Code) : void {
	}

	public emitService(_code: Code) : void {
	}
}

class PackageEmitter extends Emitter {

	private readonly pkg: Package;
	private ifaceEmitters: InterfaceEmitter[];

	constructor(pkg: Package, config: EmitterConfig) {
		super(config);
		this.pkg = pkg;
		this.ifaceEmitters = [];
	}

	public build(): void {
		const { symbols } = this.config;
		for (const ref of Object.values(this.pkg.interfaces)) {
			const iface = symbols.getInterface(ref);
			const emitter = new InterfaceEmitter(iface, this.pkg, this.config);
			emitter.build();
			this.ifaceEmitters.push(emitter);
		}
	}

	public emit(code: Code): void {
		this.emitTypes(code);
		this.emitMetaData(code);
	}

	public emitTypes(code: Code): void {
		const { nameProvider } = this.config;
		const pkgName = nameProvider.asPackageName(this.pkg);
		code.push(`export namespace ${pkgName} {`);
		code.increaseIndent();
		for (const ifaceEmitter of this.ifaceEmitters) {
			ifaceEmitter.emitNamespace(code);
			ifaceEmitter.emitTypeDeclaration(code);
			code.push('');
		}
		code.decreaseIndent();
		code.push(`}`);
	}

	public emitMetaData(code: Code): void {
		const { nameProvider } = this.config;
		const pkgName = nameProvider.asPackageName(this.pkg);
		code.push('');
		code.push(`export namespace ${pkgName} {`);
		code.increaseIndent();
		for (let i = 0; i < this.ifaceEmitters.length; i++) {
			const ifaceEmitter = this.ifaceEmitters[i];
			ifaceEmitter.emitMetaModel(code);
			ifaceEmitter.emitAPI(code);
			if (i < this.ifaceEmitters.length - 1) {
				code.push('');
			}
		}
		code.decreaseIndent();
		code.push(`}`);
	}
}

class InterfaceEmitter extends Emitter {

	private readonly iface: Interface;
	private readonly pkg: Package;
	private typeEmitters: TypeEmitter[];
	private functionEmitters: CallableEmitter<Func>[];
	private resourceEmitters: ResourceEmitter[];

	constructor(iface: Interface, pkg: Package, config: EmitterConfig) {
		super(config);
		this.iface = iface;
		this.pkg = pkg;
		this.typeEmitters = [];
		this.functionEmitters = [];
		this.resourceEmitters = [];
	}

	public build(): void {
		const typeParamNameGenerator = new TypeParamNameGenerator();
		const { symbols } = this.config;
		for (const t of Object.values(this.iface.types)) {
			const type = symbols.getType(t);
			if (Type.isRecordType(type)) {
				this.typeEmitters.push(new RecordEmitter(type, this.iface, this.config));
			} else if (Type.isVariantType(type)) {
				this.typeEmitters.push(new VariantEmitter(type, this.iface, this.config));
			} else if (Type.isEnumType(type)) {
				this.typeEmitters.push(new EnumEmitter(type, this.iface, this.config));
			} else if (Type.isFlagsType(type)) {
				this.typeEmitters.push(new FlagsEmitter(type, this.iface, this.config));
			} else if (TypeKind.isReference(type.kind)) {
				this.typeEmitters.push(new TypeReferenceEmitter(type, this.iface, this.config));
			} else if (Type.isResourceType(type)) {
				const emitter = new ResourceEmitter(type, this.iface, typeParamNameGenerator, this.config);
				emitter.build();
				this.resourceEmitters.push(emitter);
			} else {
				this.typeEmitters.push(new TypeDeclarationEmitter(type, this.iface, this.config));
			}
		}
		const Emitter = CallableEmitter(FunctionEmitter);
		for (const func of Object.values(this.iface.functions)) {
			if (!Callable.isFunction(func)) {
				continue;
			}
			this.functionEmitters.push(new Emitter(func, this.iface, this.config));
		}
	}

	public emitNamespace(code: Code): void {
		const { nameProvider } = this.config;
		const name = nameProvider.asNamespaceName(this.iface);
		this.emitDocumentation(this.iface, code);
		code.push(`export namespace ${name} {`);
		code.increaseIndent();
		code.push(`export const id = '${this.pkg.name}/${this.iface.name}' as const;`);
		for (const type of this.typeEmitters) {
			code.push('');
			type.emitNamespace(code);
		}
		for (const resource of this.resourceEmitters) {
			code.push('');
			resource.emitNamespace(code);
		}
		for (const func of this.functionEmitters) {
			code.push('');
			func.emitNamespace(code);
		}
		code.decreaseIndent();
		code.push(`}`);
	}

	public emitTypeDeclaration(code: Code): void {
		const { nameProvider } = this.config;
		const name = nameProvider.asNamespaceName(this.iface);
		const typeParams: string[] = [];
		for (const resource of this.resourceEmitters) {
			if (resource.needsTypeParameter()) {
				typeParams.push(resource.getTypeParameter(true));
			}
		}
		if (typeParams.length > 0) {
			code.push(`export type ${name}<${typeParams.join(', ')}> = {`);
		} else {
			code.push(`export type ${name} = {`);
		}
		code.increaseIndent();
		for (const resource of this.resourceEmitters) {
			resource.emitTypeDeclaration(code);
		}
		for (const func of this.functionEmitters) {
			func.emitTypeDeclaration(code);
		}
		code.decreaseIndent();
		code.push('};');
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider, symbols } = this.config;
		const name = nameProvider.asNamespaceName(this.iface);
		code.push(`export namespace ${name}.$ {`);
		code.increaseIndent();

		const order = new Map<Type, Emitter>();
		for (const type of this.typeEmitters) {
			order.set(type.type, type);
		}
		for (const resource of this.resourceEmitters) {
			order.set(resource.resource, resource);
		}

		for (const t of Object.values(this.iface.types)) {
			const type = symbols.getType(t);
			const emitter = order.get(type);
			emitter?.emitMetaModel(code);
		}

		for (const resource of this.resourceEmitters) {
			resource.emitMetaModelFunctions(code);
		}

		for (const func of this.functionEmitters) {
			func.emitMetaModel(code);
		}
		code.decreaseIndent();
		code.push('}');
	}

	public emitAPI(code: Code): void {
		const { nameProvider } = this.config;
		const name = nameProvider.asNamespaceName(this.iface);
		const qualifiedTypeName = this.getFullQualifiedTypeName();
		const functions: string[] = [];
		for (const func of this.functionEmitters) {
			functions.push(nameProvider.asFunctionName(func.callable));
		}
		const resources: string[] = [];
		for (const resource of this.resourceEmitters) {
			resources.push(nameProvider.asTypeName(resource.resource));
		}
		code.push(`export namespace ${name}._ {`);
		code.increaseIndent();
		code.push(`const functions: ${MetaModel.qualifier}.FunctionType<${MetaModel.qualifier}.ServiceFunction>[] = [${functions.map(name => `$.${name}`).join(', ')}];`);
		code.push(`const resources: ${MetaModel.qualifier}.ResourceType[] = [${resources.map(name => `$.${name}`).join(', ')}];`);
		const resourceWasmInterfaces: string[] = [];
		for (const emitter of this.resourceEmitters) {
			resourceWasmInterfaces.push(`${qualifiedTypeName}.${nameProvider.asTypeName(emitter.resource)}.WasmInterface`);
		}
		code.push(`export type WasmInterface = {`);
		code.increaseIndent();
		for(const func of this.functionEmitters) {
			func.emitWasmInterface(code);
		}
		code.decreaseIndent();
		if (resourceWasmInterfaces.length > 0) {
			code.push(`} & ${resourceWasmInterfaces.join(' & ')};`);
		} else {
			code.push(`};`);
		}

		for (const emitter of this.resourceEmitters) {
			emitter.emitService(code);
		}

		code.push(`export function createHost(service: ${qualifiedTypeName}, context: $wcm.Context): WasmInterface {`);
		code.increaseIndent();
		code.push(`return $wcm.Host.create<WasmInterface>(functions, resources, service, context);`);
		code.decreaseIndent();
		code.push('}');

		if (this.resourceEmitters.length === 0) {
			code.push(`export function createService(wasmInterface: WasmInterface, context: $wcm.Context): ${qualifiedTypeName} {`);
			code.increaseIndent();
			code.push(`return $wcm.Service.create<${qualifiedTypeName}>(functions, [], wasmInterface, context);`);
			code.decreaseIndent();
			code.push(`}`);
		} else {
			type ResourceInfo = { name: string;
				custom: { typeParamName: string; typeParam: string; paramName: string; paramType: string };
				class: { typeParam: string; func: string };
				module: { typeParam: string };
			};
			const resourceInfos: Map<string, ResourceInfo | undefined> = new Map();
			for (const emitter of this.resourceEmitters) {
				const resourceName = nameProvider.asTypeName(emitter.resource);
				if (emitter.needsTypeParameter()) {
					const typeParamName = emitter.getTypeParamName();
					resourceInfos.set(resourceName, { name: resourceName,
						custom: { typeParamName, typeParam: emitter.getTypeParameter(false), paramName: typeParamName.toLowerCase(), paramType: `$wcm.ResourceKind<${typeParamName}>` },
						class: { typeParam: emitter.getClassType(), func: emitter.hasConstructors() ? `${resourceName}.Class` : `${resourceName}.Manager` },
						module: { typeParam: emitter.getModuleType()},
					});
				} else {
					resourceInfos.set(resourceName, undefined);
				}
			}
			{
				const typeParams: string[] = [];
				const typeParamNames: string[] = [];
				const params: string[] = [];
				const resources: string[] = [];
				for (const info of resourceInfos.values()) {
					if (info !== undefined) {
						typeParams.push(info.custom.typeParam);
						typeParamNames.push(info.custom.typeParamName);
						params.push(`${info.custom.paramName}: ${info.custom.paramType}`);
						resources.push(`[$.${info.name}, ${info.custom.paramName}]`);
					}
				}
				const typeName = typeParams.length > 0 ? `${qualifiedTypeName}<${typeParamNames.join(', ')}>` : qualifiedTypeName;
				if (typeParams.length > 0) {
					code.push(`export function createService<${typeParams.join(', ')}>(${params.join(`, `)}, wasmInterface: WasmInterface, context: $wcm.Context): ${typeName} {`);
				} else {
					code.push(`export function createService(wasmInterface: WasmInterface, context: $wcm.Context): ${typeName} {`);
				}
				code.increaseIndent();
				code.push(`return $wcm.Service.create<${typeName}>(functions, [${resources.join(', ')}], wasmInterface, context);`);
				code.decreaseIndent();
				code.push(`}`);
			}
			{
				const typeParams: string[] = [];
				const resources: string[] = [];
				for (const info of resourceInfos.values()) {
					if (info !== undefined) {
						typeParams.push(info.class.typeParam);
						resources.push(`[$.${info.name}, ${info.class.func}]`);
					}
				}
				const typeName = typeParams.length > 0 ? `${qualifiedTypeName}<${typeParams.join(', ')}>` : qualifiedTypeName;
				code.push(`type ClassService = ${typeName};`);
				code.push(`export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {`);
				code.increaseIndent();
				code.push(`return $wcm.Service.create<ClassService>(functions, [${resources.join(', ')}], wasmInterface, context);`);
				code.decreaseIndent();
				code.push(`}`);
			}
			{
				const typeParams: string[] = [];
				const resources: string[] = [];
				for (const info of resourceInfos.values()) {
					if (info !== undefined) {
						typeParams.push(info.module.typeParam);
						resources.push(`[$.${info.name}, ${info.name}.Module]`);
					}
				}
				const typeName = typeParams.length > 0 ? `${qualifiedTypeName}<${typeParams.join(', ')}>` : qualifiedTypeName;
				code.push(`type ModuleService = ${typeName};`);
				code.push(`export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {`);
				code.increaseIndent();
				code.push(`return $wcm.Service.create<ModuleService>(functions, [${resources.join(', ')}], wasmInterface, context);`);
				code.decreaseIndent();
				code.push(`}`);
			}

		}
		code.decreaseIndent();
		code.push('}');
	}

	private getFullQualifiedTypeName(): string {
		const { nameProvider } = this.config;
		const ifaceName = nameProvider.asNamespaceName(this.iface);
		const pkg = nameProvider.asPackageName(this.pkg);
		return `${pkg}.${ifaceName}`;

	}
}

class InterfaceMemberEmitter extends Emitter {

	protected readonly iface: Interface;
	protected readonly member: Type | Callable;
	protected readonly owner: Interface | undefined;

	constructor(iface: Interface, member: Type | Callable, config: EmitterConfig) {
		super(config);
		this.iface = iface;
		this.member = member;
		this.owner = this.getOwner();
	}

	private getOwner(): Interface  | undefined{
		const { symbols } = this.config;
		const member = this.member;
		if (Callable.is(member)) {
			if (Callable.isFunction(member)) {
				return this.iface;
			} else {
				const ref = Callable.containingType(member);
				const type =  symbols.getType(ref);
				if (Type.isResourceType(type) && type.owner !== null) {
					const result = symbols.resolveOwner(type.owner);
					return Interface.is(result) ? result : undefined;
				} else {
					return undefined;
				}
			}
		} else {
			const result = member.owner !== null ? symbols.resolveOwner(member.owner) : undefined;
			return Interface.is(result) ? result : undefined;
		}
	}

	protected getMergeQualifier(): string {
		if (this.owner === undefined) {
			return '';
		}
		const { nameProvider } = this.config;
		const ifaceName = nameProvider.asNamespaceName(this.owner);
		return `${ifaceName}.`;
	}

	protected getPackageQualifier(): string {
		if (this.owner === undefined) {
			return '';
		}
		const { symbols, nameProvider } = this.config;
		const ifaceName = nameProvider.asNamespaceName(this.owner);
		const pkg = nameProvider.asPackageName(symbols.getPackage(this.owner.package));
		return `${pkg}.${ifaceName}.`;
	}
}

class FunctionEmitter extends InterfaceMemberEmitter {

	public readonly func: Func;
	public readonly callable: Func;

	constructor(func: Func, iface: Interface, config: EmitterConfig) {
		super(iface, func, config);
		this.func = func;
		this.callable = func;
	}

	public doEmitNamespace(code: Code, params: string[], returnType: string | undefined): void {
		if (returnType === undefined) {
			returnType = 'void';
		}
		const name = this.config.nameProvider.asFunctionName(this.func);
		code.push(`export type ${name} = (${params.join(', ')}) => ${returnType};`);
	}

	public emitTypeDeclaration(code: Code): void {
		const name = this.config.nameProvider.asFunctionName(this.func);
		code.push(`${name}: ${this.getMergeQualifier()}${name};`);
	}

	public doEmitMetaModel(code: Code, params: string[][], result: string | undefined): void {
		const name = this.config.nameProvider.asFunctionName(this.func);
		const qualifier = this.getMergeQualifier();
		if (params.length === 0) {
			code.push(`export const ${name} = new $wcm.FunctionType<${qualifier}${name}>('${name}', '${this.func.name}', [], ${result});`);
		} else {
			code.push(`export const ${name} = new $wcm.FunctionType<${qualifier}${name}>('${name}', '${this.func.name}',[`);
			code.increaseIndent();
			for (const [name, type] of params) {
				code.push(`['${name}', ${type}],`);
			}
			code.decreaseIndent();
			code.push(`], ${result});`);
		}
	}
}

class TypeDeclarationEmitter extends InterfaceMemberEmitter {

	public readonly type: Type;

	constructor(type: Type, iface: Interface, config: EmitterConfig) {
		super(iface, type, config);
		this.type = type;
	}

	public emitNamespace(code: Code): void {
		const { nameProvider, printers } = this.config;
		const name = nameProvider.asTypeName(this.type);
		this.emitDocumentation(this.type, code);
		code.push(`export type ${name} = ${printers.typeScript.print(this.type, TypeUsage.typeDeclaration)};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider, printers } = this.config;
		const name = nameProvider.asTypeName(this.type);
		code.push(`export const ${name} = ${printers.metaModel.print(this.type, TypeUsage.typeDeclaration)};`);
	}
}

class TypeReferenceEmitter extends InterfaceMemberEmitter {

	public readonly type: Type;

	constructor(type: Type, iface: Interface, config: EmitterConfig) {
		super(iface, type, config);
		this.type = type;
	}

	public emitNamespace(code: Code): void {
		if (!TypeKind.isReference(this.type.kind)) {
			throw new Error('Expected reference type');
		}
		const { nameProvider } = this.config;
		const referencedTypeName = this.getReferenceName(code, '');
		const tsName = nameProvider.asTypeName(this.type);
		this.emitDocumentation(this.type, code);
		code.push(`export type ${tsName} = ${referencedTypeName};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.config;
		const referencedTypeName = this.getReferenceName(code, '$.');
		const tsName = nameProvider.asTypeName(this.type);
		code.push(`export const ${tsName} = ${referencedTypeName};`);

	}

	private getReferenceName(code: Code, separator: string): string {
		const { nameProvider, symbols } = this.config;
		const referenced = this.getReferencedType();
		const referencedName = nameProvider.asTypeName(referenced);
		const qualifier = referenced.owner !== null ? this.computeQualifier(code, symbols.resolveOwner(referenced.owner)) : undefined;
		return qualifier !== undefined ? `${qualifier}.${separator}${referencedName}` : referencedName;
	}

	private getReferencedType(): Type & { name: string } {
		if (!TypeKind.isReference(this.type.kind)) {
			throw new Error('Expected reference type');
		}
		const { symbols } = this.config;
		const referenced = symbols.getType(this.type.kind.type);
		if (Type.hasName(referenced)) {
			return referenced;
		}
		throw new Error(`Cannot reference type ${JSON.stringify(referenced)} from ${JSON.stringify(this.iface)}`);
	}

	private computeQualifier(code: Code, reference: Interface | World): string | undefined {
		const scope = this.iface;
		if (scope === reference) {
			return undefined;
		}
		const { nameProvider, symbols } = this.config;
		if (Interface.is(scope) && Interface.is(reference)) {
			if (scope.package === reference.package) {
				const referencedPackage = symbols.getPackage(reference.package);
				const [, referencePackagedName] = nameProvider.getNamespaceAndName(referencedPackage);
				return `${referencePackagedName}.${nameProvider.asNamespaceName(reference)}`;
			} else {
				const typePackage = symbols.getPackage(scope.package);
				const referencedPackage = symbols.getPackage(reference.package);
				const [typeNamespaceName, ] = nameProvider.getNamespaceAndName(typePackage);
				const [referencedNamespaceName, referencePackagedName] = nameProvider.getNamespaceAndName(referencedPackage);
				if (typeNamespaceName === referencedNamespaceName) {
					const referencedTypeName = nameProvider.asNamespaceName(reference);
					code.imports.add(referencePackagedName, `./${referencePackagedName}`);
					return `${referencePackagedName}.${referencedTypeName}`;
				} else {
					throw new Error(`Cannot compute qualifier to import $import { type } from 'node:os';
{JSON.stringify(reference)} into scope  ${JSON.stringify(scope)}.`);
				}
			}
		}
		return undefined;
	}
}

class RecordEmitter extends InterfaceMemberEmitter {

	public readonly type: RecordType;

	constructor(record: RecordType, iface: Interface, config: EmitterConfig) {
		super(iface, record, config);
		this.type = record;
	}

	public emitNamespace(code: Code): void {
		const kind = this.type.kind;
		const { nameProvider, symbols, printers } = this.config;
		const name = nameProvider.asTypeName(this.type);
		this.emitDocumentation(this.type, code);
		code.push(`export type ${name} = {`);
		code.increaseIndent();
		for (const field of kind.record.fields) {
			this.emitDocumentation(field, code, true);
			const isOptional = TypeReference.isString(field.type)
				? false
				: Type.isOptionType(symbols.getType(field.type));
			const fieldName = nameProvider.asFieldName(field);
			code.push(`${fieldName}${isOptional ? '?' : ''}: ${printers.typeScript.printTypeReference(field.type, TypeUsage.property)};`);
		}
		code.decreaseIndent();
		code.push(`};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider, printers } = this.config;
		const name = nameProvider.asTypeName(this.type);
		code.push(`export const ${name} = new $wcm.RecordType<${this.getMergeQualifier()}${name}>([`);
		code.increaseIndent();
		for (const field of this.type.kind.record.fields) {
			const name = nameProvider.asFieldName(field);
			const type = printers.metaModel.printTypeReference(field.type, TypeUsage.property);
			code.push(`['${name}', ${type}],`);
		}
		code.decreaseIndent();
		code.push(`]);`);
	}
}

class VariantEmitter extends InterfaceMemberEmitter {

	public readonly type: VariantType;

	constructor(variant: VariantType, iface: Interface, config: EmitterConfig) {
		super(iface, variant, config);
		this.type = variant;
	}

	public emitNamespace(code: Code): void {

		function asTagName(name: string): string {
			if (name[0] === name[0].toLowerCase()) {
				return name;
			}
			let isAllUpperCase = true;
			for (let i = 1; i < name.length; i++) {
				if (name[i] !== name[i].toUpperCase()) {
					isAllUpperCase = false;
					break;
				}
			}
			if (isAllUpperCase) {
				return name.toLowerCase();
			} else {
				return name[0].toLowerCase() + name.substring(1);
			}
		}

		const kind = this.type.kind;
		const { nameProvider, printers } = this.config;
		const variantName = nameProvider.asTypeName(this.type);

		this.emitDocumentation(this.type, code, true);
		code.push(`export namespace ${variantName} {`);
		code.increaseIndent();
		const cases: { name: string; typeName: string; tagName: string; type: string | undefined }[] = [];
		for (const item of kind.variant.cases) {
			const name = nameProvider.asVariantCaseName(item);
			const typeName = nameProvider.asTypeName(item);
			let type: string | undefined;
			if (item.type !== null) {
				type = printers.typeScript.printTypeReference(item.type, TypeUsage.property);
			} else {
				type = undefined;
			}
			cases.push({ name, typeName, tagName: asTagName(name), type  });
		}

		for (let i = 0; i < cases.length; i++) {
			this.emitDocumentation(kind.variant.cases[i], code, true);
			const c = cases[i];
			code.push(`export const ${c.tagName} = '${c.name}' as const;`);
			if (c.type !== undefined) {
				code.push(`export type ${c.typeName} = { readonly tag: typeof ${c.tagName}; readonly value: ${c.type} } & _common;`);
				code.push(`export function ${c.typeName}(value: ${c.type}): ${c.typeName} {`);
				code.increaseIndent();
				code.push(`return new VariantImpl(${c.tagName}, value) as ${c.typeName};`);
				code.decreaseIndent();
				code.push(`}`);
			} else {
				code.push(`export type ${c.typeName} = { readonly tag: typeof ${c.tagName} } & _common;`);
				code.push(`export function ${c.typeName}(): ${c.typeName} {`);
				code.increaseIndent();
				code.push(`return new VariantImpl(${c.tagName}, undefined) as ${c.typeName};`);
				code.decreaseIndent();
				code.push(`}`);
			}
			code.push('');
		}
		code.push(`export type _tt = ${cases.map(value => `typeof ${value.tagName}`).join(' | ')};`);
		let needsUndefined = false;
		const items: string[] = [];
		for (const c of cases) {
			if (c.type === undefined) {
				needsUndefined = true;
			} else {
				items.push(c.type);
			}
		}
		if (needsUndefined) {
			items.push('undefined');
		}
		code.push(`export type _vt = ${items.join(' | ')};`);
		code.push(`type _common = Omit<VariantImpl, 'tag' | 'value'>;`);
		code.push(`export function _ctor(t: _tt, v: _vt): ${variantName} {`);
		code.increaseIndent();
		code.push(`return new VariantImpl(t, v) as ${variantName};`);
		code.decreaseIndent();
		code.push(`}`);

		code.push(`class VariantImpl {`);
		code.increaseIndent();
		code.push(`private readonly _tag: _tt;`);
		code.push(`private readonly _value${needsUndefined ? '?' : ''}: _vt;`);
		code.push(`constructor(t: _tt, value: _vt) {`);
		code.increaseIndent();
		code.push(`this._tag = t;`);
		code.push(`this._value = value;`);
		code.decreaseIndent();
		code.push(`}`);
		code.push(`get tag(): _tt {`);
		code.increaseIndent();
		code.push(`return this._tag;`);
		code.decreaseIndent();
		code.push(`}`);
		code.push(`get value(): _vt {`);
		code.increaseIndent();
		code.push(`return this._value;`);
		code.decreaseIndent();
		code.push(`}`);
		for (let i = 0; i < cases.length; i++) {
			const c = cases[i];
			code.push(`is${c.typeName}(): this is ${c.typeName} {`);
			code.increaseIndent();
			code.push(`return this._tag === ${variantName}.${c.tagName};`);
			code.decreaseIndent();
			code.push(`}`);
		}
		// class
		code.decreaseIndent();
		code.push(`}`);
		//namespace
		code.decreaseIndent();
		code.push(`}`);

		code.push(`export type ${variantName} = ${cases.map(value => `${variantName}.${value.typeName}`).join(' | ')};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider, printers } = this.config;
		const name = nameProvider.asTypeName(this.type);
		const cases: string[] = [];
		for (const item of this.type.kind.variant.cases) {
			const name = nameProvider.asVariantCaseName(item);
			const type = item.type === null ? 'undefined' : printers.metaModel.printTypeReference(item.type, TypeUsage.property);
			cases.push(`['${name}', ${type}]`);
		}
		const typeName = `${this.getMergeQualifier()}${name}`;
		code.push(`export const ${name} = new $wcm.VariantType<${typeName}, ${typeName}._tt, ${typeName}._vt>([${cases.join(', ')}], ${typeName}._ctor);`);
	}
}

class EnumEmitter extends InterfaceMemberEmitter {

	public readonly type: EnumType;

	constructor(type: EnumType, iface: Interface, config: EmitterConfig) {
		super(iface, type, config);
		this.type = type;
	}

	public emitNamespace(code: Code): void {
		const { nameProvider } = this.config;
		const kind = this.type.kind;
		const enumName = nameProvider.asTypeName(this.type);
		this.emitDocumentation(this.type, code, true);
		code.push(`export enum ${enumName} {`);
		code.increaseIndent();
		for (let i = 0; i < kind.enum.cases.length; i++) {
			const item = kind.enum.cases[i];
			const name = nameProvider.asEnumCaseName(item);
			this.emitDocumentation(kind.enum.cases[i], code, true);
			code.push(`${name} = '${name}',`);
		}
		code.decreaseIndent();
		code.push(`}`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.config;
		const enumName = nameProvider.asTypeName(this.type);
		const cases: string[] = [];
		for (const item of this.type.kind.enum.cases) {
			cases.push(`'${nameProvider.asEnumCaseName(item)}'`);
		}
		code.push(`export const ${enumName} = new $wcm.EnumType<${this.getMergeQualifier()}${enumName}>([${cases.join(', ')}]);`);
	}
}

class FlagsEmitter extends InterfaceMemberEmitter {

	public readonly type: FlagsType;

	constructor(flags: FlagsType, iface: Interface, config: EmitterConfig) {
		super(iface, flags, config);
		this.type = flags;
	}

	public emitNamespace(code: Code): void {
		const { nameProvider } = this.config;
		const kind = this.type.kind;
		const flagsName = nameProvider.asTypeName(this.type);
		const flagSize = FlagsEmitter.getFlagSize(kind.flags.flags.length);

		this.emitDocumentation(this.type, code, true);
		code.push(`export const ${flagsName} = Object.freeze({`);
		code.increaseIndent();
		for (let i = 0; i < kind.flags.flags.length; i++) {
			const flag = kind.flags.flags[i];
			const name = nameProvider.asFlagName(flag);
			this.emitDocumentation(flag, code, true);
			if (flagSize <= 4) {
				code.push(`${name}: 1 << ${i},`);
			} else {
				code.push(`${name}: 1n << ${i}n,`);
			}
		}
		code.decreaseIndent();
		code.push(`});`);
		switch (flagSize) {
			case 0:
			case 1:
			case 2:
			case 4:
				code.imports.addBaseType('u32');
				code.push(`export type ${flagsName} = u32;`);
				break;
			default:
				code.push(`export type ${flagsName} = bigint;`);
		}
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.config;
		const kind = this.type.kind;
		const flagsName = nameProvider.asTypeName(this.type);
		code.push(`export const ${flagsName} = new $wcm.FlagsType<${this.getMergeQualifier()}${flagsName}>(${kind.flags.flags.length});`);
	}

	private static getFlagSize(numberOfFlags: number): number {
		if (numberOfFlags === 0) {
			return 0;
		} else if (numberOfFlags <= 8) {
			return 1;
		} else if (numberOfFlags <= 16) {
			return 2;
		} else {
			return 4 * this.num32Flags(numberOfFlags);
		}
	}

	private static num32Flags(numberOfFlags: number): number {
		return Math.ceil(numberOfFlags / 32);
	}
}

class ResourceEmitter extends InterfaceMemberEmitter {

	public readonly resource: ResourceType;
	protected readonly typeParamName: string;

	protected readonly constructors: ResourceEmitter.ConstructorEmitter[];
	protected readonly methods: (ResourceEmitter.MethodEmitter | ResourceEmitter.StaticMethodEmitter)[];
	protected readonly emitters: CallableEmitter<Constructor | StaticMethod | Method>[];

	constructor(resource: ResourceType, iface: Interface, typeParamNameGenerator: TypeParamNameGenerator, config: EmitterConfig) {
		super(iface, resource, config);
		this.resource = resource;
		const name = this.config.nameProvider.asTypeName(this.resource);
		this.typeParamName = typeParamNameGenerator.generate(name);
		this.constructors = [];
		this.methods = [];
		this.emitters = [];
	}

	public build(): void {
		const methods = this.config.symbols.getMethods(this.resource);
		if (methods !== undefined && methods.length >= 0) {
			for (const method of methods) {
				if (Callable.isMethod(method)) {
					const emitter = new ResourceEmitter.MethodEmitter(method, this.resource, this.config);
					this.emitters.push(emitter);
					this.methods.push(emitter as ResourceEmitter.MethodEmitter);
				} else if (Callable.isStaticMethod(method)) {
					const emitter = new ResourceEmitter.StaticMethodEmitter(method, this.resource, this.config);
					this.emitters.push(emitter);
					this.methods.push(emitter as ResourceEmitter.StaticMethodEmitter);
				} else if (Callable.isConstructor(method)) {
					const emitter = new ResourceEmitter.ConstructorEmitter(method, this.resource, this.config);
					this.emitters.push(emitter);
					this.constructors.push(emitter as ResourceEmitter.ConstructorEmitter);
				}
			}
		}
	}

	public needsTypeParameter(): boolean {
		return this.emitters.length > 0;
	}

	public hasConstructors(): boolean {
		return this.constructors.length > 0;
	}

	public getTypeParamName(): string {
		return this.typeParamName;
	}

	public getTypeParameter(withDefault: boolean): string {
		const qualifier = this.getPackageQualifier();
		const name = this.config.nameProvider.asTypeName(this.resource);
		let typeParam = `${qualifier}${name}.Module`;
		if (this.constructors.length > 0) {
			typeParam = `${typeParam} | ${qualifier}${name}.Constructor`;
		}
		typeParam = `${typeParam} | ${qualifier}${name}.Manager`;
		return withDefault
			? `${this.typeParamName} extends ${typeParam} = ${typeParam}`
			: `${this.typeParamName} extends ${typeParam}`;
	}

	public getModuleType(): string {
		const qualifier = this.getPackageQualifier();
		const name = this.config.nameProvider.asTypeName(this.resource);
		return `${qualifier}${name}.Module`;
	}

	public getClassType(): string {
		const qualifier = this.getPackageQualifier();
		const name = this.config.nameProvider.asTypeName(this.resource);
		if (this.constructors.length > 0) {
			return `${qualifier}${name}.Constructor`;
		} else {
			return `${qualifier}${name}.Manager`;
		}
	}

	public emitNamespace(code: Code): void {
		const type = this.resource;
		const { nameProvider } = this.config;
		const tsName = nameProvider.asTypeName(type);
		code.push(`export namespace ${tsName} {`);
		code.increaseIndent();
		code.push('export type Module = {');
		code.increaseIndent();
		for (const emitter of this.emitters) {
			code.push('');
			emitter.emitNamespace(code);
		}
		code.decreaseIndent();
		code.push(`};`);
		code.push(`export type Interface = $wcm.Module2Interface<Module>;`);
		if (this.constructors.length > 0) {
			code.push(`export type Constructor = {`);
			code.increaseIndent();
			for (const constructor of this.constructors) {
				constructor.emitConstructorDeclaration(code);
			}
			code.decreaseIndent();
			code.push(`};`);
		}
		code.push(`export type Manager = $wcm.ResourceManager<Interface>;`);
		code.push(`export type WasmInterface = {`);
		code.increaseIndent();
		for (const emitter of this.emitters) {
			emitter.emitWasmInterface(code);
		}
		code.decreaseIndent();
		code.push(`};`);
		code.decreaseIndent();
		code.push(`}`);
		code.imports.addBaseType('resource');
		code.push(`export type ${tsName} = resource;`);
	}

	public emitTypeDeclaration(code: Code): void {
		if (this.emitters.length === 0) {
			return;
		}
		const { nameProvider } = this.config;
		const name = nameProvider.asTypeName(this.resource);
		code.push(`${name}: ${this.typeParamName};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.config;
		const name = nameProvider.asTypeName(this.resource);
		code.push(`export const ${name} = new $wcm.ResourceType('${name}', '${this.resource.name}');`);
	}

	public emitMetaModelFunctions(code: Code): void {
		for (const emitter of this.emitters) {
			emitter.emitMetaModel(code);
		}
	}

	public emitWasmInterface(code: Code) : void {
		for (const emitter of this.emitters) {
			emitter.emitWasmInterface(code);
		}
	}

	public emitService(code: Code): void {
		const { nameProvider } = this.config;
		const name = nameProvider.asTypeName(this.resource);
		const qualifier = this.getPackageQualifier();
		const qualifiedName = `${qualifier}${name}`;
		code.push(`export namespace ${name}  {`);
		code.increaseIndent();
		for (const emitter of this.emitters) {
			emitter.emitService(code);
		}
		const moduleType = `${qualifiedName}.Module`;
		code.push(`export function Module(wasmInterface: WasmInterface, context: $wcm.Context): ${moduleType} {`);
		code.increaseIndent();
		code.push(`return $wcm.Module.create<${moduleType}>($.${name}, wasmInterface, context);`);
		code.decreaseIndent();
		code.push(`}`);
		if (this.constructors.length > 0) {
			code.push(`class Impl implements ${qualifiedName}.Interface {`);
			code.increaseIndent();
			code.push(`private readonly _handle: ${qualifiedName};`);
			code.push(`private readonly _module: ${moduleType};`);
			for (const constructor of this.constructors) {
				constructor.emitConstructorImplementation(code, moduleType);
			}
			for (const method of this.methods) {
				method.emitClassMember(code);
			}
			code.decreaseIndent();
			code.push(`}`);
			code.push(`export function Class(wasmInterface: WasmInterface, context: $wcm.Context): ${qualifiedName}.Constructor {`);
			code.increaseIndent();
			code.push(`return class extends Impl {`);
			code.increaseIndent();
			for (const constructor of this.constructors) {
				constructor.emitAnonymousConstructorImplementation(code);
			}
			code.decreaseIndent();
			code.push(`};`);
			code.decreaseIndent();
			code.push(`}`);
		}
		code.push(`export function Manager(): ${qualifiedName}.Manager {`);
		code.increaseIndent();
		code.push(`return new $wcm.ResourceManager<${qualifiedName}.Interface>();`);
		code.decreaseIndent();
		code.push('}');

		code.decreaseIndent();
		code.push(`}`);
	}
}
namespace ResourceEmitter {

	export abstract class ResourceFunctionEmitter extends Emitter {

		protected readonly resource: ResourceType;
		protected readonly method: StaticMethod | Method | Constructor;

		constructor(method: StaticMethod | Method | Constructor, resource: ResourceType, config: EmitterConfig) {
			super(config);
			this.method = method;
			this.resource = resource;
		}

		public doEmitNamespace(code: Code, params: string[], returnType: string | undefined): void {
			if (returnType === undefined) {
				returnType = 'void';
			}
			const name = this.getFunctionName();
			code.push(`${name}(${params.join(', ')}): ${returnType};`);
		}

		public doEmitMetaModel(code: Code, params: string[][], result: string | undefined): void {
			const { nameProvider } = this.config;
			const methodName = this.getFunctionName();
			const resourceName = nameProvider.asTypeName(this.resource);
			const typeParam = `${this.computeLocalQualifier()}.Module['${methodName}']`;
			if (params.length === 0) {
				code.push(`${resourceName}.addFunction(new $wcm.FunctionType<${typeParam}>('${methodName}', '${this.method.name}', [], ${result}));`);
			} else {
				code.push(`${resourceName}.addFunction(new $wcm.FunctionType<${typeParam}>('${methodName}', '${this.method.name}', [`);
				code.increaseIndent();
				for (const [name, type] of params) {
					code.push(`['${name}', ${type}],`);
				}
				code.decreaseIndent();
				code.push(`], ${result}));`);
			}
		}

		protected abstract getFunctionName(): string;

		private computeLocalQualifier(): string {
			const type = this.resource;
			const { symbols, nameProvider } = this.config;
			if (type.owner === null) {
				return nameProvider.asTypeName(type);
			}
			const owner = symbols.resolveOwner(type.owner);
			if (Interface.is(owner)) {
				return `${nameProvider.asNamespaceName(owner)}.${nameProvider.asTypeName(type)}`;
			} else {
				return nameProvider.asTypeName(type);
			}
		}
	}

	class _MethodEmitter extends ResourceFunctionEmitter {

		public readonly callable: Method;

		constructor(method: Method, resource: ResourceType, config: EmitterConfig) {
			super(method, resource, config);
			this.callable = method;
		}

		protected getFunctionName(): string {
			return this.config.nameProvider.asMethodName(this.callable);
		}

		public emitClassMember(code: Code): void {
			const { nameProvider, printers } = this.config;
			const params: string[] = [];
			const paramNames: string[] = [];
			for (let i = 1; i < this.callable.params.length; i++) {
				const param = this.callable.params[i];
				const paramName = nameProvider.asParameterName(param);
				const paramType = printers.typeScript.printTypeReference(param.type, TypeUsage.parameter);
				paramNames.push(paramName);
				params.push(`${paramName}: ${paramType}`);
			}
			let returnType: string = 'void';
			if (this.callable.results !== null) {
				if (this.callable.results.length === 1) {
					returnType = printers.typeScript.printTypeReference(this.callable.results[0].type, TypeUsage.function);
				} else if (this.callable.results.length > 1) {
					returnType = `[${this.callable.results.map(r => printers.typeScript.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
				}
			}
			code.push(`public ${this.getFunctionName()}(${params.join(', ')}): ${returnType} {`);
			code.increaseIndent();
			if (paramNames.length > 0) {
				code.push(`return this._module.${this.getFunctionName()}(this._handle, ${paramNames.join(', ')});`);
			} else {
				code.push(`return this._module.${this.getFunctionName()}(this._handle);`);
			}
			code.decreaseIndent();
			code.push('}');

		}
	}

	class _StaticMethodEmitter extends ResourceFunctionEmitter {

		public readonly callable: StaticMethod;

		constructor(method: StaticMethod, resource: ResourceType, config: EmitterConfig) {
			super(method, resource, config);
			this.callable = method;
		}

		protected getFunctionName(): string {
			return this.config.nameProvider.asStaticMethodName(this.callable);
		}

		public emitClassMember(_code: Code): void {
		}
	}

	class _ConstructorEmitter extends ResourceFunctionEmitter {

		public readonly callable: Constructor;

		constructor(method: Constructor, resource: ResourceType, config: EmitterConfig) {
			super(method, resource, config);
			this.callable = method;
		}

		protected getFunctionName(): string {
			return this.config.nameProvider.asConstructorName(this.callable);
		}

		public emitConstructorDeclaration(code: Code): void {
			const { nameProvider, printers } = this.config;
			const params: string[] = [];
			for (const param of this.callable.params) {
				const paramName = nameProvider.asParameterName(param);
				params.push(`${paramName}: ${printers.typeScript.printTypeReference(param.type, TypeUsage.parameter)}`);
			}
			code.push(`new(${params.join(', ')}): Interface;`);
		}

		public emitConstructorImplementation(code: Code, moduleType: string): void {
			const { nameProvider, printers } = this.config;
			const params: string[] = [];
			const paramNames: string[] = [];
			for (const param of this.callable.params) {
				const paramName = nameProvider.asParameterName(param);
				const paramType = printers.typeScript.printTypeReference(param.type, TypeUsage.parameter);
				paramNames.push(paramName);
				params.push(`${paramName}: ${paramType}`);
			}
			code.push(`constructor(${params.join(', ')}, module: ${moduleType}) {`);
			code.increaseIndent();
			code.push(`this._module = module;`);
			code.push(`this._handle = module.${this.getFunctionName()}(${paramNames.join(', ')});`);
			code.decreaseIndent();
			code.push('}');
		}

		public emitAnonymousConstructorImplementation(code: Code): void {
			const { nameProvider, printers } = this.config;
			const params: string[] = [];
			const paramNames: string[] = [];
			for (const param of this.callable.params) {
				const paramName = nameProvider.asParameterName(param);
				paramNames.push(paramName);
				params.push(`${paramName}: ${printers.typeScript.printTypeReference(param.type, TypeUsage.parameter)}`);
			}
			code.push(`constructor(${params.join(', ')}) {`);
			code.increaseIndent();
			code.push(`super(${paramNames.join(', ')}, Module(wasmInterface, context));`);
			code.decreaseIndent();
			code.push('}');
		}
	}

	export const ConstructorEmitter = CallableEmitter(_ConstructorEmitter);
	export type ConstructorEmitter = _ConstructorEmitter;
	export const StaticMethodEmitter = CallableEmitter(_StaticMethodEmitter);
	export type StaticMethodEmitter = _StaticMethodEmitter;
	export const MethodEmitter = CallableEmitter(_MethodEmitter);
	export type MethodEmitter = _MethodEmitter;
}

type TypeEmitter = TypeDeclarationEmitter | TypeReferenceEmitter | RecordEmitter | VariantEmitter | EnumEmitter | FlagsEmitter;

interface CallableEmitter<C extends Callable> extends Emitter {
	callable: C;
	doEmitNamespace(code: Code, params: string[], returnType: string | undefined): void;
	doEmitMetaModel(code: Code, params: string[][], result: string | undefined): void;
}

const MAX_FLAT_PARAMS = 16;
const MAX_FLAT_RESULTS = 1;
function CallableEmitter<C extends Callable, P extends Interface | ResourceType, S extends Emitter>(base: new (callable: C, container: P, config: EmitterConfig) => CallableEmitter<C>): (new (callable: C, container: P, config: EmitterConfig) => CallableEmitter<C>) {
	return class extends base {
		public callable: C;
		constructor(callable: C, parent: P, config: EmitterConfig) {
			super(callable, parent, config);
			this.callable = callable;
		}
		public emitNamespace(code: Code): void {
			this.emitDocumentation(this.callable, code);
			const params: string[] = [];
			for (const param of this.callable.params) {
				const paramName = this.config.nameProvider.asParameterName(param);
				params.push(`${paramName}: ${this.config.printers.typeScript.printTypeReference(param.type, TypeUsage.parameter)}`);
			}
			let returnType: string | undefined = undefined;
			if (this.callable.results.length === 1) {
				returnType = this.config.printers.typeScript.printTypeReference(this.callable.results[0].type, TypeUsage.function);
			} else if (this.callable.results.length > 1) {
				returnType = `[${this.callable.results.map(r => this.config.printers.typeScript.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
			}
			this.doEmitNamespace(code, params, returnType);
		}

		public emitMetaModel(code: Code): void {
			const metaDataParams: string[][] = [];
			for (const param of this.callable.params) {
				const paramName = this.config.nameProvider.asParameterName(param);
				metaDataParams.push([paramName, this.config.printers.metaModel.printTypeReference(param.type, TypeUsage.parameter)]);
			}
			let metaReturnType: string | undefined = undefined;
			if (this.callable.results.length === 1) {
				metaReturnType = this.config.printers.metaModel.printTypeReference(this.callable.results[0].type, TypeUsage.function);
			} else if (this.callable.results.length > 1) {
				metaReturnType = `[${this.callable.results.map(r => this.config.printers.metaModel.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
			}
			this.doEmitMetaModel(code, metaDataParams, metaReturnType);
		}

		public emitWasmInterface(code: Code): void {
			const { typeFlattener } = this.config;
			const params = typeFlattener.flattenParams(this.callable);
			let returnType: string;
			const results = typeFlattener.flattenResult(this.callable);
			if (results.length === MAX_FLAT_RESULTS) {
				returnType = results[0];
			} else {
				returnType = 'void';
				code.imports.addBaseType('ptr');
				params.push({ name: 'result', type: `ptr<[${results.join(', ')}]>`});
			}
			if (params.length <= MAX_FLAT_PARAMS) {
				code.push(`'${this.callable.name}': (${params.map(p => `${p.name}: ${p.type}`).join(', ')}) => ${returnType};`);
			} else {
				code.imports.addBaseType('ptr');
				code.push(`'${this.callable.name}': (args: ptr<[${params.map(p => p.type).join(', ')}]>) => ${returnType};`);
			}
		}
	};
}