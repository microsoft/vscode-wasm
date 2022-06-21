/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::fs;

fn main() {
    let contents = fs::read_to_string("/workspace/test.bat").expect("Something went wrong reading the file");

    println!("Content:\n{}", contents);
}