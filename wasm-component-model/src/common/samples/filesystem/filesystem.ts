import * as $wcm from '../../componentModel';
import type { u64, option, u32, result, u8, flags } from '../../componentModel';
import { wall_clock } from '../clocks/main';
import { streams } from '../io/main';

export namespace filesystem {
        export type input_stream = streams.input_stream;
        export type output_stream = streams.output_stream;
        export type datetime = wall_clock.datetime;
        export type filesize = u64;
        export enum descriptor_type {
                unknown = 0,
                block_device = 1,
                character_device = 2,
                directory = 3,
                fifo = 4,
                symbolic_link = 5,
                regular_file = 6,
                socket = 7,
        }
        export type descriptor_flags = flags<'read' | 'write' | 'file_integrity_sync' | 'data_integrity_sync' | 'requested_write_sync' | 'mutate_directory'>;
        export interface descriptor_stat extends $wcm.JRecord {
                device: device;
                inode: inode;
                type: descriptor_type;
                link_count: link_count;
                size: filesize;
                data_access_timestamp: datetime;
                data_modification_timestamp: datetime;
                status_change_timestamp: datetime;
        }
        export type path_flags = flags<'symlink_follow'>;
        export type open_flags = flags<'create' | 'directory' | 'exclusive' | 'truncate'>;
        export type modes = flags<'readable' | 'writable' | 'executable'>;
        export namespace access_type {
                export const access = 0;
                export const exists = 1;
                export type _ct = typeof access | typeof exists;
                export type _vt = modes | undefined;
                type _common = Omit<VariantImpl, 'case' | 'value'>;
                export type access = { readonly case: typeof access; readonly value: modes } & _common;
                export type exists = { readonly case: typeof exists } & _common;
                export function _ctor(c: _ct, v: _vt): access_type {
                        return new VariantImpl(c, v) as access_type;
                }
                export function _access(value: modes): access {
                        return new VariantImpl(access, value) as access;
                }
                export function _exists(): exists {
                        return new VariantImpl(exists, undefined) as exists;
                }
                class VariantImpl {
                        private readonly _case: _ct;
                        private readonly _value?: _vt;
                        constructor(c: _ct, value: _vt) {
                                this._case = c;
                                this._value = value;
                        }
                        get case(): _ct {
                                return this._case;
                        }
                        get value(): _vt {
                                return this._value;
                        }
                        access(): this is access {
                                return this._case === access_type.access;
                        }
                        exists(): this is exists {
                                return this._case === access_type.exists;
                        }
                }
        }
        export type access_type = access_type.access | access_type.exists
        export type link_count = u64;
        export type device = u64;
        export type inode = u64;
        export namespace new_timestamp {
                export const no_change = 0;
                export const now = 1;
                export const timestamp = 2;
                export type _ct = typeof no_change | typeof now | typeof timestamp;
                export type _vt = datetime | undefined;
                type _common = Omit<VariantImpl, 'case' | 'value'>;
                export type no_change = { readonly case: typeof no_change } & _common;
                export type now = { readonly case: typeof now } & _common;
                export type timestamp = { readonly case: typeof timestamp; readonly value: datetime } & _common;
                export function _ctor(c: _ct, v: _vt): new_timestamp {
                        return new VariantImpl(c, v) as new_timestamp;
                }
                export function _no_change(): no_change {
                        return new VariantImpl(no_change, undefined) as no_change;
                }
                export function _now(): now {
                        return new VariantImpl(now, undefined) as now;
                }
                export function _timestamp(value: datetime): timestamp {
                        return new VariantImpl(timestamp, value) as timestamp;
                }
                class VariantImpl {
                        private readonly _case: _ct;
                        private readonly _value?: _vt;
                        constructor(c: _ct, value: _vt) {
                                this._case = c;
                                this._value = value;
                        }
                        get case(): _ct {
                                return this._case;
                        }
                        get value(): _vt {
                                return this._value;
                        }
                        no_change(): this is no_change {
                                return this._case === new_timestamp.no_change;
                        }
                        now(): this is now {
                                return this._case === new_timestamp.now;
                        }
                        timestamp(): this is timestamp {
                                return this._case === new_timestamp.timestamp;
                        }
                }
        }
        export type new_timestamp = new_timestamp.no_change | new_timestamp.now | new_timestamp.timestamp
        export interface directory_entry extends $wcm.JRecord {
                inode: option<inode>;
                type: descriptor_type;
                name: string;
        }
        export enum error_code {
                access = 0,
                would_block = 1,
                already = 2,
                bad_descriptor = 3,
                busy = 4,
                deadlock = 5,
                quota = 6,
                exist = 7,
                file_too_large = 8,
                illegal_byte_sequence = 9,
                in_progress = 10,
                interrupted = 11,
                invalid = 12,
                io = 13,
                is_directory = 14,
                loop = 15,
                too_many_links = 16,
                message_size = 17,
                name_too_long = 18,
                no_device = 19,
                no_entry = 20,
                no_lock = 21,
                insufficient_memory = 22,
                insufficient_space = 23,
                not_directory = 24,
                not_empty = 25,
                not_recoverable = 26,
                unsupported = 27,
                no_tty = 28,
                no_such_device = 29,
                overflow = 30,
                not_permitted = 31,
                pipe = 32,
                read_only = 33,
                invalid_seek = 34,
                text_file_busy = 35,
                cross_device = 36,
        }
        export enum advice {
                normal = 0,
                sequential = 1,
                random = 2,
                will_need = 3,
                dont_need = 4,
                no_reuse = 5,
        }
        export type descriptor = u32;
        export declare function read_via_stream($this: descriptor, offset: filesize): result<input_stream, error_code>;
        export declare function write_via_stream($this: descriptor, offset: filesize): result<output_stream, error_code>;
        export declare function append_via_stream($this: descriptor): result<output_stream, error_code>;
        export declare function advise($this: descriptor, offset: filesize, length: filesize, advice: advice): result<void, error_code>;
        export declare function sync_data($this: descriptor): result<void, error_code>;
        export declare function get_flags($this: descriptor): result<descriptor_flags, error_code>;
        export declare function get_type($this: descriptor): result<descriptor_type, error_code>;
        export declare function set_size($this: descriptor, size: filesize): result<void, error_code>;
        export declare function set_times($this: descriptor, data_access_timestamp: new_timestamp, data_modification_timestamp: new_timestamp): result<void, error_code>;
        export declare function read($this: descriptor, length: filesize, offset: filesize): result<[Uint8Array, boolean], error_code>;
        export declare function write($this: descriptor, buffer: Uint8Array, offset: filesize): result<filesize, error_code>;
        export declare function read_directory($this: descriptor): result<directory_entry_stream, error_code>;
        export declare function sync($this: descriptor): result<void, error_code>;
        export declare function create_directory_at($this: descriptor, path: string): result<void, error_code>;
        export declare function stat($this: descriptor): result<descriptor_stat, error_code>;
        export declare function stat_at($this: descriptor, path_flags: path_flags, path: string): result<descriptor_stat, error_code>;
        export declare function set_times_at($this: descriptor, path_flags: path_flags, path: string, data_access_timestamp: new_timestamp, data_modification_timestamp: new_timestamp): result<, error_code>;
        export declare function link_at($this: descriptor, old_path_flags: path_flags, old_path: string, new_descriptor: descriptor, new_path: string): result<, error_code>;
        export declare function open_at($this: descriptor, path_flags: path_flags, path: string, open_flags: open_flags, flags: descriptor_flags, modes: modes): result<descriptor, error_code>;
        export declare function readlink_at($this: descriptor, path: string): result<string, error_code>;
        export declare function remove_directory_at($this: descriptor, path: string): result<, error_code>;
        export declare function rename_at($this: descriptor, old_path: string, new_descriptor: descriptor, new_path: string): result<, error_code>;
        export declare function symlink_at($this: descriptor, old_path: string, new_path: string): result<, error_code>;
        export declare function access_at($this: descriptor, path_flags: path_flags, path: string, type: access_type): result<, error_code>;
        export declare function unlink_file_at($this: descriptor, path: string): result<, error_code>;
        export declare function change_file_permissions_at($this: descriptor, path_flags: path_flags, path: string, modes: modes): result<, error_code>;
        export declare function change_directory_permissions_at($this: descriptor, path_flags: path_flags, path: string, modes: modes): result<, error_code>;
        export declare function lock_shared($this: descriptor): result<, error_code>;
        export declare function lock_exclusive($this: descriptor): result<, error_code>;
        export declare function try_lock_shared($this: descriptor): result<, error_code>;
        export declare function try_lock_exclusive($this: descriptor): result<, error_code>;
        export declare function unlock($this: descriptor): result<, error_code>;
        export declare function drop_descriptor($this: descriptor): void;
        export type directory_entry_stream = u32;
        export declare function read_directory_entry($this: directory_entry_stream): result<option<directory_entry>, error_code>;
        export declare function drop_directory_entry_stream($this: directory_entry_stream): void;
        export namespace $cm {
                const $input_stream: $wcm.ComponentModelType<input_stream> = streams.$cm.$input_stream;
                const $output_stream: $wcm.ComponentModelType<output_stream> = streams.$cm.$output_stream;
                const $datetime: $wcm.ComponentModelType<datetime> = wall_clock.$cm.$datetime;
                export const $filesize: $wcm.ComponentModelType<filesize> = $wcm.u64;
                export const $descriptor_type: $wcm.ComponentModelType<descriptor_type> = new $wcm.EnumType<descriptor_type>(8);
                export const $descriptor_flags = $wcm.FlagsType<descriptor_flags>(['read', 'write', 'file_integrity_sync', 'data_integrity_sync', 'requested_write_sync', 'mutate_directory']);
                export const $descriptor_stat: $wcm.ComponentModelType<descriptor_stat> = new $wcm.RecordType<descriptor_stat>([
                        ['device', $device], ['inode', $inode], ['type', $descriptor_type], ['link_count', $link_count], ['size', $filesize], ['data_access_timestamp', $datetime], ['data_modification_timestamp', $datetime], ['status_change_timestamp', $datetime]
                ]);
                export const $path_flags = $wcm.FlagsType<path_flags>(['symlink_follow']);
                export const $open_flags = $wcm.FlagsType<open_flags>(['create', 'directory', 'exclusive', 'truncate']);
                export const $modes = $wcm.FlagsType<modes>(['readable', 'writable', 'executable']);
                export const $link_count: $wcm.ComponentModelType<link_count> = $wcm.u64;
                export const $device: $wcm.ComponentModelType<device> = $wcm.u64;
                export const $inode: $wcm.ComponentModelType<inode> = $wcm.u64;
                export const $directory_entry: $wcm.ComponentModelType<directory_entry> = new $wcm.RecordType<directory_entry>([
                        ['inode', ], ['type', $descriptor_type], ['name', $wcm.wstring]
                ]);
                export const $error_code: $wcm.ComponentModelType<error_code> = new $wcm.EnumType<error_code>(37);
                export const $advice: $wcm.ComponentModelType<advice> = new $wcm.EnumType<advice>(6);
                export const $descriptor: $wcm.ComponentModelType<descriptor> = $wcm.u32;
                export const $directory_entry_stream: $wcm.ComponentModelType<directory_entry_stream> = $wcm.u32;
                export const $read_via_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('read_via_stream', [
                        ['$this', $descriptor], ['offset', $filesize]
                ], new $wcm.ResultType<input_stream, error_code>($input_stream, $error_code));
                export const $write_via_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('write_via_stream', [
                        ['$this', $descriptor], ['offset', $filesize]
                ], new $wcm.ResultType<output_stream, error_code>($output_stream, $error_code));
                export const $append_via_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('append_via_stream', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<output_stream, error_code>($output_stream, $error_code));
                export const $advise: $wcm.FunctionSignature = new $wcm.FunctionSignature('advise', [
                        ['$this', $descriptor], ['offset', $filesize], ['length', $filesize], ['advice', $advice]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $sync_data: $wcm.FunctionSignature = new $wcm.FunctionSignature('sync_data', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $get_flags: $wcm.FunctionSignature = new $wcm.FunctionSignature('get_flags', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<descriptor_flags, error_code>($descriptor_flags, $error_code));
                export const $get_type: $wcm.FunctionSignature = new $wcm.FunctionSignature('get_type', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<descriptor_type, error_code>($descriptor_type, $error_code));
                export const $set_size: $wcm.FunctionSignature = new $wcm.FunctionSignature('set_size', [
                        ['$this', $descriptor], ['size', $filesize]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $set_times: $wcm.FunctionSignature = new $wcm.FunctionSignature('set_times', [
                        ['$this', $descriptor], ['data_access_timestamp', $new_timestamp], ['data_modification_timestamp', $new_timestamp]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $read: $wcm.FunctionSignature = new $wcm.FunctionSignature('read', [
                        ['$this', $descriptor], ['length', $filesize], ['offset', $filesize]
                ], new $wcm.ResultType<[Uint8Array, boolean], error_code>(new $wcm.TupleType<[Uint8Array, boolean]>([new $wcm.ListType<u8>($wcm.u8), $wcm.bool]), $error_code));
                export const $write: $wcm.FunctionSignature = new $wcm.FunctionSignature('write', [
                        ['$this', $descriptor], ['buffer', new $wcm.ListType<u8>($wcm.u8)], ['offset', $filesize]
                ], new $wcm.ResultType<filesize, error_code>($filesize, $error_code));
                export const $read_directory: $wcm.FunctionSignature = new $wcm.FunctionSignature('read_directory', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<directory_entry_stream, error_code>($directory_entry_stream, $error_code));
                export const $sync: $wcm.FunctionSignature = new $wcm.FunctionSignature('sync', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $create_directory_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('create_directory_at', [
                        ['$this', $descriptor], ['path', $wcm.wstring]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $stat: $wcm.FunctionSignature = new $wcm.FunctionSignature('stat', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<descriptor_stat, error_code>($descriptor_stat, $error_code));
                export const $stat_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('stat_at', [
                        ['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring]
                ], new $wcm.ResultType<descriptor_stat, error_code>($descriptor_stat, $error_code));
                export const $set_times_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('set_times_at', [
                        ['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['data_access_timestamp', $new_timestamp], ['data_modification_timestamp', $new_timestamp]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $link_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('link_at', [
                        ['$this', $descriptor], ['old_path_flags', $path_flags], ['old_path', $wcm.wstring], ['new_descriptor', $descriptor], ['new_path', $wcm.wstring]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $open_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('open_at', [
                        ['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['open_flags', $open_flags], ['flags', $descriptor_flags], ['modes', $modes]
                ], new $wcm.ResultType<descriptor, error_code>($descriptor, $error_code));
                export const $readlink_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('readlink_at', [
                        ['$this', $descriptor], ['path', $wcm.wstring]
                ], new $wcm.ResultType<string, error_code>($wcm.wstring, $error_code));
                export const $remove_directory_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('remove_directory_at', [
                        ['$this', $descriptor], ['path', $wcm.wstring]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $rename_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('rename_at', [
                        ['$this', $descriptor], ['old_path', $wcm.wstring], ['new_descriptor', $descriptor], ['new_path', $wcm.wstring]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $symlink_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('symlink_at', [
                        ['$this', $descriptor], ['old_path', $wcm.wstring], ['new_path', $wcm.wstring]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $access_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('access_at', [
                        ['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['type', $access_type]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $unlink_file_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('unlink_file_at', [
                        ['$this', $descriptor], ['path', $wcm.wstring]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $change_file_permissions_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('change_file_permissions_at', [
                        ['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['modes', $modes]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $change_directory_permissions_at: $wcm.FunctionSignature = new $wcm.FunctionSignature('change_directory_permissions_at', [
                        ['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['modes', $modes]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $lock_shared: $wcm.FunctionSignature = new $wcm.FunctionSignature('lock_shared', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $lock_exclusive: $wcm.FunctionSignature = new $wcm.FunctionSignature('lock_exclusive', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $try_lock_shared: $wcm.FunctionSignature = new $wcm.FunctionSignature('try_lock_shared', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $try_lock_exclusive: $wcm.FunctionSignature = new $wcm.FunctionSignature('try_lock_exclusive', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $unlock: $wcm.FunctionSignature = new $wcm.FunctionSignature('unlock', [
                        ['$this', $descriptor]
                ], new $wcm.ResultType<, error_code>(, $error_code));
                export const $drop_descriptor: $wcm.FunctionSignature = new $wcm.FunctionSignature('drop_descriptor', [
                        ['$this', $descriptor]
                ]);
                export const $read_directory_entry: $wcm.FunctionSignature = new $wcm.FunctionSignature('read_directory_entry', [
                        ['$this', $directory_entry_stream]
                ], new $wcm.ResultType<option<directory_entry>, error_code>(, $error_code));
                export const $drop_directory_entry_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('drop_directory_entry_stream', [
                        ['$this', $directory_entry_stream]
                ]);
        }
}
export type filesystem = Pick<typeof filesystem, 'read_via_stream' | 'write_via_stream' | 'append_via_stream' | 'advise' | 'sync_data' | 'get_flags' | 'get_type' | 'set_size' | 'set_times' | 'read' | 'write' | 'read_directory' | 'sync' | 'create_directory_at' | 'stat' | 'stat_at' | 'set_times_at' | 'link_at' | 'open_at' | 'readlink_at' | 'remove_directory_at' | 'rename_at' | 'symlink_at' | 'access_at' | 'unlink_file_at' | 'change_file_permissions_at' | 'change_directory_permissions_at' | 'lock_shared' | 'lock_exclusive' | 'try_lock_shared' | 'try_lock_exclusive' | 'unlock' | 'drop_descriptor' | 'read_directory_entry' | 'drop_directory_entry_stream'>;