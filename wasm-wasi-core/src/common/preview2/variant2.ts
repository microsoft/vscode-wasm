/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { u32, u8 } from './wasi';

// can't be named TestVariant since enums can't be merged with type definitions.
export enum TestVariantKind {
	red = 0,
	green= 1,
	nothing= 2,
	blue= 3,
}

export namespace TestVariant {

	export const red = 0 as const;
	export const green = 1 as const;
	export const nothing = 2 as const;
	export const blue = 3 as const;

	export function createRed(value: u8): { readonly case: typeof TestVariant.red; readonly value: u8 } {
		return { case: TestVariant.red, value };
	}

	export function createGreen(value: u32): { readonly case: typeof TestVariant.green; readonly value: u32 } {
		return { case: TestVariant.green, value };
	}

	export function createNothing(): { readonly case: typeof TestVariant.nothing; readonly value: undefined } {
		return { case: TestVariant.nothing, value: undefined };
	}

	export function createBlue(value: string): { readonly case: typeof TestVariant.blue; readonly value: string } {
		return { case: TestVariant.blue, value };
	}
}
export type TestVariant =
	{ readonly case: typeof TestVariant.red; readonly value: u8 } |
	{ readonly case: typeof TestVariant.green; readonly value: u32 } |
	{ readonly case: typeof TestVariant.nothing; readonly value: undefined } |
	{ readonly case: typeof TestVariant.blue; readonly value: string };

let t: TestVariant = TestVariant.createRed(1);
t.value;
if (t.case === TestVariant.blue) {
	t.value;
}

function foo(x: TestVariantKind.blue): void {

}

class X {

}

namespace X {
	export class Red {

	}
	export type red = 10;
	export function red(): void {}
}

X.red();