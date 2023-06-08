/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Event, EventEmitter } from 'vscode';

import RAL from './ral';
import { Stdio, WasmPseudoterminal, PseudoterminalState } from './api';

class LineBuffer {

	private offset: number;
	private cursor: number;
	private content: string[];
	constructor() {
		this.offset = 0;
		this.cursor = 0;
		this.content = [];
	}

	public clear(): void {
		this.offset = 0;
		this.cursor = 0;
		this.content = [];
	}

	public setContent(content: string): void {
		this.content = content.split('');
		this.cursor = this.content.length;
	}

	public getOffset(): number {
		return this.offset;
	}

	public setOffset(offset: number): void {
		this.offset = offset;
	}

	public getLine(): string {
		return this.content.join('');
	}

	public getCursor(): number {
		return this.cursor;
	}

	public isCursorAtEnd(): boolean {
		return this.cursor === this.content.length;
	}

	public isCursorAtBeginning(): boolean {
		return this.cursor === 0;
	}

	public insert(value: String) {
		for (const char of value) {
			this.content.splice(this.cursor, 0, char);
			this.cursor++;
		}
	}

	public del(): boolean {
		if (this.cursor === this.content.length) {
			return false;
		}
		this.content.splice(this.cursor, 1);
		return true;
	}

	public backspace(): boolean {
		if (this.cursor === 0) {
			return false;
		}
		this.cursor -= 1;
		this.content.splice(this.cursor, 1);
		return true;
	}

	public moveCursorRelative(characters: number): boolean {
		const newValue = this.cursor + characters;
		if (newValue < 0 || newValue > this.content.length) {
			return false;
		}
		this.cursor = newValue;
		return true;
	}

	public moveCursorStartOfLine(): boolean {
		if (this.cursor === 0) {
			return false;
		}
		this.cursor = 0;
		return true;
	}

	public moveCursorEndOfLine(): boolean {
		if (this.cursor === this.content.length) {
			return false;
		}
		this.cursor = this.content.length;
		return true;
	}

	public moveCursorWordLeft(): boolean {
		if (this.cursor === 0) {
			return false;
		}
		let index: number;
		// check if we are at the beginning of a word
		if (this.content[this.cursor - 1] === ' ') {
			index = this.cursor - 2;
			while (index > 0) {
				if (this.content[index] === ' ') {
					index--;
				} else {
					break;
				}
			}
		} else {
			index = this.cursor;
		}
		if (index === 0) {
			this.cursor = index;
			return true;
		}
		// On the first character that is not space
		while (index > 0) {
			if (this.content[index] === ' ') {
				index++;
				break;
			} else {
				index--;
			}
		}
		this.cursor = index;
		return true;
	}

	public moveCursorWordRight(): boolean {
		if (this.cursor === this.content.length) {
			return false;
		}
		let index: number;
		if (this.content[this.cursor] === ' ') {
			index = this.cursor + 1;
			while (index < this.content.length) {
				if (this.content[index] === ' ') {
					index++;
				} else {
					break;
				}
			}
		} else {
			index = this.cursor;
		}
		if (index === this.content.length) {
			this.cursor = index;
			return true;
		}

		while (index < this.content.length) {
			if (this.content[index] === ' ') {
				break;
			} else {
				index++;
			}
		}
		this.cursor = index;
		return true;
	}
}

export interface Options {
	history?: boolean;
}

class CommandHistory {

	private readonly history: string[];
	private current: number;

	constructor() {
		this.history = [''];
		this.current = 0;
	}

	public update(command: string): void {
		this.history[this.history.length - 1] = command;
	}

	public markExecuted(): void {
		// We execute a command from the history so we need to add it to the top.
		if (this.current !== this.history.length - 1) {
			this.history[this.history.length - 1] = this.history[this.current];
		}
		if (this.history[this.history.length - 1] === this.history[this.history.length - 2]) {
			this.history.pop();
		}
		this.history.push('');
		this.current = this.history.length - 1;
	}

	public previous(): string | undefined {
		if (this.current === 0) {
			return undefined;
		}
		return this.history[--this.current];
	}

	public next(): string | undefined {
		if (this.current === this.history.length - 1) {
			return undefined;
		}
		return this.history[++this.current];
	}
}

export class WasmPseudoterminalImpl implements WasmPseudoterminal {

	private readonly options: Options;
	private readonly commandHistory: CommandHistory | undefined;
	private state: PseudoterminalState;

	private readonly _onDidClose: EventEmitter<void | number>;
	public readonly onDidClose: Event<void | number>;

	private readonly _onDidWrite: EventEmitter<string>;
	public readonly onDidWrite: Event<string>;

	private readonly _onDidChangeName: EventEmitter<string>;
	public readonly onDidChangeName: Event<string>;

	private readonly _onDidCtrlC: EventEmitter<void>;
	public readonly onDidCtrlC: Event<void>;

	private readonly _onAnyKey: EventEmitter<void>;
	public readonly onAnyKey: Event<void>;

	private readonly _onDidChangeState: EventEmitter<{ old: PseudoterminalState; new: PseudoterminalState }>;
	public readonly onDidChangeState: Event<{ old: PseudoterminalState; new: PseudoterminalState }>;

	private readonly _onDidCloseTerminal: EventEmitter<void>;
	public readonly onDidCloseTerminal: Event<void>;

	private lines: string[];
	private lineBuffer: LineBuffer;
	private readlineCallback: ((value: string ) => void) | undefined;

	private isOpen: boolean;
	private nameBuffer: string | undefined;
	private writeBuffer: string[] | undefined;
	private encoder: RAL.TextEncoder;
	private decoder: RAL.TextDecoder;

	constructor(options: Options = {}) {
		this.options = options;
		this.commandHistory = this.options.history ? new CommandHistory() : undefined;
		this.state = PseudoterminalState.busy;

		this._onDidClose = new EventEmitter();
		this.onDidClose = this._onDidClose.event;

		this._onDidWrite = new EventEmitter<string>();
		this.onDidWrite = this._onDidWrite.event;

		this._onDidChangeName = new EventEmitter<string>();
		this.onDidChangeName = this._onDidChangeName.event;

		this._onDidCtrlC = new EventEmitter<void>();
		this.onDidCtrlC = this._onDidCtrlC.event;

		this._onAnyKey = new EventEmitter<void>();
		this.onAnyKey = this._onAnyKey.event;

		this._onDidChangeState = new EventEmitter<{ old: PseudoterminalState; new: PseudoterminalState }>();
		this.onDidChangeState = this._onDidChangeState.event;

		this._onDidCloseTerminal = new EventEmitter<void>();
		this.onDidCloseTerminal = this._onDidCloseTerminal.event;

		this.encoder = RAL().TextEncoder.create();
		this.decoder = RAL().TextDecoder.create();

		this.lines = [];
		this.lineBuffer = new LineBuffer();

		this.isOpen = false;
	}

	public get stdio(): Stdio {
		return {
			in: { kind: 'terminal', terminal: this },
			out: { kind: 'terminal', terminal: this },
			err: { kind: 'terminal', terminal: this }
		};
	}

	public setState(state: PseudoterminalState): void {
		const old = this.state;
		this.state = state;
		if (old !== state) {
			this._onDidChangeState.fire({ old, new: state });
		}
	}

	public getState(): PseudoterminalState {
		return this.state;
	}

	public setName(name: string): void {
		if (this.isOpen) {
			this._onDidChangeName.fire(name);
		} else {
			this.nameBuffer = name;
		}
	}

	public open(): void {
		this.isOpen = true;
		if (this.nameBuffer !== undefined) {
			this._onDidChangeName.fire(this.nameBuffer);
			this.nameBuffer = undefined;
		}
		if (this.writeBuffer !== undefined) {
			for (const item of this.writeBuffer) {
				this._onDidWrite.fire(item);
			}
			this.writeBuffer = undefined;
		}
	}

	public close(): void {
		this._onDidCloseTerminal.fire();
	}

	public async read(_maxBytesToRead: number): Promise<Uint8Array> {
		const value = await this.readline();
		return this.encoder.encode(value);
	}

	public readline(): Promise<string> {
		if (this.readlineCallback !== undefined) {
			throw new Error(`Already in readline mode`);
		}
		if (this.lines.length > 0) {
			return Promise.resolve(this.lines.shift()!);
		}
		return new Promise((resolve) => {
			this.readlineCallback = resolve;
		});
	}

	public write(content: string): Promise<void>;
	public write(content: Uint8Array, encoding?: 'utf-8'): Promise<number>;
	public write(content: Uint8Array | string, encoding?: 'utf-8'): Promise<void> | Promise<number> {
		if (typeof content === 'string') {
			this.writeString(this.replaceNewlines(content));
			return Promise.resolve();
		} else {
			this.writeString(this.getString(content, encoding));
			return Promise.resolve(content.byteLength);
		}
	}

	private writeString(str: string): void {
		if (this.isOpen) {
			this._onDidWrite.fire(str);
		} else {
			if (this.writeBuffer === undefined) {
				this.writeBuffer = [];
			}
			this.writeBuffer.push(str);
		}
	}

	public async prompt(prompt: string): Promise<void> {
		await this.write(prompt);
		this.lineBuffer.setOffset(prompt.length);
	}

	public handleInput(data: string): void {
		if (this.state === PseudoterminalState.free) {
			this._onAnyKey.fire();
			return;
		}
		const previousCursor = this.lineBuffer.getCursor();
		switch (data) {
			case '\x03': // ctrl+C
				this.handleInterrupt();
				break;
			case '\x06': // ctrl+f
			case '\x1b[C': // right
				this.adjustCursor(this.lineBuffer.moveCursorRelative(1), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x1bf': // alt+f
			case '\x1b[1;5C': // ctrl+right
				this.adjustCursor(this.lineBuffer.moveCursorWordRight(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x02': // ctrl+b
			case '\x1b[D': // left
				this.adjustCursor(this.lineBuffer.moveCursorRelative(-1), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x1bb': // alt+b
			case '\x1b[1;5D': // ctrl+left
				this.adjustCursor(this.lineBuffer.moveCursorWordLeft(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x01': // ctrl+a
			case '\x1b[H': // home
				this.adjustCursor(this.lineBuffer.moveCursorStartOfLine(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x05': // ctrl+e
			case '\x1b[F': // end
				this.adjustCursor(this.lineBuffer.moveCursorEndOfLine(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x1b[A': // up
				if (this.commandHistory === undefined) {
					this.bell();
				} else {
					const content = this.commandHistory.previous();
					if (content !== undefined) {
						this.eraseLine();
						this.lineBuffer.setContent(content);
						this.writeString(content);
					} else {
						this.bell();
					}
				}
				break;
			case '\x1b[B': // down
				if (this.commandHistory === undefined) {
					this.bell();
				} else {
					const content = this.commandHistory.next();
					if (content !== undefined) {
						this.eraseLine();
						this.lineBuffer.setContent(content);
						this.writeString(content);
					} else {
						this.bell();
					}
				}
				break;
			case '\x08': // shift+backspace
			case '\x7F': // backspace
				this.lineBuffer.backspace() ? this._onDidWrite.fire('\x1b[D\x1b[P') : this.bell();
				break;
			case '\x1b[3~': // delete key
				this.lineBuffer.del() ? this._onDidWrite.fire('\x1b[P'): this.bell();
				break;
			case '\r': // enter
				this.handleEnter();
				break;
			default:
				this.lineBuffer.insert(data);
				if (!this.lineBuffer.isCursorAtEnd()) {
					this._onDidWrite.fire('\x1b[@');
				}
				this._onDidWrite.fire(data);
				if (this.commandHistory !== undefined) {
					this.commandHistory.update(this.lineBuffer.getLine());
				}
		}
	}

	private handleInterrupt(): void {
		this._onDidCtrlC.fire();
		this._onDidWrite.fire('\x1b[31m^C\x1b[0m\r\n');
		this.lineBuffer.clear();
		this.lines.length = 0;
		this.readlineCallback?.('\n');
		this.readlineCallback = undefined;
	}

	private handleEnter(): void {
		this._onDidWrite.fire('\r\n');
		const line = this.lineBuffer.getLine();
		this.lineBuffer.clear();
		this.lines.push(line);
		if (this.commandHistory !== undefined) {
			this.commandHistory.markExecuted();
		}
		if (this.readlineCallback !== undefined) {
			const result = this.lines.shift()! + '\n';
			this.readlineCallback(result);
			this.readlineCallback = undefined;
		}
	}

	private adjustCursor(success: boolean, oldCursor: number, newCursor: number): void {
		if (!success) {
			this.bell();
			return;
		}

		const change = oldCursor - newCursor;
	    const code = change > 0 ? 'D' : 'C';
		const sequence = `\x1b[${code}`.repeat(Math.abs(change));
		this._onDidWrite.fire(sequence);
	}

	private eraseLine(): void {
		const cursor = this.lineBuffer.getCursor();
		// Move cursor back to the start of the prompt
		this.adjustCursor(true, cursor, 0);
		// erase until end of line
		this._onDidWrite.fire(`\x1b[0J`);
	}

	private bell() {
		this._onDidWrite.fire('\x07');
	}

	private static terminalRegExp = /(\r\n)|(\n)/gm;
	private replaceNewlines(str: string): string {
		return str.replace(WasmPseudoterminalImpl.terminalRegExp, (match: string, m1: string, m2: string) => {
			if (m1) {
				return m1;
			} else if (m2) {
				return '\r\n';
			} else {
				return match;
			}
		});
	}
	private getString(bytes: Uint8Array, _encoding?: 'utf-8'): string {
		return this.replaceNewlines(this.decoder.decode(bytes.slice()));
	}
}