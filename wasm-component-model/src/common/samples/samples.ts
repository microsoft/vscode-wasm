/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentModelType, EnumType, JRecord, ListType, RecordType, result, TupleType, VariantType, u32, u8, wstring, OptionType } from '../componentModel';


/****************************************************************************************
 * This are examples that can be fully generated from the Wit files.
 ****************************************************************************************/

interface TestRecord extends JRecord {
	a: u8;
	b: u32;
	c: u8;
	d: string;
}

export const TestRecordType: ComponentModelType<TestRecord> = new RecordType<TestRecord>([
	['a', u8], ['b', u32], ['c', u8], ['d', wstring]
]);

export const ListTestRecordType = new ListType<TestRecord>(TestRecordType);

export type TestTuple = [u8, string];
export const TestTupleType: ComponentModelType<TestTuple> = new TupleType<TestTuple>([u8, wstring]);

export namespace TestVariant {

	export const red = 'red' as const;
	export type Red = { readonly tag: typeof red; readonly value: u8 } & _common;
	export function Red(value: u8): Red {
		return new VariantImpl(red, value) as Red;
	}

	export const green = 'green' as const;
	export type Green = { readonly tag: typeof green; readonly value: u32 } & _common;
	export function Green(value: u32): Green {
		return new VariantImpl (green, value ) as Green;
	}

	export const nothing = 'nothing' as const;
	export type Nothing = { readonly tag: typeof nothing } & _common;
	export function Nothing(): Nothing {
		return new VariantImpl (nothing, undefined) as Nothing;
	}


	export const blue = 'blue' as const;
	export type Blue = { readonly tag: typeof blue; readonly value: string } & _common;
	export function Blue(value: string): Blue {
		return new VariantImpl (blue, value) as Blue;
	}

	export type _tt = typeof red | typeof green | typeof nothing | typeof blue;
	export type _vt = u8 | u32 | undefined | string;

	type _common = Omit<VariantImpl, 'tag' | 'value'>;

	export function _ctor(c: _tt, v: _vt): TestVariant {
		return new VariantImpl (c, v) as TestVariant;
	}

	class VariantImpl {
		private readonly _tag: _tt;
		private readonly _value?: _vt;

		constructor(tag: _tt, value: _vt) {
			this._tag = tag;
			this._value = value;
		}

		get tag(): _tt {
			return this._tag;
		}

		get value(): _vt {
			return this._value;
		}

		isRed(): this is Red {
			return this._tag === TestVariant.red;
		}

		isGreen(): this is Green {
			return this._tag === TestVariant.green;
		}

		isNothing(): this is Nothing {
			return this._tag === TestVariant.nothing;
		}

		isBlue(): this is Blue {
			return this._tag === TestVariant.blue;
		}
	}
}
export type TestVariant = TestVariant.Red | TestVariant.Green | TestVariant.Nothing | TestVariant.Blue;
export const TestVariantType: ComponentModelType<TestVariant> = new VariantType<TestVariant, TestVariant._tt, TestVariant._vt>(
	[ ['u8', u8], ['u32', u32], ['nothing', undefined], ['string', wstring] ],
	TestVariant._ctor
);


let t1: TestVariant = {} as any;
if (t1.isRed()) {
	t1.value;
}
if (t1.isBlue()) {
	t1.value;
}
if (t1.isNothing()) {
	// t1.value;
}

export namespace TestUnion {

	export const u8 = 'u8' as const;
	export const u32 = 'u32' as const;
	export const string = 'string' as const;

	export type _tt = typeof u8 | typeof u32 | typeof string;
	export type _vt = u8 | u32 | undefined | string;

	type _common = Omit<UnionImpl, 'tag' | 'value'>;

	export type $u8 = { readonly tag: typeof u8; readonly value: u8 } & _common;
	export type $u32 = { readonly tag: typeof u32; readonly value: u32 } & _common;
	export type $string = { readonly tag: typeof string; readonly value: string } & _common;

	export function _ctor(c: _tt, v: _vt): TestUnion {
		return new UnionImpl(c, v) as TestUnion;
	}

	export function _u8(value: u8): $u8 {
		return new UnionImpl(u8, value) as $u8;
	}

	export function _u32(value: u32): $u32 {
		return new UnionImpl (u32, value ) as $u32;
	}

	export function _string(): $string {
		return new UnionImpl (string, undefined) as $string;
	}

	class UnionImpl {
		private readonly _tag: _tt;
		private readonly _value?: _vt;

		constructor(tag: _tt, value: _vt) {
			this._tag = tag;
			this._value = value;
		}

		get tag(): _tt {
			return this._tag;
		}

		get value(): _vt {
			return this._value;
		}

		isU8(): this is $u8 {
			return this._tag === u8;
		}

		isU32(): this is $u32 {
			return this._tag === u32;
		}

		isString(): this is $string {
			return this._tag === string;
		}
	}
}
export type TestUnion = TestUnion.$u8 | TestUnion.$u32 | TestUnion.$string;
export const TestUnionType: ComponentModelType<TestUnion> = new VariantType<TestUnion, TestUnion._tt, TestUnion._vt>(
	[ ['u8', u8], ['u32', u32], ['string', wstring] ],
	TestUnion._ctor
);

export const TestOptionType = new OptionType<TestRecord>(TestRecordType);

export const TestResultType: ComponentModelType<result<TestTuple, u32>> = new VariantType<result<TestTuple, u32>, 'ok' | 'error', TestTuple | u32>(
	[ ['ok', TestTupleType], ['error', u32] ],
	result._ctor<TestTuple, u32>
);

export enum TestEnum {
	a = 'a',
	b = 'b',
	c = 'c'
}
export const TestEnumType: ComponentModelType<TestEnum> = new EnumType<TestEnum>(['a', 'b', 'c']);