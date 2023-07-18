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
		this.add('wasi', name);
	}

	public add(from: string, value: string): void {
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
			this.source.unshift(`import type { ${values.join(', ')} } from './${from}';`);
		}
		this.source.unshift(`import * as $wasi from './wasi';`);
		return this.source.join('\n');
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
		code.push(`export const _${this.name}: $wasi.ComponentModelType<${this.name}> = new $wasi.RecordType<${this.name}>([`);
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
		code.push(`export const _${this.name}: $wasi.ComponentModelType<${this.name}> = new $wasi.TupleType<${this.name}>([${elements.join(', ')}]);`);
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
		code.push(`export const _${this.name}: $wasi.ComponentModelType<${this.name}> = new $wasi.ListType<${this.name}>(${this.type});`);
	}
}

class TypeType implements ComponentModelType {

	private readonly name: string;
	private readonly type: string;

	constructor(name: string, type: string) {
		this.name = name;
		this.type = type;
	}

	public emit(code: Code): void {
		code.push(`export const _${this.name}: $wasi.ComponentModelType<${this.name}> = ${this.type};`);
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
		this.result = '$wasi.u8';
		return true;
	}

	visitU16(): boolean {
		this.result = '$wasi.u16';
		return true;
	}

	visitU32(): boolean {
		this.result = '$wasi.u32';
		return true;
	}

	visitU64(): boolean {
		this.result = '$wasi.u64';
		return true;
	}

	visitS8(): boolean {
		this.result = '$wasi.s8';
		return true;
	}

	visitS16(): boolean {
		this.result = '$wasi.s16';
		return true;
	}

	visitS32(): boolean {
		this.result = '$wasi.s32';
		return true;
	}

	visitS64(): boolean {
		this.result = '$wasi.s64';
		return true;
	}

	visitFloat32(): boolean {
		this.result = '$wasi.float32';
		return true;
	}

	visitFloat64(): boolean {
		this.result = '$wasi.float64';
		return true;
	}

	visitString(): boolean {
		this.result = '$wasi.wstring';
		return true;
	}

	visitBool(): boolean {
		this.result = '$wasi.bool';
		return true;
	}

	visitChar(): boolean {
		this.result = '$wasi.char';
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
		this.interfaceData.push({ componentModelTypes: new ComponentModelTypes(), exports: [] });
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
			this.code.push(`export namespace $cmt {`);
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
		const importItem = item.importItem;
		if (Identifier.is(importItem)) {
			throw new Error(`Not implemented`);
		} else if (RenameItem.is(importItem)) {
			throw new Error(`Not implemented`);
		} else if (NamedImports.is(importItem)) {
			const name = importItem.name;
			const tsName = Names.toTs(name);
			this.code.imports.add(name.value, tsName);
			for (const member of importItem.members) {
				if (Identifier.is(member)) {
					const memberName = Names.toTs(member);
					this.code.push(`type ${memberName} = ${tsName}.${memberName};`);
				} else if (RenameItem.is(member)) {
					const fromName = Names.toTs(member.from);
					const toName = Names.toTs(member.to);
					this.code.push(`type ${toName} = ${tsName}.${fromName};`);
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
		const tsName = Names.toTs(node.name);
		const tyVisitor = new TyPrinter(this.code.imports);
		const signature = node.signature;
		const params: string[] = [];
		for (const param of signature.params.members) {
			param.type.visit(tyVisitor, param.type);
			params.push(`${Names.toTs(param.name)}: ${tyVisitor.result}`);
		}
		const returnType = signature.result !== undefined ? FuncResultPrinter.do(signature.result, this.code.imports) : 'void';
		this.code.push(`export declare function ${tsName}(${params.join(', ')}): ${returnType};`);
		const interfaceData = this.getInterfaceData();
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