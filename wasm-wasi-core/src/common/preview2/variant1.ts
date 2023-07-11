/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { JVariantCase, u32, u8 } from './wasi';

export class TestVariant implements JVariantCase {
	private __caseIndex: number;
	public _value: u8 | u32 | undefined | string;

	constructor(c: number, value: u8 | u32 | undefined | string) {
		this.__caseIndex = c;
		this._value = value;
	}

	public static red(value: u8) {
		return new TestVariant(0, value);
	}

	public static green(value: u32) {
		return new TestVariant(1, value);
	}

	public static nothing() {
		return new TestVariant(2, undefined);
	}

	public static blue(value: string) {
		return new TestVariant(3, value);
	}

	get _caseIndex(): number {
		return this.__caseIndex;
	}

	get value(): u8 | u32 | undefined | string {
		return this._value;
	}

	red(): this is { readonly value: u8 } {
		return this.__caseIndex === 0;
	}

	green(): this is { readonly value: u32 } {
		return this.__caseIndex === 1;
	}

	nothing(): this is { readonly value: undefined } {
		return this.__caseIndex === 2;
	}

	blue(): this is { readonly value: string } {
		return this.__caseIndex === 3;
	}
}

let r = TestVariant.red(1);
if (r.blue()) {
	r.value;
}
