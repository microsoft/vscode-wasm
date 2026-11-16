import { size } from './baseTypes';

export function read(content: Uint8Array, offset: number, buffers: Uint8Array[]): size {
	let totalBytesRead = 0;
	for (const buffer of buffers) {
		const toRead = Math.min(buffer.length, content.byteLength - offset);
		buffer.set(content.subarray(offset, offset + toRead));
		totalBytesRead += toRead;
		if (toRead < buffer.length) {
			break;
		}
		offset += toRead;
	}
	return totalBytesRead;
}

export function write(content: Uint8Array, offset: number, buffers: Uint8Array[]): [Uint8Array, size] {
	let bytesToWrite: size = 0;
	for (const bytes of buffers) {
		bytesToWrite += bytes.byteLength;
	}

	const newSize = offset + bytesToWrite;

	// Do we need to increase the buffer
	if (newSize > content.byteLength) {
		interface ResizeableArrayBuffer extends ArrayBuffer {
			resize: (newByteLength: number) => void;
			maxByteLength: number;
		}
		//Utilize ECMAScript 2024 In-Place Resizable ArrayBuffers

		const buffer = content.buffer as ResizeableArrayBuffer;
		const oldSize = buffer.maxByteLength;

		if(newSize < oldSize){
			buffer.resize(newSize);
		} else {
			const newBuffer = new (ArrayBuffer as any)(newSize, { maxByteLength: Math.max(newSize, oldSize << 1) });
			const newContent = new Uint8Array(newBuffer);
			newContent.set(content);
			content = newContent;
		}
	}

	for (const bytes of buffers) {
		content.set(bytes, offset);
		offset += bytes.length;
	}

	return [content, bytesToWrite];
}