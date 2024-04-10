/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

use crate::host::api::types::{ DocumentSelector, TextDocument };
use crate::host::api::languages;

#[allow(non_upper_case_globals)]
pub const match_selector: fn(selector: &DocumentSelector, document: TextDocument) -> u32 = languages::match_selector;