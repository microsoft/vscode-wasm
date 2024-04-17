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

		export namespace GlobPattern {
			export const pattern = 'pattern' as const;
			export type Pattern = { readonly tag: typeof pattern; readonly value: string } & _common;
			export function Pattern(value: string): Pattern {
				return new VariantImpl(pattern, value) as Pattern;
			}

			export type _tt = typeof pattern;
			export type _vt = string;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): GlobPattern {
				return new VariantImpl(t, v) as GlobPattern;
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
				isPattern(): this is Pattern {
					return this._tag === GlobPattern.pattern;
				}
			}
		}
		export type GlobPattern = GlobPattern.Pattern;

		export type DocumentFilter = {
			language?: string | undefined;
			scheme?: string | undefined;
			notebookType?: string | undefined;
			pattern?: GlobPattern | undefined;
		};

		export namespace DocumentSelector {
			export const many = 'many' as const;
			export type Many = { readonly tag: typeof many; readonly value: DocumentFilter[] } & _common;
			export function Many(value: DocumentFilter[]): Many {
				return new VariantImpl(many, value) as Many;
			}

			export const single = 'single' as const;
			export type Single = { readonly tag: typeof single; readonly value: DocumentFilter } & _common;
			export function Single(value: DocumentFilter): Single {
				return new VariantImpl(single, value) as Single;
			}

			export type _tt = typeof many | typeof single;
			export type _vt = DocumentFilter[] | DocumentFilter;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): DocumentSelector {
				return new VariantImpl(t, v) as DocumentSelector;
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
				isMany(): this is Many {
					return this._tag === DocumentSelector.many;
				}
				isSingle(): this is Single {
					return this._tag === DocumentSelector.single;
				}
			}
		}
		export type DocumentSelector = DocumentSelector.Many | DocumentSelector.Single;

		export namespace TextDocument {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				uri(): string;

				languageId(): string;

				version(): u32;

				getText(): string;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
			export namespace imports {
				export interface Interface extends TextDocument.Interface {
					$drop(): void;
				}
			}
			export namespace exports {
				export interface Interface extends TextDocument.Interface {
					destructor(): void;
				}
			}
		}
		export type TextDocument = TextDocument.Interface;

		export namespace TextDocumentChangeEvent {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				document(): own<TextDocument>;

				contentChanges(): TextDocumentContentChangeEvent[];

				reason(): TextDocumentChangeReason | undefined;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
			export namespace imports {
				export interface Interface extends TextDocumentChangeEvent.Interface {
					$drop(): void;
				}
			}
			export namespace exports {
				export interface Interface extends TextDocumentChangeEvent.Interface {
					destructor(): void;
				}
			}
		}
		export type TextDocumentChangeEvent = TextDocumentChangeEvent.Interface;

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
			};
			export type Class = Statics & {
			};
			export namespace imports {
				export interface Interface extends OutputChannel.Interface {
					$drop(): void;
				}
			}
			export namespace exports {
				export interface Interface extends OutputChannel.Interface {
					destructor(): void;
				}
			}
		}
		export type OutputChannel = OutputChannel.Interface;
		export type Exports = {
			TextDocument: TextDocument.exports.Interface;
			TextDocumentChangeEvent: TextDocumentChangeEvent.exports.Interface;
			OutputChannel: OutputChannel.exports.Interface;
		}
	}
	export type Types = {
		TextDocument: Types.TextDocument.Class;
		TextDocumentChangeEvent: Types.TextDocumentChangeEvent.Class;
		OutputChannel: Types.OutputChannel.Class;
	};

	export namespace Commands {
		export type registerCommand = (command: string) => void;

		export type unregisterCommand = (command: string) => void;
	}
	export type Commands = {
		registerCommand: Commands.registerCommand;
		unregisterCommand: Commands.unregisterCommand;
	};

	export namespace Languages {
		export type DocumentSelector = api.Types.DocumentSelector;

		export type TextDocument = api.Types.TextDocument;

		export type matchSelector = (selector: DocumentSelector, document: own<TextDocument>) => u32;
	}
	export type Languages = {
		matchSelector: Languages.matchSelector;
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

		export type unregisterOnDidChangeTextDocument = () => void;
	}
	export type Workspace = {
		textDocuments: Workspace.textDocuments;
		registerOnDidChangeTextDocument: Workspace.registerOnDidChangeTextDocument;
		unregisterOnDidChangeTextDocument: Workspace.unregisterOnDidChangeTextDocument;
	};

	export namespace Callbacks {
		export type TextDocumentChangeEvent = api.Types.TextDocumentChangeEvent;

		export type didChangeTextDocument = (event: own<TextDocumentChangeEvent>) => void;

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
			languages: api.Languages;
		};
		export type Exports = {
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
		export const TextDocumentChangeEvent = new $wcm.ResourceType<api.Types.TextDocumentChangeEvent>('text-document-change-event', 'host:api/types/text-document-change-event');
		export const TextDocumentChangeEvent_Handle = new $wcm.ResourceHandleType('text-document-change-event');
		export const OutputChannel = new $wcm.ResourceType<api.Types.OutputChannel>('output-channel', 'host:api/types/output-channel');
		export const OutputChannel_Handle = new $wcm.ResourceHandleType('output-channel');
		export const GlobPattern = new $wcm.VariantType<api.Types.GlobPattern, api.Types.GlobPattern._tt, api.Types.GlobPattern._vt>([['pattern', $wcm.wstring]], api.Types.GlobPattern._ctor);
		export const DocumentFilter = new $wcm.RecordType<api.Types.DocumentFilter>([
			['language', new $wcm.OptionType<string>($wcm.wstring)],
			['scheme', new $wcm.OptionType<string>($wcm.wstring)],
			['notebookType', new $wcm.OptionType<string>($wcm.wstring)],
			['pattern', new $wcm.OptionType<api.Types.GlobPattern>(GlobPattern)],
		]);
		export const DocumentSelector = new $wcm.VariantType<api.Types.DocumentSelector, api.Types.DocumentSelector._tt, api.Types.DocumentSelector._vt>([['many', new $wcm.ListType<api.Types.DocumentFilter>(DocumentFilter)], ['single', DocumentFilter]], api.Types.DocumentSelector._ctor);
		TextDocument.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]text-document', [['inst', TextDocument]]));
		TextDocument.addMethod('uri', new $wcm.MethodType<api.Types.TextDocument.Interface['uri']>('[method]text-document.uri', [], $wcm.wstring));
		TextDocument.addMethod('languageId', new $wcm.MethodType<api.Types.TextDocument.Interface['languageId']>('[method]text-document.language-id', [], $wcm.wstring));
		TextDocument.addMethod('version', new $wcm.MethodType<api.Types.TextDocument.Interface['version']>('[method]text-document.version', [], $wcm.u32));
		TextDocument.addMethod('getText', new $wcm.MethodType<api.Types.TextDocument.Interface['getText']>('[method]text-document.get-text', [], $wcm.wstring));
		TextDocumentChangeEvent.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]text-document-change-event', [['inst', TextDocumentChangeEvent]]));
		TextDocumentChangeEvent.addMethod('document', new $wcm.MethodType<api.Types.TextDocumentChangeEvent.Interface['document']>('[method]text-document-change-event.document', [], new $wcm.OwnType<api.Types.TextDocument>(TextDocument)));
		TextDocumentChangeEvent.addMethod('contentChanges', new $wcm.MethodType<api.Types.TextDocumentChangeEvent.Interface['contentChanges']>('[method]text-document-change-event.content-changes', [], new $wcm.ListType<api.Types.TextDocumentContentChangeEvent>(TextDocumentContentChangeEvent)));
		TextDocumentChangeEvent.addMethod('reason', new $wcm.MethodType<api.Types.TextDocumentChangeEvent.Interface['reason']>('[method]text-document-change-event.reason', [], new $wcm.OptionType<api.Types.TextDocumentChangeReason>(TextDocumentChangeReason)));
		OutputChannel.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]output-channel', [['inst', OutputChannel]]));
		OutputChannel.addMethod('name', new $wcm.MethodType<api.Types.OutputChannel.Interface['name']>('[method]output-channel.name', [], $wcm.wstring));
		OutputChannel.addMethod('append', new $wcm.MethodType<api.Types.OutputChannel.Interface['append']>('[method]output-channel.append', [
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addMethod('appendLine', new $wcm.MethodType<api.Types.OutputChannel.Interface['appendLine']>('[method]output-channel.append-line', [
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addMethod('clear', new $wcm.MethodType<api.Types.OutputChannel.Interface['clear']>('[method]output-channel.clear', [], undefined));
		OutputChannel.addMethod('show', new $wcm.MethodType<api.Types.OutputChannel.Interface['show']>('[method]output-channel.show', [], undefined));
	}
	export namespace Types._ {
		export const id = 'host:api/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Position', $.Position],
			['Range', $.Range],
			['TextDocumentContentChangeEvent', $.TextDocumentContentChangeEvent],
			['TextDocumentChangeReason', $.TextDocumentChangeReason],
			['GlobPattern', $.GlobPattern],
			['DocumentFilter', $.DocumentFilter],
			['DocumentSelector', $.DocumentSelector],
			['TextDocument', $.TextDocument],
			['TextDocumentChangeEvent', $.TextDocumentChangeEvent],
			['OutputChannel', $.OutputChannel]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TextDocument', $.TextDocument],
			['TextDocumentChangeEvent', $.TextDocumentChangeEvent],
			['OutputChannel', $.OutputChannel]
		]);
		export namespace TextDocument {
			export type WasmInterface = {
				'[method]text-document.uri': (self: i32, result: ptr<string>) => void;
				'[method]text-document.language-id': (self: i32, result: ptr<string>) => void;
				'[method]text-document.version': (self: i32) => i32;
				'[method]text-document.get-text': (self: i32, result: ptr<string>) => void;
			};
			export type ObjectModule = {
				uri(self: TextDocument): string;
				languageId(self: TextDocument): string;
				version(self: TextDocument): u32;
				getText(self: TextDocument): string;
			};
			export namespace imports {
				export type WasmInterface = TextDocument.WasmInterface & { '[resource-drop]text-document': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = TextDocument.WasmInterface & { '[dtor]text-document': (self: i32) => void };
				export type ObjectModule = TextDocument.ObjectModule & { $destructor(self: TextDocument): void };
				class Impl extends $wcm.Resource implements api.Types.TextDocument.Interface {
					private readonly _om: ObjectModule;
					constructor(om: ObjectModule) {
						super();
						this._om = om;
					}
					public $destructor(): void {
						return this._om.$destructor(this);
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
					return class extends Impl {
						constructor() {
							super(om);
						}
					};
				}
			}
		}
		export namespace TextDocumentChangeEvent {
			export type WasmInterface = {
				'[method]text-document-change-event.document': (self: i32) => i32;
				'[method]text-document-change-event.content-changes': (self: i32, result: ptr<TextDocumentContentChangeEvent[]>) => void;
				'[method]text-document-change-event.reason': (self: i32, result: ptr<TextDocumentChangeReason | undefined>) => void;
			};
			export type ObjectModule = {
				document(self: TextDocumentChangeEvent): own<TextDocument>;
				contentChanges(self: TextDocumentChangeEvent): TextDocumentContentChangeEvent[];
				reason(self: TextDocumentChangeEvent): TextDocumentChangeReason | undefined;
			};
			export namespace imports {
				export type WasmInterface = TextDocumentChangeEvent.WasmInterface & { '[resource-drop]text-document-change-event': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = TextDocumentChangeEvent.WasmInterface & { '[dtor]text-document-change-event': (self: i32) => void };
				export type ObjectModule = TextDocumentChangeEvent.ObjectModule & { $destructor(self: TextDocumentChangeEvent): void };
				class Impl extends $wcm.Resource implements api.Types.TextDocumentChangeEvent.Interface {
					private readonly _om: ObjectModule;
					constructor(om: ObjectModule) {
						super();
						this._om = om;
					}
					public $destructor(): void {
						return this._om.$destructor(this);
					}
					public document(): own<TextDocument> {
						return this._om.document(this);
					}
					public contentChanges(): TextDocumentContentChangeEvent[] {
						return this._om.contentChanges(this);
					}
					public reason(): TextDocumentChangeReason | undefined {
						return this._om.reason(this);
					}
				}
				export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Types.TextDocumentChangeEvent.Class {
					const resource = api.Types.$.TextDocumentChangeEvent;
					const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
					return class extends Impl {
						constructor() {
							super(om);
						}
					};
				}
			}
		}
		export namespace OutputChannel {
			export type WasmInterface = {
				'[method]output-channel.name': (self: i32, result: ptr<string>) => void;
				'[method]output-channel.append': (self: i32, value_ptr: i32, value_len: i32) => void;
				'[method]output-channel.append-line': (self: i32, value_ptr: i32, value_len: i32) => void;
				'[method]output-channel.clear': (self: i32) => void;
				'[method]output-channel.show': (self: i32) => void;
			};
			export type ObjectModule = {
				name(self: OutputChannel): string;
				append(self: OutputChannel, value: string): void;
				appendLine(self: OutputChannel, value: string): void;
				clear(self: OutputChannel): void;
				show(self: OutputChannel): void;
			};
			export namespace imports {
				export type WasmInterface = OutputChannel.WasmInterface & { '[resource-drop]output-channel': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = OutputChannel.WasmInterface & { '[dtor]output-channel': (self: i32) => void };
				export type ObjectModule = OutputChannel.ObjectModule & { $destructor(self: OutputChannel): void };
				class Impl extends $wcm.Resource implements api.Types.OutputChannel.Interface {
					private readonly _om: ObjectModule;
					constructor(om: ObjectModule) {
						super();
						this._om = om;
					}
					public $destructor(): void {
						return this._om.$destructor(this);
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
					return class extends Impl {
						constructor() {
							super(om);
						}
					};
				}
			}
		}
		export type WasmInterface = {
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & TextDocument.imports.WasmInterface & TextDocumentChangeEvent.imports.WasmInterface & OutputChannel.imports.WasmInterface;
			export function create(service: api.Types, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Imports.create<WasmInterface>(undefined, resources, service, context);
			}
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & TextDocument.exports.WasmInterface & TextDocumentChangeEvent.exports.WasmInterface & OutputChannel.exports.WasmInterface;
			export function filter(exports: object, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Exports.filter<WasmInterface>(exports, undefined, resources, id, undefined, context);
			}
			const resources = [['TextDocument', $.TextDocument, TextDocument.exports.Class], ['TextDocumentChangeEvent', $.TextDocumentChangeEvent, TextDocumentChangeEvent.exports.Class], ['OutputChannel', $.OutputChannel, OutputChannel.exports.Class]];
			export function bind(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Types {
				return $wcm.Exports.bind<api.Types>(undefined, resources, wasmInterface, context);
			}
			export function loop(wasmInterface: _.imports.WasmInterface, context: $wcm.WasmContext): api.Types {
				return $wcm.Exports.loop<api.Types>(undefined, resources, wasmInterface, context);
			}
		}
	}

	export namespace Commands.$ {
		export const registerCommand = new $wcm.FunctionType<api.Commands.registerCommand>('register-command',[
			['command', $wcm.wstring],
		], undefined);
		export const unregisterCommand = new $wcm.FunctionType<api.Commands.unregisterCommand>('unregister-command',[
			['command', $wcm.wstring],
		], undefined);
	}
	export namespace Commands._ {
		export const id = 'host:api/commands' as const;
		export const witName = 'commands' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['registerCommand', $.registerCommand],
			['unregisterCommand', $.unregisterCommand]
		]);
		export type WasmInterface = {
			'register-command': (command_ptr: i32, command_len: i32) => void;
			'unregister-command': (command_ptr: i32, command_len: i32) => void;
		};
		export namespace imports {
			export WasmInterface = _.WasmInterface;
			export function create(service: api.Commands, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
			}
		}
		export namespace exports {
			export WasmInterface = _.WasmInterface;
			export function filter(exports: object, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
			}
			const resources = [];
			export function bind(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Commands {
				return $wcm.Exports.bind<api.Commands>(functions, resources, wasmInterface, context);
			}
			export function loop(wasmInterface: _.imports.WasmInterface, context: $wcm.WasmContext): api.Commands {
				return $wcm.Exports.loop<api.Commands>(functions, resources, wasmInterface, context);
			}
		}
	}

	export namespace Languages.$ {
		export const DocumentSelector = api.Types.$.DocumentSelector;
		export const TextDocument = api.Types.$.TextDocument;
		export const matchSelector = new $wcm.FunctionType<api.Languages.matchSelector>('match-selector',[
			['selector', DocumentSelector],
			['document', new $wcm.OwnType<api.Languages.TextDocument>(TextDocument)],
		], $wcm.u32);
	}
	export namespace Languages._ {
		export const id = 'host:api/languages' as const;
		export const witName = 'languages' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['DocumentSelector', $.DocumentSelector],
			['TextDocument', $.TextDocument]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['matchSelector', $.matchSelector]
		]);
		export type WasmInterface = {
			'match-selector': (selector_DocumentSelector_case: i32, selector_DocumentSelector_0: i32, selector_DocumentSelector_1: i32, selector_DocumentSelector_2: i32, selector_DocumentSelector_3: i32, selector_DocumentSelector_4: i32, selector_DocumentSelector_5: i32, selector_DocumentSelector_6: i32, selector_DocumentSelector_7: i32, selector_DocumentSelector_8: i32, selector_DocumentSelector_9: i32, selector_DocumentSelector_10: i32, selector_DocumentSelector_11: i32, selector_DocumentSelector_12: i32, document: i32) => i32;
		};
		export namespace imports {
			export WasmInterface = _.WasmInterface;
			export function create(service: api.Languages, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
			}
		}
		export namespace exports {
			export WasmInterface = _.WasmInterface;
			export function filter(exports: object, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
			}
			const resources = [];
			export function bind(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Languages {
				return $wcm.Exports.bind<api.Languages>(functions, resources, wasmInterface, context);
			}
			export function loop(wasmInterface: _.imports.WasmInterface, context: $wcm.WasmContext): api.Languages {
				return $wcm.Exports.loop<api.Languages>(functions, resources, wasmInterface, context);
			}
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
		export namespace imports {
			export WasmInterface = _.WasmInterface;
			export function create(service: api.Window, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
			}
		}
		export namespace exports {
			export WasmInterface = _.WasmInterface;
			export function filter(exports: object, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
			}
			const resources = [];
			export function bind(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Window {
				return $wcm.Exports.bind<api.Window>(functions, resources, wasmInterface, context);
			}
			export function loop(wasmInterface: _.imports.WasmInterface, context: $wcm.WasmContext): api.Window {
				return $wcm.Exports.loop<api.Window>(functions, resources, wasmInterface, context);
			}
		}
	}

	export namespace Workspace.$ {
		export const TextDocument = api.Types.$.TextDocument;
		export const textDocuments = new $wcm.FunctionType<api.Workspace.textDocuments>('text-documents', [], new $wcm.ListType<own<api.Workspace.TextDocument>>(new $wcm.OwnType<api.Workspace.TextDocument>(TextDocument)));
		export const registerOnDidChangeTextDocument = new $wcm.FunctionType<api.Workspace.registerOnDidChangeTextDocument>('register-on-did-change-text-document', [], undefined);
		export const unregisterOnDidChangeTextDocument = new $wcm.FunctionType<api.Workspace.unregisterOnDidChangeTextDocument>('unregister-on-did-change-text-document', [], undefined);
	}
	export namespace Workspace._ {
		export const id = 'host:api/workspace' as const;
		export const witName = 'workspace' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TextDocument', $.TextDocument]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['textDocuments', $.textDocuments],
			['registerOnDidChangeTextDocument', $.registerOnDidChangeTextDocument],
			['unregisterOnDidChangeTextDocument', $.unregisterOnDidChangeTextDocument]
		]);
		export type WasmInterface = {
			'text-documents': (result: ptr<own<TextDocument>[]>) => void;
			'register-on-did-change-text-document': () => void;
			'unregister-on-did-change-text-document': () => void;
		};
		export namespace imports {
			export WasmInterface = _.WasmInterface;
			export function create(service: api.Workspace, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
			}
		}
		export namespace exports {
			export WasmInterface = _.WasmInterface;
			export function filter(exports: object, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
			}
			const resources = [];
			export function bind(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Workspace {
				return $wcm.Exports.bind<api.Workspace>(functions, resources, wasmInterface, context);
			}
			export function loop(wasmInterface: _.imports.WasmInterface, context: $wcm.WasmContext): api.Workspace {
				return $wcm.Exports.loop<api.Workspace>(functions, resources, wasmInterface, context);
			}
		}
	}

	export namespace Callbacks.$ {
		export const TextDocumentChangeEvent = api.Types.$.TextDocumentChangeEvent;
		export const didChangeTextDocument = new $wcm.FunctionType<api.Callbacks.didChangeTextDocument>('did-change-text-document',[
			['event', new $wcm.OwnType<api.Callbacks.TextDocumentChangeEvent>(TextDocumentChangeEvent)],
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
			'did-change-text-document': (event: i32) => void;
			'execute-command': (command_ptr: i32, command_len: i32) => void;
		};
		export namespace imports {
			export WasmInterface = _.WasmInterface;
			export function create(service: api.Callbacks, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
			}
		}
		export namespace exports {
			export WasmInterface = _.WasmInterface;
			export function filter(exports: object, context: $wcm.WasmContext): WasmInterface {
				return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, undefined, context);
			}
			const resources = [];
			export function bind(wasmInterface: WasmInterface, context: $wcm.WasmContext): api.Callbacks {
				return $wcm.Exports.bind<api.Callbacks>(functions, resources, wasmInterface, context);
			}
			export function loop(wasmInterface: _.imports.WasmInterface, context: $wcm.WasmContext): api.Callbacks {
				return $wcm.Exports.loop<api.Callbacks>(functions, resources, wasmInterface, context);
			}
		}
	}
	export namespace all.$ {
	}
	export namespace all._ {
		export const id = 'host:api/all' as const;
		export const witName = 'all' as const;
		export namespace imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Types', Types._],
				['Workspace', Workspace._],
				['Commands', Commands._],
				['Window', Window._],
				['Languages', Languages._]
			]);
			export function create(service: all.Imports, context: $wcm.WasmContext): Imports {
				const result: Imports = Object.create(null);
				result['host:api/types'] = api.Types._.imports.create(service.types, context);
				result['host:api/workspace'] = api.Workspace._.imports.create(service.workspace, context);
				result['host:api/commands'] = api.Commands._.imports.create(service.commands, context);
				result['host:api/window'] = api.Window._.imports.create(service.window, context);
				result['host:api/languages'] = api.Languages._.imports.create(service.languages, context);
				return result;
			}
		}
		export type Imports = {
			'host:api/types': api.Types._.imports.WasmInterface;
			'host:api/workspace': api.Workspace._.imports.WasmInterface;
			'host:api/commands': api.Commands._.imports.WasmInterface;
			'host:api/window': api.Window._.imports.WasmInterface;
			'host:api/languages': api.Languages._.imports.WasmInterface;
		};
		export namespace exports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Callbacks', Callbacks._]
			]);
			export function bind(exports: Exports, context: $wcm.WasmContext): all.Exports {
				const result: all.Exports = Object.create(null);
				result.callbacks = api.Callbacks._.exports.bind(api.Callbacks._.exports.filter(exports, context), context);
				return result;
			}
		}
		export type Exports = {
			'host:api/callbacks#did-change-text-document': (event: i32) => void;
			'host:api/callbacks#execute-command': (command_ptr: i32, command_len: i32) => void;
		};
	}
}

export namespace api._ {
	export const id = 'host:api' as const;
	export const witName = 'api' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['Commands', Commands._],
		['Languages', Languages._],
		['Window', Window._],
		['Workspace', Workspace._],
		['Callbacks', Callbacks._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['all', all._],
	]);
}