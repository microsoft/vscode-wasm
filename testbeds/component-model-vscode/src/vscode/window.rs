/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

use crate::ms::vscode::window;
use crate::ms::vscode::types;

#[allow(non_upper_case_globals)]
pub const create_output_channel: fn(name: &str, language_id: Option<&str>) -> types::OutputChannel = window::create_output_channel;