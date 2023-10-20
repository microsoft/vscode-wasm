/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
use std::thread;
use std::time::Duration;

fn main() {
    let handle_one = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread one!", i);
            thread::sleep(Duration::from_millis(500));
        }
    });

    let handle_two = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread two!", i);
            thread::sleep(Duration::from_millis(1000));
        }
    });

    handle_one.join().unwrap();
    handle_two.join().unwrap();

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
}