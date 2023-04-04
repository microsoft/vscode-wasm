/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// NOTE: VSCode's copy of nodejs path library to be usable in common (non-node) namespace
// Copied from: https://github.com/nodejs/node/blob/v14.16.0/lib/path.js

/**
 * Copyright Joyent, Inc. and other Node contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const CHAR_DOT = 46; /* . */
const CHAR_FORWARD_SLASH = 47; /* / */

class ErrorInvalidArgType extends Error {
	code: 'ERR_INVALID_ARG_TYPE';
	constructor(name: string, expected: string, actual: unknown) {
		// determiner: 'must be' or 'must not be'
		let determiner;
		if (typeof expected === 'string' && expected.indexOf('not ') === 0) {
			determiner = 'must not be';
			expected = expected.replace(/^not /, '');
		} else {
			determiner = 'must be';
		}

		const type = name.indexOf('.') !== -1 ? 'property' : 'argument';
		let msg = `The "${name}" ${type} ${determiner} of type ${expected}`;

		msg += `. Received type ${typeof actual}`;
		super(msg);

		this.code = 'ERR_INVALID_ARG_TYPE';
	}
}

function validateString(value: string, name: string) {
	if (typeof value !== 'string') {
		throw new ErrorInvalidArgType(name, 'string', value);
	}
}

function isPosixPathSeparator(code: number | undefined) {
	return code === CHAR_FORWARD_SLASH;
}

// Resolves . and .. elements in a path with directory names
function normalizeString(path: string, allowAboveRoot: boolean, separator: string, isPathSeparator: (code?: number) => boolean) {
	let res = '';
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code = 0;
	for (let i = 0; i <= path.length; ++i) {
		if (i < path.length) {
			code = path.charCodeAt(i);
		}
		else if (isPathSeparator(code)) {
			break;
		}
		else {
			code = CHAR_FORWARD_SLASH;
		}

		if (isPathSeparator(code)) {
			if (lastSlash === i - 1 || dots === 1) {
				// NOOP
			} else if (dots === 2) {
				if (res.length < 2 || lastSegmentLength !== 2 ||
					res.charCodeAt(res.length - 1) !== CHAR_DOT ||
					res.charCodeAt(res.length - 2) !== CHAR_DOT) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf(separator);
						if (lastSlashIndex === -1) {
							res = '';
							lastSegmentLength = 0;
						} else {
							res = res.slice(0, lastSlashIndex);
							lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
						}
						lastSlash = i;
						dots = 0;
						continue;
					} else if (res.length !== 0) {
						res = '';
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					res += res.length > 0 ? `${separator}..` : '..';
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) {
					res += `${separator}${path.slice(lastSlash + 1, i)}`;
				}
				else {
					res = path.slice(lastSlash + 1, i);
				}
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === CHAR_DOT && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
}

export interface IPath {
	dirname(path: string): string;
	normalize(path: string): string;
	isAbsolute(path: string): boolean;
	join(...paths: string[]): string;
	basename(path: string, ext?: string): string;
	extname(path: string): string;
	sep: '/';
	delimiter: string;
}

export const posix: IPath = {

	normalize(path: string): string {
		validateString(path, 'path');

		if (path.length === 0) {
			return '.';
		}

		const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
		const trailingSeparator =
			path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;

		// Normalize the path
		path = normalizeString(path, !isAbsolute, '/', isPosixPathSeparator);

		if (path.length === 0) {
			if (isAbsolute) {
				return '/';
			}
			return trailingSeparator ? './' : '.';
		}
		if (trailingSeparator) {
			path += '/';
		}

		return isAbsolute ? `/${path}` : path;
	},

	isAbsolute(path: string): boolean {
		validateString(path, 'path');
		return path.length > 0 && path.charCodeAt(0) === CHAR_FORWARD_SLASH;
	},

	join(...paths: string[]): string {
		if (paths.length === 0) {
			return '.';
		}
		let joined;
		for (let i = 0; i < paths.length; ++i) {
			const arg = paths[i];
			validateString(arg, 'path');
			if (arg.length > 0) {
				if (joined === undefined) {
					joined = arg;
				} else {
					joined += `/${arg}`;
				}
			}
		}
		if (joined === undefined) {
			return '.';
		}
		return posix.normalize(joined);
	},

	dirname(path: string): string {
		validateString(path, 'path');
		if (path.length === 0) {
			return '.';
		}
		const hasRoot = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
		let end = -1;
		let matchedSlash = true;
		for (let i = path.length - 1; i >= 1; --i) {
			if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
				if (!matchedSlash) {
					end = i;
					break;
				}
			} else {
				// We saw the first non-path separator
				matchedSlash = false;
			}
		}

		if (end === -1) {
			return hasRoot ? '/' : '.';
		}
		if (hasRoot && end === 1) {
			return '//';
		}
		return path.slice(0, end);
	},

	basename(path: string, ext?: string): string {
		if (ext !== undefined) {
			validateString(ext, 'ext');
		}
		validateString(path, 'path');

		let start = 0;
		let end = -1;
		let matchedSlash = true;
		let i;

		if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
			if (ext === path) {
				return '';
			}
			let extIdx = ext.length - 1;
			let firstNonSlashEnd = -1;
			for (i = path.length - 1; i >= 0; --i) {
				const code = path.charCodeAt(i);
				if (code === CHAR_FORWARD_SLASH) {
					// If we reached a path separator that was not part of a set of path
					// separators at the end of the string, stop now
					if (!matchedSlash) {
						start = i + 1;
						break;
					}
				} else {
					if (firstNonSlashEnd === -1) {
						// We saw the first non-path separator, remember this index in case
						// we need it if the extension ends up not matching
						matchedSlash = false;
						firstNonSlashEnd = i + 1;
					}
					if (extIdx >= 0) {
						// Try to match the explicit extension
						if (code === ext.charCodeAt(extIdx)) {
							if (--extIdx === -1) {
								// We matched the extension, so mark this as the end of our path
								// component
								end = i;
							}
						} else {
							// Extension does not match, so our result is the entire path
							// component
							extIdx = -1;
							end = firstNonSlashEnd;
						}
					}
				}
			}

			if (start === end) {
				end = firstNonSlashEnd;
			} else if (end === -1) {
				end = path.length;
			}
			return path.slice(start, end);
		}
		for (i = path.length - 1; i >= 0; --i) {
			if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
				// If we reached a path separator that was not part of a set of path
				// separators at the end of the string, stop now
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else if (end === -1) {
				// We saw the first non-path separator, mark this as the end of our
				// path component
				matchedSlash = false;
				end = i + 1;
			}
		}

		if (end === -1) {
			return '';
		}
		return path.slice(start, end);
	},

	extname(path: string): string {
		validateString(path, 'path');
		let startDot = -1;
		let startPart = 0;
		let end = -1;
		let matchedSlash = true;
		// Track the state of characters (if any) we see before our first dot and
		// after any path separator we find
		let preDotState = 0;
		for (let i = path.length - 1; i >= 0; --i) {
			const code = path.charCodeAt(i);
			if (code === CHAR_FORWARD_SLASH) {
				// If we reached a path separator that was not part of a set of path
				// separators at the end of the string, stop now
				if (!matchedSlash) {
					startPart = i + 1;
					break;
				}
				continue;
			}
			if (end === -1) {
				// We saw the first non-path separator, mark this as the end of our
				// extension
				matchedSlash = false;
				end = i + 1;
			}
			if (code === CHAR_DOT) {
				// If this is our first dot, mark it as the start of our extension
				if (startDot === -1) {
					startDot = i;
				}
				else if (preDotState !== 1) {
					preDotState = 1;
				}
			} else if (startDot !== -1) {
				// We saw a non-dot and non-path separator before our dot, so we should
				// have a good chance at having a non-empty extension
				preDotState = -1;
			}
		}

		if (startDot === -1 ||
			end === -1 ||
			// We saw a non-dot character immediately before the dot
			preDotState === 0 ||
			// The (right-most) trimmed path component is exactly '..'
			(preDotState === 1 &&
				startDot === end - 1 &&
				startDot === startPart + 1)) {
			return '';
		}
		return path.slice(startDot, end);
	},

	sep: '/',
	delimiter: ':',
};

export const normalize = posix.normalize;
export const isAbsolute = posix.isAbsolute;
export const join = posix.join;
export const dirname = posix.dirname;
export const basename = posix.basename;
export const extname = posix.extname;
export const sep = posix.sep;
export const delimiter = posix.delimiter;