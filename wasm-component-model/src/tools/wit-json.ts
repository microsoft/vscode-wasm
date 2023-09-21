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

export interface World {
	name: string;
	docs?: Documentation | undefined;
	imports: NameMap<ObjectKind>;
	exports: NameMap<ObjectKind>;
}

export interface Documentation {
	contents: string | null;
}

export interface Interface {
	name: string;
	docs?: Documentation;
	types: References;
	functions: NameMap<Func>;
	package: number;
}

export interface Func {
	name: string;
	docs?: Documentation | undefined;
	kind: 'freestanding';
	params: Param[];
	results: TypeObject[];
}

export interface Type {
	name: string | null;
	docs?: Documentation | undefined;
	kind: TypeKind;
	owner: Owner | null;
}

export interface Package {
	name: string;
	docs?: Documentation | undefined;
	interfaces: References;
	worlds: References;
}

export type Owner = { world: number } | { interface: number };
export namespace Owner {
	export function isWorld(owner: Owner): owner is { world: number } {
		return typeof (owner as { world: number }).world === 'number';
	}
	export function isInterface(owner: Owner): owner is { interface: number } {
		return typeof (owner as { interface: number }).interface === 'number';
	}
}

export type TypeKind = BaseType | TypeObject | Record | List;
export namespace TypeKind {
	export function isBaseType(kind: TypeKind): kind is BaseType {
		return typeof (kind as BaseType).type === 'string';
	}
	export function isTypeObject(kind: TypeKind): kind is TypeObject {
		return typeof (kind as TypeObject).type === 'number';
	}
	export function isRecord(kind: TypeKind): kind is Record {
		return typeof (kind as Record).record === 'object';
	}
	export function isList(Kind: TypeKind): Kind is { List: TypeReference } {
		return false;
	}
}

export interface BaseType {
	type: string;
}

export interface Record {
	record: {
		fields: Field[];
	};
}

export interface Field {
	name: string;
	docs: Documentation;
	type: TypeReference;
}

export interface List {
}

export interface TypeObject {
	type: number;
}

export interface FuncObject {
	function: Func;
}

export interface InterfaceObject {
	interface: number;
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

export type TypeReference = number | string;
export namespace TypeReference {
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