import * as $wcm from '@vscode/wasm-component-model';
import { types } from './types';

export namespace preopens {
	type descriptor = types.descriptor;
	
	/**
	 * Return the set of preopened directories, and their path.
	 */
	export declare function get_directories(): [descriptor, string][];
	export type get_directories = typeof get_directories;
	
	
	export namespace $cm {
		const $descriptor = types.$cm.$descriptor;
		export const $get_directories = new $wcm.FunctionType<get_directories>('get_directories', [], new $wcm.ListType<[descriptor, string]>(new $wcm.TupleType<[descriptor, string]>([$descriptor, $wcm.wstring])));
		export namespace $ {
			const allFunctions = [$get_directories];
			export function createHost<T extends $wcm.Host>(service: preopens, context: $wcm.Context): T {
				return $wcm.Host.create<T>(allFunctions, service, context);
			}
			export function createService<T extends preopens>(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): T {
				return $wcm.Service.create<T>(allFunctions, wasmInterface, context);
			}

		}
	}
}
export type preopens = Pick<typeof preopens, 'get_directories'>;