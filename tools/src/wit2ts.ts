/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'fs';

import * as wit from './wit';
import {
	Visitor, InterfaceItem, UseItem, PackageItem, Identifier, RenameItem, NamedImports,
	Document, TypeItem, Tuple, Node, List, Option, Result, RecordItem, FuncItem, Ty, Borrow, _FuncResult, NamedFuncResult, FuncResult
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
		if (this.imports.size > 0) {
			this.source.unshift('');
		}
		for (const [from, values] of this.imports) {
			this.source.unshift(`import type { ${values.join(', ')} } from './${from}';`);
		}
		return this.source.join('\n');
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

class DocumentVisitor implements Visitor {

	private readonly code: Code;

	constructor() {
		this.code = new Code();
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
		const name = Names.toTs(item.name);
		this.code.push(`export namespace ${name} {`);
		this.code.increaseIndent();
		for (const member of item.members) {
			member.visit(this, member);
		}
		return false;
	}

	endVisitInterfaceItem(_item: InterfaceItem): void {
		this.code.decreaseIndent();
		this.code.push(`}`);
	}

	visitUseItem(item: UseItem): boolean {
		if (item.from !== undefined) {
		}
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
		return false;
	}

	visitRecordItem(node: RecordItem): boolean {
		const tsName = Names.toTs(node.name);
		this.code.push(`export interface ${tsName} {`);
		this.code.increaseIndent();
		for (const member of node.members) {
			const memberName = Names.toTs(member.name);
			const typeName = TyPrinter.do(member.type, this.code.imports);
			this.code.push(`${memberName}: ${typeName};`);
		}
		this.code.decreaseIndent();
		this.code.push(`}`);
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
		return false;
	}
}

const visitor = new DocumentVisitor();
document.visit(visitor, document);