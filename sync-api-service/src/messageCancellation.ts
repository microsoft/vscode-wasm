/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/**
 * A message that carries a shared array buffer that is used for
 * cancellation that is based on polling. Such a message is only
 * useful in an environnement where:
 *
 * - sender and receiver can share memory (e.g. two workers).
 * - the receiver of the message doesn't yield.
 *
 * Otherwise cancellation should be implemented using a normal message sending
 * mechanism since it can support cancellation signals as well.
 */
export interface MessageWithCancellationData {
	$cancellationData: SharedArrayBuffer;
}

/**
 * Adds cancellation data to a message. Such a message is usually send via
 * `MessagePort.postMessage` to another web worker using a *asynchronous* message
 * channel. Note that due to its nature synchronous messages can't be canceled.
 *
 * The cancellation data is stored using the property `$cancellationData`
 * on the provided message object.
 *
 * @param message The message to add cancellation data to.
 * @returns A function when called cancels the message.
 */
export function addCancellationData(message: object): () => void {
	if ((message as MessageWithCancellationData).$cancellationData !== undefined) {
		throw new Error(`Message already has a property $cancellationData`);
	}
	const data = new SharedArrayBuffer(4);
	const typedArray = new Int32Array(data, 0, 1);
	typedArray[0] = 0;
	(message as MessageWithCancellationData).$cancellationData = data;

	return () => {
		Atomics.store(typedArray, 0, 1);
	};
}