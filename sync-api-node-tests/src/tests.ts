/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
	method: 'testing/assertionError';
	params: AssertionErrorData;
	result: null;
} | {
	method: 'testing/error';
	params: ErrorData;
	result: null;
};