import * as vscode from 'vscode';

export interface IChildProcess {
	stdout: vscode.Event<Buffer>;
	stderr: vscode.Event<Buffer>;
	stdin(data: string): void;
	exit: vscode.Event<number>;
	killed: boolean;
	kill(): void;
}

export interface IChildProcessSpawner{
	spawn(program: string, args: string[], cwd: string | undefined): IChildProcess;
}
