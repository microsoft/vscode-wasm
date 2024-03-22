/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, own, i32, ptr } from '@vscode/wasm-component-model';

export namespace api {
	export namespace Types {
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

	export namespace Commands {
		export type registerCommand = (command: string) => void;
	}
	export type Commands = {
		registerCommand: Commands.registerCommand;
	};

	export namespace Window {
		export type OutputChannel = api.Types.OutputChannel;

		export type createOutputChannel = (name: string, languageId: string | undefined) => own<OutputChannel>;
	}
	export type Window = {
		createOutputChannel: Window.createOutputChannel;
	};

	export namespace Workspace {
		export type TextDocument = api.Types.TextDocument;

		export type textDocuments = () => own<TextDocument>[];

		export type registerOnDidChangeTextDocument = () => void;
	}
	export type Workspace = {
		textDocuments: Workspace.textDocuments;
		registerOnDidChangeTextDocument: Workspace.registerOnDidChangeTextDocument;
	};

	export namespace Callbacks {
		export type TextDocumentChangeEvent = api.Types.TextDocumentChangeEvent;

		export type didChangeTextDocument = (id: string, event: TextDocumentChangeEvent) => void;

		export type executeCommand = (command: string) => void;
	}
	export type Callbacks = {
		didChangeTextDocument: Callbacks.didChangeTextDocument;
		executeCommand: Callbacks.executeCommand;
	};
	export namespace all {
		export type Imports = {
			types: api.Types;
			workspace: api.Workspace;
			commands: api.Commands;
			window: api.Window;
		};
		export type Exports = {
			activate: () => void;
			deactivate: () => void;
			callbacks: api.Callbacks;
		};
	}
}

export namespace api {
	export namespace Types.$ {
		export const Position = new $wcm.RecordType<api.Types.Position>([
			['line', $wcm.u32],
			['character', $wcm.u32],
		]);
		export const Range = new $wcm.RecordType<api.Types.Range>([
			['start', Position],
			['end', Position],
		]);
		export const TextDocumentContentChangeEvent = new $wcm.RecordType<api.Types.TextDocumentContentChangeEvent>([
			['range', Range],
			['rangeOffset', $wcm.u32],
			['rangeLength', $wcm.u32],
			['text', $wcm.wstring],
		]);
		export const TextDocument = new $wcm.ResourceType<api.Types.TextDocument>('text-document', 'host:api/types/text-document');
		export const TextDocument_Handle = new $wcm.ResourceHandleType('text-document');
		export const TextDocumentChangeReason = new $wcm.EnumType<api.Types.TextDocumentChangeReason>(['undo', 'redo']);
		export const TextDocumentChangeEvent = new $wcm.RecordType<api.Types.TextDocumentChangeEvent>([
			['document', new $wcm.OwnType<api.Types.TextDocument>(TextDocument)],
			['contentChanges', new $wcm.ListType<api.Types.TextDocumentContentChangeEvent>(TextDocumentContentChangeEvent)],
			['reason', new $wcm.OptionType<api.Types.TextDocumentChangeReason>(TextDocumentChangeReason)],
		]);
		export const OutputChannel = new $wcm.ResourceType<api.Types.OutputChannel>('output-channel', 'host:api/types/output-channel');
		export const OutputChannel_Handle = new $wcm.ResourceHandleType('output-channel');
		TextDocument.addMethod('uri', new $wcm.MethodType<api.Types.TextDocument.Interface['uri']>('[method]text-document.uri', [], $wcm.wstring));
		TextDocument.addMethod('languageId', new $wcm.MethodType<api.Types.TextDocument.Interface['languageId']>('[method]text-document.language-id', [], $wcm.wstring));
		TextDocument.addMethod('version', new $wcm.MethodType<api.Types.TextDocument.Interface['version']>('[method]text-document.version', [], $wcm.u32));
		TextDocument.addMethod('getText', new $wcm.MethodType<api.Types.TextDocument.Interface['getText']>('[method]text-document.get-text', [], $wcm.wstring));
		TextDocument.addDestructor('$drop', new $wcm.DestructorType<api.Types.TextDocument.Statics['$drop']>('[resource-drop]text-document', [['inst', TextDocument]]));
		OutputChannel.addMethod('name', new $wcm.MethodType<api.Types.OutputChannel.Interface['name']>('[method]output-channel.name', [], $wcm.wstring));
		OutputChannel.addMethod('append', new $wcm.MethodType<api.Types.OutputChannel.Interface['append']>('[method]output-channel.append', [
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addMethod('appendLine', new $wcm.MethodType<api.Types.OutputChannel.Interface['appendLine']>('[method]output-channel.append-line', [
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addMethod('clear', new $wcm.MethodType<api.Types.OutputChannel.Interface['clear']>('[method]output-channel.clear', [], undefined));
		OutputChannel.addMethod('show', new $wcm.MethodType<api.Types.OutputChannel.Interface['show']>('[method]output-channel.show', [], undefined));
		OutputChannel.addDestructor('$drop', new $wcm.DestructorType<api.Types.OutputChannel.Statics['$drop']>('[resource-drop]output-channel', [['inst', OutputChannel]]));
	}
	export namespace Types._ {
		export const id = 'host:api/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
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
			class Impl extends $wcm.Resource implements api.Types.TextDocument.Interface {
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
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Types.TextDocument.Class {
				const resource = api.Types.$.TextDocument;
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
			class Impl extends $wcm.Resource implements api.Types.OutputChannel.Interface {
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
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Types.OutputChannel.Class {
				const resource = api.Types.$.OutputChannel;
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
		export function createImports(service: api.Types, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(undefined, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, undefined, resources, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Types {
			return $wcm.Exports.bind<api.Types>(undefined, [['TextDocument', $.TextDocument, TextDocument.Class], ['OutputChannel', $.OutputChannel, OutputChannel.Class]], wasmInterface, context);
		}
	}

	export namespace Commands.$ {
		export const registerCommand = new $wcm.FunctionType<api.Commands.registerCommand>('register-command',[
			['command', $wcm.wstring],
		], undefined);
	}
	export namespace Commands._ {
		export const id = 'host:api/commands' as const;
		export const witName = 'commands' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['registerCommand', $.registerCommand]
		]);
		export type WasmInterface = {
			'register-command': (command_ptr: i32, command_len: i32) => void;
		};
		export function createImports(service: api.Commands, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Commands {
			return $wcm.Exports.bind<api.Commands>(functions, [], wasmInterface, context);
		}
	}

	export namespace Window.$ {
		export const OutputChannel = api.Types.$.OutputChannel;
		export const createOutputChannel = new $wcm.FunctionType<api.Window.createOutputChannel>('create-output-channel',[
			['name', $wcm.wstring],
			['languageId', new $wcm.OptionType<string>($wcm.wstring)],
		], new $wcm.OwnType<api.Window.OutputChannel>(OutputChannel));
	}
	export namespace Window._ {
		export const id = 'host:api/window' as const;
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
		export function createImports(service: api.Window, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Window {
			return $wcm.Exports.bind<api.Window>(functions, [], wasmInterface, context);
		}
	}

	export namespace Workspace.$ {
		export const TextDocument = api.Types.$.TextDocument;
		export const textDocuments = new $wcm.FunctionType<api.Workspace.textDocuments>('text-documents', [], new $wcm.ListType<own<api.Workspace.TextDocument>>(new $wcm.OwnType<api.Workspace.TextDocument>(TextDocument)));
		export const registerOnDidChangeTextDocument = new $wcm.FunctionType<api.Workspace.registerOnDidChangeTextDocument>('register-on-did-change-text-document', [], undefined);
	}
	export namespace Workspace._ {
		export const id = 'host:api/workspace' as const;
		export const witName = 'workspace' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TextDocument', $.TextDocument]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['textDocuments', $.textDocuments],
			['registerOnDidChangeTextDocument', $.registerOnDidChangeTextDocument]
		]);
		export type WasmInterface = {
			'text-documents': (result: ptr<own<TextDocument>[]>) => void;
			'register-on-did-change-text-document': () => void;
		};
		export function createImports(service: api.Workspace, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Workspace {
			return $wcm.Exports.bind<api.Workspace>(functions, [], wasmInterface, context);
		}
	}

	export namespace Callbacks.$ {
		export const TextDocumentChangeEvent = api.Types.$.TextDocumentChangeEvent;
		export const didChangeTextDocument = new $wcm.FunctionType<api.Callbacks.didChangeTextDocument>('did-change-text-document',[
			['id', $wcm.wstring],
			['event', TextDocumentChangeEvent],
		], undefined);
		export const executeCommand = new $wcm.FunctionType<api.Callbacks.executeCommand>('execute-command',[
			['command', $wcm.wstring],
		], undefined);
	}
	export namespace Callbacks._ {
		export const id = 'host:api/callbacks' as const;
		export const witName = 'callbacks' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TextDocumentChangeEvent', $.TextDocumentChangeEvent]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['didChangeTextDocument', $.didChangeTextDocument],
			['executeCommand', $.executeCommand]
		]);
		export type WasmInterface = {
			'did-change-text-document': (id_ptr: i32, id_len: i32, event_TextDocumentChangeEvent_document: i32, event_TextDocumentChangeEvent_contentChanges_ptr: i32, event_TextDocumentChangeEvent_contentChanges_len: i32, event_TextDocumentChangeEvent_reason_case: i32, event_TextDocumentChangeEvent_reason_option_TextDocumentChangeReason: i32) => void;
			'execute-command': (command_ptr: i32, command_len: i32) => void;
		};
		export function createImports(service: api.Callbacks, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Callbacks {
			return $wcm.Exports.bind<api.Callbacks>(functions, [], wasmInterface, context);
		}
	}
	export namespace all.$ {
		export namespace Exports {
			export const activate = new $wcm.FunctionType<all.Exports['activate']>('activate', [], undefined);
			export const deactivate = new $wcm.FunctionType<all.Exports['deactivate']>('deactivate', [], undefined);
		}
	}
	export namespace all._ {
		export const id = 'host:api/all' as const;
		export const witName = 'all' as const;
		export namespace Imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Types', Types._],
				['Workspace', Workspace._],
				['Commands', Commands._],
				['Window', Window._]
			]);
		}
		export type Imports = {
			'host:api/types': api.Types._.WasmInterface;
			'host:api/workspace': api.Workspace._.WasmInterface;
			'host:api/commands': api.Commands._.WasmInterface;
			'host:api/window': api.Window._.WasmInterface;
		};
		export namespace Exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['activate', $.Exports.activate],
				['deactivate', $.Exports.deactivate]
			]);
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Callbacks', Callbacks._]
			]);
		}
		export type Exports = {
			'activate': () => void;
			'deactivate': () => void;
			'host:api/callbacks#did-change-text-document': (id_ptr: i32, id_len: i32, event_TextDocumentChangeEvent_document: i32, event_TextDocumentChangeEvent_contentChanges_ptr: i32, event_TextDocumentChangeEvent_contentChanges_len: i32, event_TextDocumentChangeEvent_reason_case: i32, event_TextDocumentChangeEvent_reason_option_TextDocumentChangeReason: i32) => void;
			'host:api/callbacks#execute-command': (command_ptr: i32, command_len: i32) => void;
		};
		export function createImports(service: all.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['host:api/types'] = api.Types._.createImports(service.types, context);
			result['host:api/workspace'] = api.Workspace._.createImports(service.workspace, context);
			result['host:api/commands'] = api.Commands._.createImports(service.commands, context);
			result['host:api/window'] = api.Window._.createImports(service.window, context);
			return result;
		}
		export function bindExports(exports: Exports, context: $wcm.WasmContext): all.Exports {
			const result: all.Exports = Object.create(null);
			Object.assign(result, $wcm.Exports.bind(Exports.functions, undefined, exports, context));
			result.callbacks = api.Callbacks._.bindExports(api.Callbacks._.filterExports(exports, context), context);
			return result;
		}
	}
}

export namespace api._ {
	export const id = 'host:api' as const;
	export const witName = 'api' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['Commands', Commands._],
		['Window', Window._],
		['Workspace', Workspace._],
		['Callbacks', Callbacks._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['all', all._],
	]);
}