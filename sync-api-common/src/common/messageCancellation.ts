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
 *
 * Note that due to its nature synchronous message sending provided by
 * the `ClientConnection` and the `ServiceConnection` classes can't be canceled
 * since the sending site of a message is blocked.
 */
interface MessageWithCancellationData {
	$cancellationData: SharedArrayBuffer;
}

export namespace Cancellation {
	/**
	 * Adds cancellation data to a message. Such a message is usually send via
	 * `MessagePort.postMessage` to another web worker using a *asynchronous*
	 * message channel. The function is therefore called on the sending side
	 * of a message.
	 *
	 * The cancellation data is stored using the property `$cancellationData`
	 * on the provided message object.
	 *
	 * @param message The message to add cancellation data to.
	 * @returns A function when called cancels the message.
	 */
	export function addData(message: object): () => void {
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

	/**
	 * Return for the given message a function that if call indicates whether
	 * the message got canceled or not. The necessary cancellation data is
	 * expected to be stored under the property `$cancellationData` and must
	 * be of type `SharedArrayBuffer`. The function is usually called on the
	 * receiving side of a message.

	 * @param message The given message.
	 * @returns a function to check if the message got canceled.
	 */
	export function retrieveCheck(message: object): () => boolean {
		const candidate = message as MessageWithCancellationData;
		if (!(candidate.$cancellationData instanceof SharedArrayBuffer)) {
			return () => false;
		}
		const typedArray = new Int32Array(candidate.$cancellationData, 0, 1);
		return () => {
			return Atomics.load(typedArray, 0) === 1;
		};
	}
}