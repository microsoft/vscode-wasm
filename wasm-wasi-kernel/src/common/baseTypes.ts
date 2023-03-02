/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type u64 = bigint;
export type s64 = bigint;
export type ptr<_type = u8> =  number;

export type size = u32;
export type byte = u8;
export type bytes = byte[];
// a \0 terminated string (e.g. C format)
export type cstring = byte[];