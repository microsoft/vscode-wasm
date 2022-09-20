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
 * Return for the given message a function that if call indicated whether
 * the message got canceled or not. The necessary cancellation data is
 * expected to be stored under the property `$cancellationData` and must
 * be of type `SharedArrayBuffer`.

 * @param message The given message.
 * @returns a function to check if the message got canceled.
 */
export function retrieveCancellationCheck(message: object): () => boolean {
	const candidate = message as MessageWithCancellationData;
	if (!(candidate instanceof SharedArrayBuffer)) {
		return () => false;
	}
	const typedArray = new Int32Array(candidate.$cancellationData, 0, 1);
	return () => {
		return Atomics.load(typedArray, 0) === 1;
	};
}