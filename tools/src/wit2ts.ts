/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'fs';

import * as wit from './wit';
import {
	Visitor, DefaultVisitor, InterfaceItem, UseItem, PackageItem, Identifier, RenameItem, NamedImports,
	Document,
	TypeItem,
	u8,
	Tuple
} from './wit-ast';

const document = wit.parse(fs.readFileSync('./src/timezone.wit', 'utf8'));

interface _Visitor extends Visitor {
	source: string[];
}
namespace Wit2TS {

	namespace TyVisistor {
		export function create(): Visitor & { getResult(): string } {
			let result: string;
			const visitor: Visitor = {
				visitU8(): boolean { result = 'number'; return true; },
				visitU16(): boolean { result = 'number'; return true; },
				visitU32(): boolean { result = 'number'; return true; },
				visitU64(): boolean { result = 'bigint'; return true; },
				visitS8(): boolean { result = 'number'; return true; },
				visitS16(): boolean { result = 'number'; return true; },
				visitS32(): boolean { result = 'number'; return true; },
				visitS64(): boolean { result = 'bigint'; return true; },
				visitFloat32(): boolean { result = 'number'; return true; },
				visitFloat64(): boolean { result = 'number'; return true; },
				visitString(): boolean { result = 'string'; return true; },
				visitBool(): boolean { result = 'boolean'; return true; },
				visitChar(): boolean { result = 'string'; return true; },
				visitTuple(node: Tuple): boolean {
					const tyVisitor = TyVisistor.create();
					const elements: string[] = [];
					for (let i = 0; i < node.members.length; i++) {
						const member = node.members[i];
						member.visit(tyVisitor, member);
						elements.push(`${i}: tyVisitor.getResult()`);
					}
					result = `{ ${elements.join(', ')} }`;
					return true;
				},
				visitList(node) {
					const tyVisitor = TyVisistor.create();
					node.type.visit(tyVisitor, node.type);
					result = `${tyVisitor.getResult()}[]`;
					return true;
				},
				visitOption(node) {
					const tyVisitor = TyVisistor.create();
					node.type.visit(tyVisitor, node.type);
					result = `(${tyVisitor.getResult()} | null)`;
					return true;
				},
				visitResult(node) {
					const tyVisitor = TyVisistor.create();
					if (node.result !== undefined) {
						
					}
					return true;
				}
			};
			return Object.assign(visitor, { getResult(): string { return result; } });
		}
	}

	export function create(): _Visitor {
		const imports: Map<string, string[]> = new Map();
		const source: string[] = [];
		let indent: string = '';

		function increaseIndent(): void {
			indent += '\t';
		}

		function decreaseIndent(): void {
			indent = indent.substring(0, indent.length - 1);
		}

		function toTsTypeName(name: string): string {
			const parts = name.split('-');
			for (let i = 0; i < parts.length; i++) {
				parts[i] = parts[i][0].toUpperCase() + parts[i].substring(1);
			}
			return parts.join('');
		}

		function addImport(from: string, value: string): void {
			let values = imports.get(from);
			if (values === undefined) {
				values = [];
				imports.set(from, values);
			}
			values.push(value);
		}

		const tyVisitor: Visitor = {
			visitU8(node: u8): string {
				return 'number';
			}
		};

		const result: _Visitor = {
			source,
			visitDocument(_document: Document): boolean {
				return true;
			},
			endVisitDocument(_document: Document): void {
				if (imports.size > 0) {
					source.unshift('');
				}
				for (const [from, values] of imports) {
					source.unshift(`import type { ${values.join(', ')} } from './${from}';`);
				}
			},
			visitPackageItem(_item: PackageItem): boolean {
				return false;
			},
			visitInterfaceItem(item: InterfaceItem): boolean {
				const tsName = toTsTypeName(item.name.value);
				source.push(`${indent}export namespace ${tsName} {`);
				increaseIndent();
				return true;
			},
			endVisitInterfaceItem(_item: InterfaceItem): void {
				decreaseIndent();
				source.push(`${indent}}`);
			},
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
					const tsName = toTsTypeName(name);
					addImport(name, tsName);
					for (const member of importItem.members) {
						if (Identifier.is(member)) {
							const memberName = toTsTypeName(member.value);
							source.push(`${indent}type ${memberName} = ${tsName}.${memberName};`);
						} else if (RenameItem.is(member)) {
							const fromName = toTsTypeName(member.from.value);
							const toName = toTsTypeName(member.to.value);
							source.push(`${indent}type ${toName} = ${tsName}.${fromName};`);
						}
					}
				}
				return false;
			},
			visitTypeItem(item: TypeItem): boolean {
				const tsName = toTsTypeName(item.name.value);
				return false;
			}
		};
		return Object.assign(DefaultVisitor, result);
	}
}

const visitor = Wit2TS.create();

Document.visit(visitor, document);

console.log(visitor.source.join('\n'));