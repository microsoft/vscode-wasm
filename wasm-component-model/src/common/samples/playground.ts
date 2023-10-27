/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export enum TestEnum2 {
	a = 'a',
	b = 'b',
	c = 'c'
}

let x = TestEnum2.a;
if (typeof x === 'string') {
	x = TestEnum2.b;
}


type Modes = number;
export namespace AccessType {
	export type Access = { readonly tag: typeof AccessType.access; readonly value: Modes };
	export type Exists = { readonly tag: typeof AccessType.exists };
}
export const AccessType = {
	access: 'access' as const,
	exists: 'exists' as const,

	Access: (mode: Modes): AccessType.Access => {
		return Object.freeze({ tag: AccessType.access, value: mode });
	},

	Exists: (): AccessType.Exists => {
		return { tag: AccessType.exists };
	}
};
export type AccessType = AccessType.Access | AccessType.Exists;

let a: AccessType = {} as any;

if (a.tag === AccessType.access) {
	a.value;
} else if (a.tag === AccessType.exists) {
}


export const DescriptorFlags = Object.freeze({
	/**
	 * Read mode: Data can be read.
	 */
	read: 1 << 0,
	/**
	 * Write mode: Data can be written to.
	 */
	write: 1 << 1,
	/**
	 * Request that writes be performed according to synchronized I/O file
     * integrity completion. The data stored in the file and the file's
     * metadata are synchronized. This is similar to `O_SYNC` in POSIX.
     *
     * The precise semantics of this operation have not yet been defined for
     * WASI. At this time, it should be interpreted as a request, and not a
     * requirement.
	 */
	fileIntegritySync: 1 << 2,
	/**
     * Request that writes be performed according to synchronized I/O data
     * integrity completion. Only the data stored in the file is
     * synchronized. This is similar to `O_DSYNC` in POSIX.
     *
     * The precise semantics of this operation have not yet been defined for
     * WASI. At this time, it should be interpreted as a request, and not a
     * requirement.
	 */
	dataIntegritySync: 1 << 3,
	/**
     * Requests that reads be performed at the same level of integrety
     * requested for writes. This is similar to `O_RSYNC` in POSIX.
     *
     * The precise semantics of this operation have not yet been defined for
     * WASI. At this time, it should be interpreted as a request, and not a
     * requirement.
	 */
	requestedWriteSync: 1 << 4,
	/**
     * Mutating directories mode: Directory contents may be mutated.
     *
     * When this flag is unset on a descriptor, operations using the
     * descriptor which would create, rename, delete, modify the data or
     * metadata of filesystem objects, or obtain another handle which
     * would permit any of those, shall fail with `error-code::read-only` if
     * they would otherwise succeed.
     *
     * This may only be set on directories.
	 */
	mutateDirectory: 1 << 5
});