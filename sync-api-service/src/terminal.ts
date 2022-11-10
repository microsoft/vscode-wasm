/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Event, EventEmitter, Pseudoterminal, Uri } from 'vscode';

import * as uuid from 'uuid';

import { RAL } from '@vscode/sync-api-common';
import { CharacterDeviceDriver, FileDescriptorDescription } from './device';

class LineBuffer {

	private cursor: number;
	private content: string[];
	constructor() {
		this.cursor = 0;
		this.content = [];
	}

	public clear(): void {
		this.cursor = 0;
		this.content = [];
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

export enum TerminalMode {
	idle = 1,
	inUse = 2
}

export interface ServicePseudoTerminal extends Pseudoterminal, CharacterDeviceDriver {
	readonly id: string;
	readonly onDidCtrlC: Event<void>;
	readonly onDidClose: Event<void>;
	readonly onAnyKey: Event<void>;

	setMode(mode: TerminalMode): void;
	setName(name: string): void;
	writeString(str: string): void;
	readline(): Promise<string>;
}

export namespace ServicePseudoTerminal {
	export function create(): ServicePseudoTerminal {
		return new ServiceTerminalImpl();
	}
}

const terminalRegExp = /(\r\n)|(\n)/gm;

class ServiceTerminalImpl implements ServicePseudoTerminal, CharacterDeviceDriver {

	private mode: TerminalMode;

	public readonly id: string;

	private readonly _onDidClose: EventEmitter<void>;
	public readonly onDidClose: Event<void>;

	private readonly _onDidWrite: EventEmitter<string>;
	public readonly onDidWrite: Event<string>;

	private readonly _onDidChangeName: EventEmitter<string>;
	public readonly onDidChangeName: Event<string>;

	private readonly _onDidCtrlC: EventEmitter<void>;
	public readonly onDidCtrlC: Event<void>;

	private readonly _onAnyKey: EventEmitter<void>;
	public readonly onAnyKey: Event<void>;

	private lines: string[];
	private lineBuffer: LineBuffer;
	private readlineCallback: ((value: string ) => void) | undefined;

	private isOpen: boolean;
	private nameBuffer: string | undefined;
	private writeBuffer: string[] | undefined;
	private encoder: RAL.TextEncoder;
	private decoder: RAL.TextDecoder;

	public readonly uri: Uri;
	public readonly fileDescriptor: FileDescriptorDescription;


	constructor() {
		this.mode = TerminalMode.inUse;

		this._onDidClose = new EventEmitter();
		this.onDidClose = this._onDidClose.event;
		this._onDidWrite = new EventEmitter<string>();
		this.onDidWrite = this._onDidWrite.event;
		this._onDidChangeName = new EventEmitter<string>;
		this.onDidChangeName = this._onDidChangeName.event;
		this._onDidCtrlC = new EventEmitter<void>;
		this.onDidCtrlC = this._onDidCtrlC.event;
		this._onAnyKey = new EventEmitter<void>;
		this.onAnyKey = this._onAnyKey.event;

		const id = this.id = uuid.v4();
		this.encoder = RAL().TextEncoder.create();
		this.decoder = RAL().TextDecoder.create();

		this.uri =  Uri.from({ scheme: 'terminal', authority: id });
		this.fileDescriptor = { kind: 'terminal', uri: this.uri };

		this.lines = [];
		this.lineBuffer = new LineBuffer();

		this.isOpen = false;
	}

	public setMode(mode: TerminalMode): void {
		this.mode = mode;
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
		this._onDidClose.fire();
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

	public write(bytes: Uint8Array): Promise<number> {
		this.writeString(this.getString(bytes));
		return Promise.resolve(bytes.byteLength);
	}

	public writeString(str: string): void {
		if (this.isOpen) {
			this._onDidWrite.fire(str);
		} else {
			if (this.writeBuffer === undefined) {
				this.writeBuffer = [];
			}
			this.writeBuffer.push(str);
		}
	}

	public handleInput(data: string): void {
		if (this.mode === TerminalMode.idle) {
			this._onAnyKey.fire();
			return;
		}
		const previousCursor = this.lineBuffer.getCursor();
		switch (data) {
			case '\x03': // ctrl+C
				this._onDidCtrlC.fire();
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
				this.bell();
				break;
			case '\x1b[B': // down
				this.bell();
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
		}
	}

	private handleEnter(): void {
		this._onDidWrite.fire('\r\n');
		const line = this.lineBuffer.getLine();
		this.lineBuffer.clear();
		this.lines.push(line);
		if (this.readlineCallback !== undefined) {
			this.readlineCallback(`${this.lines.shift()!}\n`);
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

	private bell() {
		this._onDidWrite.fire('\x07');
	}

	private getString(bytes: Uint8Array): string {
		return this.decoder.decode(bytes.slice()).replace(terminalRegExp, (match: string, m1: string, m2: string) => {
			if (m1) {
				return m1;
			} else if (m2) {
				return '\r\n';
			} else {
				return match;
			}
		});
	}
}