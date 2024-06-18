/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { ResolvedOptions } from './options';
import {
	AbstractType,
	BaseType,
	BorrowHandleType,
	Callable,
	Constructor,
	Document, Documentation, EnumCase,
	EnumType,
	Field,
	Flag,
	FlagsType,
	Func, Interface,
	ListType,
	Method,
	ObjectKind,
	OptionType,
	OwnHandleType,
	Owner, Package, Param,
	RecordType,
	ReferenceType,
	ResourceType,
	ResultType,
	StaticMethod,
	TupleType,
	Type, TypeKind, TypeReference,
	VariantCase,
	VariantType,
	World,
	type InterfaceObject,
	type PackageNameParts,
	type TypeObject
} from './wit-json';

export function processDocument(document: Document, options: ResolvedOptions): void {
	options.singleWorld = false;
	const documentEmitter = new DocumentEmitter(document, options);
	documentEmitter.build();
	documentEmitter.postBuild();
	documentEmitter.emit();
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
		if (content !== undefined && content.length > 0) {
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
		this.source.unshift('/* eslint-disable @typescript-eslint/ban-types */');
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

type NameProvider = {
	pack: {
		name(pkg: Package): string;
		fileName(pkg: Package): string;
		importName(pkg: Package): string;
		parts(pkg: Package): PackageNameParts;
	};

	world: {
		name(world: World): string;
		fileName(world: World): string;
	};

	iface: {
		typeName(iface: Interface): string;
		moduleName(iface: Interface): string;
		propertyName(iface: Interface): string;
	};

	type: {
		name(type: Type | VariantCase): string;
		parameterName(type: Type): string;
	};

	func: {
		name(func: Func): string;
	};

	method: {
		name(method: Method): string;
		staticName(method: StaticMethod): string;
		constructorName(method: Constructor): string;
	};

	parameter: {
		name(param: Param): string;
	};

	enumeration: {
		caseName(c: EnumCase): string;
	};

	variant: {
		caseName(c: VariantCase): string;
	};

	flag: {
		name(flag: Flag): string;
	};

	field: {
		name(field: Field): string;
	};
};

namespace _TypeScriptNameProvider {
	const keywords: Map<string, string> = new Map<string, string>([
		['this', 'this_'],
		['in', 'in_']
	]);

	export namespace pack {
		export function name(pkg: Package): string {
			let name = pkg.name;
			let index = name.indexOf(':');
			if (index >= 0) {
				name = name.substring(index + 1);
			}
			index = name.lastIndexOf('@');
			if (index >= 0) {
				name = name.substring(0, index);
			}
			return _asPropertyName(name);
		}
		export function fileName(pkg: Package): string {
			return `${name(pkg)}.ts`;
		}
		export function importName(pkg: Package): string {
			return name(pkg);
		}
		export function parts(pkg: Package): PackageNameParts {
			let namespace: string | undefined;
			let version: string | undefined;
			let name = pkg.name;
			let index = name.indexOf(':');
			if (index >= 0) {
				namespace = name.substring(0, index);
				name = name.substring(index + 1);
			}
			index = name.lastIndexOf('@');
			if (index >= 0) {
				version = name.substring(index + 1);
				name = name.substring(0, index);
			}

			return { namespace, name, version };
		}
	}

	export namespace world {
		export function name(world: World): string {
			return _asPropertyName(world.name);
		}
		export function fileName(world: World): string {
			return `${name(world)}.ts`;
		}
	}

	export namespace iface {
		export function typeName(iface: Interface): string {
			return _asTypeName(iface.name);
		}
		export function moduleName(iface: Interface): string {
			return _asTypeName(iface.name);
		}
		export function propertyName(iface: Interface): string {
			return _asPropertyName(iface.name);
		}
	}

	export namespace type {
		export function name(type: Type | VariantCase): string {
			if (type.name === null) {
				throw new Error(`Type ${JSON.stringify(type)} has no name.`);
			}
			return _asTypeName(type.name);
		}
		export function parameterName(type: Type): string {
			if (type.name === null) {
				throw new Error(`Type ${JSON.stringify(type)} has no name.`);
			}
			return _asTypeName(type.name);
		}
	}

	export namespace func {
		export function name(func: Func): string {
			return _asPropertyName(func.name);
		}
	}

	export namespace method {
		export function name(method: Method): string {
			return _asMethodName(method.name);
		}

		export function staticName(method: StaticMethod): string {
			return _asMethodName(method.name);
		}

		export function constructorName(method: Constructor): string {
			return _asMethodName(method.name);
		}
	}

	export namespace parameter {
		export function name(param: Param): string {
			return _asPropertyName(param.name);
		}
	}

	export namespace enumeration {
		export function caseName(c: EnumCase): string {
			return _asPropertyName(c.name);
		}
	}

	export namespace variant {
		export function caseName(c: VariantCase): string {
			return _asPropertyName(c.name);
		}
	}

	export namespace flag {
		export function name(flag: Flag): string {
			return _asPropertyName(flag.name);
		}
	}

	export namespace field {
		export function name(field: Field): string {
			return _asPropertyName(field.name);
		}
	}

	// function _asNamespaceName(name: string): string {
	// 	const parts = name.split('-');
	// 	// In VS Code namespace names start with lower case
	// 	parts[0] = parts[0][0].toLowerCase() + parts[0].substring(1);
	// 	for (let i = 1; i < parts.length; i++) {
	// 		parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
	// 	}
	// 	return parts.join('');
	// }

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

	export namespace pack {
		export function name(pkg: Package): string {
			let name = pkg.name;
			let index = name.indexOf(':');
			if (index >= 0) {
				name = name.substring(index + 1);
			}
			index = name.lastIndexOf('@');
			if (index >= 0) {
				name = name.substring(0, index);
			}
			return toTs(name);
		}
		export function fileName(pkg: Package): string {
			return `${name(pkg)}.ts`;
		}
		export function importName(pkg: Package): string {
			return name(pkg);
		}
		export function parts(pkg: Package): PackageNameParts {
			let namespace: string | undefined;
			let version: string | undefined;
			let name = pkg.name;
			let index = name.indexOf(':');
			if (index >= 0) {
				namespace = name.substring(0, index);
				name = name.substring(index + 1);
			}
			index = name.lastIndexOf('@');
			if (index >= 0) {
				version = name.substring(index + 1);
				name = name.substring(0, index);
			}

			return { namespace, name, version };
		}
	}

	export namespace world {
		export function name(world: World): string {
			return toTs(world.name);
		}
		export function fileName(world: World): string {
			return `${name(world)}.ts`;
		}
	}

	export namespace iface {
		export function typeName(iface: Interface): string {
			return toTs(iface.name);
		}
		export function moduleName(iface: Interface): string {
			return toTs(iface.name);
		}
		export function propertyName(iface: Interface): string {
			return toTs(iface.name);
		}
	}

	export namespace type {
		export function name(type: Type | VariantCase): string {
			if (type.name === null) {
				throw new Error(`Type ${JSON.stringify(type)} has no name.`);
			}
			return toTs(type.name);
		}
		export function parameterName(type: Type): string {
			if (type.name === null) {
				throw new Error(`Type ${JSON.stringify(type)} has no name.`);
			}
			return toTs(type.name);
		}
	}

	export namespace func {
		export function name(func: Func): string {
			return toTs(func.name);
		}
	}

	export namespace method {
		export function name(method: Method): string {
			return _asMethodName(method.name);
		}
		export function staticName(method: StaticMethod): string {
			return _asMethodName(method.name);
		}
		export function constructorName(method: Constructor): string {
			return _asMethodName(method.name);
		}
	}

	export namespace parameter {
		export function name(param: Param): string {
			return toTs(param.name);
		}
	}

	export namespace enumeration {
		export function caseName(c: EnumCase): string {
			return toTs(c.name);
		}
	}

	export namespace variant {
		export function caseName(c: VariantCase): string {
			return toTs(c.name);
		}
	}

	export namespace flag {
		export function name(flag: Flag): string {
			return toTs(flag.name);
		}
	}

	export namespace field {
		export function name(field: Field): string {
			return toTs(field.name);
		}
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

		let name: string | undefined = type.name !== null ? this.nameProvider.type.name(type) : undefined;
		if (name === undefined) {
			throw new Error(`Type ${JSON.stringify(type)} has no name.`);
		}
		if (type.owner !== null) {
			if (Owner.isInterface(type.owner)) {
				const iface = this.symbols.getInterface(type.owner.interface);
				return `${this.symbols.interfaces.getFullyQualifiedModuleName(iface)}.${name}`;
			} else if (Owner.isWorld(type.owner)) {
				const world = this.symbols.getWorld(type.owner.world);
				return `${this.symbols.worlds.getFullyQualifiedName(world)}.${name}`;
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
	private readonly options: ResolvedOptions;

	constructor(symbols: SymbolTable, nameProvider: NameProvider, options: ResolvedOptions) {
		this.symbols = symbols;
		this.nameProvider = nameProvider;
		this.options = options;
	}

	getFullyQualifiedModuleName(iface: Interface | number, separator: string = '.'): string {
		if (typeof iface === 'number') {
			iface = this.symbols.getInterface(iface);
		}
		let qualifier: string = '';
		if (iface.world !== undefined) {
			qualifier = `${iface.world.kind}.`;
		}
		if (this.options.singleWorld) {
			return `${qualifier}${this.nameProvider.iface.moduleName(iface)}`;
		} else {
			const pkg = this.symbols.getPackage(iface.package);
			return `${this.nameProvider.pack.name(pkg)}${separator}${qualifier}${this.nameProvider.iface.moduleName(iface)}`;
		}
	}

	getFullyQualifiedTypeName(iface: Interface | number, separator: string = '.'): string {
		if (typeof iface === 'number') {
			iface = this.symbols.getInterface(iface);
		}
		if (this.options.singleWorld) {
			return this.nameProvider.iface.moduleName(iface);
		} else {
			const pkg = this.symbols.getPackage(iface.package);
			return `${this.nameProvider.pack.name(pkg)}${separator}${this.nameProvider.iface.typeName(iface)}`;
		}
	}
}

class Worlds {

	private readonly symbols: SymbolTable;
	private readonly nameProvider: NameProvider;
	private readonly options: ResolvedOptions;

	constructor(symbols: SymbolTable, nameProvider: NameProvider, options: ResolvedOptions) {
		this.symbols = symbols;
		this.nameProvider = nameProvider;
		this.options = options;
	}

	getFullyQualifiedName(world: World | number, separator: string = '.'): string {
		if (typeof world === 'number') {
			world = this.symbols.getWorld(world);
		}
		if (this.options.singleWorld) {
			return this.nameProvider.world.name(world);
		} else {
			const pkg = this.symbols.getPackage(world.package);
			return `${this.nameProvider.pack.name(pkg)}${separator}${this.nameProvider.world.name(world)}`;
		}
	}
}

class SymbolTable {

	private readonly document: Document;
	private readonly methods: Map<AbstractType, (Method | StaticMethod | Constructor)[]>;

	public readonly worlds: Worlds;
	public readonly	interfaces: Interfaces;
	public readonly types: Types;


	constructor(document: Document, nameProvider: NameProvider, options: ResolvedOptions) {
		this.document = document;
		this.methods = new Map();
		this.worlds = new Worlds(this, nameProvider, options);
		this.interfaces = new Interfaces(this, nameProvider, options);
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

	public getWorldIndex(world: World): number {
		return this.document.worlds.indexOf(world);
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
	export const WasmContext = `${qualifier}.WasmContext`;
	export const Module: string = `${qualifier}.Module`;
	export const Handle: string = `${qualifier}.Handle`;
	export const Resource: string = `${qualifier}.Resource`;
	export const ResourceManager: string = `${qualifier}.ResourceManager`;
	export const DefaultResource: string = `${qualifier}.Resource.Default`;
	export const ResourceType: string = `${qualifier}.ResourceType`;
	export const ResourceHandle: string = `${qualifier}.ResourceHandle`;
	export const ResourceHandleType: string = `${qualifier}.ResourceHandleType`;
	export const ResourceRepresentation: string = `${qualifier}.ResourceRepresentation`;
	export const OwnType: string = `${qualifier}.OwnType`;
	export const FunctionType: string = `${qualifier}.FunctionType`;
	export const WasmInterfaces: string = `${qualifier}.WasmInterfaces`;
	export const imports: string = `${qualifier}.$imports`;
	export const exports: string = `${qualifier}.$exports`;
	export const InterfaceType: string = `${qualifier}.InterfaceType`;
	export const WorldType: string = `${qualifier}.WorldType`;
	export const WorkerConnection: string = `${qualifier}.WorkerConnection`;
	export const MainConnection: string = `${qualifier}.MainConnection`;
	export const ComponentModelContext: string = `${qualifier}.ComponentModelContext`;
	export const ImportPromisify: string = `${qualifier}.$imports.Promisify`;
	export const ExportPromisify: string = `${qualifier}.$exports.Promisify`;
	export const Code: string = `${qualifier}.Code`;
	export const ConnectionPort = `${qualifier}.RAL.ConnectionPort`;
	export const bind = `${qualifier}.$main.bind`;

	export function qualify(name: string): string {
		return `${qualifier}.${name}`;
	}

	export class TypePrinter extends AbstractTypePrinter<TypeUsage | { usage: TypeUsage.function; replace: string }> {

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
				return this.nameProvider.type.name(type);
			}
			return super.print(type, usage);
		}

		public printReference(type: ReferenceType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.type.name(type);
			}
			return super.printReference(type, usage);
		}

		public printBase(type: BaseType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.type.name(type);
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
					case 'f32':
					case 'float32':
						return `new ${qualifier}.Float32ArrayType()`;
					case 'f64':
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
			return this.nameProvider.type.name(type);
		}

		public printEnum(type: EnumType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
		}

		public printFlags(type: FlagsType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
		}

		public printVariant(type: VariantType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
		}

		public printResource(type: ResourceType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
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
				case 'float32':
					return qualify('float32');
				case 'f64':
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
					case 'f32':
					case 'float32':
						return 'Float32Array';
					case 'f64':
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
			if (depth > 0) {
				this.imports.addBaseType('borrow');
			}
			return depth === 0 ? borrowed : `borrow<${borrowed}>`;
		}

		public printOwnHandle(type: OwnHandleType, depth: number): string {
			const owned = this.printTypeReference(type.kind.handle.own, depth + 1);
			if (depth > 0) {
				this.imports.addBaseType('own');
			}
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
				return this.nameProvider.type.name(type);
			}
			return super.print(type, usage);
		}

		public printReference(type: ReferenceType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.type.name(type);
			}
			return super.printReference(type, usage);
		}

		public printBase(type: BaseType, usage: TypeUsage): string {
			if (type.name !== null && (usage === TypeUsage.parameter || usage === TypeUsage.function || usage === TypeUsage.property)) {
				return this.nameProvider.type.name(type);
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
					case 'f32':
					case 'float32':
						return 'Float32Array';
					case 'f64':
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
			return this.nameProvider.type.name(type);
		}

		public printEnum(type: EnumType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
		}

		public printFlags(type: FlagsType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
		}

		public printVariant(type: VariantType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
		}

		public printResource(type: ResourceType, _usage: TypeUsage): string {
			return this.nameProvider.type.name(type);
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
				case 'float32':
					this.imports.addBaseType('float32');
					return 'float32';
				case 'f64':
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
		['f32', 'f32'],
		['float32', 'f32'],
		['f64', 'f64'],
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
		this.flattenParamType(result, param.type, this.nameProvider.parameter.name(param));
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
			result.push({ name: `${prefix}_${this.nameProvider.type.parameterName(type)}`, type: 'i32' });
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
				this.flattenParamType(result, field.type, `${prefix}_${this.nameProvider.field.name(field)}`);
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
			return `${prefix}_${this.nameProvider.type.parameterName(type)}`;
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

type EmitterContext = {
	readonly symbols: SymbolTable;
	readonly printers: Printers;
	readonly nameProvider: NameProvider;
	readonly typeFlattener: TypeFlattener;
	readonly options: ResolvedOptions;
	readonly ifaceEmitters: Map<Interface, InterfaceEmitter>;
	readonly typeEmitters: Map<Type, TypeEmitter>;
};

abstract class Emitter {

	protected readonly context: EmitterContext;

	constructor(context: EmitterContext) {
		this.context = context;
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

	public emitWasmInterface(_code: Code, _qualifier?: string) : void {
	}

	public emitWasmExport(_code: Code, _property: string) : void {
		throw new Error('Needs to be implemented in concrete subclasses');
	}

	public emitWorldMember(_code: Code, _scope: 'imports' | 'exports') : void {
		throw new Error('Needs to be implemented in concrete subclasses');
	}

	public emitWorldWasmImport(_code: Code): void {
		throw new Error('Needs to be implemented in concrete subclasses');
	}

	public emitWorldWasmExport(_code: Code): void {
		throw new Error('Needs to be implemented in concrete subclasses');
	}

	public emitHost(_code: Code) : void {
	}
}

class DocumentEmitter {

	private readonly document: Document;
	private readonly options: ResolvedOptions;
	private readonly mainCode: Code;
	private readonly nameProvider: NameProvider;
	private readonly packages: { emitter: PackageEmitter; code: Code }[];
	private readonly exports: string[];

	constructor(document: Document, options: ResolvedOptions) {
		this.document = document;
		this.options = options;
		this.mainCode = new Code();
		this.nameProvider = this.options.nameStyle === 'wit' ? WitNameProvider : TypeScriptNameProvider;
		this.packages = [];
		this.exports = [];
	}

	public build(): void {
		const regExp = this.options.filter !== undefined ? new RegExp(`${this.options.filter}:`) : undefined;
		const package2Worlds: Map<number, World[]> = new Map();
		for (const world of this.document.worlds) {
			// Ignore import worlds. They are used to include in other worlds
			// which again are flattened by the wit parser.
			if (world.name === 'imports') {
				continue;
			}
			const worlds = package2Worlds.get(world.package);
			if (worlds === undefined) {
				package2Worlds.set(world.package, [world]);
			} else {
				worlds.push(world);
			}
		}
		const ifaceEmitters: Map<Interface, InterfaceEmitter> = new Map();
		const typeEmitters: Map<Type, TypeEmitter> = new Map();
		for (const [index, pkg] of this.document.packages.entries()) {
			if (regExp !== undefined && !regExp.test(pkg.name)) {
				continue;
			}

			const code = new Code();
			const symbols = new SymbolTable(this.document, this.nameProvider, this.options);
			const printers: Printers = {
				typeScript: new TypeScript.TypePrinter(symbols, this.nameProvider, code.imports),
				metaModel: new MetaModel.TypePrinter(symbols, this.nameProvider, code.imports)
			};
			const typeFlattener = new TypeFlattener(symbols, this.nameProvider, code.imports);
			const context: EmitterContext = { symbols, printers, nameProvider: this.nameProvider, typeFlattener, options: this.options, ifaceEmitters: ifaceEmitters, typeEmitters };

			const pkgEmitter = new PackageEmitter(pkg, package2Worlds.get(index) ?? [], context);
			pkgEmitter.build();
			this.packages.push({ emitter: pkgEmitter, code });
		}
	}

	public postBuild(): void {
		for (const pack of this.packages) {
			pack.emitter.postBuild();
		}
	}

	public emit(): void {
		const typeDeclarations: string[] = [];
		if (this.packages.length === 1 && this.packages[0].emitter.hasSingleWorlds() && this.options.structure === 'auto') {
			this.options.singleWorld = true;
			const { emitter, code } = this.packages[0];
			const world = emitter.getWorld(0);
			const fileName = this.nameProvider.world.fileName(world.world);
			emitter.emit(code);
			fs.writeFileSync(path.join(this.options.outDir, fileName), code.toString());
			return;
		} else {
			for (const { emitter, code } of this.packages) {
				const pkgName = emitter.pkgName;
				emitter.emit(code);
				this.exports.push(pkgName);
				const fileName = this.nameProvider.pack.fileName(emitter.pkg);
				fs.writeFileSync(path.join(this.options.outDir, fileName), code.toString());
				this.mainCode.push(`import { ${pkgName} } from './${this.nameProvider.pack.importName(emitter.pkg)}';`);
				typeDeclarations.push(`${pkgName}?: ${pkgName}`);
			}
		}

		if (this.packages.length === 1 && this.options.structure !== 'namespace') {
			return;
		}

		const pkg = this.packages[0].emitter.pkg;
		const parts = this.nameProvider.pack.parts(pkg);
		if (parts.namespace === undefined) {
			return;
		}
		const code = this.mainCode;
		const namespace = parts.namespace;
		code.push();

		code.push(`namespace ${namespace}._ {`);
		code.increaseIndent();

		code.push(`export const packages: Map<string, ${MetaModel.qualifier}.PackageType> =  new Map<string, ${MetaModel.qualifier}.PackageType>([`);
		code.increaseIndent();
		for (const { emitter } of this.packages) {
			const pkgName = this.nameProvider.pack.name(emitter.pkg);
			code.push(`['${pkgName}', ${pkgName}._],`);
		}
		code.decreaseIndent();
		code.push(`]);`);

		code.decreaseIndent();
		code.push(`}`);
		code.push(`export { ${this.exports.join(', ')} };`);
		code.push(`export default ${namespace};`);
		fs.writeFileSync(path.join(this.options.outDir, `${namespace}.ts`), code.toString());
	}
}

class PackageEmitter extends Emitter {

	public readonly pkg: Package;
	private worlds: World[];
	public readonly pkgName: string;
	private ifaceEmitters: InterfaceEmitter[];
	private worldEmitters: WorldEmitter[];

	constructor(pkg: Package, worlds: World[], context: EmitterContext) {
		super(context);
		this.pkg = pkg;
		this.worlds = worlds;
		this.pkgName = context.nameProvider.pack.name(pkg);
		this.ifaceEmitters = [];
		this.worldEmitters = [];
	}

	public getId(): string {
		return this.pkg.name;
	}

	public hasSingleWorlds(): boolean {
		return this.worldEmitters.length === 1;
	}

	public getWorld(index: number): WorldEmitter {
		return this.worldEmitters[index];
	}

	public build(): void {
		const { symbols } = this.context;
		for (const ref of Object.values(this.pkg.interfaces)) {
			const iface = symbols.getInterface(ref);
			const emitter = new InterfaceEmitter(iface, this.pkg, this.context);
			emitter.build();
			this.ifaceEmitters.push(emitter);
		}
		for (const world of this.worlds) {
			const emitter = new WorldEmitter(world, this.pkg, this.context);
			emitter.build();
			this.worldEmitters.push(emitter);
		}
	}

	public postBuild(): void {
		for (const ifaceEmitter of this.ifaceEmitters) {
			ifaceEmitter.postBuild();
		}
		for (const worldEmitter of this.worldEmitters) {
			worldEmitter.postBuild();
		}
	}

	public emit(code: Code): void {
		this.emitNamespace(code);
		this.emitTypeDeclaration(code);
		this.emitMetaData(code);
		this.emitApi(code);
	}

	public emitNamespace(code: Code): void {
		const pkgName = this.pkgName;
		if (!this.context.options.singleWorld) {
			code.push(`export namespace ${pkgName} {`);
			code.increaseIndent();
		}
		for (const [index, ifaceEmitter] of this.ifaceEmitters.entries()) {
			ifaceEmitter.emitNamespace(code);
			ifaceEmitter.emitTypeDeclaration(code);
			if (index < this.ifaceEmitters.length - 1) {
				code.push('');
			}
		}
		for (const [index, worldEmitter] of this.worldEmitters.entries()) {
			worldEmitter.emitNamespace(code);
			if (index < this.worldEmitters.length - 1) {
				code.push('');
			}
		}
		if (!this.context.options.singleWorld) {
			code.decreaseIndent();
			code.push(`}`);
		}
	}

	public emitTypeDeclaration(_code: Code): void {
	}

	public emitMetaData(code: Code): void {
		const pkgName = this.pkgName;
		code.push('');
		if (!this.context.options.singleWorld) {
			code.push(`export namespace ${pkgName} {`);
			code.increaseIndent();
		}
		for (let i = 0; i < this.ifaceEmitters.length; i++) {
			const ifaceEmitter = this.ifaceEmitters[i];
			ifaceEmitter.emitMetaModel(code);
			ifaceEmitter.emitAPI(code);
			if (i < this.ifaceEmitters.length - 1) {
				code.push('');
			}
		}
		for (const [index, worldEmitter] of this.worldEmitters.entries()) {
			worldEmitter.emitMetaModel(code);
			worldEmitter.emitAPI(code);
			if (index < this.worldEmitters.length - 1) {
				code.push('');
			}
		}
		if (!this.context.options.singleWorld) {
			code.decreaseIndent();
			code.push(`}`);
		}
	}

	public emitApi(code: Code): void {
		if (this.context.options.singleWorld) {
			return;
		}
		const { nameProvider } = this.context;
		const pkgName = this.pkgName;
		code.push('');
		code.push(`export namespace ${pkgName}._ {`);
		code.increaseIndent();
		const version = this.getVersion();
		if (version !== undefined) {
			code.push(`export const version = '${version}' as const;`);
		}
		code.push(`export const id = '${this.getId()}' as const;`);
		code.push(`export const witName = '${this.getWitName()}' as const;`);
		code.push(`export const interfaces: Map<string, ${MetaModel.InterfaceType}> = new Map<string, ${MetaModel.InterfaceType}>([`);
		code.increaseIndent();
		for (let i = 0; i < this.ifaceEmitters.length; i++) {
			const ifaceEmitter = this.ifaceEmitters[i];
			const name = nameProvider.iface.moduleName(ifaceEmitter.iface);
			code.push(`['${name}', ${name}._]${i < this.ifaceEmitters.length - 1 ? ',' : ''}`);
		}
		code.decreaseIndent();
		code.push(`]);`);
		if (this.worldEmitters.length > 0) {
			code.push(`export const worlds: Map<string, ${MetaModel.WorldType}> = new Map<string, ${MetaModel.WorldType}>([`);
			code.increaseIndent();
			for (const [index, emitter] of this.worldEmitters.entries()) {
				const name = nameProvider.world.name(emitter.world);
				code.push(`['${name}', ${name}._]${index < this.ifaceEmitters.length - 1 ? ',' : ''}`);
			}
			code.decreaseIndent();
			code.push(`]);`);
		}

		code.decreaseIndent();
		code.push(`}`);
	}

	private getWitName(): string {
		let name = this.pkg.name;
		let index = name.indexOf(':');
		if (index >= 0) {
			name = name.substring(index + 1);
		}
		index = name.lastIndexOf('@');
		if (index >= 0) {
			name = name.substring(0, index);
		}
		return name;
	}

	private getVersion(): string | undefined {
		let name = this.pkg.name;
		let index = name.lastIndexOf('@');
		return index >= 0 ? name.substring(index + 1) : undefined;
	}
}

class WorldEmitter extends Emitter {
	public readonly world: World;
	private readonly pkg: Package;

	private readonly imports: {
		funcEmitters: CallableEmitter<Func>[];
		interfaceEmitters: InterfaceEmitter[];
		typeEmitters: TypeEmitter[];
		locals: {
			typeEmitters: TypeEmitter[];
			interfaceEmitter: InterfaceEmitter[];
			resourceEmitters: ResourceEmitter[];
		};
	};
	private readonly exports: {
		funcEmitters: CallableEmitter<Func>[];
		interfaceEmitters: InterfaceEmitter[];
		typeEmitters: TypeEmitter[];
		locals: {
			typeEmitters: TypeEmitter[];
			interfaceEmitter: InterfaceEmitter[];
			resourceEmitters: ResourceEmitter[];
		};
	};

	constructor(world: World, pkg: Package, context: EmitterContext) {
		super(context);
		this.world = world;
		this.pkg = pkg;
		this.imports = {
			funcEmitters: [],
			interfaceEmitters: [],
			typeEmitters: [],
			locals: {
				typeEmitters: [],
				interfaceEmitter: [],
				resourceEmitters: []
			}
		};
		this.exports = {
			funcEmitters: [],
			interfaceEmitters: [],
			typeEmitters: [],
			locals: {
				typeEmitters: [],
				interfaceEmitter: [],
				resourceEmitters: []
			}
		};
	}

	public build(): void {
		const ImportEmitter = CallableEmitter(WorldImportFunctionEmitter);
		const imports = Object.values(this.world.imports);
		for (const item of imports) {
			if (ObjectKind.isFuncObject(item)) {
				this.imports.funcEmitters.push(new ImportEmitter(item.function, this.world, this.context));
			}
		}
		const ExportEmitter = CallableEmitter(WorldExportFunctionEmitter);
		const exports = Object.values(this.world.exports);
		for (const item of exports) {
			if (ObjectKind.isFuncObject(item)) {
				this.exports.funcEmitters.push(new ExportEmitter(item.function, this.world, this.context));
			}
		}
	}

	public postBuild(): void {
		const imports = Object.keys(this.world.imports);
		for (const key of imports) {
			const item = this.world.imports[key];
			if (ObjectKind.isInterfaceObject(item)) {
				this.handleInterfaceImport(key, item);
			} else if (ObjectKind.isTypeObject(item)) {
				this.handleTypeImport(key, item);
			}
		}
		const exports = Object.keys(this.world.exports);
		for (const key of exports) {
			const item = this.world.exports[key];
			if (ObjectKind.isInterfaceObject(item)) {
				this.handleInterfaceExports(key, item);
			} else if (ObjectKind.isTypeObject(item)) {
				this.handleTypeExports(key, item);
			}
		}
	}

	public getId(): string {
		let name = this.pkg.name;
		const index = name.indexOf('@');
		let version;
		if (index >= 0) {
			version = name.substring(index + 1);
			name = name.substring(0, index);
		}
		return `${name}/${this.world.name}${version !== undefined ? `@${version}` : ''}`;
	}

	private handleInterfaceImport(name: string, item: InterfaceObject): void {
		const { symbols } = this.context;
		let iface = symbols.getInterface(item.interface);
		const emitter = this.findInterfaceEmitter(iface);
		if (emitter !== undefined) {
			this.imports.interfaceEmitters.push(emitter);
			return;
		}
		iface.world = { ref: symbols.getWorldIndex(this.world), kind: 'imports' };
		this.imports.locals.interfaceEmitter.push(this.createInterfaceEmitter(name, iface));
	}

	private handleInterfaceExports(name: string, item: InterfaceObject): void {
		const { symbols } = this.context;
		let iface = symbols.getInterface(item.interface);
		const emitter = this.findInterfaceEmitter(iface);
		if (emitter !== undefined) {
			this.exports.interfaceEmitters.push(emitter);
			return;
		}
		iface.world = { ref: symbols.getWorldIndex(this.world), kind: 'exports' };
		this.exports.locals.interfaceEmitter.push(this.createInterfaceEmitter(name, iface));
	}

	private findInterfaceEmitter(iface: Interface): InterfaceEmitter | undefined {
		return this.context.ifaceEmitters.get(iface);
	}

	private createInterfaceEmitter(name: string, iface: Interface): InterfaceEmitter {
		if (iface.name === null) {
			iface = Object.assign(Object.create(null), iface, { name });
		} else if (iface.name.match(/interface-\d+/)) {
			throw new Error(`Invalid interface name: ${iface.name}`);
		}
		const result = new InterfaceEmitter(iface, this.world, this.context);
		result.build();
		const { symbols } = this.context;
		symbols.resolveOwner;
		return result;
	}

	private handleTypeImport(name: string, item: TypeObject): void {
		const { symbols } = this.context;
		if (TypeReference.isString(item.type)) {
			throw new Error(`Named type references are not supported in worlds. Type: ${item.type}`);
		}
		const type = symbols.getType(item.type);
		const emitter = this.findTypeEmitter(type);
		if (emitter !== undefined) {
			this.imports.typeEmitters.push(emitter);
			return;
		}
		this.imports.locals.typeEmitters.push(this.createTypeEmitter(name, type));
	}

	private handleTypeExports(name: string, item: TypeObject): void {
		const { symbols } = this.context;
		if (TypeReference.isString(item.type)) {
			throw new Error(`Named type references are not supported in worlds. Type: ${item.type}`);
		}
		const type = symbols.getType(item.type);
		const emitter = this.findTypeEmitter(type);
		if (emitter !== undefined) {
			this.exports.typeEmitters.push(emitter);
			return;
		}
		this.exports.locals.typeEmitters.push(this.createTypeEmitter(name, type));
	}

	private findTypeEmitter(type: Type): TypeEmitter | undefined {
		return this.context.typeEmitters.get(type);
	}

	private createTypeEmitter(name: string, type: Type): TypeEmitter {
		if (type.name === null) {
			type = Object.assign(Object.create(null), type, { name });
		}
		const result = TypeEmitter.create(type, this.world, this.context);
		return result;
	}

	public emitNamespace(code: Code): void {
		const { nameProvider } = this.context;

		code.push(`export namespace ${nameProvider.world.name(this.world)} {`);
		code.increaseIndent();
		for (const emitter of [...this.imports.locals.typeEmitters, ...this.exports.locals.typeEmitters]) {
			emitter.emitNamespace(code);
		}
		if (this.imports.locals.interfaceEmitter.length > 0) {
			code.push(`export namespace imports {`);
			code.increaseIndent();
			for (const emitter of this.imports.locals.interfaceEmitter) {
				emitter.emitNamespace(code);
				if (emitter.hasCode()) {
					emitter.emitTypeDeclaration(code);
				}
			}
			code.decreaseIndent();
			code.push(`}`);
		}
		code.push(`export type Imports = {`);
		code.increaseIndent();
		for (const emitter of this.imports.funcEmitters) {
			emitter.emitWorldMember(code, 'imports');
		}
		for (const emitter of this.imports.interfaceEmitters.concat(this.imports.locals.interfaceEmitter)) {
			if (!emitter.hasCode()) {
				continue;
			}
			if (this.pkg !== emitter.getPkg()) {
				emitter.emitImport(code);
			}
			emitter.emitWorldMember(code, 'imports');
		}
		code.decreaseIndent();
		code.push(`};`);

		code.push(`export namespace Imports {`);
		code.increaseIndent();
		code.push(`export type Promisified = ${MetaModel.ImportPromisify}<Imports>;`);
		code.decreaseIndent();
		code.push(`}`);

		code.push(`export namespace imports {`);
		code.increaseIndent();
		code.push(`export type Promisify<T> = ${MetaModel.ImportPromisify}<T>;`);
		code.decreaseIndent();
		code.push(`}`);

		if (this.exports.locals.interfaceEmitter.length > 0) {
			code.push(`export namespace exports {`);
			code.increaseIndent();
			for (const emitter of this.exports.locals.interfaceEmitter) {
				emitter.emitNamespace(code);
				if (emitter.hasCode()) {
					emitter.emitTypeDeclaration(code);
				}
			}
			code.decreaseIndent();
			code.push(`}`);
		}
		code.push(`export type Exports = {`);
		code.increaseIndent();
		for (const emitter of this.exports.funcEmitters) {
			emitter.emitWorldMember(code, 'exports');
		}
		for (const emitter of this.exports.interfaceEmitters.concat(this.exports.locals.interfaceEmitter)) {
			if (!emitter.hasCode()) {
				continue;
			}
			if (this.pkg !== emitter.getPkg()) {
				emitter.emitImport(code);
			}
			emitter.emitWorldMember(code, 'exports');
		}
		code.decreaseIndent();
		code.push(`};`);

		code.push(`export namespace Exports {`);
		code.increaseIndent();
		code.push(`export type Promisified = ${MetaModel.ExportPromisify}<Exports>;`);
		code.decreaseIndent();
		code.push(`}`);

		code.push(`export namespace exports {`);
		code.increaseIndent();
		code.push(`export type Promisify<T> = ${MetaModel.ExportPromisify}<T>;`);
		code.decreaseIndent();
		code.push(`}`);
		code.decreaseIndent();
		code.push('}');
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.context;
		const name = nameProvider.world.name(this.world);
		code.push(`export namespace ${name}.$ {`);
		code.increaseIndent();
		for (const emitter of this.imports.locals.typeEmitters) {
			emitter.emitMetaModel(code);
		}
		for (const emitter of this.imports.typeEmitters) {
			emitter.emitMetaModel(code);
		}
		for (const emitter of this.exports.locals.typeEmitters) {
			emitter.emitMetaModel(code);
		}
		for (const emitter of this.exports.typeEmitters) {
			emitter.emitMetaModel(code);
		}
		if (this.imports.funcEmitters.length > 0) {
			code.push(`export namespace imports {`);
			code.increaseIndent();
			for (const emitter of this.imports.funcEmitters) {
				emitter.emitMetaModel(code);
			}
			for (const emitter of this.imports.locals.interfaceEmitter) {
				emitter.emitMetaModel(code);
			}
			for (const emitter of this.imports.locals.resourceEmitters) {
				emitter.emitMetaModel(code);
			}
			code.decreaseIndent();
			code.push('}');
		}
		if (this.exports.funcEmitters.length > 0) {
			code.push(`export namespace exports {`);
			code.increaseIndent();
			for (const emitter of this.exports.funcEmitters) {
				emitter.emitMetaModel(code);
			}
			for (const emitter of this.exports.locals.interfaceEmitter) {
				emitter.emitMetaModel(code);
			}
			for (const emitter of this.exports.locals.resourceEmitters) {
				emitter.emitMetaModel(code);
			}
			code.decreaseIndent();
			code.push('}');
		}
		code.decreaseIndent();
		code.push('}');
	}

	public emitAPI(code: Code): void {
		const { nameProvider } = this.context;
		const name = nameProvider.world.name(this.world);

		code.push(`export namespace ${name}._ {`);
		code.increaseIndent();

		code.push(`export const id = '${this.getId()}' as const;`);
		code.push(`export const witName = '${this.world.name}' as const;`);

		const importsAllInterfaceEmitters = this.imports.locals.interfaceEmitter.concat(this.imports.interfaceEmitters);
		const exportsAllInterfaceEmitters = this.exports.locals.interfaceEmitter.concat(this.exports.interfaceEmitters);

		if (this.imports.funcEmitters.length > 0) {
			code.push(`export type $Root = {`);
			code.increaseIndent();
			for (const emitter of this.imports.funcEmitters) {
				emitter.emitWorldWasmImport(code);
			}
			code.decreaseIndent();
			code.push(`};`);
		}

		if (this.imports.funcEmitters.length + this.imports.interfaceEmitters.length + this.exports.interfaceEmitters.reduce((acc, emitter) => acc + (emitter.hasResources() ? 1 : 0), 0) > 0) {
			code.push(`export namespace imports {`);
			code.increaseIndent();

			for (const emitter of this.imports.locals.interfaceEmitter) {
				emitter.emitAPI(code);
			}

			if (this.imports.funcEmitters.length > 0) {
				code.push(`export const functions: Map<string, ${MetaModel.FunctionType}> = new Map([`);
				code.increaseIndent();
				for (const [index, emitter] of this.imports.funcEmitters.entries()) {
					const name = nameProvider.func.name(emitter.callable);
					code.push(`['${name}', $.imports.${name}]${index < this.imports.funcEmitters.length - 1 ? ',' : ''}`);
				}
				code.decreaseIndent();
				code.push(']);');
			}
			if (importsAllInterfaceEmitters.length > 0) {
				code.push(`export const interfaces: Map<string, ${MetaModel.qualifier}.InterfaceType> = new Map<string, ${MetaModel.qualifier}.InterfaceType>([`);
				code.increaseIndent();
				for (const [index, emitter] of importsAllInterfaceEmitters.entries()) {
					const iface = emitter.iface;
					const qualifier = iface.world !== undefined ? `${iface.world.kind}.` : '';
					const name = nameProvider.iface.moduleName(emitter.iface);
					if (this.pkg === emitter.getPkg()) {
						code.push(`['${name}', ${qualifier}${name}._]${index < importsAllInterfaceEmitters.length - 1 ? ',' : ''}`);
					} else {
						const pkgName = nameProvider.pack.name(emitter.getPkg());
						code.push(`['${pkgName}.${name}', ${pkgName}.${qualifier}${name}._]${index < importsAllInterfaceEmitters.length - 1 ? ',' : ''}`);
					}
				}
				code.decreaseIndent();
				code.push(`]);`);
			}

			code.push(`export function create(service: ${name}.Imports, context: ${MetaModel.WasmContext}): Imports {`);
			code.increaseIndent();
			code.push(`return ${MetaModel.imports}.create<Imports>(_, service, context);`);
			code.decreaseIndent();
			code.push('}');

			code.push(`export function loop(service: ${name}.Imports, context: ${MetaModel.WasmContext}): ${name}.Imports {`);
			code.increaseIndent();
			code.push(`return ${MetaModel.imports}.loop<${name}.Imports>(_, service, context);`);
			code.decreaseIndent();
			code.push('}');

			code.decreaseIndent();
			code.push('}');

			code.push(`export type Imports = {`);
			code.increaseIndent();
			if (this.imports.funcEmitters.length > 0) {
				code.push(`'$root': $Root;`);
			}
			for (const emitter of importsAllInterfaceEmitters) {
				if (!emitter.hasCode()) {
					continue;
				}
				emitter.emitWorldWasmImport(code);
			}
			for (const emitter of exportsAllInterfaceEmitters) {
				if (!emitter.hasResources()) {
					continue;
				}
				emitter.emitWorldWasmExportImport(code);
			}
			code.decreaseIndent();
			code.push(`};`);
		}


		if (this.exports.funcEmitters.length + this.exports.interfaceEmitters.length  > 0) {
			code.push(`export namespace exports {`);
			code.increaseIndent();

			for (const emitter of this.exports.locals.interfaceEmitter) {
				emitter.emitAPI(code);
			}
			if (this.exports.funcEmitters.length > 0) {
				code.push(`export const functions: Map<string, ${MetaModel.FunctionType}> = new Map([`);
				code.increaseIndent();
				for (const [index, emitter] of this.exports.funcEmitters.entries()) {
					const name = nameProvider.func.name(emitter.callable);
					code.push(`['${name}', $.exports.${name}]${index < this.exports.funcEmitters.length - 1 ? ',' : ''}`);
				}
				code.decreaseIndent();
				code.push(']);');
			}
			if (exportsAllInterfaceEmitters.length > 0) {
				code.push(`export const interfaces: Map<string, ${MetaModel.qualifier}.InterfaceType> = new Map<string, ${MetaModel.qualifier}.InterfaceType>([`);
				code.increaseIndent();
				for (const [index, emitter] of exportsAllInterfaceEmitters.entries()) {
					const iface = emitter.iface;
					const qualifier = iface.world !== undefined ? `${iface.world.kind}.` : '';
					const name = nameProvider.iface.moduleName(iface);
					if (this.pkg === emitter.getPkg()) {
						code.push(`['${name}', ${qualifier}${name}._]${index < exportsAllInterfaceEmitters.length - 1 ? ',' : ''}`);
					} else {
						const pkgName = nameProvider.pack.name(emitter.getPkg());
						code.push(`['${pkgName}.${name}', ${pkgName}.${qualifier}${name}._]${index < exportsAllInterfaceEmitters.length - 1 ? ',' : ''}`);
					}
				}
				code.decreaseIndent();
				code.push(`]);`);
			}

			code.push(`export function bind(exports: Exports, context: ${MetaModel.WasmContext}): ${name}.Exports {`);
			code.increaseIndent();
			code.push(`return ${MetaModel.exports}.bind<${name}.Exports>(_, exports, context);`);
			code.decreaseIndent();
			code.push('}');

			code.decreaseIndent();
			code.push('}');

			code.push(`export type Exports = {`);
			code.increaseIndent();
			for (const emitter of this.exports.funcEmitters) {
				emitter.emitWorldWasmExport(code);
			}
			for (const emitter of exportsAllInterfaceEmitters) {
				if (!emitter.hasCode()) {
					continue;
				}
				emitter.emitWorldWasmExport(code);
			}
			code.decreaseIndent();
			code.push(`};`);
		}

		code.push(`export function bind(service: ${name}.Imports, code: ${MetaModel.Code}, context?: ${MetaModel.ComponentModelContext}): Promise<${name}.Exports>;`);
		code.push(`export function bind(service: ${name}.Imports.Promisified, code: ${MetaModel.Code}, port: ${MetaModel.ConnectionPort}, context?: ${MetaModel.ComponentModelContext}): Promise<${name}.Exports.Promisified>;`);
		code.push(`export function bind(service: ${name}.Imports | ${name}.Imports.Promisified, code: ${MetaModel.Code}, portOrContext?: ${MetaModel.ConnectionPort} | ${MetaModel.ComponentModelContext}, context?: ${MetaModel.ComponentModelContext} | undefined): Promise<${name}.Exports> | Promise<${name}.Exports.Promisified> {`);
		code.increaseIndent();
		code.push(`return ${MetaModel.bind}(_, service, code, portOrContext, context);`);
		code.decreaseIndent();
		code.push(`}`);

		code.decreaseIndent();
		code.push('}');
	}
}

class InterfaceEmitter extends Emitter {

	public readonly container: Package | World;
	public readonly iface: Interface;
	private typeEmitters: TypeEmitter[];
	private functionEmitters: CallableEmitter<Func>[];
	private resourceEmitters: ResourceEmitter[];

	constructor(iface: Interface, container: Package | World, context: EmitterContext) {
		super(context);
		this.iface = iface;
		this.container = container;
		this.typeEmitters = [];
		this.functionEmitters = [];
		this.resourceEmitters = [];
		context.ifaceEmitters.set(iface, this);
	}

	public getPkg(): Package {
		const { symbols } = this.context;
		if (World.is(this.container)) {
			return symbols.getPackage(this.container.package);
		} else {
			return this.container;
		}
	}

	public getId(): string {
		const pkg = this.getPkg();
		let name = pkg.name;
		const index = name.indexOf('@');
		let version;
		if (index >= 0) {
			version = name.substring(index + 1);
			name = name.substring(0, index);
		}
		return `${name}/${this.iface.name}${version !== undefined ? `@${version}` : ''}`;
	}

	public hasVersion(): boolean {
		return this.getPkg().name.indexOf('@') >= 0;
	}

	public build(): void {
		const { symbols } = this.context;
		for (const t of Object.values(this.iface.types)) {
			const type = symbols.getType(t);
			const emitter = TypeEmitter.create(type, this.iface, this.context);
			if (emitter instanceof ResourceEmitter) {
				this.resourceEmitters.push(emitter);
			} else {
				this.typeEmitters.push(emitter);
			}
		}
		const Emitter = CallableEmitter(FunctionEmitter);
		for (const func of Object.values(this.iface.functions)) {
			if (!Callable.isFunction(func)) {
				continue;
			}
			this.functionEmitters.push(new Emitter(func, this.iface, this.context));
		}
	}

	public postBuild(): void {
	}

	public hasCode(): boolean {
		return this.functionEmitters.length > 0 || this.resourceEmitters.length > 0;
	}

	public hasResources(): boolean {
		return this.resourceEmitters.length > 0;
	}

	public emitNamespace(code: Code): void {
		const { nameProvider } = this.context;
		const name = nameProvider.iface.moduleName(this.iface);
		this.emitDocumentation(this.iface, code);
		code.push(`export namespace ${name} {`);
		code.increaseIndent();
		const emitters = [...this.typeEmitters, ...this.resourceEmitters, ...this.functionEmitters];
		for (const [index, type] of emitters.entries()) {
			type.emitNamespace(code);
			if (index < emitters.length - 1) {
				code.push('');
			}
		}
		code.decreaseIndent();
		code.push(`}`);
	}

	public emitTypeDeclaration(code: Code): void {
		const { nameProvider } = this.context;
		const name = nameProvider.iface.typeName(this.iface);
		code.push(`export type ${name} = {`);
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
		const { nameProvider, symbols } = this.context;
		const name = nameProvider.iface.moduleName(this.iface);
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
		const { nameProvider } = this.context;
		const name = nameProvider.iface.moduleName(this.iface);
		const types: string[] = [];
		const resources: string[] = [];
		for (const type of this.typeEmitters) {
			types.push(nameProvider.type.name(type.type));
		}
		for (const resource of this.resourceEmitters) {
			const name = nameProvider.type.name(resource.resource);
			types.push(name);
			resources.push(name);
		}
		code.push(`export namespace ${name}._ {`);
		code.increaseIndent();
		code.push(`export const id = '${this.getId()}' as const;`);
		code.push(`export const witName = '${this.iface.name}' as const;`);
		for (const emitter of this.resourceEmitters) {
			emitter.emitAPI(code);
		}
		let qualifier = '';
		if (this.iface.world !== undefined) {
			// calculator.$.imports.Iface.
			const { symbols } = this.context;
			const world = symbols.getWorld(this.iface.world.ref);
			qualifier = `${nameProvider.world.name(world)}.$.${this.iface.world.kind}.${nameProvider.iface.typeName(this.iface)}.`;
		}
		if (types.length > 0) {
			code.push(`export const types: Map<string, ${MetaModel.qualifier}.AnyComponentModelType> = new Map<string, ${MetaModel.qualifier}.AnyComponentModelType>([`);
			code.increaseIndent();
			for (let i = 0; i < types.length; i++) {
				code.push(`['${types[i]}', ${qualifier}$.${types[i]}]${i < types.length - 1 ? ',' : ''}`);
			}
			code.decreaseIndent();
			code.push(']);');
		}
		if (this.functionEmitters.length > 0) {
			code.push(`export const functions: Map<string, ${MetaModel.FunctionType}> = new Map([`);
			code.increaseIndent();
			for (let i = 0; i < this.functionEmitters.length; i++) {
				const name = nameProvider.func.name(this.functionEmitters[i].callable);
				code.push(`['${name}', ${qualifier}$.${name}]${i < this.functionEmitters.length - 1 ? ',' : ''}`);
			}
			code.decreaseIndent();
			code.push(']);');
		}
		if (resources.length > 0) {
			const mapType = `Map<string, ${MetaModel.qualifier}.ResourceType>`;
			code.push(`export const resources: ${mapType} = new ${mapType}([`);
			code.increaseIndent();
			for (const [index, resource] of resources.entries()) {
				code.push(`['${resource}', ${qualifier}$.${resource}]${index < resources.length - 1 ? ',' : ''}`);
			}
			code.decreaseIndent();
			code.push(']);');
		}
		code.push(`export type WasmInterface = {`);
		code.increaseIndent();
		for(const func of this.functionEmitters) {
			func.emitWasmInterface(code);
		}
		code.decreaseIndent();
		code.push(`};`);
		if (this.functionEmitters.length + this.resourceEmitters.length > 0) {
			code.push('export namespace imports {');
			code.increaseIndent();
			if (this.resourceEmitters.length > 0) {
				const resourceWasmInterfaces: string[] = [];
				for (const emitter of this.resourceEmitters) {
					resourceWasmInterfaces.push(`${nameProvider.type.name(emitter.resource)}.imports.WasmInterface`);
				}
				code.push(`export type WasmInterface = _.WasmInterface & ${resourceWasmInterfaces.join(' & ')};`);
			} else {
				code.push('export type WasmInterface = _.WasmInterface;');
			}
			code.decreaseIndent();
			code.push('}');

			code.push('export namespace exports {');
			code.increaseIndent();
			if (this.resourceEmitters.length > 0) {
				const resourceWasmInterfaces: string[] = [];
				for (const emitter of this.resourceEmitters) {
					resourceWasmInterfaces.push(`${nameProvider.type.name(emitter.resource)}.exports.WasmInterface`);
				}
				code.push(`export type WasmInterface = _.WasmInterface & ${resourceWasmInterfaces.join(' & ')};`);
			} else {
				code.push('export type WasmInterface = _.WasmInterface;');
			}
			if (this.resourceEmitters.length > 0) {
				code.push('export namespace imports {');
				code.increaseIndent();
				code.push(`export type WasmInterface = {`);
				code.increaseIndent();
				for (const emitter of this.resourceEmitters) {
					emitter.emitWasmExportImport(code);
				}
				code.decreaseIndent();
				code.push(`};`);
				code.decreaseIndent();
				code.push('}');
			}

			code.decreaseIndent();
			code.push(`}`);
		}
		code.decreaseIndent();
		code.push(`}`);
	}

	public emitImport(code: Code): void {
		const { nameProvider } = this.context;
		const name = nameProvider.pack.name(this.getPkg());
		code.imports.add(name, `./${name}`);
	}

	public emitWorldMember(code: Code, scope: 'imports' | 'exports'): void {
		const { symbols, nameProvider } = this.context;
		const name = World.is(this.container) ? `${scope}.${nameProvider.iface.typeName(this.iface)}` : symbols.interfaces.getFullyQualifiedTypeName(this.iface);
		code.push(`${nameProvider.iface.propertyName(this.iface)}: ${name};`);
	}

	public emitWorldWasmImport(code: Code): void {
		const { symbols } = this.context;
		const [name, version] = this.getQualifierAndVersion(this.getPkg());
		const property = `${name}/${this.iface.name}${version !== undefined ? `@${version}` : ''}`;
		code.push(`'${property}': ${symbols.interfaces.getFullyQualifiedModuleName(this.iface)}._.imports.WasmInterface;`);
	}

	public emitWorldWasmExportImport(code: Code): void {
		const { symbols } = this.context;
		const [name, version] = this.getQualifierAndVersion(this.getPkg());
		const property = `[export]${name}/${this.iface.name}${version !== undefined ? `@${version}` : ''}`;
		code.push(`'${property}': ${symbols.interfaces.getFullyQualifiedModuleName(this.iface)}._.exports.imports.WasmInterface;`);
	}

	public emitWorldWasmExport(code: Code): void {
		const [name, version] = this.getQualifierAndVersion(this.getPkg());
		const property = `${name}/${this.iface.name}${version !== undefined ? `@${version}` : ''}`;
		for (const func of this.functionEmitters) {
			func.emitWasmExport(code, property);
		}
		for (const resource of this.resourceEmitters) {
			resource.emitWasmExport(code);
		}
	}

	public emitWorldCreateImport(code: Code, result: string): void {
		const { symbols, nameProvider } = this.context;
		const [name, version] = this.getQualifierAndVersion(this.getPkg());
		const property = `${name}/${this.iface.name}${version !== undefined ? `@${version}` : ''}`;
		code.push(`${result}['${property}'] = ${symbols.interfaces.getFullyQualifiedModuleName(this.iface)}._.imports.create(service.${nameProvider.iface.propertyName(this.iface)}, context);`);
	}

	public emitWorldBindExport(code: Code, result: string): void {
		const { symbols, nameProvider } = this.context;
		const qualifier = `${symbols.interfaces.getFullyQualifiedModuleName(this.iface)}._`;
		code.push(`${result}.${nameProvider.iface.propertyName(this.iface)} = ${qualifier}.exports.bind(${qualifier}.exports.filter(exports, context), context);`);
	}

	public getFullQualifiedTypeName(): string {
		const { nameProvider, options } = this.context;
		const ifaceName = nameProvider.iface.typeName(this.iface);
		if (options.singleWorld) {
			if (Package.is(this.container)) {
				return ifaceName;
			} else {
				return `${nameProvider.world.name(this.container)}.${ifaceName}`;
			}
		} else {
			const pkg = nameProvider.pack.name(this.getPkg());
			if (Package.is(this.container)) {
				return `${pkg}.${ifaceName}`;
			} else {
				return `${pkg}.${nameProvider.world.name(this.container)}.${ifaceName}`;
			}
		}
	}

	private getQualifierAndVersion(pkg: Package): [string, string | undefined] {
		let name = pkg.name;
		let version: string | undefined;
		let index = name.lastIndexOf('@');
		if (index >= 0) {
			version = name.substring(index + 1);
			name = name.substring(0, index);
		}
		return [name, version];
	}
}

class MemberEmitter extends Emitter {

	protected readonly container: Interface | World;
	protected readonly member: Type | Callable;
	protected readonly owner: Interface | World | undefined;

	constructor(container: Interface | World, member: Type | Callable, context: EmitterContext) {
		super(context);
		this.container = container;
		this.member = member;
		this.owner = this.getOwner();
	}

	private getOwner(): Interface  | World | undefined {
		const { symbols } = this.context;
		const member = this.member;
		if (Callable.is(member)) {
			if (Callable.isFunction(member)) {
				return this.container;
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
		return `${this.getOwnerName(this.owner)}.`;
	}

	protected getQualifier(): string {
		if (this.owner === undefined) {
			return '';
		}
		const { symbols, nameProvider, options } = this.context;
		let ownerName = this.getOwnerName(this.owner);
		if (Interface.is(this.owner)) {
			// The interface is local to a world
			if (this.owner.world !== undefined) {
				const world = symbols.getWorld(this.owner.world.ref);
				ownerName = `${nameProvider.world.name(world)}.${this.owner.world.kind}.${ownerName}`;
			}
		}
		if (options.singleWorld) {
			return `${ownerName}.`;
		} else {
			const pkg = nameProvider.pack.name(symbols.getPackage(this.owner.package));
			return `${pkg}.${ownerName}.`;
		}
	}

	protected getOwnerName(owner: Interface | World): string {
		const { nameProvider } = this.context;
		return Interface.is(owner) ? nameProvider.iface.moduleName(owner) : nameProvider.world.name(owner);
	}

	protected getContainerName(): string {
		const { nameProvider } = this.context;
		return Interface.is(this.container) ? nameProvider.iface.moduleName(this.container) : nameProvider.world.name(this.container);
	}
}

class FunctionEmitter extends MemberEmitter {

	public readonly func: Func;
	public readonly callable: Func;

	constructor(func: Func, container: Interface | World, context: EmitterContext) {
		super(container, func, context);
		this.func = func;
		this.callable = func;
	}

	public getName(): string {
		return this.context.nameProvider.func.name(this.func);
	}

	public doEmitNamespace(code: Code, params: string[], returnType: string | undefined): void {
		if (returnType === undefined) {
			returnType = 'void';
		}
		const name = this.context.nameProvider.func.name(this.func);
		code.push(`export type ${name} = (${params.join(', ')}) => ${returnType};`);
	}

	public emitTypeDeclaration(code: Code): void {
		const name = this.context.nameProvider.func.name(this.func);
		code.push(`${name}: ${this.getMergeQualifier()}${name};`);
	}

	public doEmitMetaModel(code: Code, params: string[][], result: string | undefined): void {
		const name = this.context.nameProvider.func.name(this.func);
		if (params.length === 0) {
			code.push(`export const ${name} = new $wcm.FunctionType<${this.getTypeParam()}>('${this.func.name}', [], ${result});`);
		} else {
			code.push(`export const ${name} = new $wcm.FunctionType<${this.getTypeParam()}>('${this.func.name}',[`);
			code.increaseIndent();
			for (const [name, type] of params) {
				code.push(`['${name}', ${type}],`);
			}
			code.decreaseIndent();
			code.push(`], ${result});`);
		}
	}

	protected getTypeParam(): string {
		const name = this.context.nameProvider.func.name(this.func);
		const qualifier = this.getQualifier();
		return `${qualifier}${name}`;
	}
}

class WorldImportFunctionEmitter extends FunctionEmitter {

	constructor(func: Func, world: World, context: EmitterContext) {
		super(func, world, context);
	}

	protected getTypeParam(): string {
		const name = this.context.nameProvider.func.name(this.func);
		const qualifier = this.getMergeQualifier();
		return `${qualifier}Imports['${name}']`;
	}
}

class WorldExportFunctionEmitter extends FunctionEmitter {

	constructor(func: Func, world: World, context: EmitterContext) {
		super(func, world, context);
	}

	protected getTypeParam(): string {
		const name = this.context.nameProvider.func.name(this.func);
		const qualifier = this.getMergeQualifier();
		return `${qualifier}Exports['${name}']`;
	}
}

class InterfaceMemberEmitter extends MemberEmitter {

	constructor(container: Interface, member: Type | Callable, context: EmitterContext) {
		super(container, member, context);
	}
}

class TypeDeclarationEmitter extends MemberEmitter {

	public readonly type: Type;

	constructor(type: Type, container: Interface | World, context: EmitterContext) {
		super(container, type, context);
		this.type = type;
		context.typeEmitters.set(type, this);
	}

	public emitNamespace(code: Code): void {
		const { nameProvider, printers } = this.context;
		const name = nameProvider.type.name(this.type);
		this.emitDocumentation(this.type, code);
		code.push(`export type ${name} = ${printers.typeScript.print(this.type, TypeUsage.typeDeclaration)};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider, printers } = this.context;
		const name = nameProvider.type.name(this.type);
		code.push(`export const ${name} = ${printers.metaModel.print(this.type, TypeUsage.typeDeclaration)};`);
	}
}

class TypeReferenceEmitter extends MemberEmitter {

	public readonly type: Type;

	constructor(type: Type, container: Interface | World, context: EmitterContext) {
		super(container, type, context);
		this.type = type;
		this.context.typeEmitters.set(type, this);
	}

	public emitNamespace(code: Code): void {
		if (!TypeKind.isReference(this.type.kind)) {
			throw new Error('Expected reference type');
		}
		const { nameProvider } = this.context;
		const referencedTypeName = this.getReferenceName(code, '');
		const tsName = nameProvider.type.name(this.type);
		this.emitDocumentation(this.type, code);
		code.push(`export type ${tsName} = ${referencedTypeName};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.context;
		const referencedTypeName = this.getReferenceName(code, '$.');
		const tsName = nameProvider.type.name(this.type);
		code.push(`export const ${tsName} = ${referencedTypeName};`);

	}

	private getReferenceName(code: Code, separator: string): string {
		const { nameProvider, symbols } = this.context;
		const referenced = this.getReferencedType();
		const referencedName = nameProvider.type.name(referenced);
		const qualifier = referenced.owner !== null ? this.computeQualifier(code, symbols.resolveOwner(referenced.owner)) : undefined;
		return qualifier !== undefined ? `${qualifier}.${separator}${referencedName}` : referencedName;
	}

	private getReferencedType(): Type & { name: string } {
		if (!TypeKind.isReference(this.type.kind)) {
			throw new Error('Expected reference type');
		}
		const { symbols } = this.context;
		const referenced = symbols.getType(this.type.kind.type);
		if (Type.hasName(referenced)) {
			return referenced;
		}
		throw new Error(`Cannot reference type ${JSON.stringify(referenced)} from ${JSON.stringify(this.container)}`);
	}

	private computeQualifier(code: Code, reference: Interface | World): string | undefined {
		const scope = this.container;
		if (scope === reference) {
			return undefined;
		}
		const { nameProvider, symbols } = this.context;
		if (World.is(scope) && Interface.is(reference)) {
			if (scope.package === reference.package) {
				return `${nameProvider.iface.moduleName(reference)}`;
			}
		} else if (Interface.is(scope) && Interface.is(reference)) {
			if (scope.package === reference.package) {
				const { options } = this.context;
				if (options.singleWorld) {
					return `${nameProvider.iface.moduleName(reference)}`;
				} else {
					const referencedPackage = symbols.getPackage(reference.package);
					const parts = nameProvider.pack.parts(referencedPackage);
					return `${parts.name}.${nameProvider.iface.moduleName(reference)}`;
				}
			} else {
				const typePackage = symbols.getPackage(scope.package);
				const referencedPackage = symbols.getPackage(reference.package);
				const typeParts = nameProvider.pack.parts(typePackage);
				const referencedParts = nameProvider.pack.parts(referencedPackage);
				if (typeParts.namespace === referencedParts.namespace) {
					const referencedTypeName = nameProvider.iface.moduleName(reference);
					code.imports.add(referencedParts.name, `./${referencedParts.name}`);
					return `${referencedParts.name}.${referencedTypeName}`;
				}
			}
		}
		throw new Error(`Cannot compute qualifier to import $import { type } into scope  ${JSON.stringify(scope)}.`);
	}
}

class RecordEmitter extends MemberEmitter {

	public readonly type: RecordType;

	constructor(record: RecordType, container: Interface | World, context: EmitterContext) {
		super(container, record, context);
		this.type = record;
		this.context.typeEmitters.set(record, this);
	}

	public emitNamespace(code: Code): void {
		const kind = this.type.kind;
		const { nameProvider, symbols, printers } = this.context;
		const name = nameProvider.type.name(this.type);
		this.emitDocumentation(this.type, code);
		code.push(`export type ${name} = {`);
		code.increaseIndent();
		for (const field of kind.record.fields) {
			this.emitDocumentation(field, code, true);
			const isOptional = TypeReference.isString(field.type)
				? false
				: Type.isOptionType(symbols.getType(field.type));
			const fieldName = nameProvider.field.name(field);
			code.push(`${fieldName}${isOptional ? '?' : ''}: ${printers.typeScript.printTypeReference(field.type, TypeUsage.property)};`);
		}
		code.decreaseIndent();
		code.push(`};`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider, printers } = this.context;
		const name = nameProvider.type.name(this.type);
		code.push(`export const ${name} = new $wcm.RecordType<${this.getQualifier()}${name}>([`);
		code.increaseIndent();
		for (const field of this.type.kind.record.fields) {
			const name = nameProvider.field.name(field);
			const type = printers.metaModel.printTypeReference(field.type, TypeUsage.property);
			code.push(`['${name}', ${type}],`);
		}
		code.decreaseIndent();
		code.push(`]);`);
	}
}

class VariantEmitter extends MemberEmitter {

	public readonly type: VariantType;

	constructor(variant: VariantType, container: Interface | World, context: EmitterContext) {
		super(container, variant, context);
		this.type = variant;
		this.context.typeEmitters.set(variant, this);
	}

	public emitNamespace(code: Code): void {

		function ensureVarName(name:string): string {
			return name === 'delete' ? 'delete_' : name;
		}

		function asTagName(name: string): string {
			if (name[0] === name[0].toLowerCase()) {
				return ensureVarName(name);
			}
			let isAllUpperCase = true;
			for (let i = 1; i < name.length; i++) {
				if (name[i] !== name[i].toUpperCase()) {
					isAllUpperCase = false;
					break;
				}
			}
			if (isAllUpperCase) {
				return ensureVarName(name.toLowerCase());
			} else {
				return ensureVarName(name[0].toLowerCase() + name.substring(1));
			}
		}

		const kind = this.type.kind;
		const { nameProvider, printers } = this.context;
		const variantName = nameProvider.type.name(this.type);

		this.emitDocumentation(this.type, code, true);
		code.push(`export namespace ${variantName} {`);
		code.increaseIndent();
		const cases: { name: string; typeName: string; tagName: string; type: string | undefined }[] = [];
		for (const item of kind.variant.cases) {
			const name = nameProvider.variant.caseName(item);
			const typeName = nameProvider.type.name(item);
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
		const { nameProvider, printers } = this.context;
		const name = nameProvider.type.name(this.type);
		const cases: string[] = [];
		for (const item of this.type.kind.variant.cases) {
			const name = nameProvider.variant.caseName(item);
			const type = item.type === null ? 'undefined' : printers.metaModel.printTypeReference(item.type, TypeUsage.property);
			cases.push(`['${name}', ${type}]`);
		}
		const typeName = `${this.getQualifier()}${name}`;
		code.push(`export const ${name} = new $wcm.VariantType<${typeName}, ${typeName}._tt, ${typeName}._vt>([${cases.join(', ')}], ${typeName}._ctor);`);
	}
}

class EnumEmitter extends MemberEmitter {

	public readonly type: EnumType;

	constructor(type: EnumType, container: Interface | World, context: EmitterContext) {
		super(container, type, context);
		this.type = type;
		this.context.typeEmitters.set(type, this);
	}

	public emitNamespace(code: Code): void {
		const { nameProvider } = this.context;
		const kind = this.type.kind;
		const enumName = nameProvider.type.name(this.type);
		this.emitDocumentation(this.type, code, true);
		code.push(`export enum ${enumName} {`);
		code.increaseIndent();
		for (let i = 0; i < kind.enum.cases.length; i++) {
			const item = kind.enum.cases[i];
			const name = nameProvider.enumeration.caseName(item);
			this.emitDocumentation(kind.enum.cases[i], code, true);
			code.push(`${name} = '${name}'${i < kind.enum.cases.length - 1 ? ',' : ''}`);
		}
		code.decreaseIndent();
		code.push(`}`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.context;
		const enumName = nameProvider.type.name(this.type);
		const cases: string[] = [];
		for (const item of this.type.kind.enum.cases) {
			cases.push(`'${nameProvider.enumeration.caseName(item)}'`);
		}
		code.push(`export const ${enumName} = new $wcm.EnumType<${this.getQualifier()}${enumName}>([${cases.join(', ')}]);`);
	}
}

class FlagsEmitter extends MemberEmitter {

	public readonly type: FlagsType;

	constructor(flags: FlagsType, container: Interface | World, context: EmitterContext) {
		super(container, flags, context);
		this.type = flags;
		this.context.typeEmitters.set(flags, this);
	}

	public emitNamespace(code: Code): void {
		const { nameProvider } = this.context;
		const kind = this.type.kind;
		const flagsName = nameProvider.type.name(this.type);
		const flagSize = FlagsEmitter.getFlagSize(kind.flags.flags.length);

		this.emitDocumentation(this.type, code, true);
		code.push(`export const ${flagsName} = Object.freeze({`);
		code.increaseIndent();
		for (let i = 0; i < kind.flags.flags.length; i++) {
			const flag = kind.flags.flags[i];
			const name = nameProvider.flag.name(flag);
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
		const { nameProvider } = this.context;
		const kind = this.type.kind;
		const flagsName = nameProvider.type.name(this.type);
		code.push(`export const ${flagsName} = new $wcm.FlagsType<${this.getQualifier()}${flagsName}>(${kind.flags.flags.length});`);
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

	private conztructor: ResourceEmitter.ConstructorEmitter | undefined;
	private readonly statics: ResourceEmitter.StaticMethodEmitter[];
	private readonly methods: ResourceEmitter.MethodEmitter[];
	private readonly destructor: ResourceEmitter.DestructorEmitter;
	private readonly emitters: CallableEmitter<Constructor | StaticMethod | Method>[];

	constructor(resource: ResourceType, iface: Interface, context: EmitterContext) {
		super(iface, resource, context);
		this.resource = resource;
		this.conztructor = undefined;
		this.destructor = new ResourceEmitter.DestructorEmitter(resource, context);
		this.statics = [];
		this.methods = [];
		this.emitters = [];
		this.context.typeEmitters.set(resource, this);
	}

	public get type(): Type {
		return this.resource;
	}

	public build(): void {
		const methods = this.context.symbols.getMethods(this.resource);
		if (methods !== undefined && methods.length >= 0) {
			for (const method of methods) {
				if (Callable.isMethod(method)) {
					const emitter = new ResourceEmitter.MethodEmitter(method, this.resource, this.context);
					this.emitters.push(emitter);
					this.methods.push(emitter as ResourceEmitter.MethodEmitter);
				} else if (Callable.isStaticMethod(method)) {
					const emitter = new ResourceEmitter.StaticMethodEmitter(method, this.resource, this.context);
					this.emitters.push(emitter);
					this.statics.push(emitter as ResourceEmitter.StaticMethodEmitter);
				} else if (Callable.isConstructor(method)) {
					const emitter = new ResourceEmitter.ConstructorEmitter(method, this.resource, this.context);
					this.emitters.push(emitter);
					if (this.conztructor !== undefined) {
						throw new Error(`Resource ${this.resource.name} has multiple constructors, which is not supported in JavaScript.`);
					}
					this.conztructor = emitter as ResourceEmitter.ConstructorEmitter;
				}
			}
		}
	}

	public getId(): string {
		const rName = this.resource.name;
		const iName = this.container.name;
		const pkg = this.context.symbols.getPackage(this.container.package);
		let pkgName = pkg.name;
		return `${pkgName}/${iName}/${rName}`;
	}

	public hasConstructors(): boolean {
		return this.conztructor !== undefined;
	}

	public emitNamespace(code: Code): void {
		const type = this.resource;
		const { nameProvider } = this.context;
		const tsName = nameProvider.type.name(type);
		const iName = `${tsName}.Interface`;
		code.push(`export namespace ${tsName} {`);
		code.increaseIndent();

		code.push(`export interface Interface extends ${MetaModel.Resource} {`);
		code.increaseIndent();
		for (const [index, method] of this.methods.entries()) {
			method.emitInterfaceDeclaration(code);
			if (index < this.methods.length - 1) {
				code.push();
			}
		}
		code.decreaseIndent();
		code.push(`}`);

		code.push(`export type Statics = {`);
		code.increaseIndent();
		if (this.conztructor !== undefined) {
			this.conztructor.emitStaticConstructorDeclaration(code);
		}
		for (const method of this.statics) {
			method.emitStaticsDeclaration(code);
		}
		code.decreaseIndent();
		code.push('};');

		code.push(`export type Class = Statics & {`);
		code.increaseIndent();
		if (this.conztructor !== undefined) {
			this.conztructor.emitConstructorDeclaration(code);
		}

		code.decreaseIndent();
		code.push(`};`);

		code.decreaseIndent();
		code.push(`}`);
		code.push(`export type ${tsName} = ${iName};`);
	}

	public emitTypeDeclaration(code: Code): void {
		if (this.emitters.length === 0) {
			return;
		}
		const { nameProvider } = this.context;
		const container = this.getContainerName();
		const name = nameProvider.type.name(this.resource);
		code.push(`${name}: ${container}.${name}.Class;`);
	}

	public emitMetaModel(code: Code): void {
		const { nameProvider } = this.context;
		const name = nameProvider.type.name(this.resource);
		code.push(`export const ${name} = new ${MetaModel.ResourceType}<${this.getQualifier()}${name}>('${this.resource.name}', '${this.getId()}');`);
		code.push(`export const ${name}_Handle = new ${MetaModel.ResourceHandleType}('${this.resource.name}');`);
	}

	public emitMetaModelFunctions(code: Code): void {
		this.destructor.emitMetaModel(code);
		for (const emitter of this.emitters) {
			emitter.emitMetaModel(code);
		}
	}

	public emitAPI(code: Code): void {
		const { nameProvider } = this.context;
		const name = nameProvider.type.name(this.resource);
		code.push(`export namespace ${name} {`);
		code.increaseIndent();
		code.push(`export type WasmInterface = {`);
		code.increaseIndent();
		for (const emitter of this.emitters) {
			emitter.emitWasmInterface(code);
		}
		code.decreaseIndent();
		code.push(`};`);

		code.push('export namespace imports {');
		code.increaseIndent();
		code.push(`export type WasmInterface = ${name}.WasmInterface & { ${this.destructor.getWasmImportSignature()} };`);
		code.decreaseIndent();
		code.push('}');

		code.push('export namespace exports {');
		code.increaseIndent();
		code.push(`export type WasmInterface = ${name}.WasmInterface & { ${this.destructor.getWasmExportSignature()} };`);
		code.decreaseIndent();
		code.push(`}`);

		code.decreaseIndent();
		code.push(`}`);
	}

	public emitWasmExport(code: Code): void {
		const iName = this.container.name;
		const pkg = this.context.symbols.getPackage(this.container.package);
		const qualifier = `${pkg.name}/${iName}#`;
		for (const emitter of this.emitters) {
			emitter.emitWasmInterface(code, qualifier);
		}
	}

	public emitWasmExportImport(code: Code): void {
		code.push(`'[resource-new]${this.resource.name}': (rep: i32) => i32;`);
		code.push(`'[resource-rep]${this.resource.name}': (handle: i32) => i32;`);
		code.push(`'[resource-drop]${this.resource.name}': (handle: i32) => void;`);
	}

	public getImportDestructorSignature(): string {
		return `'[resource-drop]${this.resource.name}': (self: i32) => void`;
	}
}
namespace ResourceEmitter {

	export abstract class ResourceElementEmitter extends Emitter {

		protected readonly resource: ResourceType;

		constructor(resource: ResourceType, context: EmitterContext) {
			super(context);
			this.resource = resource;
		}

		protected getPackageQualifier(): string {
			const type = this.resource;
			const { symbols, nameProvider } = this.context;
			if (type.owner === null) {
				return nameProvider.type.name(type);
			}
			const owner = symbols.resolveOwner(type.owner);
			if (Interface.is(owner)) {
				const pkg = symbols.getPackage(owner.package);
				if (this.context.options.singleWorld) {
					return `${nameProvider.iface.moduleName(owner)}.${nameProvider.type.name(type)}`;
				} else {
					return `${nameProvider.pack.name(pkg)}.${nameProvider.iface.moduleName(owner)}.${nameProvider.type.name(type)}`;
				}
			} else {
				return nameProvider.type.name(type);
			}
		}
	}

	export abstract class ResourceFunctionEmitter extends ResourceElementEmitter {

		protected readonly method: StaticMethod | Method | Constructor;

		constructor(method: StaticMethod | Method | Constructor, resource: ResourceType, context: EmitterContext) {
			super(resource, context);
			this.method = method;
		}

		public doEmitNamespace(): void {
		}

		public doEmitMetaModel(code: Code, params: string[][], result: string | undefined): void {
			const { nameProvider } = this.context;
			const methodName = this.getMethodName();
			const resourceName = nameProvider.type.name(this.resource);
			const typeParam = `${this.getPackageQualifier()}.${this.getTypeQualifier()}['${methodName}']`;
			const [addMethod, metaModelType] = this.getMetaModelInfo();
			if (params.length === 0) {
				code.push(`${resourceName}.${addMethod}('${methodName}', new $wcm.${metaModelType}<${typeParam}>('${this.method.name}', [], ${result}));`);
			} else {
				code.push(`${resourceName}.${addMethod}('${methodName}', new $wcm.${metaModelType}<${typeParam}>('${this.method.name}', [`);
				code.increaseIndent();
				for (const [name, type] of params) {
					code.push(`['${name}', ${type}],`);
				}
				code.decreaseIndent();
				code.push(`], ${result}));`);
			}
		}

		public getName(): string {
			return this.getMethodName();
		}
		protected abstract getMethodName(): string;
		protected abstract getMetaModelInfo(): [string, string];
		protected abstract getTypeQualifier(): string;

		protected getSignatureParts(start: 0 | 1, omitReturn?: false): [string[], string[], string];
		protected getSignatureParts(start: 0 | 1, omitReturn: true): [string[], string[], string];
		protected getSignatureParts(start: 0 | 1, omitReturn: boolean = false): [string[], string[], string] {
			const { nameProvider, printers } = this.context;
			const params: string[] = [];
			const paramNames: string[] = [];
			for (let i = start; i < this.method.params.length; i++) {
				const param = this.method.params[i];
				const paramName = nameProvider.parameter.name(param);
				const paramType = printers.typeScript.printTypeReference(param.type, TypeUsage.parameter);
				paramNames.push(paramName);
				params.push(`${paramName}: ${paramType}`);
			}
			let returnType: string = 'void';
			if (this.method.results !== null && omitReturn === false) {
				if (this.method.results.length === 1) {
					returnType = printers.typeScript.printTypeReference(this.method.results[0].type, TypeUsage.function);
				} else if (this.method.results.length > 1) {
					returnType = `[${this.method.results.map(r => printers.typeScript.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
				}
			}
			return [params, paramNames, returnType];
		}

	}

	class _MethodEmitter extends ResourceFunctionEmitter {

		public readonly callable: Method;

		constructor(method: Method, resource: ResourceType, context: EmitterContext) {
			super(method, resource, context);
			this.callable = method;
		}

		protected getMethodName(): string {
			return this.context.nameProvider.method.name(this.callable);
		}

		protected getMetaModelInfo(): [string, string] {
			return ['addMethod', 'MethodType'];
		}

		protected getTypeQualifier(): string {
			return 'Interface';
		}

		public emitInterfaceDeclaration(code: Code): void {
			this.emitDocumentation(this.callable, code);
			const [params, , returnType] = this.getSignatureParts(1);
			code.push(`${this.getMethodName()}(${params.join(', ')}): ${returnType};`);
		}
	}

	class _StaticMethodEmitter extends ResourceFunctionEmitter {

		public readonly callable: StaticMethod;

		constructor(method: StaticMethod, resource: ResourceType, context: EmitterContext) {
			super(method, resource, context);
			this.callable = method;
		}

		protected getMethodName(): string {
			return this.context.nameProvider.method.staticName(this.callable);
		}

		protected getMetaModelInfo(): [string, string] {
			return ['addStaticMethod', 'StaticMethodType'];
		}

		protected getTypeQualifier(): string {
			return 'Statics';
		}

		public emitStaticsDeclaration(code: Code): void {
			const [params, , returnType] = this.getSignatureParts(0);
			code.push(`${this.getMethodName()}(${params.join(', ')}): ${returnType};`);
		}
	}

	class _ConstructorEmitter extends ResourceFunctionEmitter {

		public readonly callable: Constructor;

		constructor(method: Constructor, resource: ResourceType, context: EmitterContext) {
			super(method, resource, context);
			this.callable = method;
		}

		protected getMethodName(): string {
			return this.context.nameProvider.method.constructorName(this.callable);
		}

		protected getMetaModelInfo(): [string, string] {
			return ['addConstructor', 'ConstructorType'];
		}

		protected getTypeQualifier(): string {
			return 'Class';
		}

		public emitConstructorDeclaration(code: Code): void {
			const [params] = this.getSignatureParts(0, true);
			code.push(`new(${params.join(', ')}): Interface;`);
		}

		public emitStaticConstructorDeclaration(code: Code): void {
			const [params] = this.getSignatureParts(0, true);
			code.push(`$new?(${params.join(', ')}): Interface;`);
		}
	}

	class _DestructorEmitter extends ResourceElementEmitter {

		constructor(resource: ResourceType, context: EmitterContext) {
			super(resource, context);
		}

		public emitMetaModel(code: Code): void {
			const resourceName = this.context.nameProvider.type.name(this.resource);
			code.push(`${resourceName}.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]${this.resource.name}', [['inst', ${resourceName}]]));`);
		}

		public emitWasmInterface(code: Code, qualifier: string = ''): void {
			code.push(`${qualifier}${this.getWasmImportSignature()};`);
		}

		public getWasmImportSignature(): string {
			return `'[resource-drop]${this.resource.name}': (self: i32) => void`;
		}

		public getWasmExportSignature(): string {
			return `'[dtor]${this.resource.name}': (self: i32) => void`;
		}
	}

	export const ConstructorEmitter = CallableEmitter(_ConstructorEmitter);
	export type ConstructorEmitter = _ConstructorEmitter;
	export const DestructorEmitter = _DestructorEmitter;
	export type DestructorEmitter = _DestructorEmitter;
	export const StaticMethodEmitter = CallableEmitter(_StaticMethodEmitter);
	export type StaticMethodEmitter = _StaticMethodEmitter;
	export const MethodEmitter = CallableEmitter(_MethodEmitter);
	export type MethodEmitter = _MethodEmitter;
}

type TypeEmitter = TypeDeclarationEmitter | TypeReferenceEmitter | RecordEmitter | VariantEmitter | EnumEmitter | FlagsEmitter | ResourceEmitter;
namespace TypeEmitter {
	export function create(type: Type, container: Interface | World, context: EmitterContext): TypeEmitter {
		if (Type.isRecordType(type)) {
			return new RecordEmitter(type, container, context);
		} else if (Type.isVariantType(type)) {
			return new VariantEmitter(type, container, context);
		} else if (Type.isEnumType(type)) {
			return new EnumEmitter(type, container, context);
		} else if (Type.isFlagsType(type)) {
			return new FlagsEmitter(type, container, context);
		} else if (TypeKind.isReference(type.kind)) {
			return new TypeReferenceEmitter(type, container, context);
		} else if (Type.isResourceType(type)) {
			if (Interface.is(container)) {
				const emitter = new ResourceEmitter(type, container, context);
				emitter.build();
				return emitter;
			} else {
				throw new Error('Resource type can only be declared in an interface.');
			}
		} else {
			return new TypeDeclarationEmitter(type, container, context);
		}
	}
}

interface CallableEmitter<C extends Callable> extends Emitter {
	callable: C;
	getName(): string;
	doEmitNamespace(code: Code, params: string[], returnType: string | undefined): void;
	doEmitMetaModel(code: Code, params: string[][], result: string | undefined): void;
}

const MAX_FLAT_PARAMS = 16;
const MAX_FLAT_RESULTS = 1;
function CallableEmitter<C extends Callable, P extends Interface | ResourceType | World, S extends Emitter>(base: new (callable: C, container: P, context: EmitterContext) => CallableEmitter<C>): (new (callable: C, container: P, context: EmitterContext) => CallableEmitter<C>) {
	return class extends base {
		public callable: C;
		private readonly parent: P;
		constructor(callable: C, parent: P, context: EmitterContext) {
			super(callable, parent, context);
			this.callable = callable;
			this.parent = parent;
		}

		public emitNamespace(code: Code): void {
			this.emitDocumentation(this.callable, code);
			const [params, returnType] = this.getParamsAndReturnType();
			this.doEmitNamespace(code, params, returnType);
		}

		private getParamsAndReturnType(): [string[], string | undefined] {
			const params: string[] = [];
			for (const param of this.callable.params) {
				const paramName = this.context.nameProvider.parameter.name(param);
				params.push(`${paramName}: ${this.context.printers.typeScript.printTypeReference(param.type, TypeUsage.parameter)}`);
			}
			let returnType = this.getReturnType();
			return [params, returnType];
		}

		public emitMetaModel(code: Code): void {
			const [params, returnType] = this.getMetaModelParamsAndReturnType();
			this.doEmitMetaModel(code, params, returnType);
		}

		private getMetaModelParamsAndReturnType(): [string[][], string | undefined] {
			const { nameProvider } = this.context;
			const metaDataParams: string[][] = [];
			const start: number = Callable.isMethod(this.callable) ? 1 : 0;
			for (let i = start; i < this.callable.params.length; i++) {
				const param = this.callable.params[i];
				const paramName = this.context.nameProvider.parameter.name(param);
				const typeName = this.context.printers.metaModel.printTypeReference(param.type, TypeUsage.parameter);
				metaDataParams.push([paramName, typeName]);
			}
			let metaReturnType: string | undefined = undefined;
			if (Callable.isConstructor(this.callable)) {
				const pName = nameProvider.type.name(this.parent as ResourceType);
				metaReturnType = `new ${MetaModel.OwnType}(${pName}_Handle)`;
			} else {
				if (this.callable.results.length === 1) {
					metaReturnType = this.context.printers.metaModel.printTypeReference(this.callable.results[0].type, TypeUsage.function);
				} else if (this.callable.results.length > 1) {
					metaReturnType = `[${this.callable.results.map(r => this.context.printers.metaModel.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
				}
			}
			return [metaDataParams, metaReturnType];
		}

		public emitWasmInterface(code: Code, qualifier: string = ''): void {
			code.push(`'${qualifier}${this.callable.name}': ${this.getWasmSignature(code.imports)};`);
		}

		public emitWasmExport(code: Code, prefix: string): void {
			code.push(`'${prefix}#${this.callable.name}': ${this.getWasmSignature(code.imports)};`);
		}

		public emitWorldMember(code: Code): void {
			let [params, returnType] = this.getParamsAndReturnType();
			if (returnType === undefined) {
				returnType = 'void';
			}
			code.push(`${this.getName()}: (${params.join(', ')}) => ${returnType};`);
		}

		public emitWorldWasmImport(code: Code): void {
			code.push(`'${this.callable.name}': ${this.getWasmSignature(code.imports)};`);
		}

		public emitWorldWasmExport(code: Code): void {
			code.push(`'${this.callable.name}': ${this.getWasmSignature(code.imports)};`);
		}

		private getWasmSignature(imports: Imports): string {
			const { typeFlattener } = this.context;
			const flattenedParams = typeFlattener.flattenParams(this.callable);
			let returnType: string;
			const flattenedResults = typeFlattener.flattenResult(this.callable);
			if (flattenedResults.length === 0) {
				returnType = 'void';
			} else if (flattenedResults.length <= MAX_FLAT_RESULTS) {
				returnType = flattenedResults[0];
			} else {
				returnType = 'void';
				imports.addBaseType('ptr');
				flattenedParams.push({ name: 'result', type: `ptr<${this.getReturnType()!}>`});
			}
			if (flattenedParams.length <= MAX_FLAT_PARAMS) {
				return `(${flattenedParams.map(p => `${p.name}: ${p.type}`).join(', ')}) => ${returnType}`;
			} else {
				imports.addBaseType('ptr');
				const params: string[] = [];
				for (const param of this.callable.params) {
					params.push(this.context.printers.metaModel.printTypeReference(param.type, TypeUsage.parameter));
				}
				return `(args: ptr<[${params.join(', ')}]>) => ${returnType}`;
			}
		}

		private getReturnType(): string | undefined {
			let returnType: string | undefined = undefined;
			if (this.callable.results.length === 1) {
				returnType = this.context.printers.typeScript.printTypeReference(this.callable.results[0].type, TypeUsage.function);
			} else if (this.callable.results.length > 1) {
				returnType = `[${this.callable.results.map(r => this.context.printers.typeScript.printTypeReference(r.type, TypeUsage.function)).join(', ')}]`;
			}
			return returnType;
		}
	};
}