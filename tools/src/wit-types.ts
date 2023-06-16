/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

enum NodeKind {
	document = 'document',
	package = 'package',
	packageId = 'packageId',
	versionNumber = 'version',
	world = 'world',
	export = 'export',
	import = 'import',
	interfaceType = 'interfaceType',
	interface = 'interface',
	type = 'type',
	variant = 'variant',
	variantCase = 'variantCase',
	record = 'record',
	union = 'union',
	flags = 'flags',
	enum = 'enum',
	field = 'field',
	use = 'use',
	func = 'func',
	funcSignature = 'funcSignature',
	funcParams = 'funcParams',
	funcResult = 'funcResult',
	namedFuncResult = 'namedFuncResult',
	namedType = 'namedType',
	tuple = 'tuple',
	list = 'list',
	option = 'option',
	result = 'result',
	handle = 'handle',
	qualifiedName = 'qualifiedName',
	rename = 'rename',
	u8 = 'u8',
	u16 = 'u16',
	u32 = 'u32',
	u64 = 'u64',
	s8 = 's8',
	s16 = 's16',
	s32 = 's32',
	s64 = 's64',
	bool = 'bool',
	char = 'char',
	string = 'string',
	float32 = 'float32',
	float64 = 'float64',
	noResult = 'noResult',
	name = 'name',
	id = 'id',
	multiLineComment = 'multiLineComment',
	multiLineCommentOneLine = 'multiLineCommentOneLine',
	singleLineComment = 'singleLineComment',
	commentBlock = 'commentBlock'
}

export interface Position {
	offset: number;
	line: number;
	column: number;
}

export interface Range {
	start: Position;
	end: Position;
}

export interface Node {
	kind: NodeKind;
	range: Range;
	parent: Node | undefined;
	comments?: Node[];
}

export interface u8 extends Node {
	kind: NodeKind.u8;
}

export namespace u8 {
	export function is(node: Node): node is u8 {
		return node.kind === NodeKind.u8;
	}
	export function create(range: Range): u8 {
		return { kind: NodeKind.u8, range, parent: undefined };
	}
}

export interface u16 extends Node {
	kind: NodeKind.u16;
}

export namespace u16 {
	export function is(node: Node): node is u16 {
		return node.kind === NodeKind.u16;
	}
	export function create(range: Range): u16 {
		return { kind: NodeKind.u16, range, parent: undefined };
	}
}

export interface u32 extends Node {
	kind: NodeKind.u32;
}

export namespace u32 {
	export function is(node: Node): node is u32 {
		return node.kind === NodeKind.u32;
	}
	export function create(range: Range): u32 {
		return { kind: NodeKind.u32, range, parent: undefined };
	}
}

export interface u64 extends Node {
	kind: NodeKind.u64;
}

export namespace u64 {
	export function is(node: Node): node is u64 {
		return node.kind === NodeKind.u64;
	}
	export function create(range: Range): u64 {
		return { kind: NodeKind.u64, range, parent: undefined };
	}
}

export interface s8 extends Node {
	kind: NodeKind.s8;
}

export namespace s8 {
	export function is(node: Node): node is s8 {
		return node.kind === NodeKind.s8;
	}
	export function create(range: Range): s8 {
		return { kind: NodeKind.s8, range, parent: undefined };
	}
}

export interface s16 extends Node {
	kind: NodeKind.s16;
}

export namespace s16 {
	export function is(node: Node): node is s16 {
		return node.kind === NodeKind.s16;
	}
	export function create(range: Range): s16 {
		return { kind: NodeKind.s16, range, parent: undefined };
	}
}

export interface s32 extends Node {
	kind: NodeKind.s32;
}

export namespace s32 {
	export function is(node: Node): node is s32 {
		return node.kind === NodeKind.s32;
	}
	export function create(range: Range): s32 {
		return { kind: NodeKind.s32, range, parent: undefined };
	}
}

export interface s64 extends Node {
	kind: NodeKind.s64;
}

export namespace s64 {
	export function is(node: Node): node is s64 {
		return node.kind === NodeKind.s64;
	}
	export function create(range: Range): s64 {
		return { kind: NodeKind.s64, range, parent: undefined };
	}
}

export interface float32 extends Node {
	kind: NodeKind.float32;
}

export namespace float32 {
	export function is(node: Node): node is float32 {
		return node.kind === NodeKind.float32;
	}
	export function create(range: Range): float32 {
		return { kind: NodeKind.float32, range, parent: undefined };
	}
}

export interface float64 extends Node {
	kind: NodeKind.float64;
}

export namespace float64 {
	export function is(node: Node): node is float64 {
		return node.kind === NodeKind.float64;
	}
	export function create(range: Range): float64 {
		return { kind: NodeKind.float64, range, parent: undefined };
	}
}

export interface bool extends Node {
	kind: NodeKind.bool;
}

export namespace bool {
	export function is(node: Node): node is bool {
		return node.kind === NodeKind.bool;
	}
	export function create(range: Range): bool {
		return { kind: NodeKind.bool, range, parent: undefined };
	}
}

export interface char extends Node {
	kind: NodeKind.char;
}

export namespace char {
	export function is(node: Node): node is char {
		return node.kind === NodeKind.char;
	}
	export function create(range: Range): char {
		return { kind: NodeKind.char, range, parent: undefined };
	}
}

export interface string_ extends Node {
	kind: NodeKind.string;
}

export namespace string_ {
	export function is(node: Node): node is string_ {
		return node.kind === NodeKind.string;
	}
	export function create(range: Range): string_ {
		return { kind: NodeKind.string, range, parent: undefined };
	}
}

export interface Identifier extends Node {
	kind: NodeKind.id;
	name: string;
}

export namespace Identifier {
	export function is(node: Node): node is Identifier {
		return node.kind === NodeKind.id;
	}
	export function create(range: Range, name: string): Identifier {
		return { kind: NodeKind.id, range, parent: undefined, name };
	}
}

export interface MultiLineComment extends Node {
	kind: NodeKind.multiLineComment;
	text: string;
}

export namespace MultiLineComment {
	export function is(node: Node): node is MultiLineComment {
		return node.kind === NodeKind.multiLineComment;
	}
	export function create(range: Range, text: string): MultiLineComment {
		return { kind: NodeKind.multiLineComment, range, parent: undefined, text };
	}
}

export interface SingleLineComment extends Node {
	kind: NodeKind.singleLineComment;
	value: string;
}

export namespace SingleLineComment {
	export function is(node: Node): node is SingleLineComment {
		return node.kind === NodeKind.singleLineComment;
	}
	export function create(range: Range, value: string): SingleLineComment {
		return { kind: NodeKind.singleLineComment, range, parent: undefined, value };
	}
}

export interface MultiLineCommentOneLine extends Node {
	kind: NodeKind.multiLineCommentOneLine;
	value: string;
}

export namespace MultiLineCommentOneLine {
	export function is(node: Node): node is MultiLineCommentOneLine {
		return node.kind === NodeKind.multiLineCommentOneLine;
	}
	export function create(range: Range, value: string): MultiLineCommentOneLine {
		return { kind: NodeKind.multiLineCommentOneLine, range, parent: undefined, value };
	}
}

export type Comment = MultiLineComment | SingleLineComment;

export interface VersionNumber extends Node {
	kind: NodeKind.versionNumber;
	value: string;
}

export namespace VersionNumber {
	export function is(node: Node): node is VersionNumber {
		return node.kind === NodeKind.versionNumber;
	}
	export function create(range: Range, value: string): VersionNumber {
		return { kind: NodeKind.versionNumber, range, parent: undefined, value };
	}
}

export interface PackageIdentifier extends Node {
	kind: NodeKind.packageId;
	namespace?: Identifier;
	name: Identifier;
	version?: VersionNumber;
}

export namespace PackageIdentifier {
	export function is(node: Node): node is PackageIdentifier {
		return node.kind === NodeKind.packageId;
	}
	export function create(range: Range, name: Identifier, namespace?: Identifier, version?: VersionNumber): PackageIdentifier {
		return { kind: NodeKind.packageId, range, parent: undefined, name, namespace, version };
	}
}

export interface PackageStatement extends Node {
	kind: NodeKind.package;
}

export interface Document extends Node {
	pack: PackageStatement;
	members: Node[];
}