## Mapping Wit types onto JavaScript / TypeScript types

To support interoperability between different component interfaces written in JavaScript / Typescript a standard should be established specifying how Wit types are to be mapped onto corresponding JavaScript / TypeScript files.

The mapping we should be idiomatic for both JavaScript and TypeScript programmers. Pure JavaScript programmers should be able to use the mappings intuitively without corresponding TypeScript declaration files.

For the following Wit types the mapping is straight forward and captured in the following table:

| Wit         | JavaScript | TypeScript declaration |
|-------------|------------|------------|
| u8 | number | type u8 = number; |
| u16 | number | type u16 = number; |
| u32 | number | type u32 = number; |
| u64 | bigint | type u64 = bigint; |
| s8 | number | type s8 = number; |
| s16 | number | type s16 = number; |
| s32 | number | type s32 = number; |
| s64 | bigint | type s64 = bigint; |
| float32 | number | type float32 = number; |
| float64 | number | type float64 = number; |
| bool | boolean |  boolean |
| string | string | string |
| char | string[0] | string |
| record | object literal | type declaration |
| list\<T\> | [] | Array\<T\>|
| tuple\<T1, T2\> | [] | [T1, T2] |
| option\<T\> | variable | ? and (T \| undefined) |
| result\<ok, err\> | ok & Error | ok & Error |

Enums, variants and flags need some supporting JavaScript / TypeScript code since they are not natively supported in JavaScript. The proposed code should be aligned whenever possible with existing efforts to standardize these types in JavaScript.

To determine an idiomatic implementation for these types I used the following data sources:

- usage of these programming constructs in [NodeJS](https://nodejs.org/en/docs) and the [standard libraries](https://developer.mozilla.org/en-US/)
- searching on public GitHub repositories to find implementation of the prgramming constructs
- asked ChatGPT 4 to generate JavaScript code for the construct in a JavaScript idiomatic way.

### Enum

Actually, enumerations are implemented in many ways on JavaScript. Typical approaches are:

- string literal
- object keys, were the value is either a string or number
- Symbols
- classes
- Proxies

String literals are mainly used in NodeJS and the standard libraries. You find all kind of implementation on GitHub. ChatGPT generated object keys with numbers as values.

To keep things idiomatic for JavaScript developers but sill have decent TypeScript and tooling support component model enums (u32 value) should be mapped onto a string value, where the valid values of the string value are the names of the enumeration fields. In addition a supporting JS structure must be generated that allows accessing the enumeration value using a key on an object literal. This ensures that:

- we have a place to add corresponding documentation of an enum field
- tools can support operations like hover, goto declaration, find all references

This mapping makes enumeration value types in JavaScript.

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

- tag/case: a string denoting the case of the variant. The component model uses case to refer to the variant case. However when writing code using tag might be more appropriate.
- value: carrying the value of the variant if there is any

To match the semantic of variants/enums in other programming languages the object literals should have value semantic (e.g. being immutable).

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
	/**
	 * Test for readability, writeability, or executability.
	 */
	access: 'access',
	/**
	 * Test whether the path exists.
	 */
	exists: 'exists',

	Access: (modes) => {
		return Object.freeze({ tag: AccessType.access, value: modes });
	},
	Exists: () => {
		return Object.freeze({ tag: AccessType.exists });
	}
}

// Usage

let accessType = AccessType.Exists();
....
if (accessType.tag === AccessType.access) {
	....
}
```

If TypeScript code is generated the following discriminated union definition can be used

```TypeScript
export namespace AccessType {
	export type Access = { readonly tag: typeof AccessType.access; readonly value: Modes };
	export type Exists = { readonly tag: typeof AccessType.exists };
}
export const AccessType = {
	/**
	 * Test for readability, writeability, or executability.
	 */
	access: 'access' as const,
	/**
	 * Test whether the path exists.
	 */
	exists: 'exists' as const,

	Access: (mode: Modes): AccessType.Access => {
		return Object.freeze({ kind: AccessType.access, value: mode });
	},

	Exists: (): AccessType.Exists => {
		return Object.freeze({ kind: AccessType.exists });
	}
};
export type AccessType = AccessType.Access | AccessType.Exists;
```

which when compile produces a nice d.ts file as well:

```TypeScript
export declare namespace AccessType {
    type Access = {
        readonly tag: typeof AccessType.access;
        readonly value: Modes;
    };
    type Exists = {
        readonly tag: typeof AccessType.exists;
    };
}
export declare const AccessType: {
	/**
	 * Test for readability, writeability, or executability.
	 */
    access: "access";
	/**
	 * Test whether the path exists.
	 */
    exists: "exists";
    Access: (mode: Modes) => AccessType.Access;
    Exists: () => AccessType.Exists;
};
export type AccessType = AccessType.Access | AccessType.Exists;
```

For variant cases that don't carry a value we could use a singleton and make that one a const declaration instead of providing a creator function. For the above example this would look like this:

```js
export const AccessType = {

	// as above

	Exists: Object.freeze({ tag: AccessType.exists })
}
```

However this would lead to inconsistencies when comparing variant cases. For the cases without value someone could write:

```js
let accessType = AccessType.Exists();
if (accessType === AccessType.Exists) {

}
```

which would do the correct checking since the object literals are identical. However it will not work for variant cases carrying a value since we would compare a object literal to a function.

To further ease the variant case checking we could generate additional checking functions on the variant literal. The TypeScript interfaces for this would look like this:

```typescript
export namespace AccessType {
	type common = {
		isAccess(): this is AccessType.Access;
		isExists(): this is AccessType.Exists;
	}
	export type Access = { readonly tag: typeof AccessType.access; readonly value: Modes } & common;
	export type Exists = { readonly tag: typeof AccessType.exists } & common;
}
```

Which then supports writing JavaScript and TypeScript code like this

```typescript
let accessType: AccessType = ...;
if (accessType.isAccess()) {
	accessType.value; // No compile error
} else if (accessType.isExists()) {
	accessType.value; // Compile error since exists has no value.
}
```

with the benefit of TypeScript providing correct error messages.

Implementation wise the variant would be implemented using a class instead of using a frozen object literal. However, this will have no impact on the user of the variant, especially not how a JavaScript developer can interact with it. There will still be a `tag` and a `value` property with direct access to it.

### Flags

Existing idiomatic usages of flags in JavaScript (see usage in NodeJS) seem to map flags onto the `number` type and use the provided bit operations (&, |, ~, <<, >>, ... ) to manipulate the bitset. Using the `number` type has also the advantage that flags will have value semantic out of the box.

Since JavaScript only supports bit operations on numbers on the lower 32 bits we need a solution for flags with more and 32 bits. Those should be mapped onto `bigint` which provides integers with unlimited size, including their corresponding bit operations. Besides the base type holding the value a code generation tool must generate a supporting JavaScript structure as well. For the following Wit variant definition

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
