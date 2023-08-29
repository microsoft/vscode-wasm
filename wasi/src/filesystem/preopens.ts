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
		export const $get_directories = new $wcm.FunctionSignature<get_directories>('get_directories', [], new $wcm.ListType<[descriptor, string]>(new $wcm.TupleType<[descriptor, string]>([$descriptor, $wcm.wstring])));
	}
}
export type preopens = Pick<typeof preopens, 'get_directories'>;