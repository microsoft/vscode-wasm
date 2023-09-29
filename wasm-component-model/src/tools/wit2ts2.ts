/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { Document, Documentation, Enum, Flags, Func, Interface, Owner, Package, Record, Type, TypeKind, TypeReference, Variant, World } from './wit-json';
import { ResolvedOptions } from './options';

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
		return this.source.join('\n');
	}
}

type SymbolTable = Pick<Document, 'interfaces' | 'types' | 'packages' | 'worlds'>;

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

	export function getNamespaceAndName(name: string): [string | undefined, string] {
		const index = name.indexOf(':');
		if (index === -1) {
			return [undefined, name];
		}
		return [name.substring(0, index), name.substring(index + 1)];
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

		constructor(pkg: Package, mainCode: Code, symbols: SymbolTable) {
			this.pkg = pkg;
			this.symbols = symbols;
			this.mainCode = mainCode;
		}

		public emit(): Code {
			const star = this.mainCode.imports.getUniqueName();
			this.mainCode.imports.addStar(`./${Names.asImportName(this.pkg)}`, star);
			this.mainCode.push(`export namespace ${Names.asPackageName(this.pkg)} {`);
			this.mainCode.increaseIndent();

			const code = new Code();
			for (const ref of Object.values(this.pkg.interfaces)) {
				const iface = this.symbols.interfaces[ref];
				const typeExports = this.processInterface(iface, code);
				code.push('');
				const name = Names.asTypeName(iface.name);
				this.mainCode.push(`export type ${name} = ${star}.${name};`);
				if (typeExports.length > 0) {
					this.mainCode.push(`export namespace ${name} {`);
					this.mainCode.increaseIndent();
					for (const type of typeExports) {
						this.mainCode.push(`export type ${type} = ${star}.${name}.${type};`);
					}
					this.mainCode.decreaseIndent();
					this.mainCode.push(`}`);
				}
			}

			this.mainCode.decreaseIndent();
			this.mainCode.push(`}`);
			return code;
		}

		private processInterface(iface: Interface, code: Code): string[] {
			const typeExports: string[] = [];
			emitDocumentation(iface, code);
			const name = Names.asTypeName(iface.name);
			code.push(`export namespace ${name} {`);
			code.increaseIndent();
			for (const t of Object.values(iface.types)) {
				code.push('');
				const type = this.symbols.types[t];
				typeExports.push(...(new TypeEmitter(type, iface, code, this.symbols)).emit());
			}
			const funcExports: string[] = [];
			for (const func of Object.values(iface.functions)) {
				code.push('');
				(new FunctionEmitter(func, iface, code, this.symbols)).emit();
				funcExports.push(Names.asFuncName(func.name));
			}
			code.decreaseIndent();
			code.push(`}`);
			code.push(`export type ${name} = Pick<typeof ${name}, ${funcExports.map(item => `'${item}'`).join(' | ')}>;`);
			return typeExports;
		}
	}

	class TypeEmitter {

		private readonly type: Type;
		private readonly scope: Interface;
		private readonly code: Code;
		private readonly symbols: SymbolTable;

		constructor(type: Type, scope: Interface, code: Code, symbols: SymbolTable) {
			this.type = type;
			this.scope = scope;
			this.code = code;
			this.symbols = symbols;
		}

		public emit(): string[] {
			const exports: string[] = [];
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
					this.code.push(`type ${Names.asTypeName(this.type.name)} = ${typeName};`);
				} else {
					throw new Error(`Cannot reference type ${JSON.stringify(referenced)} from ${JSON.stringify(this.scope)}`);
				}
			} else {
				const name = Names.asTypeName(this.type.name);
				exports.push(name);
				this.code.push(`export type ${name} = ${TypeName.fromType(this.type, this.scope, this.symbols, this.code.imports, TypeUsage.typeDeclaration)};`);
			}
			return exports;
		}

		private emitRecord(name: string, kind: Record): void {
			this.code.push(`export interface ${Names.asTypeName(name)} extends $wcm.JRecord {`);
			this.code.increaseIndent();
			for (const field of kind.record.fields) {
				emitDocumentation(field, this.code, true);
				const isOptional = TypeReference.isString(field.type)
					? false
					: TypeKind.isOption(this.symbols.types[field.type].kind);

				this.code.push(`${Names.asPropertyName(field.name)}${isOptional ? '?' : ''}: ${TypeName.fromReference(field.type, this.scope, this.symbols, this.code.imports, TypeUsage.property)};`);
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
		}

		private emitVariant(name: string, kind: Variant): void {
			const code = this.code;
			const variantName = Names.asTypeName(name);

			this.code.push(`export namespace ${variantName} {`);
			this.code.increaseIndent();
			const names: string[] = [];
			const types: (string | undefined)[] = [];
			for (const item of kind.variant.cases) {
				names.push(Names.asPropertyName(item.name));
				if (item.type !== null) {
					types.push(TypeName.fromReference(item.type, this.scope, this.symbols, this.code.imports, TypeUsage.property));
				} else {
					types.push(undefined);
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
		}

		private emitEnum(name: string, kind: Enum): void {
			this.code.push(`export enum ${Names.asTypeName(name)} {`);
			this.code.increaseIndent();
			for (let i = 0; i < kind.enum.cases.length; i++) {
				const item = kind.enum.cases[i];
				this.code.push(`${Names.asPropertyName(item.name)} = ${i},`);
			}
			this.code.decreaseIndent();
			this.code.push(`}`);
		}

		private emitFlags(name: string, kind: Flags): void {
			this.code.push(`export interface ${Names.asTypeName(name)} extends $wcm.JFlags {`);
			this.code.increaseIndent();
			for (const flag of kind.flags.flags) {
				this.code.push(`${Names.asPropertyName(flag.name)}: boolean;`);
			}
			this.code.decreaseIndent();
			this.code.push(`};`);
		}

		private computeQualifier(scope: Interface | World, reference: Interface | World): string | undefined {
			if (scope === reference) {
				return undefined;
			}
			if (Interface.is(scope) && Interface.is(reference)) {
				if (scope.package === reference.package) {
					return `${Names.asTypeName(reference.name)}`;
				} else {
					const typePackage = this.symbols.packages[scope.package];
					const referencedPackage = this.symbols.packages[reference.package];
					const [typeNamespace, ] = Names.getNamespaceAndName(typePackage.name);
					const [referenceNamespace, referenceName] = Names.getNamespaceAndName(referencedPackage.name);
					if (typeNamespace === referenceNamespace) {
						const refName = Names.asTypeName(reference.name);
						this.code.imports.add(refName, `./${referenceName}`);
						return refName;
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
		private readonly code: Code;
		private readonly symbols: SymbolTable;

		constructor(func: Func, scope: Interface, code: Code, symbols: SymbolTable) {
			this.func = func;
			this.scope = scope;
			this.code = code;
			this.symbols = symbols;
		}

		public emit(): void {
			emitDocumentation(this.func, this.code);
			const name = Names.asFuncName(this.func.name);
			const elements: string[] = [];
			for (const param of this.func.params) {
				elements.push(`${Names.asParamName(param.name)}: ${TypeName.fromReference(param.type, this.scope, this.symbols, this.code.imports, TypeUsage.parameter)}`);
			}
			let returnType = this.func.results.length === 0
				? 'void'
				: this.func.results.length === 1
					? TypeName.fromReference(this.func.results[0].type, this.scope, this.symbols, this.code.imports, TypeUsage.function)
					: `[${this.func.results.map(r => TypeName.fromReference(r.type, this.scope, this.symbols, this.code.imports, TypeUsage.function)).join(', ')}]`;

			this.code.push(`export declare function ${name}(${elements.join(', ')}): ${returnType};`);
			// this.code.push(`export type ${name} = typeof ${name};`);
		}
	}

	export enum TypeUsage {
		parameter,
		function,
		property,
		typeDeclaration
	}

	namespace TypeName {

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