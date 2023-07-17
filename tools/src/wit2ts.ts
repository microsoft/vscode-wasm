/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'fs';

import * as wit from './wit';
import {
	Visitor, InterfaceItem, UseItem, PackageItem, Identifier, RenameItem, NamedImports,
	Document, TypeItem, Tuple, Node, List, Option, Result, RecordItem, FuncItem
} from './wit-ast';

const document = wit.parse(fs.readFileSync('./src/timezone.wit', 'utf8'));

namespace Names {

	const keywords: Map<string, string> = new Map<string, string>([
		['this', 'self']
	]);

	export function toTsType(name: string): string {
		const parts = name.split('-');
		for (let i = 0; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		return parts.join('');
	}

	export function toTsProperty(name: string, keepKeyword: boolean = false): string {
		const parts = name.split('-');
		for (let i = 1; i < parts.length; i++) {
			parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
		}
		const result = parts.join('');
		if (keepKeyword) {
			return result;
		} else {
			const replacement = keywords.get(result);
			return replacement !== undefined ? replacement : result;
		}
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

class Line {
	private readonly parts: string[];
	private modes: ('add' | 'append')[];

	constructor() {
		this.parts = [];
		this.modes = ['add'];
	}

	public push(part: string): void {
		const mode = this.modes[this.modes.length - 1];
		if (mode === 'add') {
			this.parts.push(part);
		} else {
			if (this.parts.length === 0) {
				this.parts.push(part);
			} else {
				this.parts[this.parts.length - 1] += part;
			}
		}
	}

	public add(): void {
		this.modes.push('add');
	}

	public append(): void {
		this.modes.push('append');
	}

	public pop() {
		this.modes.pop();
	}

	public toString(): string {
		return this.parts.join(' ');
	}
}

class Code {

	public readonly imports: Imports;
	public line: Line;
	private readonly source: string[];
	private indent: number;

	constructor() {
		this.imports = new Imports();
		this.line = new Line();
		this.source = [];
		this.indent = 0;
	}

	public increaseIndent(): void {
		this.indent += 1;
	}

	public decreaseIndent(): void {
		this.indent -= 1;
	}

	public pushLine(): void {
		this.source.push(`${new Array(this.indent).fill('\t').join('')}${this.line.toString()}`);
		this.line = new Line();
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

class TyVisitor implements Visitor {

	private readonly imports: Imports;
	public result: string;

	public static toString(node: Node, typeContext: Imports): string {
		const visitor = new TyVisitor(typeContext);
		node.visit(visitor, node);
		return visitor.result;
	}

	public constructor(imports: Imports) {
		this.imports = imports;
		this.result = '';
	}

}

class InterfaceVisitor implements Visitor {

	private readonly code: Code;

	constructor(code: Code) {
		this.code = code;
	}

}

class DocumentVisitor implements Visitor {

	private readonly code: Code;

	constructor() {
		this.code = new Code();
	}

	visitU8(): boolean {
		this.code.line.push('u8');
		this.code.imports.addBaseType('u8');
		return true;
	}

	visitU16(): boolean {
		this.code.line.push('u16');
		this.code.imports.addBaseType('u16');
		return true;
	}

	visitU32(): boolean {
		this.code.line.push('u32');
		this.code.imports.addBaseType('u32');
		return true;
	}

	visitU64(): boolean {
		this.code.line.push('u64');
		this.code.imports.addBaseType('u64');
		return true;
	}

	visitS8(): boolean {
		this.code.line.push('s8');
		this.code.imports.addBaseType('s8');
		return true;
	}

	visitS16(): boolean {
		this.code.line.push('s16');
		this.code.imports.addBaseType('s16');
		return true;
	}

	visitS32(): boolean {
		this.code.line.push('s32');
		this.code.imports.addBaseType('s32');
		return true;
	}

	visitS64(): boolean {
		this.code.line.push('s64');
		this.code.imports.addBaseType('s64');
		return true;
	}

	visitFloat32(): boolean {
		this.code.line.push('float32');
		this.code.imports.addBaseType('float32');
		return true;
	}

	visitFloat64(): boolean {
		this.code.line.push('float64');
		this.code.imports.addBaseType('float64');
		return true;
	}

	visitString(): boolean {
		this.code.line.push('string');
		return true;
	}

	visitBool(): boolean {
		this.code.line.push('boolean');
		return true;
	}

	visitChar(): boolean {
		this.code.line.push('string');
		return true;
	}

	visitTuple(node: Tuple): boolean {
		this.code.line.push('[');
		this.code.line.append();
		for (let i = 0; i < node.members.length; i++) {
			const member = node.members[i];
			member.visit(this, member);
			if (i < node.members.length - 2) {
				this.code.line.push(', ');
			}
		}
		this.code.line.push(']');
		this.code.line.pop();
		return false;
	}

	visitList(node: List) {
		node.type.visit(this, node.type);
		this.code.line.append();
		this.code.line.push('[]');
		this.code.line.pop();
		return false;
	}

	visitOption(node: Option) {
		this.code.line.push('Option<');
		this.code.line.append();
		node.type.visit(this, node.type);
		this.code.line.push('>');
		this.code.line.pop();
		return false;
	}

	visitResult(node: Result) {
		this.code.line.push('Result<');
		this.code.line.append();
		if (node.ok !== undefined) {
			node.ok.visit(this, node.ok);
		} else {
			this.code.line.push('void');
		}
		this.code.line.push(', ');
		if (node.error !== undefined) {
			node.error.visit(this, node.error);
		} else {
			this.code.line.push('void');
		}
		this.code.line.push('>');
		this.code.line.pop();
		return false;
	}

	visitIdentifier(node: Identifier) {
		this.code.line.push(Names.toTsType(node.value));
		return true;
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
		const tsName = Names.toTsType(item.name.value);
		this.code.line.push(`export namespace ${tsName} {`);
		this.code.pushLine();
		this.code.increaseIndent();
		return true;
	}
	endVisitInterfaceItem(_item: InterfaceItem): void {
		this.code.decreaseIndent();
		this.code.addLine(`}`);
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
			const name = importItem.name.value;
			const tsName = Names.toTsType(name);
			this.code.imports.add(name, tsName);
			for (const member of importItem.members) {
				if (Identifier.is(member)) {
					const memberName = Names.toTsType(member.value);
					this.code.addLine(`type ${memberName} = ${tsName}.${memberName};`);
				} else if (RenameItem.is(member)) {
					const fromName = Names.toTsType(member.from.value);
					const toName = Names.toTsType(member.to.value);
					this.code.addLine(`type ${toName} = ${tsName}.${fromName};`);
				}
			}
		}
		return false;
	}
	visitTypeItem(item: TypeItem): boolean {
		const tsName = Names.toTsType(item.name.value);
		const typeName = TyVisitor.toString(item.type, this.code.imports);
		this.code.addLine(`export type ${tsName} = ${typeName};`);
		return false;
	}
	visitRecordItem(node: RecordItem): boolean {
		const tsName = Names.toTsType(node.name.value);
		this.code.addLine(`export interface ${tsName} {`);
		this.code.increaseIndent();
		for (const member of node.members) {
			const memberName = Names.toTsProperty(member.name.value);
			const typeName = TyVisitor.toString(member.type, this.code.imports);
			this.code.addLine(`${memberName}: ${typeName};`);
		}
		this.code.decreaseIndent();
		this.code.addLine(`}`);
		return false;
	}
	visitFuncItem(node: FuncItem): boolean {
		const tsName = Names.toTsProperty(node.name.value);
		const tyVisitor = new TyVisitor(this.code.imports);
		const signature = node.signature;
		const params: string[] = [];
		for (const param of signature.params.members) {
			param.type.visit(tyVisitor, param.type);
			params.push(`${Names.toTsProperty(param.name.value)}: ${tyVisitor.result}`);
		}
		const returnType = signature.result !== undefined ? TyVisitor.toString(signature.result, this.code.imports) : 'void';
		this.code.addLine(`export declare function ${tsName}(${params.join(', ')}): ${returnType};`);
		return false;
	}
}

const visitor = new DocumentVisitor();
document.visit(visitor, document);