/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

pub mod commands;
pub mod window;
pub mod workspace;

use crate::host;

pub type OutputChannel = host::api::types::OutputChannel;
pub type TextDocument = host::api::types::TextDocument;