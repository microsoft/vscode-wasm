/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, own, i32, ptr } from '@vscode/wasm-component-model';

export namespace example {
	export namespace Types {
		export type Operands = {
			left: u32;
			right: u32;
		};

		export namespace Operation {
			export const add = 'add' as const;
			export type Add = { readonly tag: typeof add; readonly value: Operands } & _common;
			export function Add(value: Operands): Add {
				return new VariantImpl(add, value) as Add;
			}

			export const sub = 'sub' as const;
			export type Sub = { readonly tag: typeof sub; readonly value: Operands } & _common;
			export function Sub(value: Operands): Sub {
				return new VariantImpl(sub, value) as Sub;
			}

			export const mul = 'mul' as const;
			export type Mul = { readonly tag: typeof mul; readonly value: Operands } & _common;
			export function Mul(value: Operands): Mul {
				return new VariantImpl(mul, value) as Mul;
			}

			export const div = 'div' as const;
			export type Div = { readonly tag: typeof div; readonly value: Operands } & _common;
			export function Div(value: Operands): Div {
				return new VariantImpl(div, value) as Div;
			}

			export type _tt = typeof add | typeof sub | typeof mul | typeof div;
			export type _vt = Operands | Operands | Operands | Operands;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Operation {
				return new VariantImpl(t, v) as Operation;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isAdd(): this is Add {
					return this._tag === Operation.add;
				}
				isSub(): this is Sub {
					return this._tag === Operation.sub;
				}
				isMul(): this is Mul {
					return this._tag === Operation.mul;
				}
				isDiv(): this is Div {
					return this._tag === Operation.div;
				}
			}
		}
		export type Operation = Operation.Add | Operation.Sub | Operation.Mul | Operation.Div;

		export type Position = {
			line: u32;
			character: u32;
		};

		export type Range = {
			start: Position;
			end: Position;
		};

		export type TextDocumentContentChangeEvent = {
			range: Range;
			rangeOffset: u32;
			rangeLength: u32;
			text: string;
		};

		export enum TextDocumentChangeReason {
			undo = 'undo',
			redo = 'redo'
		}

		export type TextDocumentChangeEvent = {
			document: own<TextDocument>;
			contentChanges: TextDocumentContentChangeEvent[];
			reason?: TextDocumentChangeReason | undefined;
		};

		export namespace TextDocument {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				uri(): string;

				languageId(): string;

				version(): u32;

				getText(): string;
			}
			export type Statics = {
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
			};
		}
		export type TextDocument = TextDocument.Interface;

		export namespace OutputChannel {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				name(): string;

				append(value: string): void;

				appendLine(value: string): void;

				clear(): void;

				show(): void;
			}
			export type Statics = {
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
			};
		}
		export type OutputChannel = OutputChannel.Interface;
	}
	export type Types = {
		TextDocument: Types.TextDocument.Class;
		OutputChannel: Types.OutputChannel.Class;
	};

	export namespace Window {
		export type OutputChannel = example.Types.OutputChannel;

		export type createOutputChannel = (name: string, languageId: string | undefined) => own<OutputChannel>;
	}
	export type Window = {
		createOutputChannel: Window.createOutputChannel;
	};

	export namespace Workspace {
		export type registerOnDidChangeTextDocument = () => void;
	}
	export type Workspace = {
		registerOnDidChangeTextDocument: Workspace.registerOnDidChangeTextDocument;
	};

	export namespace WorkspaceEvents {
		export type didChangeTextDocument = (uri: string, content: string) => void;
	}
	export type WorkspaceEvents = {
		didChangeTextDocument: WorkspaceEvents.didChangeTextDocument;
	};

	export namespace Commands {
		export type register = (command: string) => void;
	}
	export type Commands = {
		register: Commands.register;
	};

	export namespace CommandsEvents {
		export type execute = (command: string) => void;
	}
	export type CommandsEvents = {
		execute: CommandsEvents.execute;
	};
	export namespace calculator {
		export type Operation = Types.Operation;
		export type Imports = {
			workspace: example.Workspace;
			commands: example.Commands;
			types: example.Types;
			window: example.Window;
		};
		export type Exports = {
			calc: (o: Operation) => u32;
			workspaceEvents: example.WorkspaceEvents;
			commandsEvents: example.CommandsEvents;
		};
	}
}

export namespace example {
	export namespace Types.$ {
		export const Operands = new $wcm.RecordType<example.Types.Operands>([
			['left', $wcm.u32],
			['right', $wcm.u32],
		]);
		export const Operation = new $wcm.VariantType<example.Types.Operation, example.Types.Operation._tt, example.Types.Operation._vt>([['add', Operands], ['sub', Operands], ['mul', Operands], ['div', Operands]], example.Types.Operation._ctor);
		export const Position = new $wcm.RecordType<example.Types.Position>([
			['line', $wcm.u32],
			['character', $wcm.u32],
		]);
		export const Range = new $wcm.RecordType<example.Types.Range>([
			['start', Position],
			['end', Position],
		]);
		export const TextDocumentContentChangeEvent = new $wcm.RecordType<example.Types.TextDocumentContentChangeEvent>([
			['range', Range],
			['rangeOffset', $wcm.u32],
			['rangeLength', $wcm.u32],
			['text', $wcm.wstring],
		]);
		export const TextDocument = new $wcm.ResourceType<example.Types.TextDocument>('text-document', 'vscode:example/types/text-document');
		export const TextDocument_Handle = new $wcm.ResourceHandleType('text-document');
		export const TextDocumentChangeReason = new $wcm.EnumType<example.Types.TextDocumentChangeReason>(['undo', 'redo']);
		export const TextDocumentChangeEvent = new $wcm.RecordType<example.Types.TextDocumentChangeEvent>([
			['document', new $wcm.OwnType<example.Types.TextDocument>(TextDocument)],
			['contentChanges', new $wcm.ListType<example.Types.TextDocumentContentChangeEvent>(TextDocumentContentChangeEvent)],
			['reason', new $wcm.OptionType<example.Types.TextDocumentChangeReason>(TextDocumentChangeReason)],
		]);
		export const OutputChannel = new $wcm.ResourceType<example.Types.OutputChannel>('output-channel', 'vscode:example/types/output-channel');
		export const OutputChannel_Handle = new $wcm.ResourceHandleType('output-channel');
		TextDocument.addMethod('uri', new $wcm.MethodType<example.Types.TextDocument.Interface['uri']>('[method]text-document.uri', [], $wcm.wstring));
		TextDocument.addMethod('languageId', new $wcm.MethodType<example.Types.TextDocument.Interface['languageId']>('[method]text-document.language-id', [], $wcm.wstring));
		TextDocument.addMethod('version', new $wcm.MethodType<example.Types.TextDocument.Interface['version']>('[method]text-document.version', [], $wcm.u32));
		TextDocument.addMethod('getText', new $wcm.MethodType<example.Types.TextDocument.Interface['getText']>('[method]text-document.get-text', [], $wcm.wstring));
		TextDocument.addDestructor('$drop', new $wcm.DestructorType<example.Types.TextDocument.Statics['$drop']>('[resource-drop]text-document', [['inst', TextDocument]]));
		OutputChannel.addMethod('name', new $wcm.MethodType<example.Types.OutputChannel.Interface['name']>('[method]output-channel.name', [], $wcm.wstring));
		OutputChannel.addMethod('append', new $wcm.MethodType<example.Types.OutputChannel.Interface['append']>('[method]output-channel.append', [
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addMethod('appendLine', new $wcm.MethodType<example.Types.OutputChannel.Interface['appendLine']>('[method]output-channel.append-line', [
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addMethod('clear', new $wcm.MethodType<example.Types.OutputChannel.Interface['clear']>('[method]output-channel.clear', [], undefined));
		OutputChannel.addMethod('show', new $wcm.MethodType<example.Types.OutputChannel.Interface['show']>('[method]output-channel.show', [], undefined));
		OutputChannel.addDestructor('$drop', new $wcm.DestructorType<example.Types.OutputChannel.Statics['$drop']>('[resource-drop]output-channel', [['inst', OutputChannel]]));
	}
	export namespace Types._ {
		export const id = 'vscode:example/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Operands', $.Operands],
			['Operation', $.Operation],
			['Position', $.Position],
			['Range', $.Range],
			['TextDocumentContentChangeEvent', $.TextDocumentContentChangeEvent],
			['TextDocumentChangeReason', $.TextDocumentChangeReason],
			['TextDocumentChangeEvent', $.TextDocumentChangeEvent],
			['TextDocument', $.TextDocument],
			['OutputChannel', $.OutputChannel]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TextDocument', $.TextDocument],
			['OutputChannel', $.OutputChannel]
		]);
		export namespace TextDocument {
			export type WasmInterface = {
				'[method]text-document.uri': (self: i32, result: ptr<string>) => void;
				'[method]text-document.language-id': (self: i32, result: ptr<string>) => void;
				'[method]text-document.version': (self: i32) => i32;
				'[method]text-document.get-text': (self: i32, result: ptr<string>) => void;
				'[resource-drop]text-document': (self: i32) => void;
			};
			type ObjectModule = {
				uri(self: TextDocument): string;
				languageId(self: TextDocument): string;
				version(self: TextDocument): u32;
				getText(self: TextDocument): string;
			};
			type ClassModule = {
				$drop(self: TextDocument): void;
			};
			class Impl extends $wcm.Resource implements example.Types.TextDocument.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public uri(): string {
					return this._om.uri(this);
				}
				public languageId(): string {
					return this._om.languageId(this);
				}
				public version(): u32 {
					return this._om.version(this);
				}
				public getText(): string {
					return this._om.getText(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Types.TextDocument.Class {
				const resource = example.Types.$.TextDocument;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: TextDocument): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export namespace OutputChannel {
			export type WasmInterface = {
				'[method]output-channel.name': (self: i32, result: ptr<string>) => void;
				'[method]output-channel.append': (self: i32, value_ptr: i32, value_len: i32) => void;
				'[method]output-channel.append-line': (self: i32, value_ptr: i32, value_len: i32) => void;
				'[method]output-channel.clear': (self: i32) => void;
				'[method]output-channel.show': (self: i32) => void;
				'[resource-drop]output-channel': (self: i32) => void;
			};
			type ObjectModule = {
				name(self: OutputChannel): string;
				append(self: OutputChannel, value: string): void;
				appendLine(self: OutputChannel, value: string): void;
				clear(self: OutputChannel): void;
				show(self: OutputChannel): void;
			};
			type ClassModule = {
				$drop(self: OutputChannel): void;
			};
			class Impl extends $wcm.Resource implements example.Types.OutputChannel.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public name(): string {
					return this._om.name(this);
				}
				public append(value: string): void {
					return this._om.append(this, value);
				}
				public appendLine(value: string): void {
					return this._om.appendLine(this, value);
				}
				public clear(): void {
					return this._om.clear(this);
				}
				public show(): void {
					return this._om.show(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Types.OutputChannel.Class {
				const resource = example.Types.$.OutputChannel;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: OutputChannel): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
		} & TextDocument.WasmInterface & OutputChannel.WasmInterface;
		export function createImports(service: example.Types, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(undefined, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, undefined, resources, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Types {
			return $wcm.Exports.bind<example.Types>(undefined, [['TextDocument', $.TextDocument, TextDocument.Class], ['OutputChannel', $.OutputChannel, OutputChannel.Class]], wasmInterface, context);
		}
	}

	export namespace Window.$ {
		export const OutputChannel = example.Types.$.OutputChannel;
		export const createOutputChannel = new $wcm.FunctionType<example.Window.createOutputChannel>('create-output-channel',[
			['name', $wcm.wstring],
			['languageId', new $wcm.OptionType<string>($wcm.wstring)],
		], new $wcm.OwnType<example.Window.OutputChannel>(OutputChannel));
	}
	export namespace Window._ {
		export const id = 'vscode:example/window' as const;
		export const witName = 'window' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutputChannel', $.OutputChannel]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['createOutputChannel', $.createOutputChannel]
		]);
		export type WasmInterface = {
			'create-output-channel': (name_ptr: i32, name_len: i32, languageId_case: i32, languageId_option_ptr: i32, languageId_option_len: i32) => i32;
		};
		export function createImports(service: example.Window, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Window {
			return $wcm.Exports.bind<example.Window>(functions, [], wasmInterface, context);
		}
	}

	export namespace Workspace.$ {
		export const registerOnDidChangeTextDocument = new $wcm.FunctionType<example.Workspace.registerOnDidChangeTextDocument>('register-on-did-change-text-document', [], undefined);
	}
	export namespace Workspace._ {
		export const id = 'vscode:example/workspace' as const;
		export const witName = 'workspace' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['registerOnDidChangeTextDocument', $.registerOnDidChangeTextDocument]
		]);
		export type WasmInterface = {
			'register-on-did-change-text-document': () => void;
		};
		export function createImports(service: example.Workspace, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Workspace {
			return $wcm.Exports.bind<example.Workspace>(functions, [], wasmInterface, context);
		}
	}

	export namespace WorkspaceEvents.$ {
		export const didChangeTextDocument = new $wcm.FunctionType<example.WorkspaceEvents.didChangeTextDocument>('did-change-text-document',[
			['uri', $wcm.wstring],
			['content', $wcm.wstring],
		], undefined);
	}
	export namespace WorkspaceEvents._ {
		export const id = 'vscode:example/workspace-events' as const;
		export const witName = 'workspace-events' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['didChangeTextDocument', $.didChangeTextDocument]
		]);
		export type WasmInterface = {
			'did-change-text-document': (uri_ptr: i32, uri_len: i32, content_ptr: i32, content_len: i32) => void;
		};
		export function createImports(service: example.WorkspaceEvents, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.WorkspaceEvents {
			return $wcm.Exports.bind<example.WorkspaceEvents>(functions, [], wasmInterface, context);
		}
	}

	export namespace Commands.$ {
		export const register = new $wcm.FunctionType<example.Commands.register>('register',[
			['command', $wcm.wstring],
		], undefined);
	}
	export namespace Commands._ {
		export const id = 'vscode:example/commands' as const;
		export const witName = 'commands' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['register', $.register]
		]);
		export type WasmInterface = {
			'register': (command_ptr: i32, command_len: i32) => void;
		};
		export function createImports(service: example.Commands, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Commands {
			return $wcm.Exports.bind<example.Commands>(functions, [], wasmInterface, context);
		}
	}

	export namespace CommandsEvents.$ {
		export const execute = new $wcm.FunctionType<example.CommandsEvents.execute>('execute',[
			['command', $wcm.wstring],
		], undefined);
	}
	export namespace CommandsEvents._ {
		export const id = 'vscode:example/commands-events' as const;
		export const witName = 'commands-events' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['execute', $.execute]
		]);
		export type WasmInterface = {
			'execute': (command_ptr: i32, command_len: i32) => void;
		};
		export function createImports(service: example.CommandsEvents, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.CommandsEvents {
			return $wcm.Exports.bind<example.CommandsEvents>(functions, [], wasmInterface, context);
		}
	}
	export namespace calculator.$ {
		export const Operation = Types.$.Operation;
		export namespace Exports {
			export const calc = new $wcm.FunctionType<calculator.Exports['calc']>('calc',[
				['o', Operation],
			], $wcm.u32);
		}
	}
	export namespace calculator._ {
		export const id = 'vscode:example/calculator' as const;
		export const witName = 'calculator' as const;
		export namespace Imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Workspace', Workspace._],
				['Commands', Commands._],
				['Types', Types._],
				['Window', Window._]
			]);
		}
		export type Imports = {
			'vscode:example/workspace': example.Workspace._.WasmInterface;
			'vscode:example/commands': example.Commands._.WasmInterface;
			'vscode:example/types': example.Types._.WasmInterface;
			'vscode:example/window': example.Window._.WasmInterface;
		};
		export namespace Exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['calc', $.Exports.calc]
			]);
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['WorkspaceEvents', WorkspaceEvents._],
				['CommandsEvents', CommandsEvents._]
			]);
		}
		export type Exports = {
			'calc': (o_Operation_case: i32, o_Operation_0: i32, o_Operation_1: i32) => i32;
			'vscode:example/workspace-events#did-change-text-document': (uri_ptr: i32, uri_len: i32, content_ptr: i32, content_len: i32) => void;
			'vscode:example/commands-events#execute': (command_ptr: i32, command_len: i32) => void;
		};
		export function createImports(service: calculator.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['vscode:example/workspace'] = example.Workspace._.createImports(service.workspace, context);
			result['vscode:example/commands'] = example.Commands._.createImports(service.commands, context);
			result['vscode:example/types'] = example.Types._.createImports(service.types, context);
			result['vscode:example/window'] = example.Window._.createImports(service.window, context);
			return result;
		}
		export function bindExports(exports: Exports, context: $wcm.WasmContext): calculator.Exports {
			const result: calculator.Exports = Object.create(null);
			Object.assign(result, $wcm.Exports.bind(Exports.functions, undefined, exports, context));
			result.workspaceEvents = example.WorkspaceEvents._.bindExports(example.WorkspaceEvents._.filterExports(exports, context), context);
			result.commandsEvents = example.CommandsEvents._.bindExports(example.CommandsEvents._.filterExports(exports, context), context);
			return result;
		}
	}
}

export namespace example._ {
	export const id = 'vscode:example' as const;
	export const witName = 'example' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['Window', Window._],
		['Workspace', Workspace._],
		['WorkspaceEvents', WorkspaceEvents._],
		['Commands', Commands._],
		['CommandsEvents', CommandsEvents._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['calculator', calculator._],
	]);
}