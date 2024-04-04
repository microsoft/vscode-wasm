/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

use crate::host::api::workspace;

#[allow(non_upper_case_globals)]
pub const text_documents: fn() -> Vec<super::TextDocument> = workspace::text_documents;
