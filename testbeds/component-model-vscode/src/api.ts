/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
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
			export interface Interface extends $wcm.Resource {
				uri(): string;

				languageId(): string;

				version(): u32;

				getText(): string;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type TextDocument = TextDocument.Interface;

		export namespace OutputChannel {
			export interface Interface extends $wcm.Resource {
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

		export type didChangeTextDocument = (event: TextDocumentChangeEvent) => void;

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
		export namespace Imports {
			export type Promisified = $wcm.$imports.Promisify<Imports>;
		}
		export namespace imports {
			export type Promisify<T> = $wcm.$imports.Promisify<T>;
		}
		export type Exports = {
			activate: () => void;
			deactivate: () => void;
			callbacks: api.Callbacks;
		};
		export namespace Exports {
			export type Promisified = $wcm.$exports.Promisify<Exports>;
		}
		export namespace exports {
			export type Promisify<T> = $wcm.$exports.Promisify<T>;
		}
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
		TextDocument.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]text-document', [['inst', TextDocument]]));
		TextDocument.addMethod('uri', new $wcm.MethodType<api.Types.TextDocument.Interface['uri']>('[method]text-document.uri', [], $wcm.wstring));
		TextDocument.addMethod('languageId', new $wcm.MethodType<api.Types.TextDocument.Interface['languageId']>('[method]text-document.language-id', [], $wcm.wstring));
		TextDocument.addMethod('version', new $wcm.MethodType<api.Types.TextDocument.Interface['version']>('[method]text-document.version', [], $wcm.u32));
		TextDocument.addMethod('getText', new $wcm.MethodType<api.Types.TextDocument.Interface['getText']>('[method]text-document.get-text', [], $wcm.wstring));
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
		export namespace TextDocument {
			export type WasmInterface = {
				'[method]text-document.uri': (self: i32, result: ptr<string>) => void;
				'[method]text-document.language-id': (self: i32, result: ptr<string>) => void;
				'[method]text-document.version': (self: i32) => i32;
				'[method]text-document.get-text': (self: i32, result: ptr<string>) => void;
			};
			export namespace imports {
				export type WasmInterface = TextDocument.WasmInterface & { '[resource-drop]text-document': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = TextDocument.WasmInterface & { '[dtor]text-document': (self: i32) => void };
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
			export namespace imports {
				export type WasmInterface = OutputChannel.WasmInterface & { '[resource-drop]output-channel': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = OutputChannel.WasmInterface & { '[dtor]output-channel': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
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
		export type WasmInterface = {
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & TextDocument.imports.WasmInterface & OutputChannel.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & TextDocument.exports.WasmInterface & OutputChannel.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]text-document': (rep: i32) => i32;
					'[resource-rep]text-document': (handle: i32) => i32;
					'[resource-drop]text-document': (handle: i32) => void;
					'[resource-new]output-channel': (rep: i32) => i32;
					'[resource-rep]output-channel': (handle: i32) => i32;
					'[resource-drop]output-channel': (handle: i32) => void;
				};
			}
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
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
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
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['OutputChannel', $.OutputChannel]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['createOutputChannel', $.createOutputChannel]
		]);
		export type WasmInterface = {
			'create-output-channel': (name_ptr: i32, name_len: i32, languageId_case: i32, languageId_option_ptr: i32, languageId_option_len: i32) => i32;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
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
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
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
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace Callbacks.$ {
		export const TextDocumentChangeEvent = api.Types.$.TextDocumentChangeEvent;
		export const didChangeTextDocument = new $wcm.FunctionType<api.Callbacks.didChangeTextDocument>('did-change-text-document',[
			['event', TextDocumentChangeEvent],
		], undefined);
		export const executeCommand = new $wcm.FunctionType<api.Callbacks.executeCommand>('execute-command',[
			['command', $wcm.wstring],
		], undefined);
	}
	export namespace Callbacks._ {
		export const id = 'host:api/callbacks' as const;
		export const witName = 'callbacks' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['TextDocumentChangeEvent', $.TextDocumentChangeEvent]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['didChangeTextDocument', $.didChangeTextDocument],
			['executeCommand', $.executeCommand]
		]);
		export type WasmInterface = {
			'did-change-text-document': (event_TextDocumentChangeEvent_document: i32, event_TextDocumentChangeEvent_contentChanges_ptr: i32, event_TextDocumentChangeEvent_contentChanges_len: i32, event_TextDocumentChangeEvent_reason_case: i32, event_TextDocumentChangeEvent_reason_option_TextDocumentChangeReason: i32) => void;
			'execute-command': (command_ptr: i32, command_len: i32) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}
	export namespace all.$ {
		export namespace exports {
			export const activate = new $wcm.FunctionType<all.Exports['activate']>('activate', [], undefined);
			export const deactivate = new $wcm.FunctionType<all.Exports['deactivate']>('deactivate', [], undefined);
		}
	}
	export namespace all._ {
		export const id = 'host:api/all' as const;
		export const witName = 'all' as const;
		export namespace imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Types', Types._],
				['Workspace', Workspace._],
				['Commands', Commands._],
				['Window', Window._]
			]);
			export function create(service: all.Imports, context: $wcm.WasmContext): Imports {
				return $wcm.$imports.create<Imports>(_, service, context);
			}
			export function loop(service: all.Imports, context: $wcm.WasmContext): all.Imports {
				return $wcm.$imports.loop<all.Imports>(_, service, context);
			}
		}
		export type Imports = {
			'host:api/types': api.Types._.imports.WasmInterface;
			'host:api/workspace': api.Workspace._.imports.WasmInterface;
			'host:api/commands': api.Commands._.imports.WasmInterface;
			'host:api/window': api.Window._.imports.WasmInterface;
		};
		export namespace exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['activate', $.exports.activate],
				['deactivate', $.exports.deactivate]
			]);
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Callbacks', Callbacks._]
			]);
			export function bind(exports: Exports, context: $wcm.WasmContext): all.Exports {
				return $wcm.$exports.bind<all.Exports>(_, exports, context);
			}
		}
		export type Exports = {
			'activate': () => void;
			'deactivate': () => void;
			'host:api/callbacks#did-change-text-document': (event_TextDocumentChangeEvent_document: i32, event_TextDocumentChangeEvent_contentChanges_ptr: i32, event_TextDocumentChangeEvent_contentChanges_len: i32, event_TextDocumentChangeEvent_reason_case: i32, event_TextDocumentChangeEvent_reason_option_TextDocumentChangeReason: i32) => void;
			'host:api/callbacks#execute-command': (command_ptr: i32, command_len: i32) => void;
		};
		export function bind(service: all.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<all.Exports>;
		export function bind(service: all.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<all.Exports.Promisified>;
		export function bind(service: all.Imports | all.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<all.Exports> | Promise<all.Exports.Promisified> {
			return $wcm.$main.bind(_, service, code, portOrContext, context);
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