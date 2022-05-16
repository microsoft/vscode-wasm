/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
     println!("Hello, world {:?} !", args);
}
