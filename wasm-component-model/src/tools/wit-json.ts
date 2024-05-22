/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export interface Document {
	worlds: World[];
	interfaces: Interface[];
	types: Type[];
	packages: Package[];
}

export interface Documentation {
	contents: string | null;
}

export interface World {
	name: string;
	docs?: Documentation | undefined;
	imports: NameMap<ObjectKind>;
	exports: NameMap<ObjectKind>;
	package: number;
}
export namespace World {
	export function is(value: any): value is World {
		return typeof value === 'object'
			&& typeof value.name === 'string'
			&& typeof value.imports === 'object'
			&& typeof value.exports === 'object'
			&& typeof value.package === 'number';
	}
}
export interface PackageNameParts {
	namespace?: string | undefined;
	name: string;
	version?: string | undefined;
}

export interface Package {
	name: string;
	docs?: Documentation | undefined;
	interfaces: References;
	worlds: References;
}
export namespace Package {
	export function is(value: any): value is Package {
		return typeof value === 'object'
			&& typeof value.name === 'string'
			&& typeof value.interfaces === 'object'
			&& typeof value.worlds === 'object';
	}
}

export interface Interface {
	name: string;
	docs?: Documentation;
	types: References;
	functions: NameMap<Callable>;
	world?: {
		ref: number;
		kind: 'imports' | 'exports';
	};
	package: number;
}
export namespace Interface {
	export function is(value: any): value is Interface {
		return typeof value === 'object'
			&& typeof value.name === 'string'
			&& typeof value.types === 'object'
			&& typeof value.functions === 'object'
			&& typeof value.package === 'number';
	}
}

export type Callable = Func | Method | StaticMethod | Constructor;
export namespace Callable {
	export function isFunction(value: Callable): value is Func {
		const candidate = value as Func;
		return candidate.kind === 'freestanding';
	}
	export function isStaticMethod(value: Callable): value is StaticMethod {
		const candidate = value as StaticMethod;
		return typeof candidate.kind === 'object' && typeof candidate.kind.static === 'number';
	}
	export function isConstructor(value: Callable): value is Constructor {
		const candidate = value as Constructor;
		return typeof candidate.kind === 'object' && typeof candidate.kind.constructor === 'number';
	}
	export function isMethod(value: Callable): value is Method {
		const candidate = value as Method;
		return typeof candidate.kind === 'object' && typeof candidate.kind.method === 'number';
	}
	export function is(value: any): value is Callable {
		return isFunction(value) || isStaticMethod(value) || isConstructor(value) || isMethod(value);
	}
	export function containingType(value: Method | StaticMethod | Constructor): number {
		if (isMethod(value)) {
			return value.kind.method;
		} else if (isStaticMethod(value)) {
			return value.kind.static;
		} else if (isConstructor(value)) {
			return value.kind.constructor;
		}
		throw new Error(`Unknown callable kind ${JSON.stringify(value)}`);
	}
}

interface AbstractCallable {
	name: string;
	docs?: Documentation | undefined;
	params: Param[];
	results: TypeObject[];
}

export interface Func extends AbstractCallable {
	kind: 'freestanding';
}

export interface StaticMethod extends AbstractCallable{
	kind: {
		static: number;
	};
}

export interface Constructor extends AbstractCallable {
	kind: {
		constructor: number;
	};
}

export interface Method extends AbstractCallable {
	kind: {
		method: number;
	};
}

export type Type = BaseType | ReferenceType | ListType | OptionType | TupleType | ResultType | RecordType | EnumType | FlagsType | VariantType | ResourceType | BorrowHandleType | OwnHandleType;
export namespace Type {
	export function isBaseType(type: Type): type is BaseType {
		return TypeKind.isBase(type.kind);
	}
	export function isReferenceType(type: Type): type is ReferenceType {
		return TypeKind.isReference(type.kind);
	}
	export function isListType(type: Type): type is ListType {
		return TypeKind.isList(type.kind);
	}
	export function isOptionType(type: Type): type is OptionType {
		return TypeKind.isOption(type.kind);
	}
	export function isTupleType(type: Type): type is TupleType {
		return TypeKind.isTuple(type.kind);
	}
	export function isResultType(type: Type): type is ResultType {
		return TypeKind.isResult(type.kind);
	}
	export function isResourceType(type: Type): type is ResourceType {
		return TypeKind.isResource(type.kind);
	}
	export function isRecordType(type: Type): type is RecordType {
		return TypeKind.isRecord(type.kind);
	}
	export function isEnumType(type: Type): type is EnumType {
		return TypeKind.isEnum(type.kind);
	}
	export function isFlagsType(type: Type): type is FlagsType {
		return TypeKind.isFlags(type.kind);
	}
	export function isVariantType(type: Type): type is VariantType {
		return TypeKind.isVariant(type.kind);
	}
	export function isBorrowHandleType(type: Type): type is BorrowHandleType {
		return TypeKind.isBorrowHandle(type.kind);
	}
	export function isOwnHandleType(type: Type): type is OwnHandleType {
		return TypeKind.isOwnHandle(type.kind);
	}
	export function hasName(type: Type): type is Type & { name: string } {
		return typeof type.name === 'string';
	}
}

export interface AbstractType {
	name: string | null;
	docs?: Documentation | undefined;
	owner: Owner | null;
}

export interface BaseType extends AbstractType {
	kind: BaseKind;
}

export interface ReferenceType extends AbstractType {
	kind: ReferenceKind;
}

export interface ListType extends AbstractType {
	kind: ListKind;
}

export interface OptionType extends AbstractType {
	kind: OptionKind;
}

export interface TupleType extends AbstractType {
	kind: TupleKind;
}

export interface ResultType extends AbstractType {
	kind: ResultKind;
}

export interface RecordType extends AbstractType {
	kind: RecordKind;
}

export interface EnumType extends AbstractType {
	kind: EnumKind;
}

export interface FlagsType extends AbstractType {
	kind: FlagsKind;
}

export interface VariantType extends AbstractType {
	kind: VariantKind;
}

export interface BorrowHandleType extends AbstractType {
	kind: BorrowHandleKind;
}

export interface OwnHandleType extends AbstractType {
	kind: OwnHandleKind;
}

export interface ResourceType extends AbstractType {
	kind: 'resource';
}

export namespace Owner {
	export function isWorld(owner: Owner): owner is { world: number } {
		return typeof (owner as { world: number }).world === 'number';
	}
	export function isInterface(owner: Owner): owner is { interface: number } {
		return typeof (owner as { interface: number }).interface === 'number';
	}
	export function kind(owner: Owner): OwnerKind {
		if (isWorld(owner)) {
			return OwnerKind.World;
		} else if (isInterface(owner)) {
			return OwnerKind.Interface;
		} else {
			throw new Error(`Unknown owner kind ${JSON.stringify(owner)}`);
		}
	}
}
export type Owner = { world: number } | { interface: number };
export enum OwnerKind {
	World = 'world',
	Interface = 'interface',
}

export type TypeKind = TypeObject | RecordKind | VariantKind | EnumKind | FlagsKind | TupleKind | ListKind | OptionKind | BorrowHandleKind | OwnHandleKind | ResultKind | BaseKind | ReferenceKind | 'resource';
export namespace TypeKind {
	export function isBase(kind: TypeKind): kind is BaseKind {
		return typeof (kind as BaseKind).type === 'string';
	}
	export function isReference(kind: TypeKind): kind is ReferenceKind {
		return typeof (kind as ReferenceKind).type === 'number';
	}
	export function isTypeObject(kind: TypeKind): kind is TypeObject {
		const candidate = kind as TypeObject;
		return typeof candidate.type === 'number' || typeof candidate.type === 'string';
	}
	export function isRecord(kind: TypeKind): kind is RecordKind {
		return typeof (kind as RecordKind).record === 'object';
	}
	export function isVariant(kind: TypeKind): kind is VariantKind {
		const candidate = kind as VariantKind;
		return typeof candidate.variant === 'object';
	}
	export function isEnum(kind: TypeKind): kind is EnumKind {
		const candidate = kind as EnumKind;
		return typeof candidate.enum === 'object';
	}
	export function isFlags(kind: TypeKind): kind is FlagsKind {
		const candidate = kind as FlagsKind;
		return typeof candidate.flags === 'object';
	}
	export function isTuple(kind: TypeKind): kind is TupleKind {
		const candidate = kind as TupleKind;
		return typeof candidate.tuple === 'object';
	}
	export function isList(kind: TypeKind): kind is ListKind {
		const candidate = kind as ListKind;
		return typeof candidate.list === 'number' || typeof candidate.list === 'string';
	}
	export function isOption(kind: TypeKind): kind is OptionKind {
		const candidate = kind as OptionKind;
		return typeof candidate.option === 'number' || typeof candidate.option === 'string';
	}
	export function isResult(kind: TypeKind): kind is ResultKind {
		const candidate = kind as ResultKind;
		const ok = candidate.result?.ok;
		const err = candidate.result?.err;
		return (ok !== undefined && (typeof ok === 'number' || typeof ok === 'string' || ok === null))
			&& (err !== undefined && (typeof err === 'number' || typeof err === 'string' || err === null));
	}
	export function isBorrowHandle(kind: TypeKind): kind is BorrowHandleKind {
		const candidate = kind as BorrowHandleKind;
		return typeof candidate.handle === 'object' && TypeReference.is(candidate.handle.borrow);
	}
	export function isOwnHandle(kind: TypeKind): kind is OwnHandleKind {
		const candidate = kind as OwnHandleKind;
		return typeof candidate.handle === 'object' && TypeReference.is(candidate.handle.own);
	}
	export function isResource(kind: TypeKind): kind is 'resource' {
		return kind === 'resource';
	}
}

export interface BaseKind {
	type: string;
}

export interface ReferenceKind {
	type: number;
}

export interface RecordKind {
	record: {
		fields: Field[];
	};
}

export interface Field {
	name: string;
	docs: Documentation;
	type: TypeReference;
}

export interface VariantKind {
	variant: {
		cases: VariantCase[];
	};
}

export interface VariantCase {
	name: string;
	docs: Documentation;
	type: TypeReference | null;
}

export interface EnumKind {
	enum: {
		cases: EnumCase[];
	};
}

export interface EnumCase {
	name: string;
	docs: Documentation;
}

export interface FlagsKind {
	flags: {
		flags: Flag[];
	};
}

export interface Flag {
	name: string;
	docs: Documentation;
}

export interface TupleKind {
	tuple: {
		types: TypeReference[];
	};
}

export interface ListKind {
	list: TypeReference;
}

export interface OptionKind {
	option: TypeReference;
}

export interface ResultKind {
	result: {
		ok: TypeReference | null;
		err: TypeReference | null;
	};
}

export interface BorrowHandleKind {
	handle: {
		borrow: TypeReference;
	};
}

export interface OwnHandleKind {
	handle: {
		own: TypeReference;
	};
}

export type ObjectKind = TypeObject | FuncObject | InterfaceObject;
export namespace ObjectKind {
	export function isTypeObject(kind: ObjectKind): kind is TypeObject {
		return typeof (kind as TypeObject).type === 'number';
	}
	export function isFuncObject(kind: ObjectKind): kind is FuncObject {
		return typeof (kind as FuncObject).function === 'object';
	}
	export function isInterfaceObject(kind: ObjectKind): kind is InterfaceObject {
		return typeof (kind as InterfaceObject).interface === 'number';
	}
}

export interface TypeObject {
	type: number | string;
}

export interface FuncObject {
	function: Func;
}

export interface InterfaceObject {
	interface: number;
}

export type TypeReference = number | string;
export namespace TypeReference {
	export function is(value: TypeReference | Type): value is TypeReference {
		const candidate = value as TypeReference;
		return isNumber(candidate) || isString(candidate);
	}
	export function isNumber(ref: TypeReference): ref is number {
		return typeof ref === 'number';
	}
	export function isString(ref: TypeReference): ref is string {
		return typeof ref === 'string';
	}
}

export interface Param {
	name: string;
	type: TypeReference;
}

export type References = NameMap<number>;

export interface NameMap<T> {
	[name: string]: T;
}