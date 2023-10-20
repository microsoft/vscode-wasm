### Enum

Component model enums (u32 value) should be mapped onto an integer number. Besides the number value a code generation tool should generate the following supporting JS structure

```js
const EnumName = {
	0: 'name of enum case at 0',
	1: 'name of enum case at 1',
	'name of enum case at 0': 0,
	'name of enum case at 1': 1
}
```

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

the support JS structure would look like this:

```js
export const DescriptorType = {
	0: "unknown",
	1: "blockDevice",
	2: "characterDevice",
	3: "directory",
	4: "fifo",
	5: "symbolicLink",
	6: "regularFile",
	7: "socket",
	unknown: 0,
	blockDevice: 1,
	characterDevice: 2,
	directory: 3,
	fifo: 4,
	symbolicLink: 5,
	regularFile: 6,
	socket: 7,
}

// Usage

let type = DescriptorType.blockDevice;
```

If TypeScript code is generated the following definition can be used

```TypeScript
export enum DescriptorType = {
	unknown = 0,
	blockDevice = 1,
	characterDevice = 2,
	directory = 3,
	fifo = 4,
	symbolicLink = 5,
	regularFile = 6,
	socket = 7,
}
```

### Variants

Component model variants are mapped onto an object literal with the following two properties:

- case: a number denoting the case of the variant
- value: carrying the value of the variant if there is any

Besides the object literal holding the value of the variant a code generation tool should generate a supporting structure as well. For the following Wit enum definition

```wit
/// Access type used by `access-at`.
variant access-type {
	/// Test for readability, writeability, or executability.
	access(modes),

	/// Test whether the path exists.
	exists,
}
```

the support JS structure would look like this:

```js
export const AccessType = {
	access: 0,
	exists: 1,
	0: "access",
	1: "exists",

	createAccess: (modes) => {
		return { case: AccessType.access, value: modes };
	},
	createExists: () => {
		return { case: AccessType.exists };
	}
}

// Usage

let accessType = AccessType.createExists();
....
if (acessType === AccessType.access) {
	....
}
```

If TypeScript code is generated the following definition can be used

```TypeScript
export namespace AccessType {
	export type access = { readonly case: typeof AccessType.access; readonly value: Modes };
	export type exists = { readonly case: typeof AccessType.exists };
}
export const AccessType = {
	access: 0 as const,
	exists: 1 as const,
	0: 'access',
	1: 'exists',

	createAccess: (mode: Modes): AccessType.access => {
		return { case: AccessType.access, value: mode };
	},

	createExists: (): AccessType.exists => {
		return { case: AccessType.exists };
	}
};
export type AccessType = AccessType.access | AccessType.exists;
```