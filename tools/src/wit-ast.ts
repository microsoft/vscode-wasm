/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

enum NodeKind {
	document = 'document',
	package = 'package',
	packageId = 'packageId',
	versionNumber = 'version',
	topLevelUseItem = 'topLevelUseItem',
	topLevelUseInterface = 'topLevelUseInterface',
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

export interface Visitor {
	visitDocument?(node: Document): boolean;
	endVisitDocument?(node: Document): void;
	visitPackageItem?(node: PackageItem): boolean;
	endVisitPackageItem?(node: PackageItem): void;
	visitPackageIdentifier?(node: PackageIdentifier): boolean;
	endVisitPackageIdentifier?(node: PackageIdentifier): void;
	visitVersionNumber?(node: VersionNumber): boolean;
	endVisitVersionNumber?(node: VersionNumber): void;
	visitTopLevelUseItem?(node: TopLevelUseItem): boolean;
	endVisitTopLevelUseItem?(node: TopLevelUseItem): void;
	visitTopLevelUseInterface?(node: TopLevelUseInterface): boolean;
	endVisitTopLevelUseInterface?(node: TopLevelUseInterface): void;
	visitWorldItem?(node: WorldItem): boolean;
	endVisitWorldItem?(node: WorldItem): void;
	visitExportItem?(node: ExportItem): boolean;
	endVisitExportItem?(node: ExportItem): void;
	visitImportItem?(node: ImportItem): boolean;
	endVisitImportItem?(node: ImportItem): void;
	visitInterfaceType?(node: InterfaceType): boolean;
	endVisitInterfaceType?(node: InterfaceType): void;
	visitInterfaceItem?(node: InterfaceItem): boolean;
	endVisitInterfaceItem?(node: InterfaceItem): void;
	visitFuncItem?(node: FuncItem): boolean;
	endVisitFuncItem?(node: FuncItem): void;
	visitFuncType?(node: FuncType): boolean;
	endVisitFuncType?(node: FuncType): void;
	visitFuncParams?(node: FuncParams): boolean;
	endVisitFuncParams?(node: FuncParams): void;
	visitFuncResult?(node: FuncResult): boolean;
	endVisitFuncResult?(node: FuncResult): void;
	visitNamedFuncResult?(node: NamedFuncResult): boolean;
	endVisitNamedFuncResult?(node: NamedFuncResult): void;
	visitNamedType?(node: NamedType): boolean;
	endVisitNamedType?(node: NamedType): void;
	visitUseItem?(node: UseItem): boolean;
	endVisitUseItem?(node: UseItem): void;
	visitNamedImports?(node: NamedImports): boolean;
	endVisitNamedImports?(node: NamedImports): void;
	visitRenameItem?(node: RenameItem): boolean;
	endVisitRenameItem?(node: RenameItem): void;
	visitVariantItem?(node: VariantItem): boolean;
	endVisitVariantItem?(node: VariantItem): void;
	visitVariantCase?(node: VariantCase): boolean;
	endVisitVariantCase?(node: VariantCase): void;
	visitRecordItem?(node: RecordItem): boolean;
	endVisitRecordItem?(node: RecordItem): void;
	visitRecordField?(node: RecordField): boolean;
	endVisitRecordField?(node: RecordField): void;
	visitUnionItem?(node: UnionItem): boolean;
	endVisitUnionItem?(node: UnionItem): void;
	visitFlagsItem?(node: FlagsItem): boolean;
	endVisitFlagsItem?(node: FlagsItem): void;
	visitEnumItem?(node: EnumItem): boolean;
	endVisitEnumItem?(node: EnumItem): void;
	visitTypeItem?(node: TypeItem): boolean;
	endVisitTypeItem?(node: TypeItem): void;
	visitTuple?(node: Tuple): boolean;
	endVisitTuple?(node: Tuple): void;
	visitList?(node: List): boolean;
	endVisitList?(node: List): void;
	visitOption?(node: Option): boolean;
	endVisitOption?(node: Option): void;
	visitResult?(node: Result): boolean;
	endVisitResult?(node: Result): void;
	visitNoResultType?(node: NoResultType): boolean;
	endVisitNoResultType?(node: NoResultType): void;
	visitBorrow?(node: Borrow): boolean;
	endVisitBorrow?(node: Borrow): void;
	visitU8?(node: u8): boolean;
	endVisitU8?(node: u8): void;
	visitU16?(node: u16): boolean;
	endVisitU16?(node: u16): void;
	visitU32?(node: u32): boolean;
	endVisitU32?(node: u32): void;
	visitU64?(node: u64): boolean;
	endVisitU64?(node: u64): void;
	visitS8?(node: s8): boolean;
	endVisitS8?(node: s8): void;
	visitS16?(node: s16): boolean;
	endVisitS16?(node: s16): void;
	visitS32?(node: s32): boolean;
	endVisitS32?(node: s32): void;
	visitS64?(node: s64): boolean;
	endVisitS64?(node: s64): void;
	visitBool?(node: bool): boolean;
	endVisitBool?(node: bool): void;
	visitChar?(node: char): boolean;
	endVisitChar?(node: char): void;
	visitString?(node: string_): boolean;
	endVisitString?(node: string_): void;
	visitFloat32?(node: float32): boolean;
	endVisitFloat32?(node: float32): void;
	visitFloat64?(node: float64): boolean;
	endVisitFloat64?(node: float64): void;
	visitIdentifier?(node: Identifier): boolean;
	endVisitIdentifier?(node: Identifier): void;
	visitCommentBlock?(node: CommentBlock): boolean;
	endVisitCommentBlock?(node: CommentBlock): void;
	visitMultiLineComment?(node: MultiLineComment): boolean;
	endVisitMultiLineComment?(node: MultiLineComment): void;
	visitSingleLineComment?(node: SingleLineComment): boolean;
	endVisitSingleLineComment?(node: SingleLineComment): void;
	visitMultiLineCommentOneLine?(node: MultiLineCommentOneLine): boolean;
	endVisitMultiLineCommentOneLine?(node: MultiLineCommentOneLine): void;
}

export const DefaultVisitor: Visitor = {
	visitDocument: () => true,
	endVisitDocument: () => { },
	visitPackageItem: () => true,
	endVisitPackageItem: () => { },
	visitPackageIdentifier: () => true,
	endVisitPackageIdentifier: () => { },
	visitVersionNumber: () => true,
	endVisitVersionNumber: () => { },
	visitTopLevelUseItem: () => true,
	endVisitTopLevelUseItem: () => { },
	visitTopLevelUseInterface: () => true,
	endVisitTopLevelUseInterface: () => { },
	visitWorldItem: () => true,
	endVisitWorldItem: () => { },
	visitExportItem: () => true,
	endVisitExportItem: () => { },
	visitImportItem: () => true,
	endVisitImportItem: () => { },
	visitInterfaceType: () => true,
	endVisitInterfaceType: () => { },
	visitInterfaceItem: () => true,
	endVisitInterfaceItem: () => { },
	visitFuncItem: () => true,
	endVisitFuncItem: () => { },
	visitFuncType: () => true,
	endVisitFuncType: () => { },
	visitFuncParams: () => true,
	endVisitFuncParams: () => { },
	visitFuncResult: () => true,
	endVisitFuncResult: () => { },
	visitNamedFuncResult: () => true,
	endVisitNamedFuncResult: () => { },
	visitNamedType: () => true,
	endVisitNamedType: () => { },
	visitUseItem: () => true,
	endVisitUseItem: () => { },
	visitNamedImports: () => true,
	endVisitNamedImports: () => { },
	visitRenameItem: () => true,
	endVisitRenameItem: () => { },
	visitVariantItem: () => true,
	endVisitVariantItem: () => { },
	visitVariantCase: () => true,
	endVisitVariantCase: () => { },
	visitRecordItem: () => true,
	endVisitRecordItem: () => { },
	visitRecordField: () => true,
	endVisitRecordField: () => { },
	visitUnionItem: () => true,
	endVisitUnionItem: () => { },
	visitFlagsItem: () => true,
	endVisitFlagsItem: () => { },
	visitEnumItem: () => true,
	endVisitEnumItem: () => { },
	visitTypeItem: () => true,
	endVisitTypeItem: () => { },
	visitTuple: () => true,
	endVisitTuple: () => { },
	visitList: () => true,
	endVisitList: () => { },
	visitOption: () => true,
	endVisitOption: () => { },
	visitResult: () => true,
	endVisitResult: () => { },
	visitNoResultType: () => true,
	endVisitNoResultType: () => { },
	visitBorrow: () => true,
	endVisitBorrow: () => { },
	visitU8: () => true,
	endVisitU8: () => { },
	visitU16: () => true,
	endVisitU16: () => { },
	visitU32: () => true,
	endVisitU32: () => { },
	visitU64: () => true,
	endVisitU64: () => { },
	visitS8: () => true,
	endVisitS8: () => { },
	visitS16: () => true,
	endVisitS16: () => { },
	visitS32: () => true,
	endVisitS32: () => { },
	visitS64: () => true,
	endVisitS64: () => { },
	visitBool: () => true,
	endVisitBool: () => { },
	visitChar: () => true,
	endVisitChar: () => { },
	visitString: () => true,
	endVisitString: () => { },
	visitFloat32: () => true,
	endVisitFloat32: () => { },
	visitFloat64: () => true,
	endVisitFloat64: () => { },
	visitIdentifier: () => true,
	endVisitIdentifier: () => { },
	visitCommentBlock: () => true,
	endVisitCommentBlock: () => { },
	visitMultiLineComment: () => true,
	endVisitMultiLineComment: () => { },
	visitSingleLineComment: () => true,
	endVisitSingleLineComment: () => { },
	visitMultiLineCommentOneLine: () => true,
	endVisitMultiLineCommentOneLine: () => { },
};

export interface Document extends Node {
	kind: NodeKind.document;
	pack?: PackageItem;
	members: DocumentMember[];
	visit: (visitor: Visitor, node:Document) => void;
}
export namespace Document {
	export function is(node: Node): node is Document {
		return node.kind === NodeKind.document;
	}
	export function create(range: Range, pack: PackageItem | undefined | null, members: DocumentMember[]): Document {
		pack = pack === null ? undefined : pack;
		return { kind: NodeKind.document, range, parent: undefined, pack, members, visit };
	}
	export function visit(visitor: Visitor, node: Document): void {
		if (visitor.visitDocument && visitor.visitDocument(node)) {
			node.pack && node.pack.visit(visitor, node.pack);
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitDocument && visitor.endVisitDocument(node);
	}
}

export type DocumentMember = (WorldItem | InterfaceItem) & { visit: (visitor: Visitor, node: DocumentMember) => void };

export interface PackageItem extends Node {
	kind: NodeKind.package;
	id: PackageIdentifier;
	visit: (visitor: Visitor, node: PackageItem) => void;
}
export namespace PackageItem {
	export function is(node: Node): node is PackageItem {
		return node.kind === NodeKind.package;
	}
	export function create(range: Range, id: PackageIdentifier): PackageItem {
		return { kind: NodeKind.package, range, parent: undefined, id, visit };
	}
	function visit(visitor: Visitor, node: PackageItem): void {
		if (visitor.visitPackageItem && visitor.visitPackageItem(node)) {
			node.id.visit(visitor, node.id);
		}
		visitor.endVisitPackageItem && visitor.endVisitPackageItem(node);
	}
}

export interface PackageIdentifier extends Node {
	kind: NodeKind.packageId;
	namespace: Identifier | undefined;
	name: Identifier;
	version: VersionNumber | undefined;
	visit: (visitor: Visitor, node: PackageIdentifier) => void;
}
export namespace PackageIdentifier {
	export function is(node: Node): node is PackageIdentifier {
		return node.kind === NodeKind.packageId;
	}
	export function create(range: Range, namespace: Identifier | undefined | null, name: Identifier, version: VersionNumber | undefined | null): PackageIdentifier {
		namespace = namespace === null ? undefined : namespace;
		version = version === null ? undefined : version;
		return { kind: NodeKind.packageId, range, parent: undefined, name, namespace, version, visit };
	}
	function visit(visitor: Visitor, node: PackageIdentifier): void {
		if (visitor.visitPackageIdentifier && visitor.visitPackageIdentifier(node)) {
			node.namespace && node.namespace.visit(visitor, node.namespace);
			node.name.visit(visitor, node.name);
			node.version && node.version.visit(visitor, node.version);
		}
		visitor.endVisitPackageIdentifier && visitor.endVisitPackageIdentifier(node);
	}
}

export interface VersionNumber extends Node {
	kind: NodeKind.versionNumber;
	value: string;
	visit: (visitor: Visitor, node: VersionNumber) => void;
}
export namespace VersionNumber {
	export function is(node: Node): node is VersionNumber {
		return node.kind === NodeKind.versionNumber;
	}
	export function create(range: Range, value: string): VersionNumber {
		return { kind: NodeKind.versionNumber, range, parent: undefined, value, visit };
	}
	function visit(visitor: Visitor, node: VersionNumber): void {
		visitor.visitVersionNumber && visitor.visitVersionNumber(node);
		visitor.endVisitVersionNumber && visitor.endVisitVersionNumber(node);
	}
}

export interface TopLevelUseItem extends Node {
	kind: NodeKind.topLevelUseItem;
	interface: TopLevelUseInterface;
	visit: (visitor: Visitor, node: TopLevelUseItem) => void;
}
export namespace TopLevelUseItem {
	export function is(node: Node): node is TopLevelUseItem {
		return node.kind === NodeKind.topLevelUseItem;
	}
	export function create(range: Range, _interface: TopLevelUseInterface): TopLevelUseItem {
		return { kind: NodeKind.topLevelUseItem, range, parent: undefined, interface: _interface, visit };
	}
	export function visit(visitor: Visitor, node: TopLevelUseItem): void {
		if (visitor.visitTopLevelUseItem && visitor.visitTopLevelUseItem(node)) {
			node.interface.visit(visitor, node.interface);
		}
		visitor.endVisitTopLevelUseItem && visitor.endVisitTopLevelUseItem(node);
	}
}

export interface TopLevelUseInterface extends Node {
	namespace: Identifier;
	name: Identifier | undefined;
	import: Identifier | undefined;
	version: VersionNumber | undefined;
	visit: (visitor: Visitor, node: TopLevelUseInterface) => void;
}
export namespace TopLevelUseInterface {
	export function is(node: Node): node is TopLevelUseInterface {
		return node.kind === NodeKind.topLevelUseInterface;
	}
	export function create(range: Range, namespace: Identifier, name: Identifier | undefined | null, _import: Identifier | undefined | null, version: VersionNumber | undefined | null): TopLevelUseInterface {
		name = name === null ? undefined : name;
		_import = _import === null ? undefined : _import;
		version = version === null ? undefined : version;
		return { kind: NodeKind.topLevelUseInterface, range, parent: undefined, namespace, name, import: _import, version, visit };
	}
	export function visit(visitor: Visitor, node: TopLevelUseInterface): void {
		if (visitor.visitTopLevelUseInterface && visitor.visitTopLevelUseInterface(node)) {
			node.namespace.visit(visitor, node.namespace);
			node.name && node.name.visit(visitor, node.name);
			node.import && node.import.visit(visitor, node.import);
			node.version && node.version.visit(visitor, node.version);
		}
		visitor.endVisitTopLevelUseInterface && visitor.endVisitTopLevelUseInterface(node);
	}
}

export interface WorldItem extends Node {
	kind: NodeKind.world;
	name: Identifier;
	members: WorldMember[];
	visit: (visitor: Visitor, node: WorldItem) => void;
}
export namespace WorldItem {
	export function is(node: Node): node is WorldItem {
		return node.kind === NodeKind.world;
	}
	export function create(range: Range, name: Identifier, members: WorldMember[]): WorldItem {
		return { kind: NodeKind.world, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: WorldItem): void {
		if (visitor.visitWorldItem && visitor.visitWorldItem(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitWorldItem && visitor.endVisitWorldItem(node);
	}
}

export type WorldMember = (ExportItem | UseItem | TypeDefItem) & { visit: (visitor: Visitor, node: WorldMember) => void };

export interface ExportItem extends Node {
	kind: NodeKind.export;
	name: Identifier;
	type: ExternType;
	visit: (visitor: Visitor, node: ExportItem) => void;
}
export namespace ExportItem {
	export function is(node: Node): node is ExportItem {
		return node.kind === NodeKind.export;
	}
	export function create(range: Range, name: Identifier, type: ExternType): ExportItem {
		return { kind: NodeKind.export, range, parent: undefined, name, type, visit };
	}
	function visit(visitor: Visitor, node: ExportItem): void {
		if (visitor.visitExportItem && visitor.visitExportItem(node)) {
			node.name.visit(visitor, node.name);
			node.type.visit(visitor, node.type);
		}
		visitor.endVisitExportItem && visitor.endVisitExportItem(node);
	}
}

export type ExternType = (FuncType | InterfaceType) & { visit: (visitor: Visitor, node: ExternType) => void };

export interface ImportItem extends Node {
	kind: NodeKind.import;
	name: Identifier;
	visit: (visitor: Visitor, node: ImportItem) => void;
}
export namespace ImportItem {
	export function is(node: Node): node is ImportItem {
		return node.kind === NodeKind.import;
	}
	export function create(range: Range, name: Identifier): ImportItem {
		return { kind: NodeKind.import, range, parent: undefined, name, visit };
	}
	function visit(visitor: Visitor, node: ImportItem): void {
		if (visitor.visitImportItem && visitor.visitImportItem(node)) {
			node.name.visit(visitor, node.name);
		}
		visitor.endVisitImportItem && visitor.endVisitImportItem(node);
	}
}

export interface InterfaceType extends Node {
	kind: NodeKind.interfaceType;
	members: InterfaceMember[];
	visit: (visitor: Visitor, node: InterfaceType) => void;
}
export namespace InterfaceType {
	export function is(node: Node): node is InterfaceType {
		return node.kind === NodeKind.interfaceType;
	}
	export function create(range: Range, members: InterfaceMember[]): InterfaceType {
		return { kind: NodeKind.interfaceType, range, parent: undefined, members, visit };
	}
	function visit(visitor: Visitor, node: InterfaceType): void {
		if (visitor.visitInterfaceType && visitor.visitInterfaceType(node)) {
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitInterfaceType && visitor.endVisitInterfaceType(node);
	}
}

export interface InterfaceItem extends Node {
	kind: NodeKind.interface;
	name: Identifier;
	members: InterfaceMember[];
	visit: (visitor: Visitor, node: InterfaceItem) => void;
}
export namespace InterfaceItem {
	export function is(node: Node): node is InterfaceItem {
		return node.kind === NodeKind.interface;
	}
	export function create(range: Range, name: Identifier, members: InterfaceMember[]): InterfaceItem {
		return { kind: NodeKind.interface, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: InterfaceItem): void {
		if (visitor.visitInterfaceItem && visitor.visitInterfaceItem(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitInterfaceItem && visitor.endVisitInterfaceItem(node);
	}
}

export type InterfaceMember = (TypeDefItem | FuncItem | UseItem) & { visit: (visitor: Visitor, node: InterfaceMember) => void };

export interface FuncItem extends Node {
	kind: NodeKind.func;
	name: Identifier;
	signature: FuncType;
	visit: (visitor: Visitor, node: FuncItem) => void;
}
export namespace FuncItem {
	export function is(node: Node): node is FuncItem {
		return node.kind === NodeKind.func;
	}
	export function create(range: Range, name: Identifier, signature: FuncType): FuncItem {
		return { kind: NodeKind.func, range, parent: undefined, name, signature, visit };
	}
	function visit(visitor: Visitor, node: FuncItem): void {
		if (visitor.visitFuncItem && visitor.visitFuncItem(node)) {
			node.name.visit(visitor, node.name);
			node.signature.visit(visitor, node.signature);
		}
		visitor.endVisitFuncItem && visitor.endVisitFuncItem(node);
	}
}

export interface FuncType extends Node {
	kind: NodeKind.funcSignature;
	params: FuncParams;
	result: _FuncResult | undefined;
	visit: (visitor: Visitor, node: FuncType) => void;
}
export namespace FuncType {
	export function is(node: Node): node is FuncType {
		return node.kind === NodeKind.funcSignature;
	}
	export function create(range: Range, params: FuncParams, result: _FuncResult | undefined): FuncType {
		return { kind: NodeKind.funcSignature, range, parent: undefined, params, result, visit };
	}
	function visit(visitor: Visitor, node: FuncType): void {
		if (visitor.visitFuncType && visitor.visitFuncType(node)) {
			node.params.visit(visitor, node.params);
			node.result && node.result.visit(visitor, node.result);
		}
		visitor.endVisitFuncType && visitor.endVisitFuncType(node);
	}
}

export type _FuncResult = (FuncResult | NamedFuncResult) & { visit: (visitor: Visitor, node: _FuncResult) => void };

export interface FuncParams extends Node {
	kind: NodeKind.funcParams;
	members: NamedType[];
	visit: (visitor: Visitor, node: FuncParams) => void;
}
export namespace FuncParams {
	export function is(node: Node): node is FuncParams {
		return node.kind === NodeKind.funcParams;
	}
	export function create(range: Range, members: NamedType[]): FuncParams {
		return { kind: NodeKind.funcParams, range, parent: undefined, members: members, visit };
	}
	function visit(visitor: Visitor, node: FuncParams): void {
		if (visitor.visitFuncParams && visitor.visitFuncParams(node)) {
			node.members.forEach(param => param.visit(visitor, param));
		}
		visitor.endVisitFuncParams && visitor.endVisitFuncParams(node);
	}
}

export interface NamedFuncResult extends Node {
	kind: NodeKind.namedFuncResult;
	members: NamedType[];
	visit: (visitor: Visitor, node: NamedFuncResult) => void;
}
export namespace NamedFuncResult {
	export function is(node: Node): node is NamedFuncResult {
		return node.kind === NodeKind.namedFuncResult;
	}
	export function create(range: Range, members: NamedType[]): NamedFuncResult {
		return { kind: NodeKind.namedFuncResult, range, parent: undefined, members, visit };
	}
	function visit(visitor: Visitor, node: NamedFuncResult): void {
		if (visitor.visitNamedFuncResult && visitor.visitNamedFuncResult(node)) {
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitNamedFuncResult && visitor.endVisitNamedFuncResult(node);
	}
}

export interface FuncResult extends Node {
	kind: NodeKind.funcResult;
	type: Ty;
	visit: (visitor: Visitor, node: FuncResult) => void;
}
export namespace FuncResult {
	export function is(node: Node): node is FuncResult {
		return node.kind === NodeKind.funcResult;
	}
	export function create(range: Range, type: Ty): FuncResult {
		return { kind: NodeKind.funcResult, range, parent: undefined, type, visit };
	}
	function visit(visitor: Visitor, node: FuncResult): void {
		if (visitor.visitFuncResult && visitor.visitFuncResult(node)) {
			node.type.visit(visitor, node.type);
		}
		visitor.endVisitFuncResult && visitor.endVisitFuncResult(node);
	}
}

export interface NamedType extends Node {
	kind: NodeKind.namedType;
	name: Identifier;
	type: Ty;
	visit: (visitor: Visitor, node: NamedType) => void;
}
export namespace NamedType {
	export function is(node: Node): node is NamedType {
		return node.kind === NodeKind.namedType;
	}
	export function create(range: Range, name: Identifier, type: Ty): NamedType {
		return { kind: NodeKind.namedType, range, parent: undefined, name, type, visit };
	}
	function visit(visitor: Visitor, node: NamedType): void {
		if (visitor.visitNamedType && visitor.visitNamedType(node)) {
			node.name.visit(visitor, node.name);
			node.type.visit(visitor, node.type);
		}
		visitor.endVisitNamedType && visitor.endVisitNamedType(node);
	}
}

export interface UseItem extends Node {
	kind: NodeKind.use;
	from: PackageIdentifier | undefined;
	importItem: ImportItemTypes;
	visit: (visitor: Visitor, node: UseItem) => void;
}
export namespace UseItem {
	export function is(node: Node): node is UseItem {
		return node.kind === NodeKind.use;
	}
	export function create(range: Range, from: PackageIdentifier | undefined | null, importItem: ImportItemTypes, ): UseItem {
		from = from === null ? undefined : from;
		return { kind: NodeKind.use, range, parent: undefined, from, importItem, visit };
	}
	function visit(visitor: Visitor, node: UseItem): void {
		if (visitor.visitUseItem && visitor.visitUseItem(node)) {
			node.from && node.from.visit(visitor, node.from);
			node.importItem.visit(visitor, node.importItem);
		}
		visitor.endVisitUseItem && visitor.endVisitUseItem(node);
	}
}

export type ImportItemTypes = (Identifier | RenameItem | NamedImports) & { visit: (visitor: Visitor, node: ImportItemTypes) => void };
export namespace ImportItemTypes {
	export function is(node: Node): node is ImportItem {
		return Identifier.is(node) || RenameItem.is(node) || NamedImports.is(node);
	}
}

export interface NamedImports extends Node {
	kind: NodeKind.namedImports;
	name: Identifier;
	members: (Identifier | RenameItem)[];
	visit: (visitor: Visitor, node: NamedImports) => void;
}
export namespace NamedImports {
	export function is(node: Node): node is NamedImports {
		return node.kind === NodeKind.namedImports;
	}
	export function create(range: Range, name: Identifier, members: (Identifier | RenameItem)[]): NamedImports {
		return { kind: NodeKind.namedImports, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: NamedImports): void {
		if (visitor.visitNamedImports && visitor.visitNamedImports(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member as any));
		}
		visitor.endVisitNamedImports && visitor.endVisitNamedImports(node);
	}
}

export interface RenameItem extends Node {
	kind: NodeKind.renamed;
	from: Identifier;
	to: Identifier;
	visit: (visitor: Visitor, node: RenameItem) => void;
}
export namespace RenameItem {
	export function is(node: Node): node is RenameItem {
		return node.kind === NodeKind.renamed;
	}
	export function create(range: Range, from: Identifier, to: Identifier): RenameItem {
		return { kind: NodeKind.renamed, range, parent: undefined, from, to, visit };
	}
	function visit(visitor: Visitor, node: RenameItem): void {
		if (visitor.visitRenameItem && visitor.visitRenameItem(node)) {
			node.from.visit(visitor, node.from);
			node.to.visit(visitor, node.to);
		}
		visitor.endVisitRenameItem && visitor.endVisitRenameItem(node);
	}
}

export type TypeDefItem = (VariantItem | RecordItem | UnionItem | FlagsItem | EnumItem | TypeItem)  & { visit: (visitor: Visitor, node: TypeDefItem) => void };
export namespace TypeDefItem {
	export function is(node: Node): node is TypeDefItem {
		return VariantItem.is(node) || RecordItem.is(node) || UnionItem.is(node) || FlagsItem.is(node) || EnumItem.is(node) || TypeItem.is(node);
	}
}

export interface VariantItem extends Node {
	kind: NodeKind.variant;
	name: Identifier;
	members: VariantCase[];
	visit: (visitor: Visitor, node: VariantItem) => void;
}
export namespace VariantItem {
	export function is(node: Node): node is VariantItem {
		return node.kind === NodeKind.variant;
	}
	export function create(range: Range, name: Identifier, members: VariantCase[]): VariantItem {
		return { kind: NodeKind.variant, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: VariantItem): void {
		if (visitor.visitVariantItem && visitor.visitVariantItem(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member as any));
		}
		visitor.endVisitVariantItem && visitor.endVisitVariantItem(node);
	}
}

export interface VariantCase extends Node {
	kind: NodeKind.variantCase;
	name: Identifier;
	type?: Ty;
	visit: (visitor: Visitor, node: VariantCase) => void;
}
export namespace VariantCase {
	export function is(node: Node): node is VariantCase {
		return node.kind === NodeKind.variantCase;
	}
	export function create(range: Range, name: Identifier, type?: Ty): VariantCase {
		return { kind: NodeKind.variantCase, range, parent: undefined, name, type, visit };
	}
	function visit(visitor: Visitor, node: VariantCase): void {
		if (visitor.visitVariantCase && visitor.visitVariantCase(node)) {
			node.name.visit(visitor, node.name);
			node.type && node.type.visit(visitor, node.type);
		}
		visitor.endVisitVariantCase && visitor.endVisitVariantCase(node);
	}
}

export interface RecordItem extends Node {
	kind: NodeKind.record;
	name: Identifier;
	members: RecordField[];
	visit: (visitor: Visitor, node: RecordItem) => void;
}
export namespace RecordItem {
	export function is(node: Node): node is RecordItem {
		return node.kind === NodeKind.record;
	}
	export function create(range: Range, name: Identifier, members: RecordField[]): RecordItem {
		return { kind: NodeKind.record, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: RecordItem): void {
		if (visitor.visitRecordItem && visitor.visitRecordItem(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member as any));
		}
		visitor.endVisitRecordItem && visitor.endVisitRecordItem(node);
	}
}

export interface RecordField extends Node {
	kind: NodeKind.field;
	name: Identifier;
	type: Ty;
	visit: (visitor: Visitor, node: RecordField) => void;
}
export namespace RecordField {
	export function is(node: Node): node is RecordField {
		return node.kind === NodeKind.field;
	}
	export function create(range: Range, name: Identifier, type: Ty): RecordField {
		return { kind: NodeKind.field, range, parent: undefined, name, type, visit };
	}
	function visit(visitor: Visitor, node: RecordField): void {
		if (visitor.visitRecordField && visitor.visitRecordField(node)) {
			node.name.visit(visitor, node.name);
			node.type.visit(visitor, node.type);
		}
		visitor.endVisitRecordField && visitor.endVisitRecordField(node);
	}
}

export interface UnionItem extends Node {
	kind: NodeKind.union;
	name: Identifier;
	members: Ty[];
	visit: (visitor: Visitor, node: UnionItem) => void;
}
export namespace UnionItem {
	export function is(node: Node): node is UnionItem {
		return node.kind === NodeKind.union;
	}
	export function create(range: Range, name: Identifier, members: Ty[]): UnionItem {
		return { kind: NodeKind.union, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: UnionItem): void {
		if (visitor.visitUnionItem && visitor.visitUnionItem(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitUnionItem && visitor.endVisitUnionItem(node);
	}
}

export interface FlagsItem extends Node {
	kind: NodeKind.flags;
	name: Identifier;
	members: Identifier[];
	visit: (visitor: Visitor, node: FlagsItem) => void;
}
export namespace FlagsItem {
	export function is(node: Node): node is FlagsItem {
		return node.kind === NodeKind.flags;
	}
	export function create(range: Range, name: Identifier, members: Identifier[]): FlagsItem {
		return { kind: NodeKind.flags, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: FlagsItem): void {
		if (visitor.visitFlagsItem && visitor.visitFlagsItem(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitFlagsItem && visitor.endVisitFlagsItem(node);
	}
}

export interface EnumItem extends Node {
	kind: NodeKind.enum;
	name: Identifier;
	members: Identifier[];
	visit: (visitor: Visitor, node: EnumItem) => void;
}
export namespace EnumItem {
	export function is(node: Node): node is EnumItem {
		return node.kind === NodeKind.enum;
	}
	export function create(range: Range, name: Identifier, members: Identifier[]): EnumItem {
		return { kind: NodeKind.enum, range, parent: undefined, name, members, visit };
	}
	function visit(visitor: Visitor, node: EnumItem): void {
		if (visitor.visitEnumItem && visitor.visitEnumItem(node)) {
			node.name.visit(visitor, node.name);
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitEnumItem && visitor.endVisitEnumItem(node);
	}
}

export interface TypeItem extends Node {
	kind: NodeKind.type;
	name: Identifier;
	type: Ty;
	visit: (visitor: Visitor, node: TypeItem) => void;
}
export namespace TypeItem {
	export function is(node: Node): node is TypeItem {
		return node.kind === NodeKind.type;
	}
	export function create(range: Range, name: Identifier, type: Ty): TypeItem {
		return { kind: NodeKind.type, range, parent: undefined, name, type, visit };
	}
	function visit(visitor: Visitor, node: TypeItem): void {
		if (visitor.visitTypeItem && visitor.visitTypeItem(node)) {
			node.name.visit(visitor, node.name);
			node.type.visit(visitor, node.type);
		}
		visitor.endVisitTypeItem && visitor.endVisitTypeItem(node);
	}
}

export type Ty = (Tuple | List | Option | Result | Handle | BaseTypes) & { visit: (visitor: Visitor, node: Ty) => void };
export namespace Ty {
	export function is(node: Node): node is Ty {
		return Tuple.is(node) || List.is(node) || Option.is(node) || Result.is(node) || Handle.is(node) || BaseTypes.is(node);
	}
}

export interface Tuple extends Node {
	kind: NodeKind.tuple;
	members: Ty[];
	visit: (visitor: Visitor, node: Tuple) => void;
}
export namespace Tuple {
	export function is(node: Node): node is Tuple {
		return node.kind === NodeKind.tuple;
	}
	export function create(range: Range, members: Ty[]): Tuple {
		return { kind: NodeKind.tuple, range, parent: undefined, members, visit };
	}
	function visit(visitor: Visitor, node: Tuple): void {
		if (visitor.visitTuple && visitor.visitTuple(node)) {
			node.members.forEach(member => member.visit(visitor, member));
		}
		visitor.endVisitTuple && visitor.endVisitTuple(node);
	}
}

export interface List extends Node {
	kind: NodeKind.list;
	type: Ty;
	visit: (visitor: Visitor, node: List) => void;
}
export namespace List {
	export function is(node: Node): node is List {
		return node.kind === NodeKind.list;
	}
	export function create(range: Range, type: Ty): List {
		return { kind: NodeKind.list, range, parent: undefined, type, visit };
	}
	function visit(visitor: Visitor, node: List): void {
		if (visitor.visitList && visitor.visitList(node)) {
			node.type.visit(visitor, node.type);
		}
		visitor.endVisitList && visitor.endVisitList(node);
	}
}

export interface Option extends Node {
	kind: NodeKind.option;
	type: Ty;
	visit: (visitor: Visitor, node: Option) => void;
}
export namespace Option {
	export function is(node: Node): node is Option {
		return node.kind === NodeKind.option;
	}
	export function create(range: Range, type: Ty): Option {
		return { kind: NodeKind.option, range, parent: undefined, type, visit };
	}
	function visit(visitor: Visitor, node: Option): void {
		if (visitor.visitOption && visitor.visitOption(node)) {
			node.type.visit(visitor, node.type);
		}
		visitor.endVisitOption && visitor.endVisitOption(node);
	}
}

export interface Result extends Node {
	kind: NodeKind.result;
	ok: ResultType | undefined;
	error: Ty | undefined;
	visit: (visitor: Visitor, node: Result) => void;
}
export namespace Result {
	export function is(node: Node): node is Result {
		return node.kind === NodeKind.result;
	}
	export function create(range: Range, ok: ResultType | undefined | null, error: Ty | undefined | null): Result {
		ok = ok === null ? undefined : ok;
		error = error === null ? undefined : error;
		return { kind: NodeKind.result, range, parent: undefined, ok: ok, error, visit };
	}
	function visit(visitor: Visitor, node: Result): void {
		if (visitor.visitResult && visitor.visitResult(node)) {
			if (node.ok) {
				node.ok.visit(visitor, node.ok);
			}
			if (node.error) {
				node.error.visit(visitor, node.error);
			}
		}
		visitor.endVisitResult && visitor.endVisitResult(node);
	}
}

export type ResultType = (Ty | NoResultType) & { visit: (visitor: Visitor, node: ResultType) => void };

export interface NoResultType extends Node {
	kind: NodeKind.noResult;
	visit: (visitor: Visitor, node: NoResultType) => void;
}
export namespace NoResultType {
	export function is(node: Node): node is NoResultType {
		return node.kind === NodeKind.noResult;
	}
	export function create(range: Range): NoResultType {
		return { kind: NodeKind.noResult, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: NoResultType): void {
		visitor.visitNoResultType && visitor.visitNoResultType(node);
		visitor.endVisitNoResultType && visitor.endVisitNoResultType(node);
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
	visit: (visitor: Visitor, node: Borrow) => void;
}
export namespace Borrow {
	export function is(node: Node): node is Borrow {
		return node.kind === NodeKind.borrow;
	}
	export function create(range: Range, name: Identifier): Borrow {
		return { kind: NodeKind.borrow, range, parent: undefined, name, visit };
	}
	function visit(visitor: Visitor, node: Borrow): void {
		if (visitor.visitBorrow && visitor.visitBorrow(node)) {
			node.name.visit(visitor, node.name);
		}
		visitor.endVisitBorrow && visitor.endVisitBorrow(node);
	}
}

export type BaseTypes = (u8 | u16 | u32 | u64 | s8 | s16 | s32 | s64 | bool | char | string_ | float32 | float64) & { visit: (visitor: Visitor, node: BaseTypes) => void };
export namespace BaseTypes {
	export function is(node: Node): node is BaseTypes {
		return u8.is(node) || u16.is(node) || u32.is(node) || u64.is(node) || s8.is(node) || s16.is(node) || s32.is(node) || s64.is(node) || bool.is(node) || char.is(node) || string_.is(node) || float32.is(node) || float64.is(node);
	}
}

export interface u8 extends Node {
	kind: NodeKind.u8;
	visit: (visitor: Visitor, node: u8) => void;
}
export namespace u8 {
	export function is(node: Node): node is u8 {
		return node.kind === NodeKind.u8;
	}
	export function create(range: Range): u8 {
		return { kind: NodeKind.u8, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: u8): void {
		visitor.visitU8 && visitor.visitU8(node);
		visitor.endVisitU8 && visitor.endVisitU8(node);
	}
}

export interface u16 extends Node {
	kind: NodeKind.u16;
	visit: (visitor: Visitor, node: u16) => void;
}
export namespace u16 {
	export function is(node: Node): node is u16 {
		return node.kind === NodeKind.u16;
	}
	export function create(range: Range): u16 {
		return { kind: NodeKind.u16, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: u16): void {
		visitor.visitU16 && visitor.visitU16(node);
		visitor.endVisitU16 && visitor.endVisitU16(node);
	}
}

export interface u32 extends Node {
	kind: NodeKind.u32;
	visit: (visitor: Visitor, node: u32) => void;
}
export namespace u32 {
	export function is(node: Node): node is u32 {
		return node.kind === NodeKind.u32;
	}
	export function create(range: Range): u32 {
		return { kind: NodeKind.u32, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: u32): void {
		visitor.visitU32 && visitor.visitU32(node);
		visitor.endVisitU32 && visitor.endVisitU32(node);
	}
}

export interface u64 extends Node {
	kind: NodeKind.u64;
	visit: (visitor: Visitor, node: u64) => void;
}
export namespace u64 {
	export function is(node: Node): node is u64 {
		return node.kind === NodeKind.u64;
	}
	export function create(range: Range): u64 {
		return { kind: NodeKind.u64, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: u64): void {
		visitor.visitU64 && visitor.visitU64(node);
		visitor.endVisitU64 && visitor.endVisitU64(node);
	}
}

export interface s8 extends Node {
	kind: NodeKind.s8;
	visit: (visitor: Visitor, node: s8) => void;
}
export namespace s8 {
	export function is(node: Node): node is s8 {
		return node.kind === NodeKind.s8;
	}
	export function create(range: Range): s8 {
		return { kind: NodeKind.s8, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: s8): void {
		visitor.visitS8 && visitor.visitS8(node);
		visitor.endVisitS8 && visitor.endVisitS8(node);
	}
}

export interface s16 extends Node {
	kind: NodeKind.s16;
	visit: (visitor: Visitor, node: s16) => void;
}
export namespace s16 {
	export function is(node: Node): node is s16 {
		return node.kind === NodeKind.s16;
	}
	export function create(range: Range): s16 {
		return { kind: NodeKind.s16, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: s16): void {
		visitor.visitS16 && visitor.visitS16(node);
		visitor.endVisitS16 && visitor.endVisitS16(node);
	}
}

export interface s32 extends Node {
	kind: NodeKind.s32;
	visit: (visitor: Visitor, node: s32) => void;
}
export namespace s32 {
	export function is(node: Node): node is s32 {
		return node.kind === NodeKind.s32;
	}
	export function create(range: Range): s32 {
		return { kind: NodeKind.s32, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: s32): void {
		visitor.visitS32 && visitor.visitS32(node);
		visitor.endVisitS32 && visitor.endVisitS32(node);
	}
}

export interface s64 extends Node {
	kind: NodeKind.s64;
	visit: (visitor: Visitor, node: s64) => void;
}
export namespace s64 {
	export function is(node: Node): node is s64 {
		return node.kind === NodeKind.s64;
	}
	export function create(range: Range): s64 {
		return { kind: NodeKind.s64, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: s64): void {
		visitor.visitS64 && visitor.visitS64(node);
		visitor.endVisitS64 && visitor.endVisitS64(node);
	}

}

export interface float32 extends Node {
	kind: NodeKind.float32;
	visit: (visitor: Visitor, node: float32) => void;
}
export namespace float32 {
	export function is(node: Node): node is float32 {
		return node.kind === NodeKind.float32;
	}
	export function create(range: Range): float32 {
		return { kind: NodeKind.float32, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: float32): void {
		visitor.visitFloat32 && visitor.visitFloat32(node);
		visitor.endVisitFloat32 && visitor.endVisitFloat32(node);
	}
}

export interface float64 extends Node {
	kind: NodeKind.float64;
	visit: (visitor: Visitor, node: float64) => void;
}
export namespace float64 {
	export function is(node: Node): node is float64 {
		return node.kind === NodeKind.float64;
	}
	export function create(range: Range): float64 {
		return { kind: NodeKind.float64, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: float64): void {
		visitor.visitFloat64 && visitor.visitFloat64(node);
		visitor.endVisitFloat64 && visitor.endVisitFloat64(node);
	}
}

export interface bool extends Node {
	kind: NodeKind.bool;
	visit: (visitor: Visitor, node: bool) => void;
}
export namespace bool {
	export function is(node: Node): node is bool {
		return node.kind === NodeKind.bool;
	}
	export function create(range: Range): bool {
		return { kind: NodeKind.bool, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: bool): void {
		visitor.visitBool && visitor.visitBool(node);
		visitor.endVisitBool && visitor.endVisitBool(node);
	}
}

export interface char extends Node {
	kind: NodeKind.char;
	visit: (visitor: Visitor, node: char) => void;
}
export namespace char {
	export function is(node: Node): node is char {
		return node.kind === NodeKind.char;
	}
	export function create(range: Range): char {
		return { kind: NodeKind.char, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: char): void {
		visitor.visitChar && visitor.visitChar(node);
		visitor.endVisitChar && visitor.endVisitChar(node);
	}
}

export interface string_ extends Node {
	kind: NodeKind.string;
	visit: (visitor: Visitor, node: string_) => void;
}
export namespace string_ {
	export function is(node: Node): node is string_ {
		return node.kind === NodeKind.string;
	}
	export function create(range: Range): string_ {
		return { kind: NodeKind.string, range, parent: undefined, visit };
	}
	function visit(visitor: Visitor, node: string_): void {
		visitor.visitString && visitor.visitString(node);
		visitor.endVisitString && visitor.endVisitString(node);
	}
}

export interface Identifier extends Node {
	kind: NodeKind.id;
	value: string;
	visit: (visitor: Visitor, node: Identifier) => void;
}
export namespace Identifier {
	export function is(node: Node): node is Identifier {
		return node.kind === NodeKind.id;
	}
	export function create(range: Range, value: string): Identifier {
		return { kind: NodeKind.id, range, parent: undefined, value, visit };
	}
	function visit(visitor: Visitor, node: Identifier): void {
		visitor.visitIdentifier && visitor.visitIdentifier(node);
		visitor.endVisitIdentifier && visitor.endVisitIdentifier(node);
	}
}

export interface MultiLineComment extends Node {
	kind: NodeKind.multiLineComment;
	value: string;
	visit: (visitor: Visitor, node: MultiLineComment) => void;
}
export namespace MultiLineComment {
	export function is(node: Node): node is MultiLineComment {
		return node.kind === NodeKind.multiLineComment;
	}
	export function create(range: Range, value: string): MultiLineComment {
		return { kind: NodeKind.multiLineComment, range, parent: undefined, value, visit };
	}
	function visit(visitor: Visitor, node: MultiLineComment): void {
		visitor.visitMultiLineComment && visitor.visitMultiLineComment(node);
		visitor.endVisitMultiLineComment && visitor.endVisitMultiLineComment(node);
	}
}

export interface SingleLineComment extends Node {
	kind: NodeKind.singleLineComment;
	value: string;
	visit: (visitor: Visitor, node: SingleLineComment) => void;
}
export namespace SingleLineComment {
	export function is(node: Node): node is SingleLineComment {
		return node.kind === NodeKind.singleLineComment;
	}
	export function create(range: Range, value: string): SingleLineComment {
		return { kind: NodeKind.singleLineComment, range, parent: undefined, value, visit };
	}
	function visit(visitor: Visitor, node: SingleLineComment): void {
		visitor.visitSingleLineComment && visitor.visitSingleLineComment(node);
		visitor.endVisitSingleLineComment && visitor.endVisitSingleLineComment(node);
	}
}

export interface MultiLineCommentOneLine extends Node {
	kind: NodeKind.multiLineCommentOneLine;
	value: string;
	visit: (visitor: Visitor, node: MultiLineCommentOneLine) => void;
}
export namespace MultiLineCommentOneLine {
	export function is(node: Node): node is MultiLineCommentOneLine {
		return node.kind === NodeKind.multiLineCommentOneLine;
	}
	export function create(range: Range, value: string): MultiLineCommentOneLine {
		return { kind: NodeKind.multiLineCommentOneLine, range, parent: undefined, value, visit };
	}
	function visit(visitor: Visitor, node: MultiLineCommentOneLine): void {
		visitor.visitMultiLineCommentOneLine && visitor.visitMultiLineCommentOneLine(node);
		visitor.endVisitMultiLineCommentOneLine && visitor.endVisitMultiLineCommentOneLine(node);
	}
}

export interface CommentBlock extends Node {
	kind: NodeKind.commentBlock;
	members: Comment[];
	visit: (visitor: Visitor, node: CommentBlock) => void;
}
export namespace CommentBlock {
	export function is(node: Node): node is CommentBlock {
		return node.kind === NodeKind.commentBlock;
	}
	export function create(range: Range, members: Comment[]): CommentBlock {
		return { kind: NodeKind.commentBlock, range, parent: undefined, members, visit };
	}
	function visit(visitor: Visitor, node: CommentBlock): void {
		if (visitor.visitCommentBlock && visitor.visitCommentBlock(node)) {
			node.members.forEach(child => child.visit(visitor, child));
			visitor.endVisitCommentBlock && visitor.endVisitCommentBlock(node);
		}
	}
}

export type Comment = (MultiLineComment | MultiLineCommentOneLine | SingleLineComment) & { visit: (visitor: Visitor, node: Comment) => void};
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
			return Node.finalize(CommentBlock.create(range, filtered));
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
	export function attachComments<T extends Node>(node: T, ...ws: (string | Comment)[]): T {
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
		return node;
	}
	export function finalize<T extends Node>(node: T, ...ws: (string | Comment)[]): T {
		attachComments(node, ...ws);
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
				if (is(value)) {
					value.parent = node;
				}
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