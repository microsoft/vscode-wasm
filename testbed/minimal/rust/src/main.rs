/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::env;
use std::io::Write;
use std::io::stdin;
use std::io::stdout;

fn main() {
    let args: Vec<String> = env::args().collect();
    println!("Hello, world {:?} !", args);

    print!("Enter your name: ");
    stdout().flush().unwrap();

    let mut buffer = String::new();
    stdin().read_line(&mut buffer).unwrap();

    print!("\nHello {}", buffer);
    stdout().flush().unwrap();
}