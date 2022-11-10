/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::fs;

fn main() {
    let contents = fs::read_to_string("/workspace/test.bat").expect("Something went wrong reading the file");
    println!("Content:\n{}", contents);

    // let args: Vec<String> = env::args().collect();
    // println!("Hello, world {:?} !", args);

    // print!("Enter your name: ");
    // stdout().flush().unwrap();

    // let mut buffer = String::new();
    // stdin().read_line(&mut buffer).unwrap();

    // print!("\nHello {}", buffer);
    // stdout().flush().unwrap();

    // let _input_file = fs::File::open("/workspace/test.bat").map_err(|err| format!("error opening input {}: {}", "abc.txt", err)).unwrap();

    // let contents =
    //     fs::read_to_string("/workspace/test.bat").expect("Something went wrong reading the file");
    // println!("Content:\n{}", contents);

    for file in fs::read_dir("./workspace").unwrap() {
        println!("{}", file.unwrap().path().display());
    }
}