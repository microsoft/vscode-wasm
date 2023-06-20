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
	namedImports = 'namedImports',
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
	borrow = 'borrow',
	qualifiedName = 'qualifiedName',
	renamed = 'renamed',
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

export interface Document extends Node {
	kind: NodeKind.document;
	pack?: PackageItem;
	members: (WorldItem | InterfaceItem)[];
}
export namespace Document {
	export function is(node: Node): node is Document {
		return node.kind === NodeKind.document;
	}
	export function create(range: Range, pack: PackageItem | undefined | null, members: (WorldItem | InterfaceItem)[], ...ws: Comment[]): Document {
		pack = pack === null ? undefined : pack;
		return Node.parent({ kind: NodeKind.document, range, parent: undefined, pack, members }, pack, members);
	}
}

export interface PackageItem extends Node {
	kind: NodeKind.package;
	id: PackageIdentifier;
}
export namespace PackageItem {
	export function is(node: Node): node is PackageItem {
		return node.kind === NodeKind.package;
	}
	export function create(range: Range, id: PackageIdentifier): PackageItem {
		return { kind: NodeKind.package, range, parent: undefined, id };
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

export interface WorldItem extends Node {
	kind: NodeKind.world;
	name: Identifier;
	members: WorldMember[];
}
export namespace WorldItem {
	export function is(node: Node): node is WorldItem {
		return node.kind === NodeKind.world;
	}
	export function create(range: Range, name: Identifier, members: WorldMember[]): WorldItem {
		return { kind: NodeKind.world, range, parent: undefined, name, members };
	}
}

export type WorldMember = ExportItem | UseItem | TypeDefItem;

export interface ExportItem extends Node {
	kind: NodeKind.export;
	name: Identifier;
	type: ExternType;
}
export namespace ExportItem {
	export function is(node: Node): node is ExportItem {
		return node.kind === NodeKind.export;
	}
	export function create(range: Range, name: Identifier, type: ExternType): ExportItem {
		return { kind: NodeKind.export, range, parent: undefined, name, type };
	}
}

export type ExternType = FuncType | InterfaceType;

export interface ImportItem extends Node {
	kind: NodeKind.import;
	name: Identifier;
}
export namespace ImportItem {
	export function is(node: Node): node is ImportItem {
		return node.kind === NodeKind.import;
	}
	export function create(range: Range, name: Identifier): ImportItem {
		return { kind: NodeKind.import, range, parent: undefined, name };
	}
}

export interface InterfaceType extends Node {
	kind: NodeKind.interfaceType;
	members: InterfaceMember[];
}
export namespace InterfaceType {
	export function is(node: Node): node is InterfaceType {
		return node.kind === NodeKind.interfaceType;
	}
	export function create(range: Range, members: InterfaceMember[]): InterfaceType {
		return { kind: NodeKind.interfaceType, range, parent: undefined, members };
	}
}

export interface InterfaceItem extends Node {
	kind: NodeKind.interface;
	name: Identifier;
	members: InterfaceMember[];
}
export namespace InterfaceItem {
	export function is(node: Node): node is InterfaceItem {
		return node.kind === NodeKind.interface;
	}
	export function create(range: Range, name: Identifier, members: InterfaceMember[]): InterfaceItem {
		return { kind: NodeKind.interface, range, parent: undefined, name, members };
	}
}

export type InterfaceMember = TypeDefItem | FuncItem | UseItem;

export interface FuncItem extends Node {
	kind: NodeKind.func;
	name: Identifier;
	signature: FuncType;
}

export interface FuncType extends Node {
	kind: NodeKind.funcSignature;
	params: FuncParams;
	result?: FuncResult | NamedFuncResult;
}
export namespace FuncType {
	export function is(node: Node): node is FuncType {
		return node.kind === NodeKind.funcSignature;
	}
	export function create(range: Range, params: FuncParams, result?: FuncResult | NamedFuncResult): FuncType {
		return { kind: NodeKind.funcSignature, range, parent: undefined, params, result };
	}
}

export interface FuncParams extends Node {
	kind: NodeKind.funcParams;
	params: NamedType[];
}
export namespace FuncParams {
	export function is(node: Node): node is FuncParams {
		return node.kind === NodeKind.funcParams;
	}
	export function create(range: Range, params: NamedType[]): FuncParams {
		return { kind: NodeKind.funcParams, range, parent: undefined, params };
	}
}

export interface NamedFuncResult extends Node {
	kind: NodeKind.namedFuncResult;
	name: Identifier;
	members: NamedType[];
}
export namespace NamedFuncResult {
	export function is(node: Node): node is NamedFuncResult {
		return node.kind === NodeKind.namedFuncResult;
	}
	export function create(range: Range, name: Identifier, members: NamedType[]): NamedFuncResult {
		return { kind: NodeKind.namedFuncResult, range, parent: undefined, name, members };
	}
}

export interface FuncResult extends Node {
	kind: NodeKind.funcResult;
	type: Ty;
}
export namespace FuncResult {
	export function is(node: Node): node is FuncResult {
		return node.kind === NodeKind.funcResult;
	}
	export function create(range: Range, type: Ty): FuncResult {
		return { kind: NodeKind.funcResult, range, parent: undefined, type };
	}
}

export interface NamedType extends Node {
	kind: NodeKind.namedType;
	name: Identifier;
	type: Ty;
}
export namespace NamedType {
	export function is(node: Node): node is NamedType {
		return node.kind === NodeKind.namedType;
	}
	export function create(range: Range, name: Identifier, type: Ty): NamedType {
		return { kind: NodeKind.namedType, range, parent: undefined, name, type };
	}
}

export interface UseItem extends Node {
	kind: NodeKind.use;
	from?: PackageIdentifier;
	importItem: ImportItemTypes;
}
export namespace UseItem {
	export function is(node: Node): node is UseItem {
		return node.kind === NodeKind.use;
	}
	export function create(range: Range, importItem: ImportItemTypes, from?: PackageIdentifier): UseItem {
		return { kind: NodeKind.use, range, parent: undefined, importItem, from };
	}
}

export type ImportItemTypes = Identifier | RenamedIdentifier | NamedImports;
export namespace ImportItemTypes {
	export function is(node: Node): node is ImportItem {
		return Identifier.is(node) || RenamedIdentifier.is(node) || NamedImports.is(node);
	}
}

export interface NamedImports extends Node {
	kind: NodeKind.namedImports;
	name: Identifier;
	members: (Identifier | RenamedIdentifier)[];
}
export namespace NamedImports {
	export function is(node: Node): node is NamedImports {
		return node.kind === NodeKind.namedImports;
	}
	export function create(range: Range, name: Identifier, members: (Identifier | RenamedIdentifier)[]): NamedImports {
		return { kind: NodeKind.namedImports, range, parent: undefined, name, members };
	}
}

export interface RenamedIdentifier extends Node {
	kind: NodeKind.renamed;
	from: Identifier;
	to: Identifier;
}
export namespace RenamedIdentifier {
	export function is(node: Node): node is RenamedIdentifier {
		return node.kind === NodeKind.renamed;
	}
	export function create(range: Range, from: Identifier, to: Identifier): RenamedIdentifier {
		return { kind: NodeKind.renamed, range, parent: undefined, from, to };
	}
}

export type TypeDefItem = VariantItem | RecordItem | UnionItem | FlagsItem | EnumItem | TypeItem;
export namespace TypeDefItem {
	export function is(node: Node): node is TypeDefItem {
		return VariantItem.is(node) || RecordItem.is(node) || UnionItem.is(node) || FlagsItem.is(node) || EnumItem.is(node) || TypeItem.is(node);
	}
}

export interface VariantItem extends Node {
	kind: NodeKind.variant;
	name: Identifier;
	members: VariantCase[];
}
export namespace VariantItem {
	export function is(node: Node): node is VariantItem {
		return node.kind === NodeKind.variant;
	}
	export function create(range: Range, name: Identifier, members: VariantCase[]): VariantItem {
		return { kind: NodeKind.variant, range, parent: undefined, name, members };
	}
}

export interface VariantCase extends Node {
	kind: NodeKind.variantCase;
	name: Identifier;
	type?: Ty;
}
export namespace VariantCase {
	export function is(node: Node): node is VariantCase {
		return node.kind === NodeKind.variantCase;
	}
	export function create(range: Range, name: Identifier, type?: Ty): VariantCase {
		return { kind: NodeKind.variantCase, range, parent: undefined, name, type };
	}
}

export interface RecordItem extends Node {
	kind: NodeKind.record;
	name: Identifier;
	members: Field[];
}
export namespace RecordItem {
	export function is(node: Node): node is RecordItem {
		return node.kind === NodeKind.record;
	}
	export function create(range: Range, name: Identifier, members: Field[]): RecordItem {
		return { kind: NodeKind.record, range, parent: undefined, name, members };
	}
}

export interface Field extends Node {
	kind: NodeKind.field;
	name: Identifier;
	type: Ty;
}
export namespace Field {
	export function is(node: Node): node is Field {
		return node.kind === NodeKind.field;
	}
	export function create(range: Range, name: Identifier, type: Ty): Field {
		return { kind: NodeKind.field, range, parent: undefined, name, type };
	}
}

export interface UnionItem extends Node {
	kind: NodeKind.union;
	name: Identifier;
	members: Ty[];
}
export namespace UnionItem {
	export function is(node: Node): node is UnionItem {
		return node.kind === NodeKind.union;
	}
	export function create(range: Range, name: Identifier, members: Ty[]): UnionItem {
		return { kind: NodeKind.union, range, parent: undefined, name, members };
	}
}

export interface FlagsItem extends Node {
	kind: NodeKind.flags;
	name: Identifier;
	members: Identifier[];
}
export namespace FlagsItem {
	export function is(node: Node): node is FlagsItem {
		return node.kind === NodeKind.flags;
	}
	export function create(range: Range, name: Identifier, members: Identifier[]): FlagsItem {
		return { kind: NodeKind.flags, range, parent: undefined, name, members };
	}
}

export interface EnumItem extends Node {
	kind: NodeKind.enum;
	name: Identifier;
	members: Identifier[];
}
export namespace EnumItem {
	export function is(node: Node): node is EnumItem {
		return node.kind === NodeKind.enum;
	}
	export function create(range: Range, name: Identifier, members: Identifier[]): EnumItem {
		return { kind: NodeKind.enum, range, parent: undefined, name, members };
	}
}

export interface TypeItem extends Node {
	kind: NodeKind.type;
	name: Identifier;
	type: Ty;
}
export namespace TypeItem {
	export function is(node: Node): node is TypeItem {
		return node.kind === NodeKind.type;
	}
	export function create(range: Range, name: Identifier, type: Ty): TypeItem {
		return { kind: NodeKind.type, range, parent: undefined, name, type };
	}
}

export type Ty = Tuple | List | Option | Result | Handle | BaseTypes;
export namespace Ty {
	export function is(node: Node): node is Ty {
		return Tuple.is(node) || List.is(node) || Option.is(node) || Result.is(node) || Handle.is(node) || BaseTypes.is(node);
	}
}

export interface Tuple extends Node {
	kind: NodeKind.tuple;
	members: Ty[];
}
export namespace Tuple {
	export function is(node: Node): node is Tuple {
		return node.kind === NodeKind.tuple;
	}
	export function create(range: Range, members: Ty[]): Tuple {
		return { kind: NodeKind.tuple, range, parent: undefined, members };
	}
}

export interface List extends Node {
	kind: NodeKind.list;
	type: Ty;
}
export namespace List {
	export function is(node: Node): node is List {
		return node.kind === NodeKind.list;
	}
	export function create(range: Range, type: Ty): List {
		return { kind: NodeKind.list, range, parent: undefined, type };
	}
}

export interface Option extends Node {
	kind: NodeKind.option;
	type: Ty;
}
export namespace Option {
	export function is(node: Node): node is Option {
		return node.kind === NodeKind.option;
	}
	export function create(range: Range, type: Ty): Option {
		return { kind: NodeKind.option, range, parent: undefined, type };
	}
}

export interface Result extends Node {
	kind: NodeKind.result;
	result: Ty | NoResultType;
	error: Ty;
}
export namespace Result {
	export function is(node: Node): node is Result {
		return node.kind === NodeKind.result;
	}
	export function create(range: Range, result: Ty | NoResultType, error: Ty): Result {
		return { kind: NodeKind.result, range, parent: undefined, result, error };
	}
}

export interface NoResultType extends Node {
	kind: NodeKind.noResult;
}
export namespace NoResultType {
	export function is(node: Node): node is NoResultType {
		return node.kind === NodeKind.noResult;
	}
	export function create(range: Range): NoResultType {
		return { kind: NodeKind.noResult, range, parent: undefined };
	}
}

export type Handle = Identifier | Borrow;
export namespace Handle {
	export function is(node: Node): node is Handle {
		return Identifier.is(node) || Borrow.is(node);
	}
}

export interface Borrow extends Node {
	kind: NodeKind.borrow;
	name: Identifier;
}export namespace Borrow {
	export function is(node: Node): node is Borrow {
		return node.kind === NodeKind.borrow;
	}
	export function create(range: Range, name: Identifier): Borrow {
		return { kind: NodeKind.borrow, range, parent: undefined, name };
	}
}

export type BaseTypes = u8 | u16 | u32 | u64 | s8 | s16 | s32 | s64 | bool | char | string_ | float32 | float64;
export namespace BaseTypes {
	export function is(node: Node): node is BaseTypes {
		return u8.is(node) || u16.is(node) || u32.is(node) || u64.is(node) || s8.is(node) || s16.is(node) || s32.is(node) || s64.is(node) || bool.is(node) || char.is(node) || string_.is(node) || float32.is(node) || float64.is(node);
	}
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

export interface CommentBlock extends Node {
	kind: NodeKind.commentBlock;
	members: Comment[];
}
export namespace CommentBlock {
	export function is(node: Node): node is CommentBlock {
		return node.kind === NodeKind.commentBlock;
	}
	export function create(range: Range, members: Comment[]): CommentBlock {
		return { kind: NodeKind.commentBlock, range, parent: undefined, members };
	}
}

export type Comment = MultiLineComment | MultiLineCommentOneLine | SingleLineComment;
export namespace Comment {
	export function is(node: Node): node is Comment {
		return MultiLineComment.is(node) || MultiLineCommentOneLine.is(node) || SingleLineComment.is(node);
	}
	export function create(range: Range, items: (string | Comment)[]): Comment | CommentBlock | undefined {
		const filtered = [];
		for (const item of items) {
			if (typeof item === 'string') {
				continue;
			}
			filtered.push(item);
		}
		if (filtered.length === 0) {
			return undefined;
		} else if (filtered.length === 1) {
			return filtered[0];
		} else {
			return Node.finalize({
				kind: NodeKind.commentBlock,
				range: range,
				parent: undefined,
				members: filtered
			});
		}
	}
}

export interface Node {
	kind: NodeKind;
	range: Range;
	parent: Node | undefined;
	comments?: (Comment | CommentBlock | undefined)[];
}
export namespace Node {
	export function finalize<T extends Node>(node: T, ...ws: (string | Comment)[]): T {
		if (ws !== undefined && ws.length > 0) {
			let filtered = [];
			for (const item of ws) {
				if (Array.isArray(item)) {
					throw new Error('Should not happen');
				} else if (item === null) {
					filtered.push(undefined);
				} else if (typeof item === 'object') {
					filtered.push(item);
				} else {
					filtered.push(undefined);
				}
			}
			let end = filtered.length - 1;
			while (end >= 0 && filtered[end] === undefined) {
				end--;
			}
			if (end >= 0) {
				if (end < filtered.length - 1) {
					filtered = filtered.slice(0, end + 1);
				}
				node.comments = filtered;
			}
		}
		const props = Object.keys(node);
		for (const prop of props) {
			const value = (node as any)[prop];
			if (Array.isArray(value)) {
				for (const member of value) {
					if (is(member)) {
						member.parent = node;
					}
				}
			} else {

			}
		}
		return node;
	}
	function is(node: any): node is Node {
		const candidate = node as Node;
		return candidate !== undefined && candidate !== null && typeof candidate === 'object' &&
			typeof candidate.kind === 'string' && candidate.range !== undefined;
	}
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