/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { VariableResult } from '../connection';

export type AssertionErrorData = {
	message: string;
	actual: unknown;
	expected: unknown;
	operator: string;
	generatedMessage: boolean;
	code: string;
};

export type ErrorData = {
	message: string;
};

export type TestRequests = {
	method: 'uint8array';
	params: {
		p1: string;
	};
	result: Uint8Array;
} | {
	method: 'int8array';
	params: undefined;
	result: Int8Array;
} | {
	method: 'uint16array';
	params: undefined;
	result: Uint16Array;
} | {
	method: 'int16array';
	params: undefined;
	result: Int16Array;
} | {
	method: 'uint32array';
	params: undefined;
	result: Uint32Array;
} | {
	method: 'int32array';
	params: undefined;
	result: Int32Array;
} | {
	method: 'uint64array';
	params: undefined;
	result: BigUint64Array;
} | {
	method: 'int64array';
	params: undefined;
	result: BigInt64Array;
} | {
	method: 'varUint8array';
	params: undefined;
	result: VariableResult<Uint8Array>;
}| {
	method: 'varJSON';
	params: undefined;
	result: VariableResult<{ name: string; age: number }>;
} | {
	method: 'testing/assertionError';
	params: AssertionErrorData;
	result: null;
} | {
	method: 'testing/error';
	params: ErrorData;
	result: null;
} | {
	method: 'testing/done';
	params: undefined;
	result: undefined;
};