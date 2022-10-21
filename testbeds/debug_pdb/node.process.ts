import * as vscode from 'vscode';
import { ChildProcess, spawn } from 'child_process';
import { Event } from 'vscode';
import { IChildProcess, IChildProcessSpawner } from './types';

// Node implementation of process abstraction
class ProcessWrapper implements IChildProcess {
	_stdoutEmitter = new vscode.EventEmitter<Buffer>();
	_stderrEmitter = new vscode.EventEmitter<Buffer>();
	_exitEmitter = new vscode.EventEmitter<number>();
	constructor(private readonly process: ChildProcess) {
		process.stdout?.on('data', this._stdoutEmitter.fire.bind(this._stdoutEmitter));
		process.stderr?.on('data', this._stderrEmitter.fire.bind(this._stdoutEmitter));
		process.on('exit', this._exitEmitter.fire.bind(this._exitEmitter));
	}
	get stdout(): Event<Buffer> {
		return this._stdoutEmitter.event;
	}
	get stderr(): Event<Buffer> {
		return this._stderrEmitter.event;
	}
	stdin(data: string): void {
		const result = this.process.stdin?.write(data);
		if (!result) {
			this.process.stdin?.once('drain', () => {
				this.process.stdin?.write(data);
			});
		}
	}
	get exit(): Event<number> {
		return this._exitEmitter.event;
	}
	get killed(): boolean {
		return this.process.killed;
	}
	kill(): void {
		this.process.kill();
	}
}

export class ProcessSpawner implements IChildProcessSpawner {
	spawn(program: string, args: string[], cwd: string | undefined): IChildProcess {
		return new ProcessWrapper(spawn(program, args, { cwd }));
	}
}