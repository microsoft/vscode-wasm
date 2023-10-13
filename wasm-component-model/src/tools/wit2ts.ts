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

		const symbols = new SymbolTable(document, nameProvider);
		const visitor = new TypeScript.PackageEmitter(pkg, mainCode, symbols, nameProvider, options);
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
}

interface NameProvider {
	asFileName(pkg: Package): string;
	asImportName(pkg: Package): string;
	asPackageName(pkg: Package): string;
	asNamespaceName(iface: Interface): string;
	asTypeName(type: Type): string;
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
		let result = asPackageName(pkg);
		result = result[0].toLowerCase() + result.substring(1);
		return `${result}.ts`;
	}

	export function asImportName(pkg: Package): string {
		return asPackageName(pkg);
	}

	export function asPackageName(pkg: Package): string {
		const index = pkg.name.indexOf(':');
		if (index === -1) {
			return _asTypeName(pkg.name);
		}
		return _asTypeName(pkg.name.substring(index + 1));
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

	export function asTypeName(type: Type): string {
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

	export interface Emitter {
		emit(code: Code): void;
	}

	export class TypeNameEmitter implements Emitter {

		private readonly name: string;
		private readonly reference: string;

		constructor(name: string, reference: string) {
			this.name = name;
			this.reference = reference;
		}

		public emit(code: Code): void {
			code.push(`export const ${this.name} = ${this.reference};`);
		}
	}

	export class RecordEmitter implements Emitter {

		private readonly name: string;
		private readonly typeParam: string;
		private readonly fields: string[][];

		constructor(name: string, typeParam: string, fields: string[][]) {
			this.name = name;
			this.typeParam = typeParam;
			this.fields = fields;
		}

		public emit(code: Code): void {
			code.push(`export const ${this.name} = new $wcm.RecordType<${this.typeParam}>([`);
			code.increaseIndent();
			for (const [name, type] of this.fields) {
				code.push(`['${name}', ${type}],`);
			}
			code.decreaseIndent();
			code.push(`]);`);
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

		public emit(code: Code): void {
			code.push(`export const ${this.name} = new $wcm.EnumType<${this.typeParam}>(${this.items});`);
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

		public emit(code: Code): void {
			code.push(`export const ${this.name} = new $wcm.FlagsType<${this.typeParam}>([${this.flags.map(flag => `'${flag}'`).join(', ')}]);`);
		}
	}

	export class VariantEmitter implements Emitter {

		private readonly name: string;
		private readonly typeParam: string;
		private readonly cases: (string | undefined)[];

		constructor(name: string, typeParam: string, cases: (string | undefined)[]) {
			this.name = name;
			this.typeParam = typeParam;
			this.cases = cases;
		}

		public emit(code: Code): void {
			code.push(`export const ${this.name} = new $wcm.VariantType<${this.typeParam}, ${this.typeParam}._ct, ${this.typeParam}._vt>([${this.cases.map(c => c !== undefined ? c : 'undefined').join(', ')}], ${this.typeParam}._ctor);`);
		}
	}

	export class NamespaceResourceEmitter implements Emitter {

		public readonly name: string;
		private readonly witName: string;
		public readonly functionEmitters: AbstractFunctionEmitter[];

		constructor(name: string, witName: string, functionEmitters: AbstractFunctionEmitter[]) {
			this.name = name;
			this.witName = witName;
			this.functionEmitters = functionEmitters;
		}

		public emit(code: Code): void {
			code.push(`export const ${this.name} = new $wcm.NamespaceResourceType('${this.name}', '${this.witName}');`);
		}
	}

	export abstract class AbstractFunctionEmitter implements Emitter {

		protected readonly typeParam: string;
		public readonly name: string;
		protected readonly witName: string;
		protected readonly params: string[][];
		protected readonly result: string | undefined;

		constructor(typeParam: string, name: string, witName: string, params: string[][], result: string | undefined) {
			this.typeParam = typeParam;
			this.name = name;
			this.witName = witName;
			this.params = params;
			this.result = result;
		}

		public abstract emit(code: Code): void;
	}

	export class FunctionEmitter extends AbstractFunctionEmitter {

		constructor(typeParam: string, name: string, witName: string, params: string[][], result: string | undefined) {
			super(typeParam, name, witName, params, result);
		}

		public emit(code: Code): void {
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

	export class ResourceFunctionEmitter extends AbstractFunctionEmitter {

		private readonly resourceName: string;

		constructor(resourceName: string, typeParam: string, name: string, witName: string, params: string[][], result: string | undefined) {
			super(typeParam, name, witName, params, result);
			this.resourceName = resourceName;
		}

		public emit(code: Code): void {
			if (this.params.length === 0) {
				code.push(`${this.resourceName}.addFunction(new $wcm.FunctionType<${this.typeParam}>('${this.name}', '${this.witName}', [], ${this.result}));`);
			} else {
				code.push(`${this.resourceName}.addFunction(new $wcm.FunctionType<${this.typeParam}>('${this.name}', '${this.witName}', [`);
				code.increaseIndent();
				for (const [name, type] of this.params) {
					code.push(`['${name}', ${type}],`);
				}
				code.decreaseIndent();
				code.push(`], ${this.result}));`);
			}
		}
	}

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
		private readonly options: ResolvedOptions;
		private readonly metaModelEmitters: Map<string, MetaModel.Emitter[]>;

		private static MAX_FLAT_PARAMS = 16;
		private static MAX_FLAT_RESULTS = 1;

		constructor(pkg: Package, mainCode: Code, symbols: SymbolTable, nameProvider: NameProvider, options: ResolvedOptions) {
			this.pkg = pkg;
			this.mainCode = mainCode;
			this.symbols = symbols;
			this.nameProvider = nameProvider;
			this.options = options;
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
				for (const [interfaceName, emitters] of this.metaModelEmitters) {
					code.push(`export namespace ${interfaceName}.$ {`);
					code.increaseIndent();
					const functions: string[] = [];
					const namespaceResources: string[] = [];
					const resourceFunctionEmitters: MetaModel.AbstractFunctionEmitter[] = [];
					for (const emitter of emitters) {
						emitter.emit(code);
						if (emitter instanceof MetaModel.FunctionEmitter) {
							functions.push(emitter.name);
						} else if (emitter instanceof MetaModel.NamespaceResourceEmitter) {
							namespaceResources.push(emitter.name);
							resourceFunctionEmitters.push(...emitter.functionEmitters);
						}
					}
					for (const emitter of resourceFunctionEmitters) {
						emitter.emit(code);
					}
					code.decreaseIndent();
					code.push('}');

					const iface = interfaces.get(interfaceName)!;
					code.push(`export namespace ${interfaceName}._ {`);
					if (this.hasFunctions(iface)) {
						code.increaseIndent();

						code.push(`const functions: ${MetaModel.qualifier}.FunctionType<${MetaModel.qualifier}.ServiceFunction>[] = [${functions.map(name => `$.${name}`).join(', ')}];`);
						code.push(`const resources: ${MetaModel.qualifier}.NamespaceResourceType[] = [${namespaceResources.map(name => `$.${name}`).join(', ')}];`);
						const ifaceName = this.symbols.interfaces.getFullyQualifiedName(iface);
						code.push(`export type WasmInterface = {`);
						code.increaseIndent();
						const typeFlattener = new TypeFlattener(this.symbols, this.nameProvider, code.imports);
						for (const func of Object.values(iface.functions)) {
							const params = typeFlattener.flattenParams(func);
							let returnType: string;
							const results = typeFlattener.flattenResult(func);
							if (results.length === PackageEmitter.MAX_FLAT_RESULTS) {
								returnType = results[0];
							} else {
								returnType = 'void';
								code.imports.addBaseType('ptr');
								params.push({ name: 'result', type: `ptr<[${results.join(', ')}]>`});
							}
							if (params.length <= PackageEmitter.MAX_FLAT_PARAMS) {
								code.push(`'${func.name}': (${params.map(p => `${p.name}: ${p.type}`).join(', ')}) => ${returnType};`);
							} else {
								code.imports.addBaseType('ptr');
								code.push(`'${func.name}': (args: ptr<[${params.map(p => p.type).join(', ')}]>) => ${returnType};`);
							}
						}
						code.decreaseIndent();
						code.push(`};`);
						code.push(`export function createHost(service: ${ifaceName}, context: $wcm.Context): WasmInterface {`);
						code.increaseIndent();
						code.push(`return $wcm.Host.create<WasmInterface>(functions, resources, service, context);`);
						code.decreaseIndent();
						code.push(`}`);
						code.push(`export function createService(wasmInterface: WasmInterface, context: $wcm.Context): ${ifaceName} {`);
						code.increaseIndent();
						code.push(`return $wcm.Service.create<${ifaceName}>(functions, resources, wasmInterface, context);`);
						code.decreaseIndent();
						code.push(`}`);

						code.decreaseIndent();
					}
					code.push('}');
				}
				code.decreaseIndent();
				code.push(`}`);
			}

			this.mainCode.push(`export { ${pkgName} } from './${this.nameProvider.asImportName(this.pkg)}';`);
			return code;
		}

		private hasFunctions(iface: Interface): boolean {
			if (Object.values(iface.functions).length > 0) {
				return true;
			}
			for (const t of Object.values(iface.types)) {
				const type = this.symbols.getType(t);
				if (Type.isResourceType(type)) {
					const method = this.symbols.getMethods(type);
					if (method !== undefined && method.length > 0) {
						return true;
					}
				}
			}
			return false;
		}

		private processInterface(iface: Interface, qualifier: string, code: Code, printers: Printers): void {
			const name = this.nameProvider.asNamespaceName(iface);
			const metaModelEmitters: MetaModel.Emitter[] = [];
			this.metaModelEmitters.set(name, metaModelEmitters);

			emitDocumentation(iface, code);
			code.push(`export namespace ${name} {`);
			code.increaseIndent();
			const exports: string[] = [];
			for (const t of Object.values(iface.types)) {
				code.push('');
				const type = this.symbols.getType(t);
				const typeEmitter = new TypeEmitter(type, iface, `${qualifier}.${name}`, code, this.symbols, printers, this.nameProvider, this.options);
				typeEmitter.emit();
				if (typeEmitter.metaModelEmitter !== undefined) {
					metaModelEmitters.push(typeEmitter.metaModelEmitter);
				}
				if (Type.isResourceType(type)) {
					const methods = this.symbols.getMethods(type);
					if (methods !== undefined && methods.length > 0) {
						exports.push(this.nameProvider.asTypeName(type));
					}
				}
			}
			for (const func of Object.values(iface.functions)) {
				if (!Callable.isFunction(func)) {
					continue;
				}
				code.push('');
				const funcEmitter = new FunctionEmitter(func, `${qualifier}.${name}`, code, printers, this.nameProvider);
				funcEmitter.emit();
				if (funcEmitter.metaModelEmitter !== undefined) {
					metaModelEmitters.push(funcEmitter.metaModelEmitter);
				}
				exports.push(this.nameProvider.asFunctionName(func));
			}
			code.decreaseIndent();
			code.push(`}`);
			if (exports.length > 0) {
				code.push(`export type ${name} = Pick<typeof ${name}, ${exports.map(item => `'${item}'`).join(' | ')}>;`);
			} else {
				code.push(`export type ${name} = typeof ${name};`);
			}
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
		private readonly options: ResolvedOptions;
		public metaModelEmitter: MetaModel.Emitter | undefined;

		constructor(type: Type, scope: Interface, qualifier: string, code: Code, symbols: SymbolTable, printers: Printers, nameProvider: NameProvider, options: ResolvedOptions) {
			this.type = type;
			this.scope = scope;
			this.qualifier = qualifier;
			this.code = code;
			this.symbols = symbols;
			this.printers = printers;
			this.nameProvider = nameProvider;
			this.options = options;
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
			} else if (TypeKind.isReference(this.type.kind)) {
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
			} else if (Type.isResourceType(this.type)) {
				this.emitResource(this.type);
			} else {
				const name = this.nameProvider.asTypeName(this.type);
				this.code.push(`export type ${name} = ${this.printers.typeScript.print(this.type, TypeUsage.typeDeclaration)};`);
				this.metaModelEmitter = new MetaModel.TypeNameEmitter(name, this.printers.metaModel.print(this.type, TypeUsage.typeDeclaration));
			}
		}

		private emitRecord(type: RecordType): void {
			const kind = type.kind;
			const tsName = this.nameProvider.asTypeName(type);
			this.code.push(`export type ${tsName} = {`);
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
			this.code.push(`};`);
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
			this.code.push(`export type ${tsName} = {`);
			this.code.increaseIndent();
			for (const flag of kind.flags.flags) {
				const flagName = this.nameProvider.asFlagName(flag);
				this.code.push(`${flagName}: boolean;`);
				flags.push(flagName);
			}
			this.code.decreaseIndent();
			this.code.push(`};`);
			this.metaModelEmitter = new MetaModel.FlagsEmitter(tsName, `${this.qualifier}.${tsName}`, flags);
		}

		private emitResource(type: ResourceType): void {
			const tsName = this.nameProvider.asTypeName(type);
			const methods = this.symbols.getMethods(type);
			const metaModelEmitters: MetaModel.FunctionEmitter[] = [];
			if (methods === undefined || methods.length === 0) {
				this.code.imports.addBaseType('resource');
				this.code.push(`export type ${tsName} = resource;`);
			} else {
				this.code.imports.addBaseType('resource');
				this.code.push(`export type ${tsName} = resource;`);
				this.code.push(`export namespace ${tsName} {`);
				this.code.increaseIndent();
				for (const method of methods) {
					this.code.push('');
					let emitter: MethodEmitter | StaticMethodEmitter | ConstructorEmitter;
					if (Callable.isMethod(method)) {
						emitter = new MethodEmitter(tsName, method, this.qualifier, this.code, this.printers, this.nameProvider, this.options);
					} else if (Callable.isStaticMethod(method)) {
						emitter = new StaticMethodEmitter(tsName, method, this.qualifier, this.code, this.printers, this.nameProvider, this.options);
					} else if (Callable.isConstructor(method)) {
						emitter = new ConstructorEmitter(tsName, method, this.qualifier, this.code, this.printers, this.nameProvider, this.options);
					} else {
						throw new Error(`Unexpected callable ${JSON.stringify(method)}.`);
					}
					emitter.emit();
					if (emitter.metaModelEmitter !== undefined) {
						metaModelEmitters.push(emitter.metaModelEmitter);
					}
				}
				this.code.decreaseIndent();
				this.code.push(`}`);
			}
			this.metaModelEmitter = new MetaModel.NamespaceResourceEmitter(tsName, type.name!, metaModelEmitters);
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

	abstract class CallableEmitter {

		protected readonly callable: Callable;
		protected readonly qualifier: string;
		protected readonly code: Code;
		protected readonly printers: Printers;
		protected readonly nameProvider: NameProvider;
		public metaModelEmitter: MetaModel.FunctionEmitter | undefined;

		constructor(callable: Callable, qualifier: string, code: Code, printers: Printers, nameProvider: NameProvider) {
			this.callable = callable;
			this.qualifier = qualifier;
			this.code = code;
			this.printers = printers;
			this.nameProvider = nameProvider;
		}

		public emit(): void {
			emitDocumentation(this.callable, this.code);
			const params: string[] = [];
			const metaDataParams: string[][] = [];
			for (const param of this.callable.params) {
				const paramName = this.nameProvider.asParameterName(param);
				params.push(`${paramName}: ${this.printers.typeScript.printTypeReference(param.type, TypeUsage.parameter)}`);
				metaDataParams.push([paramName, this.printers.metaModel.printTypeReference(param.type, TypeUsage.parameter)]);
			}
			let returnType: string | undefined = undefined;
			let metaReturnType: string | undefined = undefined;
			if (this.callable.results.length === 1) {
				returnType = this.printers.typeScript.printTypeReference(this.callable.results[0].type, TypeUsage.function);
				metaReturnType = this.printers.metaModel.printTypeReference(this.callable.results[0].type, TypeUsage.function);
			} else if (this.callable.results.length > 1) {
				returnType = `[${this.callable.results.map(r => this.printers.typeScript.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
				metaReturnType = `[${this.callable.results.map(r => this.printers.metaModel.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
			}
			this.metaModelEmitter = this.doEmit(params, returnType, metaDataParams, metaReturnType);
		}

		protected abstract doEmit(params: string[], returnType: string | undefined, metaData: string[][], metaReturnType: string | undefined): MetaModel.FunctionEmitter;
	}

	class FunctionEmitter extends CallableEmitter {

		private readonly func: Func;

		constructor(func: Func, qualifier: string, code: Code, printers: Printers, nameProvider: NameProvider) {
			super(func, qualifier, code, printers, nameProvider);
			this.func = func;
		}

		protected doEmit(params: string[], returnType: string | undefined, metaData: string[][], metaReturnType: string | undefined): MetaModel.FunctionEmitter {
			if (returnType === undefined) {
				returnType = 'void';
			}
			const funcName = this.nameProvider.asFunctionName(this.func);
			this.code.push(`export declare function ${funcName}(${params.join(', ')}): ${returnType};`);
			return new MetaModel.FunctionEmitter(`typeof ${this.qualifier}.${funcName}`, funcName, this.callable.name, metaData, metaReturnType);
		}
	}

	class MethodEmitter extends CallableEmitter {

		private readonly resourceName: string;
		private readonly method: Method;
		private readonly options: ResolvedOptions;

		constructor(resourceName: string, method: Method, qualifier: string, code: Code, printers: Printers, nameProvider: NameProvider, options: ResolvedOptions) {
			super(method, qualifier, code, printers, nameProvider);
			this.resourceName = resourceName;
			this.method = method;
			this.options = options;
		}

		protected doEmit(params: string[], returnType: string | undefined, metaData: string[][], metaReturnType: string | undefined): MetaModel.AbstractFunctionEmitter {
			if (returnType === undefined) {
				returnType = 'void';
			}
			const methodName = this.nameProvider.asMethodName(this.method);
			if (this.options.resourceStyle === 'namespace') {
				this.code.push(`export declare function ${methodName}(${params.join(', ')}): ${returnType};`);
				return new MetaModel.ResourceFunctionEmitter(this.resourceName, `typeof ${this.qualifier}.${this.resourceName}.${methodName}`, methodName, this.callable.name, metaData, metaReturnType);
			} else if (this.options.resourceStyle === 'class') {
				throw new Error(`Unknown resource style ${this.options.resourceStyle}.`);
			} else {
				throw new Error(`Unknown resource style ${this.options.resourceStyle}.`);
			}
		}
	}

	class StaticMethodEmitter extends CallableEmitter {

		private readonly resourceName: string;
		private readonly method: StaticMethod;
		private readonly options: ResolvedOptions;

		constructor(resourceName: string, method: StaticMethod, qualifier: string, code: Code, printers: Printers, nameProvider: NameProvider, options: ResolvedOptions) {
			super(method, qualifier, code, printers, nameProvider);
			this.resourceName = resourceName;
			this.method = method;
			this.options = options;
		}

		protected doEmit(params: string[], returnType: string | undefined, metaData: string[][], metaReturnType: string | undefined): MetaModel.AbstractFunctionEmitter {
			if (returnType === undefined) {
				returnType = 'void';
			}
			const methodName = this.nameProvider.asStaticMethodName(this.method);
			if (this.options.resourceStyle === 'namespace') {
				this.code.push(`export declare function ${methodName}(${params.join(', ')}): ${returnType};`);
				return new MetaModel.ResourceFunctionEmitter(this.resourceName, `typeof ${this.qualifier}.${this.resourceName}.${methodName}`, methodName, this.callable.name, metaData, metaReturnType);
			} else if (this.options.resourceStyle === 'class') {
				throw new Error(`Unknown resource style ${this.options.resourceStyle}.`);
			} else {
				throw new Error(`Unknown resource style ${this.options.resourceStyle}.`);
			}
		}
	}

	class ConstructorEmitter extends CallableEmitter {

		private readonly resourceName: string;
		private readonly method: Constructor;
		private readonly options: ResolvedOptions;

		constructor(resourceName: string, method: Constructor, qualifier: string, code: Code, printers: Printers, nameProvider: NameProvider, options: ResolvedOptions) {
			super(method, qualifier, code, printers, nameProvider);
			this.resourceName = resourceName;
			this.method = method;
			this.options = options;
		}

		protected doEmit(params: string[], returnType: string | undefined, metaData: string[][], metaReturnType: string | undefined): MetaModel.AbstractFunctionEmitter {
			if (returnType === undefined) {
				returnType = 'void';
			}
			const methodName = this.nameProvider.asConstructorName(this.method);
			if (this.options.resourceStyle === 'namespace') {
				this.code.push(`export declare function ${methodName}(${params.join(', ')}): ${returnType};`);
				return new MetaModel.ResourceFunctionEmitter(this.resourceName, `typeof ${this.qualifier}.${this.resourceName}.${methodName}`, methodName, this.callable.name, metaData, metaReturnType);
			} else if (this.options.resourceStyle === 'class') {
				throw new Error(`Unknown resource style ${this.options.resourceStyle}.`);
			} else {
				throw new Error(`Unknown resource style ${this.options.resourceStyle}.`);
			}
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
}