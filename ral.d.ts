import type { Uri } from 'vscode';
interface _Path {
    dirname(path: string): string;
    normalize(path: string): string;
    isAbsolute(path: string): boolean;
    join(...paths: string[]): string;
    basename(path: string, ext?: string): string;
    extname(path: string): string;
    sep: string;
    delimiter: string;
}
interface RAL {
    readonly path: _Path;
    readonly webAssembly: {
        compile(uri: Uri): Promise<WebAssembly.Module>;
    };
}
declare function RAL(): RAL;
declare namespace RAL {
    type Path = _Path;
    function install(ral: RAL): void;
    function isInstalled(): boolean;
}
export default RAL;
