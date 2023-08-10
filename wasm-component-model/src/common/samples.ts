/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ComponentModelType, Enumeration, FlagsType, JFlags, JRecord, ListType, Option, RecordType, Result, TupleType, VariantType, u32, u8, wstring } from './componentModel';


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

export type TestFlags = Record<'a' | 'b' | 'c', boolean> & JFlags;
export const TestFlagsType: FlagsType<TestFlags> = new FlagsType<TestFlags>(['a', 'b', 'c']);
let flags: TestFlags = TestFlagsType.create();
flags.a = true;

export namespace TestVariant {

	export const red = 0 as const;
	export const green = 1 as const;
	export const nothing = 2 as const;
	export const blue = 3 as const;

	export type _ct = typeof red | typeof green | typeof nothing | typeof blue;
	export type _vt = u8 | u32 | undefined | string;


	type _common = Omit<VariantImpl, 'case' | 'value'>;
	export type red = { readonly case: typeof red; readonly value: u8 } & _common;
	export type green = { readonly case: typeof green; readonly value: u32 } & _common;
	export type nothing = { readonly case: typeof nothing } & _common;
	export type blue = { readonly case: typeof blue; readonly value: string } & _common;

	export function _ctor(c: _ct, v: _vt): TestVariant {
		return new VariantImpl (c, v) as TestVariant;
	}

	export function _red(value: u8): red {
		return new VariantImpl(red, value) as red;
	}

	export function _green(value: u32): green {
		return new VariantImpl (green, value ) as green;
	}

	export function _nothing(): nothing {
		return new VariantImpl (nothing, undefined) as nothing;
	}

	export function _blue(value: string): blue {
		return new VariantImpl (blue, value) as blue;
	}

	class VariantImpl {
		private readonly _case: _ct;
		private readonly _value?: _vt;

		constructor(c: _ct, value: _vt) {
			this._case = c;
			this._value = value;
		}

		get case(): _ct {
			return this._case;
		}

		get value(): _vt {
			return this._value;
		}

		red(): this is red {
			return this._case === 0;
		}

		green(): this is green {
			return this._case === 1;
		}

		nothing(): this is nothing {
			return this._case === 2;
		}

		blue(): this is blue {
			return this._case === 3;
		}
	}
}
export type TestVariant = TestVariant.red | TestVariant.green | TestVariant.nothing | TestVariant.blue;
export const TestVariantType: ComponentModelType<TestVariant> = new VariantType<TestVariant, TestVariant._ct, TestVariant._vt>(
	[ u8, u32, undefined, wstring ],
	TestVariant._ctor
);


let t1: TestVariant = {} as any;
if (t1.red()) {
	t1.value;
}
if (t1.blue()) {
	t1.value;
}
if (t1.nothing()) {
	// t1.value;
}

export namespace TestUnion {

	export const u8 = 0 as const;
	export const u32 = 1 as const;
	export const string = 2 as const;

	export type _ct = typeof u8 | typeof u32 | typeof string;
	export type _vt = u8 | u32 | undefined | string;

	type _common = Omit<UnionImpl, 'case' | 'value'>;

	export type $u8 = { readonly case: typeof u8; readonly value: u8 } & _common;
	export type $u32 = { readonly case: typeof u32; readonly value: u32 } & _common;
	export type $string = { readonly case: typeof string; readonly value: string } & _common;

	export function _ctor(c: _ct, v: _vt): TestUnion {
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
		private readonly _case: _ct;
		private readonly _value?: _vt;

		constructor(c: _ct, value: _vt) {
			this._case = c;
			this._value = value;
		}

		get case(): _ct {
			return this._case;
		}

		get value(): _vt {
			return this._value;
		}

		u8(): this is $u8 {
			return this._case === u8;
		}

		u32(): this is $u32 {
			return this._case === u32;
		}

		string(): this is $string {
			return this._case === string;
		}
	}
}
export type TestUnion = TestUnion.$u8 | TestUnion.$u32 | TestUnion.$string;
export const TestUnionType: ComponentModelType<TestUnion> = new VariantType<TestUnion, TestUnion._ct, TestUnion._vt>(
	[ u8, u32, wstring ],
	TestUnion._ctor
);

export const TestOptionType: ComponentModelType<Option<TestRecord>> = new VariantType<Option<TestRecord>, Option._ct, Option._vt<TestRecord>>(
	[ undefined, TestRecordType],
	Option._ctor<TestRecord>
);

export const TestResultType: ComponentModelType<Result<TestTuple, u32>> = new VariantType<Result<TestTuple, u32>, 0 | 1, TestTuple | u32>(
	[ TestTupleType, u32 ],
	Result._ctor<TestTuple, u32>
);

export enum TestEnum {
	a = 0,
	b = 1,
	c = 2
}
export const TestEnumType: ComponentModelType<TestEnum> = new Enumeration<TestEnum>(3);