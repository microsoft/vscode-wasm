### Enum

Component model enums (u32 value) should be mapped onto a string value, where the valid values of the string value are the names of the enumeration fields. In addition it is recommended to generate a supporting JS structure that allows accessing the enumeration value using an identifier instead of a literal string. The ensures that:

- we have a place to add corresponding documentation of an enum field
- tools can support operations like hover, goto declaration, find all references

For the following Wit enum definition

```wit
enum descriptor-type {
	/// The type of the descriptor or file is unknown or is different from
	/// any of the other types specified.
	unknown,
	/// The descriptor refers to a block device inode.
	block-device,
	/// The descriptor refers to a character device inode.
	character-device,
	/// The descriptor refers to a directory inode.
	directory,
	/// The descriptor refers to a named pipe.
	fifo,
	/// The file refers to a symbolic link inode.
	symbolic-link,
	/// The descriptor refers to a regular file inode.
	regular-file,
	/// The descriptor refers to a socket.
	socket,
}
```

the supporting JS structure would look like this:

```js
export const DescriptorType = Object.freeze({
	/**
	 * The type of the descriptor or file is unknown or is different from
	 * any of the other types specified.
	 */
	unknown: 'unknown',
	/**
	 * The descriptor refers to a block device inode.
	 */
	blockDevice: 'blockDevice',
	/**
	 * The descriptor refers to a character device inode.
	 */
	characterDevice: 'characterDevice',
	/**
	 * The descriptor refers to a directory inode.
	 */
	directory: 'directory',
	/**
	 * The file refers to a symbolic link inode.
	 */
	fifo: 'fifo',
	/**
	 * The descriptor refers to a regular file inode.
	 */
	symbolicLink: 'symbolicLink',
	/**
	 * The descriptor refers to a regular file inode.
	 */
	regularFile: 'regularFile',
	/**
	 * The descriptor refers to a socket.
	 */
	socket: 'socket'
});

// Usage

let type = DescriptorType.blockDevice;
```

If TypeScript code is generated the following definition can be used

```TypeScript
export enum DescriptorType = {
	unknown = 'unknown',
	blockDevice = 'blockDevice',
	characterDevice = 'characterDevice',
	directory = 'directory',
	fifo = 'fifo',
	symbolicLink = 'symbolicLink',
	regularFile = 'regularFile',
	socket = 'socket'
}
```
The JavaScript representation of such a TypeScript enumeration will be a string. So JavaScript developers are not forced to use any of the support structures.

### Variants

Component model variants are mapped onto an object literal with the following two properties:

- kind/case: a string denoting the case of the variant. The component model uses case to refer to the variant case. However when writing code using kind might be more appropriate.
- value: carrying the value of the variant if there is any

Besides the object literal holding the value of the variant a code generation tool should generate a supporting JavaScript structure as well. For the following Wit variant definition

```wit
/// Access type used by `access-at`.
variant access-type {
	/// Test for readability, writeability, or executability.
	access(modes),

	/// Test whether the path exists.
	exists,
}
```

the supporting JS structure would look like this:

```js
export const AccessType = {
	access: 'access',
	exists: 'exists',

	Access: (modes) => {
		return Object.freeze({ kind: AccessType.access, value: modes });
	},
	Exists: () => {
		return Object.freeze({ kind: AccessType.exists });
	}
}

// Usage

let accessType = AccessType.Exists();
....
if (accessType.kind === AccessType.access) {
	....
}
```

If TypeScript code is generated the following definition can be used

```TypeScript
export namespace AccessType {
	export type access = { readonly kind: typeof AccessType.access; readonly value: Modes };
	export type exists = { readonly kind: typeof AccessType.exists };
}
export const AccessType = {
	access: 'access' as const,
	exists: 'exists' as const,

	Access: (mode: Modes): AccessType.access => {
		return { kind: AccessType.access, value: mode };
	},

	Exists: (): AccessType.exists => {
		return { kind: AccessType.exists };
	}
};
export type AccessType = AccessType.access | AccessType.exists;
```

which when compile produces a nice d.ts file as well:

```TypeScript
export declare namespace AccessType {
    type access = {
        readonly case: typeof AccessType.access;
        readonly value: Modes;
    };
    type exists = {
        readonly case: typeof AccessType.exists;
    };
}
export declare const AccessType: {
    /**
     * The access type
     */
    access: "access";
    /**
     * The exists type
     */
    exists: "exists";
    Access: (mode: Modes) => AccessType.access;
    Exists: () => AccessType.exists;
};
export type AccessType = AccessType.access | AccessType.exists;
```

### Flags

Existing idiomatic usages of flags in JavaScript seem to map flags onto the `number` type and use the provided bit operations (&, |, ~, <<, >>, ... ) to manipulate the bitset. Using the `number` type has also the advantage that flags will have value semantic out of the box.

Since JavaScript only supports bit operations on numbers on the lower 32 bits we need a solution for flags with more and 32 bits. Those should be mapped onto `bigint` which provides integers with unlimited size, including their corresponding bit operations. Besides the base type holding the value a code generation tool should generate a supporting JavaScript structure as well. For the following Wit variant definition

```wit
/// Descriptor flags.
///
/// Note: This was called `fdflags` in earlier versions of WASI.
flags descriptor-flags {
    /// Read mode: Data can be read.
    read,
    /// Write mode: Data can be written to.
    write,
    /// Request that writes be performed according to synchronized I/O file
    /// integrity completion. The data stored in the file and the file's
    /// metadata are synchronized. This is similar to `O_SYNC` in POSIX.
    ///
    /// The precise semantics of this operation have not yet been defined for
    /// WASI. At this time, it should be interpreted as a request, and not a
    /// requirement.
    file-integrity-sync,
    /// Request that writes be performed according to synchronized I/O data
    /// integrity completion. Only the data stored in the file is
    /// synchronized. This is similar to `O_DSYNC` in POSIX.
    ///
    /// The precise semantics of this operation have not yet been defined for
    /// WASI. At this time, it should be interpreted as a request, and not a
    /// requirement.
    data-integrity-sync,
    /// Requests that reads be performed at the same level of integrety
    /// requested for writes. This is similar to `O_RSYNC` in POSIX.
    ///
    /// The precise semantics of this operation have not yet been defined for
    /// WASI. At this time, it should be interpreted as a request, and not a
    /// requirement.
    requested-write-sync,
    /// Mutating directories mode: Directory contents may be mutated.
    ///
    /// When this flag is unset on a descriptor, operations using the
    /// descriptor which would create, rename, delete, modify the data or
    /// metadata of filesystem objects, or obtain another handle which
    /// would permit any of those, shall fail with `error-code::read-only` if
    /// they would otherwise succeed.
    ///
    /// This may only be set on directories.
    mutate-directory,
}
```

the supporting JS structure would look like this

```JavaScript
/**
 * Descriptor flags.
 *
 * Note: This was called `fdflags` in earlier versions of WASI.
 */
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
```
