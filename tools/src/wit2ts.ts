/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'fs';

import * as wit from './wit';
import {
	Visitor, InterfaceItem, UseItem, PackageItem, Identifier, RenameItem, NamedImports,
	Document, TypeItem, Tuple, List, Option, Result, RecordItem, FuncItem, Ty, Borrow, _FuncResult, NamedFuncResult, FuncResult
} from './wit-ast';

const document = wit.parse(fs.readFileSync('./src/timezone.wit', 'utf8'));

namespace Names {

	const keywords: Map<string, string> = new Map<string, string>([
		['this', 'self']
	]);

	export function toTs(id: Identifier): string {
		const result = id.value.replace(/-/g, '_');
		return keywords.get(result) ?? result;
	}
}

class Imports {

	private readonly imports: Map<string, string[]> = new Map();

	constructor() {
	}

	public get size(): number {
		return this.imports.size;
	}

	public addBaseType(name: string): void {
		this.add(name, '@vscode/wasm-component-model');
	}

	public add(value: string, from: string): void {
		let values = this.imports.get(from);
		if (values === undefined) {
			values = [];
			this.imports.set(from, values);
		}
		values.push(value);
	}

	public entries(): IterableIterator<[string, string[]]> {
		return this.imports.entries();
	}

	public [Symbol.iterator](): IterableIterator<[string, string[]]> {
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
			this.source.unshift(`import type { ${values.join(', ')} } from '${from}';`);
		}
		this.source.unshift(`import * as $wcm from '@vscode/wasm-component-model';`);
		return this.source.join('\n');
	}
}

interface SymbolInformation {
	getComponentModelName(): string;
}

class LocalSymbol implements SymbolInformation {
	public readonly name: string;

	constructor(name: string) {
		this.name = name;
	}

	public getComponentModelName(): string {
		return `$${this.name}`;
	}
}

class ImportedSymbol implements SymbolInformation {
	public readonly name: string;
	public readonly from: string;
	public readonly original?: string;

	constructor(name: string, from: string, original?: string) {
		this.name = name;
		this.from = from;
		this.original = original;
	}

	public getComponentModelName(): string {
		if (this.original !== undefined) {
			return `${this.from}.$cm.${this.original}`;
		} else {
			return `${this.from}.$cm.${this.name}`;
		}
	}
}

class Symbols {

	private readonly symbols: Map<string, SymbolInformation> = new Map();

	public addLocal(name: string): void {
		this.symbols.set(name, new LocalSymbol(name));
	}

	public addImported(name: string, from: string, original?: string): void {
		this.symbols.set(name, new ImportedSymbol(name, from, original));
	}

	public get(name: string): SymbolInformation | undefined {
		return this.symbols.get(name);
	}
}

interface ComponentModelType {
	emit(code: Code): void;
}

class RecordType implements ComponentModelType {

	private readonly name: string;
	private readonly fields: [string, string][];

	constructor(name: string) {
		this.name = name;
		this.fields = [];
	}

	public addField(name: string, type: string): void {
		this.fields.push([name, type]);
	}

	public emit(code: Code): void {
		const elements: string[] = [];
		for (const [name, type] of this.fields) {
			elements.push(`['${name}', ${type}]`);
		}
		code.push(`export const $${this.name}: $wcm.ComponentModelType<${this.name}> = new $wcm.RecordType<${this.name}>([`);
		code.increaseIndent();
		code.push(`${elements.join(', ')}`);
		code.decreaseIndent();
		code.push(`]);`);
	}
}

class TupleType implements ComponentModelType {

	private readonly name: string;
	private readonly fields: string[];

	constructor(name: string) {
		this.name = name;
		this.fields = [];
	}

	public addField(type: string): void {
		this.fields.push(type);
	}

	public emit(code: Code): void {
		const elements: string[] = [];
		for (const type of this.fields) {
			elements.push(type);
		}
		code.push(`export const $${this.name}: $wcm.ComponentModelType<${this.name}> = new $wcm.TupleType<${this.name}>([${elements.join(', ')}]);`);
	}
}

class ListType implements ComponentModelType {

	private readonly name: string;
	private readonly type: string;

	constructor(name: string, type: string) {
		this.name = name;
		this.type = type;
	}

	public emit(code: Code): void {
		code.push(`export const $${this.name}: $wcm.ComponentModelType<${this.name}> = new $wcm.ListType<${this.name}>(${this.type});`);
	}
}

type Visibility = 'public' | 'private';
class TypeType implements ComponentModelType {

	private readonly name: string;
	private readonly type: string;
	private readonly visibility: Visibility;

	constructor(name: string, type: string, visibility: Visibility = 'public') {
		this.name = name;
		this.type = type;
		this.visibility = visibility;
	}

	public emit(code: Code): void {
		if (this.visibility === 'public') {
			code.push(`export const $${this.name}: $wcm.ComponentModelType<${this.name}> = ${this.type};`);
		} else {
			code.push(`const $${this.name}: $wcm.ComponentModelType<${this.name}> = ${this.type};`);
		}
	}
}

class FunctionSignature implements ComponentModelType {

	private readonly name: string;
	private readonly parameters: [string, string][];
	private returnType: string | undefined;

	constructor(name: string) {
		this.name = name;
		this.parameters = [];
		this.returnType = undefined;
	}

	public addParameter(name: string, type: string): void {
		this.parameters.push([name, type]);
	}

	public setReturnType(type: string): void {
		this.returnType = type;
	}

	public emit(code: Code): void {
		const elements: string[] = [];
		for (const [name, type] of this.parameters) {
			elements.push(`['${name}', ${type}]`);
		}
		code.push(`export const $${this.name}: $wcm.FunctionSignature = new $wcm.FunctionSignature(${this.name}, [`);
		code.increaseIndent();
		code.push(`${elements.join(', ')}`);
		code.decreaseIndent();
		if (this.returnType !== undefined) {
			code.push(`], ${this.returnType} );`);
		} else {
			code.push(`]);`);
		}
	}
}

class ComponentModelTypePrinter implements Visitor {

	public result: string;

	public static do(node: Ty): string {
		const visitor = new ComponentModelTypePrinter();
		node.visit(visitor, node);
		return visitor.result;
	}

	public constructor() {
		this.result = '';
	}

	visitU8(): boolean {
		this.result = '$wcm.u8';
		return true;
	}

	visitU16(): boolean {
		this.result = '$wcm.u16';
		return true;
	}

	visitU32(): boolean {
		this.result = '$wcm.u32';
		return true;
	}

	visitU64(): boolean {
		this.result = '$wcm.u64';
		return true;
	}

	visitS8(): boolean {
		this.result = '$wcm.s8';
		return true;
	}

	visitS16(): boolean {
		this.result = '$wcm.s16';
		return true;
	}

	visitS32(): boolean {
		this.result = '$wcm.s32';
		return true;
	}

	visitS64(): boolean {
		this.result = '$wcm.s64';
		return true;
	}

	visitFloat32(): boolean {
		this.result = '$wcm.float32';
		return true;
	}

	visitFloat64(): boolean {
		this.result = '$wcm.float64';
		return true;
	}

	visitString(): boolean {
		this.result = '$wcm.wstring';
		return true;
	}

	visitBool(): boolean {
		this.result = '$wcm.bool';
		return true;
	}

	visitChar(): boolean {
		this.result = '$wcm.char';
		return true;
	}

	visitIdentifier(node: Identifier) {
		this.result = Names.toTs(node);
		return true;
	}

	visitTuple(_node: Tuple): boolean {
		return false;
	}

	visitList(_node: List): boolean {
		return false;
	}

	visitOption(_node: Option): boolean {
		return false;
	}

	visitResult(_node: Result): boolean {
		return false;
	}

	visitBorrow(_node: Borrow): boolean {
		return false;
	}
}

class ComponentModelTypes {
	private readonly types: ComponentModelType[];

	constructor() {
		this.types = [];
	}

	public get size(): number {
		return this.types.length;
	}

	public add(type: ComponentModelType): void {
		this.types.push(type);
	}

	public emit(code: Code): void {
		for (const type of this.types) {
			type.emit(code);
		}
	}
}

class TyPrinter implements Visitor {

	private readonly imports: Imports;
	public result: string;

	public static do(node: Ty, imports: Imports): string {
		const visitor = new TyPrinter(imports);
		node.visit(visitor, node);
		return visitor.result;
	}

	public constructor(imports: Imports) {
		this.imports = imports;
		this.result = '';
	}

	visitU8(): boolean {
		this.result = 'u8';
		this.imports.addBaseType('u8');
		return true;
	}

	visitU16(): boolean {
		this.result = 'u16';
		this.imports.addBaseType('u16');
		return true;
	}

	visitU32(): boolean {
		this.result = 'u32';
		this.imports.addBaseType('u32');
		return true;
	}

	visitU64(): boolean {
		this.result = 'u64';
		this.imports.addBaseType('u64');
		return true;
	}

	visitS8(): boolean {
		this.result = 's8';
		this.imports.addBaseType('s8');
		return true;
	}

	visitS16(): boolean {
		this.result = 's16';
		this.imports.addBaseType('s16');
		return true;
	}

	visitS32(): boolean {
		this.result = 's32';
		this.imports.addBaseType('s32');
		return true;
	}

	visitS64(): boolean {
		this.result = 's64';
		this.imports.addBaseType('s64');
		return true;
	}

	visitFloat32(): boolean {
		this.result = 'float32';
		this.imports.addBaseType('float32');
		return true;
	}

	visitFloat64(): boolean {
		this.result = 'float64';
		this.imports.addBaseType('float64');
		return true;
	}

	visitString(): boolean {
		this.result = 'string';
		return true;
	}

	visitBool(): boolean {
		this.result = 'boolean';
		return true;
	}

	visitChar(): boolean {
		this.result = 'string';
		return true;
	}

	visitIdentifier(node: Identifier) {
		this.result = Names.toTs(node);
		return true;
	}

	visitTuple(node: Tuple): boolean {
		const elements: string[] = [];
		const tyVisitor = new TyPrinter(this.imports);
		for (let i = 0; i < node.members.length; i++) {
			const member = node.members[i];
			member.visit(tyVisitor, member);
			elements.push(tyVisitor.result);
		}
		this.result = `[${elements.join(', ')}]`;
		return false;
	}

	visitList(node: List): boolean {
		const tyVisitor = new TyPrinter(this.imports);
		node.type.visit(tyVisitor, node.type);
		this.result = `${tyVisitor.result}[]`;
		return false;
	}

	visitOption(node: Option): boolean {
		const tyVisitor = new TyPrinter(this.imports);
		node.type.visit(tyVisitor, node.type);
		this.result = `Option<${tyVisitor.result}>`;
		return false;
	}

	visitResult(node: Result): boolean {
		const tyVisitor = new TyPrinter(this.imports);
		if (node.ok !== undefined) {
			node.ok.visit(tyVisitor, node.ok);
		} else {
			tyVisitor.result = 'void';
		}
		const ok = tyVisitor.result;
		if (node.error !== undefined) {
			node.error.visit(tyVisitor, node.error);
		} else {
			tyVisitor.result = 'void';
		}
		const error = tyVisitor.result;
		this.result = `Result<${ok}, ${error}>`;
		return false;
	}

	visitBorrow(node: Borrow): boolean {
		const tyVisitor = new TyPrinter(this.imports);
		node.name.visit(tyVisitor, node.name);
		this.result = `Borrow<${tyVisitor.result}>`;
		return false;
	}

}

class FuncResultPrinter implements Visitor {

	private readonly imports: Imports;
	public result: string;

	public static do(node: _FuncResult, imports: Imports): string {
		const visitor = new FuncResultPrinter(imports);
		node.visit(visitor, node);
		return visitor.result;
	}

	public constructor(imports: Imports) {
		this.imports = imports;
		this.result = '';
	}

	visitFuncResult(node: FuncResult): boolean {
		const tyVisitor = new TyPrinter(this.imports);
		node.type.visit(tyVisitor, node.type);
		this.result = tyVisitor.result;
		return false;
	}

	visitNamedFuncResult(_node: NamedFuncResult): boolean {
		return false;
	}
}

interface InterfaceData {
	symbols: Symbols;
	componentModelTypes: ComponentModelTypes;
	exports: string[];
}

class DocumentVisitor implements Visitor {

	private readonly code: Code;
	private readonly interfaceData: InterfaceData[];

	constructor() {
		this.code = new Code();
		this.interfaceData = [];
	}


	public visitDocument(_node: Document): boolean {
		return true;
	}

	public endVisitDocument(_document: Document): void {
		console.log(this.code.toString());
	}

	public visitPackageItem(_item: PackageItem): boolean {
		return false;
	}

	visitInterfaceItem(item: InterfaceItem): boolean {
		this.interfaceData.push({ symbols: new Symbols(), componentModelTypes: new ComponentModelTypes(), exports: [] });
		const name = Names.toTs(item.name);
		this.code.push(`export namespace ${name} {`);
		this.code.increaseIndent();
		for (const member of item.members) {
			member.visit(this, member);
		}
		return false;
	}

	endVisitInterfaceItem(item: InterfaceItem): void {
		const interfaceData = this.interfaceData.pop();
		if (interfaceData === undefined) {
			throw new Error(`No interface data available`);
		}
		if (interfaceData.componentModelTypes.size > 0) {
			this.code.push(`export namespace $cm {`);
			this.code.increaseIndent();
			interfaceData.componentModelTypes.emit(this.code);
			this.code.decreaseIndent();
			this.code.push(`}`);
		}
		this.code.decreaseIndent();
		this.code.push(`}`);
		if (interfaceData.exports.length > 0) {
			const name = Names.toTs(item.name);
			this.code.push(`export type ${name} = Pick<typeof ${name}, ${interfaceData.exports.join(', ')}>;`);
		}
	}

	visitUseItem(item: UseItem): boolean {
		const interfaceData = this.getInterfaceData();
		const importItem = item.importItem;
		if (Identifier.is(importItem)) {
			throw new Error(`Not implemented`);
		} else if (RenameItem.is(importItem)) {
			throw new Error(`Not implemented`);
		} else if (NamedImports.is(importItem)) {
			const name = importItem.name;
			const tsName = Names.toTs(name);
			this.code.imports.add(tsName, `./${name.value}`);
			for (const member of importItem.members) {
				if (Identifier.is(member)) {
					const memberName = Names.toTs(member);
					this.code.push(`type ${memberName} = ${tsName}.${memberName};`);
					interfaceData.componentModelTypes.add(new TypeType(memberName, `${tsName}.$cm.$${memberName}`, 'private'));
				} else if (RenameItem.is(member)) {
					const fromName = Names.toTs(member.from);
					const toName = Names.toTs(member.to);
					this.code.push(`type ${toName} = ${tsName}.${fromName};`);
					interfaceData.componentModelTypes.add(new TypeType(toName, `${tsName}.$cm.$${fromName}`, 'private'));
				}
			}
		}
		return false;
	}

	visitTypeItem(item: TypeItem): boolean {
		const tsName = Names.toTs(item.name);
		const typeName = TyPrinter.do(item.type, this.code.imports);
		this.code.push(`export type ${tsName} = ${typeName};`);
		const interfaceData = this.getInterfaceData();
		interfaceData.componentModelTypes.add(new TypeType(tsName, ComponentModelTypePrinter.do(item.type)));
		return false;
	}

	visitRecordItem(node: RecordItem): boolean {
		const tsName = Names.toTs(node.name);
		const recordType = new RecordType(tsName);
		this.code.push(`export interface ${tsName} {`);
		this.code.increaseIndent();
		for (const member of node.members) {
			const memberName = Names.toTs(member.name);
			const typeName = TyPrinter.do(member.type, this.code.imports);
			this.code.push(`${memberName}: ${typeName};`);
			recordType.addField(memberName, ComponentModelTypePrinter.do(member.type));
		}
		this.code.decreaseIndent();
		this.code.push(`}`);
		const interfaceData = this.getInterfaceData();
		interfaceData.componentModelTypes.add(recordType);
		return false;
	}

	visitFuncItem(node: FuncItem): boolean {
		const interfaceData = this.getInterfaceData();
		const tsName = Names.toTs(node.name);
		const functionSignature = new FunctionSignature(tsName);
		const tyVisitor = new TyPrinter(this.code.imports);
		const signature = node.signature;
		const params: string[] = [];
		for (const param of signature.params.members) {
			param.type.visit(tyVisitor, param.type);
			const paramName = Names.toTs(param.name);
			const typeName = tyVisitor.result;
			params.push(`${paramName}: ${typeName}`);
			functionSignature.addParameter(paramName, `$${typeName}`);
		}
		const returnType = signature.result !== undefined ? FuncResultPrinter.do(signature.result, this.code.imports) : 'void';
		this.code.push(`export declare function ${tsName}(${params.join(', ')}): ${returnType};`);
		if (signature.result !== undefined) {
			functionSignature.setReturnType(`$${returnType}`);
		}
		interfaceData.componentModelTypes.add(functionSignature);
		interfaceData.exports.push(tsName);
		return false;
	}

	private getInterfaceData(): InterfaceData {
		const result = this.interfaceData[this.interfaceData.length - 1];
		if (result === undefined) {
			throw new Error(`No component model type`);
		}
		return result;
	}
}

const visitor = new DocumentVisitor();
document.visit(visitor, document);