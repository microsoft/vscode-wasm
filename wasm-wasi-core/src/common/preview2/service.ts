/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FunctionType, InterfaceType, JType, PackageType, Promisify, ResourceManager, UnionJType, WasmInterfaces } from '@vscode/wasm-component-model';
import RAL from '../ral';
import { Header, ParamRestore } from './connection';
import { FixedLinearMemory, ReadonlyMemory } from './memory';
import { http } from '@vscode/wasi';


export abstract class AbstractServiceConnection {

	private readonly interfaces: Promisify<WasmInterfaces>;
	private readonly decoder: RAL.TextDecoder;
	private readonly signatures: Map<string, Map<string, FunctionType<any>>> = new Map();

	constructor(interfaces: Promisify<WasmInterfaces>, metaTypes: (PackageType | InterfaceType)[]) {
		this.interfaces = interfaces;
		this.decoder = RAL().TextDecoder.create('utf-8');
		for (const metaType of metaTypes) {
			if (PackageType.is(metaType)) {
				for (const iface of metaType.interfaces.values()) {
					this.fillInterface(iface);
				}
			} else if (InterfaceType.is(metaType)) {
				this.fillInterface(metaType);
			}
		}
	}

	protected unpack(transfer: SharedArrayBuffer, data: SharedArrayBuffer): [string, string, FixedLinearMemory, ReadonlyMemory] {
		const [index] = Header.getReturn(new DataView(transfer));
		const transferMemory = new FixedLinearMemory(transfer, index);
		const dataMemory = new ReadonlyMemory(data);
		const [iface_ptr, iface_bytes] = Header.getIface(transferMemory.view);
		const ifaceName = this.decoder.decode(new Uint8Array(dataMemory.buffer, iface_ptr, iface_bytes));
		const [func_ptr, func_bytes] = Header.getIface(transferMemory.view);
		const funcName = this.decoder.decode(new Uint8Array(dataMemory.buffer, func_ptr, func_bytes));
		return [ifaceName, funcName, transferMemory, dataMemory];
	}

	protected async doCall(transfer: SharedArrayBuffer, data: SharedArrayBuffer): Promise<void> {
		const [ifaceName, funcName, transferMemory, dataMemory] = this.unpack(transfer, data);
		const func = this.interfaces[ifaceName][funcName];
		if (!func) {
			throw new Error(`Function ${ifaceName}/${funcName} not found`);
		}
		const signature = this.getSignature(ifaceName, funcName);
		if (!signature) {
			throw new Error(`Signature for ${ifaceName}/${funcName} not found`);
		}
		const params = new ParamRestore(signature, transferMemory).run();
		const result = await func.apply(undefined, params);
	}

	private fillInterface(iface: InterfaceType): void {
		const signatures = new Map<string, FunctionType<any>>();
		for (const func of iface.functions.values()) {
			signatures.set(func.witName, func);
		}
		this.signatures.set(iface.witName, signatures);
	}

	private getSignature(ifaceName: string, funcName: string): FunctionType<any> | undefined {
		const iface = this.signatures.get(ifaceName);
		if (iface !== undefined) {
			return iface.get(funcName);
		}
		return undefined;
	}
}


type ParamWasmFunction = (...params: (number | bigint)[]) => Promise<number | bigint | void>;
interface ParamWasmInterface {
	readonly [key: string]: ParamWasmFunction;
}

type ParamServiceFunction = (...params: UnionJType[]) => Promise<JType | void>;
type GenericConstructor<T> = (...args: any[]) => T;
interface ParamModuleInterface {
	readonly [key: string]: (ParamServiceFunction | ParamModuleInterface | ResourceManager<any> | GenericConstructor<any>);
}


export namespace Service {
	export function createHost<T extends ParamWasmInterface>(service: Promisify<http.Types.Fields>): T;
	export function createHost(service: any): any {
		return {};
	}
}

let s: http.Types.Fields = {} as any;
let sp: Promisify<http.Types.Fields> = {} as any;

const w = Service.createHost(s);
const wp = Service.createHost(sp);