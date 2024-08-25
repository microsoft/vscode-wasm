/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u8, u16, u32, u64, i32, ptr, result, i64 } from '@vscode/wasm-component-model';
import { clocks } from './clocks';
import { io } from './io';

export namespace sockets {
	export namespace Network {
		/**
		 * Error codes.
		 * 
		 * In theory, every API can return any error code.
		 * In practice, API's typically only return the errors documented per API
		 * combined with a couple of errors that are always possible:
		 * - `unknown`
		 * - `access-denied`
		 * - `not-supported`
		 * - `out-of-memory`
		 * - `concurrency-conflict`
		 * 
		 * See each individual API for what the POSIX equivalents are. They sometimes differ per API.
		 */
		export enum ErrorCode {

			/**
			 * Unknown error
			 */
			unknown = 'unknown',

			/**
			 * Access denied.
			 * 
			 * POSIX equivalent: EACCES, EPERM
			 */
			accessDenied = 'accessDenied',

			/**
			 * The operation is not supported.
			 * 
			 * POSIX equivalent: EOPNOTSUPP
			 */
			notSupported = 'notSupported',

			/**
			 * One of the arguments is invalid.
			 * 
			 * POSIX equivalent: EINVAL
			 */
			invalidArgument = 'invalidArgument',

			/**
			 * Not enough memory to complete the operation.
			 * 
			 * POSIX equivalent: ENOMEM, ENOBUFS, EAI_MEMORY
			 */
			outOfMemory = 'outOfMemory',

			/**
			 * The operation timed out before it could finish completely.
			 */
			timeout = 'timeout',

			/**
			 * This operation is incompatible with another asynchronous operation that is already in progress.
			 * 
			 * POSIX equivalent: EALREADY
			 */
			concurrencyConflict = 'concurrencyConflict',

			/**
			 * Trying to finish an asynchronous operation that:
			 * - has not been started yet, or:
			 * - was already finished by a previous `finish-*` call.
			 * 
			 * Note: this is scheduled to be removed when `future`s are natively supported.
			 */
			notInProgress = 'notInProgress',

			/**
			 * The operation has been aborted because it could not be completed immediately.
			 * 
			 * Note: this is scheduled to be removed when `future`s are natively supported.
			 */
			wouldBlock = 'wouldBlock',

			/**
			 * The operation is not valid in the socket's current state.
			 */
			invalidState = 'invalidState',

			/**
			 * A new socket resource could not be created because of a system limit.
			 */
			newSocketLimit = 'newSocketLimit',

			/**
			 * A bind operation failed because the provided address is not an address that the `network` can bind to.
			 */
			addressNotBindable = 'addressNotBindable',

			/**
			 * A bind operation failed because the provided address is already in use or because there are no ephemeral ports available.
			 */
			addressInUse = 'addressInUse',

			/**
			 * The remote address is not reachable
			 */
			remoteUnreachable = 'remoteUnreachable',

			/**
			 * The TCP connection was forcefully rejected
			 */
			connectionRefused = 'connectionRefused',

			/**
			 * The TCP connection was reset.
			 */
			connectionReset = 'connectionReset',

			/**
			 * A TCP connection was aborted.
			 */
			connectionAborted = 'connectionAborted',

			/**
			 * The size of a datagram sent to a UDP socket exceeded the maximum
			 * supported size.
			 */
			datagramTooLarge = 'datagramTooLarge',

			/**
			 * Name does not exist or has no suitable associated IP addresses.
			 */
			nameUnresolvable = 'nameUnresolvable',

			/**
			 * A temporary failure in name resolution occurred.
			 */
			temporaryResolverFailure = 'temporaryResolverFailure',

			/**
			 * A permanent failure in name resolution occurred.
			 */
			permanentResolverFailure = 'permanentResolverFailure'
		}
		export namespace ErrorCode {
			export class Error_ extends $wcm.ResultError<ErrorCode> {
				constructor(value: ErrorCode) {
					super(value, `ErrorCode: ${value}`);
				}
			}
		}

		export enum IpAddressFamily {

			/**
			 * Similar to `AF_INET` in POSIX.
			 */
			ipv4 = 'ipv4',

			/**
			 * Similar to `AF_INET6` in POSIX.
			 */
			ipv6 = 'ipv6'
		}

		export type Ipv4Address = [u8, u8, u8, u8];

		export type Ipv6Address = [u16, u16, u16, u16, u16, u16, u16, u16];

		export namespace IpAddress {
			export const ipv4 = 'ipv4' as const;
			export type Ipv4 = { readonly tag: typeof ipv4; readonly value: Ipv4Address } & _common;
			export function Ipv4(value: Ipv4Address): Ipv4 {
				return new VariantImpl(ipv4, value) as Ipv4;
			}

			export const ipv6 = 'ipv6' as const;
			export type Ipv6 = { readonly tag: typeof ipv6; readonly value: Ipv6Address } & _common;
			export function Ipv6(value: Ipv6Address): Ipv6 {
				return new VariantImpl(ipv6, value) as Ipv6;
			}

			export type _tt = typeof ipv4 | typeof ipv6;
			export type _vt = Ipv4Address | Ipv6Address;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): IpAddress {
				return new VariantImpl(t, v) as IpAddress;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isIpv4(): this is Ipv4 {
					return this._tag === IpAddress.ipv4;
				}
				isIpv6(): this is Ipv6 {
					return this._tag === IpAddress.ipv6;
				}
			}
		}
		export type IpAddress = IpAddress.Ipv4 | IpAddress.Ipv6;

		export type Ipv4SocketAddress = {

			/**
			 * sin_port
			 */
			port: u16;

			/**
			 * sin_addr
			 */
			address: Ipv4Address;
		};

		export type Ipv6SocketAddress = {

			/**
			 * sin6_port
			 */
			port: u16;

			/**
			 * sin6_flowinfo
			 */
			flowInfo: u32;

			/**
			 * sin6_addr
			 */
			address: Ipv6Address;

			/**
			 * sin6_scope_id
			 */
			scopeId: u32;
		};

		export namespace IpSocketAddress {
			export const ipv4 = 'ipv4' as const;
			export type Ipv4 = { readonly tag: typeof ipv4; readonly value: Ipv4SocketAddress } & _common;
			export function Ipv4(value: Ipv4SocketAddress): Ipv4 {
				return new VariantImpl(ipv4, value) as Ipv4;
			}

			export const ipv6 = 'ipv6' as const;
			export type Ipv6 = { readonly tag: typeof ipv6; readonly value: Ipv6SocketAddress } & _common;
			export function Ipv6(value: Ipv6SocketAddress): Ipv6 {
				return new VariantImpl(ipv6, value) as Ipv6;
			}

			export type _tt = typeof ipv4 | typeof ipv6;
			export type _vt = Ipv4SocketAddress | Ipv6SocketAddress;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): IpSocketAddress {
				return new VariantImpl(t, v) as IpSocketAddress;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isIpv4(): this is Ipv4 {
					return this._tag === IpSocketAddress.ipv4;
				}
				isIpv6(): this is Ipv6 {
					return this._tag === IpSocketAddress.ipv6;
				}
			}
		}
		export type IpSocketAddress = IpSocketAddress.Ipv4 | IpSocketAddress.Ipv6;

		export namespace Network {
			export interface Interface extends $wcm.Resource {
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type Network = Network.Interface;
	}
	export type Network = {
	};

	/**
	 * This interface provides a value-export of the default network handle..
	 */
	export namespace InstanceNetwork {
		export type Network = sockets.Network.Network;

		/**
		 * Get a handle to the default network.
		 */
		export type instanceNetwork = () => Network;
	}
	export type InstanceNetwork = {
		instanceNetwork: InstanceNetwork.instanceNetwork;
	};

	export namespace IpNameLookup {
		export type Pollable = io.Poll.Pollable;

		export type Network = sockets.Network.Network;

		export type ErrorCode = sockets.Network.ErrorCode;
		export const ErrorCode = sockets.Network.ErrorCode;

		export type IpAddress = sockets.Network.IpAddress;
		export const IpAddress = sockets.Network.IpAddress;

		export namespace ResolveAddressStream {
			export interface Interface extends $wcm.Resource {
				/**
				 * Returns the next address from the resolver.
				 * 
				 * This function should be called multiple times. On each call, it will
				 * return the next address in connection order preference. If all
				 * addresses have been exhausted, this function returns `none`.
				 * 
				 * This function never returns IPv4-mapped IPv6 addresses.
				 * 
				 * # Typical errors
				 * - `name-unresolvable`:          Name does not exist or has no suitable associated IP addresses. (EAI_NONAME, EAI_NODATA, EAI_ADDRFAMILY)
				 * - `temporary-resolver-failure`: A temporary failure in name resolution occurred. (EAI_AGAIN)
				 * - `permanent-resolver-failure`: A permanent failure in name resolution occurred. (EAI_FAIL)
				 * - `would-block`:                A result is not available yet. (EWOULDBLOCK, EAGAIN)
				 *
				 * @throws ErrorCode.Error_
				 */
				resolveNextAddress(): IpAddress | undefined;

				/**
				 * Create a `pollable` which will resolve once the stream is ready for I/O.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(): Pollable;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type ResolveAddressStream = ResolveAddressStream.Interface;

		/**
		 * Resolve an internet host name to a list of IP addresses.
		 * 
		 * Unicode domain names are automatically converted to ASCII using IDNA encoding.
		 * If the input is an IP address string, the address is parsed and returned
		 * as-is without making any external requests.
		 * 
		 * See the wasi-socket proposal README.md for a comparison with getaddrinfo.
		 * 
		 * This function never blocks. It either immediately fails or immediately
		 * returns successfully with a `resolve-address-stream` that can be used
		 * to (asynchronously) fetch the results.
		 * 
		 * # Typical errors
		 * - `invalid-argument`: `name` is a syntactically invalid domain name or IP address.
		 * 
		 * # References:
		 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getaddrinfo.html>
		 * - <https://man7.org/linux/man-pages/man3/getaddrinfo.3.html>
		 * - <https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfo>
		 * - <https://man.freebsd.org/cgi/man.cgi?query=getaddrinfo&sektion=3>
		 *
		 * @throws ErrorCode.Error_
		 */
		export type resolveAddresses = (network: Network, name: string) => ResolveAddressStream;
	}
	export type IpNameLookup = {
		ResolveAddressStream: IpNameLookup.ResolveAddressStream.Class;
		resolveAddresses: IpNameLookup.resolveAddresses;
	};

	export namespace Tcp {
		export type InputStream = io.Streams.InputStream;

		export type OutputStream = io.Streams.OutputStream;

		export type Pollable = io.Poll.Pollable;

		export type Duration = clocks.MonotonicClock.Duration;

		export type Network = sockets.Network.Network;

		export type ErrorCode = sockets.Network.ErrorCode;
		export const ErrorCode = sockets.Network.ErrorCode;

		export type IpSocketAddress = sockets.Network.IpSocketAddress;
		export const IpSocketAddress = sockets.Network.IpSocketAddress;

		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		export const IpAddressFamily = sockets.Network.IpAddressFamily;

		export enum ShutdownType {

			/**
			 * Similar to `SHUT_RD` in POSIX.
			 */
			receive = 'receive',

			/**
			 * Similar to `SHUT_WR` in POSIX.
			 */
			send = 'send',

			/**
			 * Similar to `SHUT_RDWR` in POSIX.
			 */
			both = 'both'
		}

		export namespace TcpSocket {
			export interface Interface extends $wcm.Resource {
				/**
				 * Bind the socket to a specific network on the provided IP address and port.
				 * 
				 * If the IP address is zero (`0.0.0.0` in IPv4, `::` in IPv6), it is left to the implementation to decide which
				 * network interface(s) to bind to.
				 * If the TCP/UDP port is zero, the socket will be bound to a random free port.
				 * 
				 * Bind can be attempted multiple times on the same socket, even with
				 * different arguments on each iteration. But never concurrently and
				 * only as long as the previous bind failed. Once a bind succeeds, the
				 * binding can't be changed anymore.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:          The `local-address` has the wrong address family. (EAFNOSUPPORT, EFAULT on Windows)
				 * - `invalid-argument`:          `local-address` is not a unicast address. (EINVAL)
				 * - `invalid-argument`:          `local-address` is an IPv4-mapped IPv6 address. (EINVAL)
				 * - `invalid-state`:             The socket is already bound. (EINVAL)
				 * - `address-in-use`:            No ephemeral ports available. (EADDRINUSE, ENOBUFS on Windows)
				 * - `address-in-use`:            Address is already in use. (EADDRINUSE)
				 * - `address-not-bindable`:      `local-address` is not an address that the `network` can bind to. (EADDRNOTAVAIL)
				 * - `not-in-progress`:           A `bind` operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # Implementors note
				 * When binding to a non-zero port, this bind operation shouldn't be affected by the TIME_WAIT
				 * state of a recently closed socket on the same local address. In practice this means that the SO_REUSEADDR
				 * socket option should be set implicitly on all platforms, except on Windows where this is the default behavior
				 * and SO_REUSEADDR performs something different entirely.
				 * 
				 * Unlike in POSIX, in WASI the bind operation is async. This enables
				 * interactive WASI hosts to inject permission prompts. Runtimes that
				 * don't want to make use of this ability can simply call the native
				 * `bind` as part of either `start-bind` or `finish-bind`.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/bind.html>
				 * - <https://man7.org/linux/man-pages/man2/bind.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-bind>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=bind&sektion=2&format=html>
				 *
				 * @throws ErrorCode.Error_
				 */
				startBind(network: Network, localAddress: IpSocketAddress): void;

				/**
				 * @throws ErrorCode.Error_
				 */
				finishBind(): void;

				/**
				 * Connect to a remote endpoint.
				 * 
				 * On success:
				 * - the socket is transitioned into the `connected` state.
				 * - a pair of streams is returned that can be used to read & write to the connection
				 * 
				 * After a failed connection attempt, the socket will be in the `closed`
				 * state and the only valid action left is to `drop` the socket. A single
				 * socket can not be used to connect more than once.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:          The `remote-address` has the wrong address family. (EAFNOSUPPORT)
				 * - `invalid-argument`:          `remote-address` is not a unicast address. (EINVAL, ENETUNREACH on Linux, EAFNOSUPPORT on MacOS)
				 * - `invalid-argument`:          `remote-address` is an IPv4-mapped IPv6 address. (EINVAL, EADDRNOTAVAIL on Illumos)
				 * - `invalid-argument`:          The IP address in `remote-address` is set to INADDR_ANY (`0.0.0.0` / `::`). (EADDRNOTAVAIL on Windows)
				 * - `invalid-argument`:          The port in `remote-address` is set to 0. (EADDRNOTAVAIL on Windows)
				 * - `invalid-argument`:          The socket is already attached to a different network. The `network` passed to `connect` must be identical to the one passed to `bind`.
				 * - `invalid-state`:             The socket is already in the `connected` state. (EISCONN)
				 * - `invalid-state`:             The socket is already in the `listening` state. (EOPNOTSUPP, EINVAL on Windows)
				 * - `timeout`:                   Connection timed out. (ETIMEDOUT)
				 * - `connection-refused`:        The connection was forcefully rejected. (ECONNREFUSED)
				 * - `connection-reset`:          The connection was reset. (ECONNRESET)
				 * - `connection-aborted`:        The connection was aborted. (ECONNABORTED)
				 * - `remote-unreachable`:        The remote address is not reachable. (EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN, ENONET)
				 * - `address-in-use`:            Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE, EADDRNOTAVAIL on Linux, EAGAIN on BSD)
				 * - `not-in-progress`:           A connect operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # Implementors note
				 * The POSIX equivalent of `start-connect` is the regular `connect` syscall.
				 * Because all WASI sockets are non-blocking this is expected to return
				 * EINPROGRESS, which should be translated to `ok()` in WASI.
				 * 
				 * The POSIX equivalent of `finish-connect` is a `poll` for event `POLLOUT`
				 * with a timeout of 0 on the socket descriptor. Followed by a check for
				 * the `SO_ERROR` socket option, in case the poll signaled readiness.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/connect.html>
				 * - <https://man7.org/linux/man-pages/man2/connect.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-connect>
				 * - <https://man.freebsd.org/cgi/man.cgi?connect>
				 *
				 * @throws ErrorCode.Error_
				 */
				startConnect(network: Network, remoteAddress: IpSocketAddress): void;

				/**
				 * @throws ErrorCode.Error_
				 */
				finishConnect(): [InputStream, OutputStream];

				/**
				 * Start listening for new connections.
				 * 
				 * Transitions the socket into the `listening` state.
				 * 
				 * Unlike POSIX, the socket must already be explicitly bound.
				 * 
				 * # Typical errors
				 * - `invalid-state`:             The socket is not bound to any local address. (EDESTADDRREQ)
				 * - `invalid-state`:             The socket is already in the `connected` state. (EISCONN, EINVAL on BSD)
				 * - `invalid-state`:             The socket is already in the `listening` state.
				 * - `address-in-use`:            Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE)
				 * - `not-in-progress`:           A listen operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # Implementors note
				 * Unlike in POSIX, in WASI the listen operation is async. This enables
				 * interactive WASI hosts to inject permission prompts. Runtimes that
				 * don't want to make use of this ability can simply call the native
				 * `listen` as part of either `start-listen` or `finish-listen`.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/listen.html>
				 * - <https://man7.org/linux/man-pages/man2/listen.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-listen>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=listen&sektion=2>
				 *
				 * @throws ErrorCode.Error_
				 */
				startListen(): void;

				/**
				 * @throws ErrorCode.Error_
				 */
				finishListen(): void;

				/**
				 * Accept a new client socket.
				 * 
				 * The returned socket is bound and in the `connected` state. The following properties are inherited from the listener socket:
				 * - `address-family`
				 * - `keep-alive-enabled`
				 * - `keep-alive-idle-time`
				 * - `keep-alive-interval`
				 * - `keep-alive-count`
				 * - `hop-limit`
				 * - `receive-buffer-size`
				 * - `send-buffer-size`
				 * 
				 * On success, this function returns the newly accepted client socket along with
				 * a pair of streams that can be used to read & write to the connection.
				 * 
				 * # Typical errors
				 * - `invalid-state`:      Socket is not in the `listening` state. (EINVAL)
				 * - `would-block`:        No pending connections at the moment. (EWOULDBLOCK, EAGAIN)
				 * - `connection-aborted`: An incoming connection was pending, but was terminated by the client before this listener could accept it. (ECONNABORTED)
				 * - `new-socket-limit`:   The new socket resource could not be created because of a system limit. (EMFILE, ENFILE)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/accept.html>
				 * - <https://man7.org/linux/man-pages/man2/accept.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-accept>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=accept&sektion=2>
				 *
				 * @throws ErrorCode.Error_
				 */
				accept(): [TcpSocket, InputStream, OutputStream];

				/**
				 * Get the bound local address.
				 * 
				 * POSIX mentions:
				 * > If the socket has not been bound to a local name, the value
				 * > stored in the object pointed to by `address` is unspecified.
				 * 
				 * WASI is stricter and requires `local-address` to return `invalid-state` when the socket hasn't been bound yet.
				 * 
				 * # Typical errors
				 * - `invalid-state`: The socket is not bound to any local address.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getsockname.html>
				 * - <https://man7.org/linux/man-pages/man2/getsockname.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getsockname>
				 * - <https://man.freebsd.org/cgi/man.cgi?getsockname>
				 *
				 * @throws ErrorCode.Error_
				 */
				localAddress(): IpSocketAddress;

				/**
				 * Get the remote address.
				 * 
				 * # Typical errors
				 * - `invalid-state`: The socket is not connected to a remote address. (ENOTCONN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getpeername.html>
				 * - <https://man7.org/linux/man-pages/man2/getpeername.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getpeername>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=getpeername&sektion=2&n=1>
				 *
				 * @throws ErrorCode.Error_
				 */
				remoteAddress(): IpSocketAddress;

				/**
				 * Whether the socket is in the `listening` state.
				 * 
				 * Equivalent to the SO_ACCEPTCONN socket option.
				 */
				isListening(): boolean;

				/**
				 * Whether this is a IPv4 or IPv6 socket.
				 * 
				 * Equivalent to the SO_DOMAIN socket option.
				 */
				addressFamily(): IpAddressFamily;

				/**
				 * Hints the desired listen queue size. Implementations are free to ignore this.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * Any other value will never cause an error, but it might be silently clamped and/or rounded.
				 * 
				 * # Typical errors
				 * - `not-supported`:        (set) The platform does not support changing the backlog size after the initial listen.
				 * - `invalid-argument`:     (set) The provided value was 0.
				 * - `invalid-state`:        (set) The socket is in the `connect-in-progress` or `connected` state.
				 *
				 * @throws ErrorCode.Error_
				 */
				setListenBacklogSize(value: u64): void;

				/**
				 * Enables or disables keepalive.
				 * 
				 * The keepalive behavior can be adjusted using:
				 * - `keep-alive-idle-time`
				 * - `keep-alive-interval`
				 * - `keep-alive-count`
				 * These properties can be configured while `keep-alive-enabled` is false, but only come into effect when `keep-alive-enabled` is true.
				 * 
				 * Equivalent to the SO_KEEPALIVE socket option.
				 *
				 * @throws ErrorCode.Error_
				 */
				keepAliveEnabled(): boolean;

				/**
				 * @throws ErrorCode.Error_
				 */
				setKeepAliveEnabled(value: boolean): void;

				/**
				 * Amount of time the connection has to be idle before TCP starts sending keepalive packets.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * Any other value will never cause an error, but it might be silently clamped and/or rounded.
				 * I.e. after setting a value, reading the same setting back may return a different value.
				 * 
				 * Equivalent to the TCP_KEEPIDLE socket option. (TCP_KEEPALIVE on MacOS)
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The provided value was 0.
				 *
				 * @throws ErrorCode.Error_
				 */
				keepAliveIdleTime(): Duration;

				/**
				 * @throws ErrorCode.Error_
				 */
				setKeepAliveIdleTime(value: Duration): void;

				/**
				 * The time between keepalive packets.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * Any other value will never cause an error, but it might be silently clamped and/or rounded.
				 * I.e. after setting a value, reading the same setting back may return a different value.
				 * 
				 * Equivalent to the TCP_KEEPINTVL socket option.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The provided value was 0.
				 *
				 * @throws ErrorCode.Error_
				 */
				keepAliveInterval(): Duration;

				/**
				 * @throws ErrorCode.Error_
				 */
				setKeepAliveInterval(value: Duration): void;

				/**
				 * The maximum amount of keepalive packets TCP should send before aborting the connection.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * Any other value will never cause an error, but it might be silently clamped and/or rounded.
				 * I.e. after setting a value, reading the same setting back may return a different value.
				 * 
				 * Equivalent to the TCP_KEEPCNT socket option.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The provided value was 0.
				 *
				 * @throws ErrorCode.Error_
				 */
				keepAliveCount(): u32;

				/**
				 * @throws ErrorCode.Error_
				 */
				setKeepAliveCount(value: u32): void;

				/**
				 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The TTL value must be 1 or higher.
				 *
				 * @throws ErrorCode.Error_
				 */
				hopLimit(): u8;

				/**
				 * @throws ErrorCode.Error_
				 */
				setHopLimit(value: u8): void;

				/**
				 * The kernel buffer space reserved for sends/receives on this socket.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * Any other value will never cause an error, but it might be silently clamped and/or rounded.
				 * I.e. after setting a value, reading the same setting back may return a different value.
				 * 
				 * Equivalent to the SO_RCVBUF and SO_SNDBUF socket options.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The provided value was 0.
				 *
				 * @throws ErrorCode.Error_
				 */
				receiveBufferSize(): u64;

				/**
				 * @throws ErrorCode.Error_
				 */
				setReceiveBufferSize(value: u64): void;

				/**
				 * @throws ErrorCode.Error_
				 */
				sendBufferSize(): u64;

				/**
				 * @throws ErrorCode.Error_
				 */
				setSendBufferSize(value: u64): void;

				/**
				 * Create a `pollable` which can be used to poll for, or block on,
				 * completion of any of the asynchronous operations of this socket.
				 * 
				 * When `finish-bind`, `finish-listen`, `finish-connect` or `accept`
				 * return `error(would-block)`, this pollable can be used to wait for
				 * their success or failure, after which the method can be retried.
				 * 
				 * The pollable is not limited to the async operation that happens to be
				 * in progress at the time of calling `subscribe` (if any). Theoretically,
				 * `subscribe` only has to be called once per socket and can then be
				 * (re)used for the remainder of the socket's lifetime.
				 * 
				 * See <https://github.com/WebAssembly/wasi-sockets/blob/main/TcpSocketOperationalSemantics.md#pollable-readiness>
				 * for more information.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(): Pollable;

				/**
				 * Initiate a graceful shutdown.
				 * 
				 * - `receive`: The socket is not expecting to receive any data from
				 * the peer. The `input-stream` associated with this socket will be
				 * closed. Any data still in the receive queue at time of calling
				 * this method will be discarded.
				 * - `send`: The socket has no more data to send to the peer. The `output-stream`
				 * associated with this socket will be closed and a FIN packet will be sent.
				 * - `both`: Same effect as `receive` & `send` combined.
				 * 
				 * This function is idempotent; shutting down a direction more than once
				 * has no effect and returns `ok`.
				 * 
				 * The shutdown function does not close (drop) the socket.
				 * 
				 * # Typical errors
				 * - `invalid-state`: The socket is not in the `connected` state. (ENOTCONN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/shutdown.html>
				 * - <https://man7.org/linux/man-pages/man2/shutdown.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-shutdown>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=shutdown&sektion=2>
				 *
				 * @throws ErrorCode.Error_
				 */
				shutdown(shutdownType: ShutdownType): void;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type TcpSocket = TcpSocket.Interface;
	}
	export type Tcp = {
		TcpSocket: Tcp.TcpSocket.Class;
	};

	export namespace TcpCreateSocket {
		export type Network = sockets.Network.Network;

		export type ErrorCode = sockets.Network.ErrorCode;
		export const ErrorCode = sockets.Network.ErrorCode;

		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		export const IpAddressFamily = sockets.Network.IpAddressFamily;

		export type TcpSocket = sockets.Tcp.TcpSocket;

		/**
		 * Create a new TCP socket.
		 * 
		 * Similar to `socket(AF_INET or AF_INET6, SOCK_STREAM, IPPROTO_TCP)` in POSIX.
		 * On IPv6 sockets, IPV6_V6ONLY is enabled by default and can't be configured otherwise.
		 * 
		 * This function does not require a network capability handle. This is considered to be safe because
		 * at time of creation, the socket is not bound to any `network` yet. Up to the moment `bind`/`connect`
		 * is called, the socket is effectively an in-memory configuration object, unable to communicate with the outside world.
		 * 
		 * All sockets are non-blocking. Use the wasi-poll interface to block on asynchronous operations.
		 * 
		 * # Typical errors
		 * - `not-supported`:     The specified `address-family` is not supported. (EAFNOSUPPORT)
		 * - `new-socket-limit`:  The new socket resource could not be created because of a system limit. (EMFILE, ENFILE)
		 * 
		 * # References
		 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/socket.html>
		 * - <https://man7.org/linux/man-pages/man2/socket.2.html>
		 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasocketw>
		 * - <https://man.freebsd.org/cgi/man.cgi?query=socket&sektion=2>
		 *
		 * @throws ErrorCode.Error_
		 */
		export type createTcpSocket = (addressFamily: IpAddressFamily) => TcpSocket;
	}
	export type TcpCreateSocket = {
		createTcpSocket: TcpCreateSocket.createTcpSocket;
	};

	export namespace Udp {
		export type Pollable = io.Poll.Pollable;

		export type Network = sockets.Network.Network;

		export type ErrorCode = sockets.Network.ErrorCode;
		export const ErrorCode = sockets.Network.ErrorCode;

		export type IpSocketAddress = sockets.Network.IpSocketAddress;
		export const IpSocketAddress = sockets.Network.IpSocketAddress;

		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		export const IpAddressFamily = sockets.Network.IpAddressFamily;

		/**
		 * A received datagram.
		 */
		export type IncomingDatagram = {

			/**
			 * The payload.
			 * 
			 * Theoretical max size: ~64 KiB. In practice, typically less than 1500 bytes.
			 */
			data: Uint8Array;

			/**
			 * The source address.
			 * 
			 * This field is guaranteed to match the remote address the stream was initialized with, if any.
			 * 
			 * Equivalent to the `src_addr` out parameter of `recvfrom`.
			 */
			remoteAddress: IpSocketAddress;
		};

		/**
		 * A datagram to be sent out.
		 */
		export type OutgoingDatagram = {

			/**
			 * The payload.
			 */
			data: Uint8Array;

			/**
			 * The destination address.
			 * 
			 * The requirements on this field depend on how the stream was initialized:
			 * - with a remote address: this field must be None or match the stream's remote address exactly.
			 * - without a remote address: this field is required.
			 * 
			 * If this value is None, the send operation is equivalent to `send` in POSIX. Otherwise it is equivalent to `sendto`.
			 */
			remoteAddress?: IpSocketAddress | undefined;
		};

		export namespace UdpSocket {
			export interface Interface extends $wcm.Resource {
				/**
				 * Bind the socket to a specific network on the provided IP address and port.
				 * 
				 * If the IP address is zero (`0.0.0.0` in IPv4, `::` in IPv6), it is left to the implementation to decide which
				 * network interface(s) to bind to.
				 * If the port is zero, the socket will be bound to a random free port.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:          The `local-address` has the wrong address family. (EAFNOSUPPORT, EFAULT on Windows)
				 * - `invalid-state`:             The socket is already bound. (EINVAL)
				 * - `address-in-use`:            No ephemeral ports available. (EADDRINUSE, ENOBUFS on Windows)
				 * - `address-in-use`:            Address is already in use. (EADDRINUSE)
				 * - `address-not-bindable`:      `local-address` is not an address that the `network` can bind to. (EADDRNOTAVAIL)
				 * - `not-in-progress`:           A `bind` operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # Implementors note
				 * Unlike in POSIX, in WASI the bind operation is async. This enables
				 * interactive WASI hosts to inject permission prompts. Runtimes that
				 * don't want to make use of this ability can simply call the native
				 * `bind` as part of either `start-bind` or `finish-bind`.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/bind.html>
				 * - <https://man7.org/linux/man-pages/man2/bind.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-bind>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=bind&sektion=2&format=html>
				 *
				 * @throws ErrorCode.Error_
				 */
				startBind(network: Network, localAddress: IpSocketAddress): void;

				/**
				 * @throws ErrorCode.Error_
				 */
				finishBind(): void;

				/**
				 * Set up inbound & outbound communication channels, optionally to a specific peer.
				 * 
				 * This function only changes the local socket configuration and does not generate any network traffic.
				 * On success, the `remote-address` of the socket is updated. The `local-address` may be updated as well,
				 * based on the best network path to `remote-address`.
				 * 
				 * When a `remote-address` is provided, the returned streams are limited to communicating with that specific peer:
				 * - `send` can only be used to send to this destination.
				 * - `receive` will only return datagrams sent from the provided `remote-address`.
				 * 
				 * This method may be called multiple times on the same socket to change its association, but
				 * only the most recently returned pair of streams will be operational. Implementations may trap if
				 * the streams returned by a previous invocation haven't been dropped yet before calling `stream` again.
				 * 
				 * The POSIX equivalent in pseudo-code is:
				 * ```text
				 * if (was previously connected) {
				 * connect(s, AF_UNSPEC)
				 * }
				 * if (remote_address is Some) {
				 * connect(s, remote_address)
				 * }
				 * ```
				 * 
				 * Unlike in POSIX, the socket must already be explicitly bound.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:          The `remote-address` has the wrong address family. (EAFNOSUPPORT)
				 * - `invalid-argument`:          The IP address in `remote-address` is set to INADDR_ANY (`0.0.0.0` / `::`). (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `invalid-argument`:          The port in `remote-address` is set to 0. (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `invalid-state`:             The socket is not bound.
				 * - `address-in-use`:            Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE, EADDRNOTAVAIL on Linux, EAGAIN on BSD)
				 * - `remote-unreachable`:        The remote address is not reachable. (ECONNRESET, ENETRESET, EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN, ENONET)
				 * - `connection-refused`:        The connection was refused. (ECONNREFUSED)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/connect.html>
				 * - <https://man7.org/linux/man-pages/man2/connect.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-connect>
				 * - <https://man.freebsd.org/cgi/man.cgi?connect>
				 *
				 * @throws ErrorCode.Error_
				 */
				stream(remoteAddress: IpSocketAddress | undefined): [IncomingDatagramStream, OutgoingDatagramStream];

				/**
				 * Get the current bound address.
				 * 
				 * POSIX mentions:
				 * > If the socket has not been bound to a local name, the value
				 * > stored in the object pointed to by `address` is unspecified.
				 * 
				 * WASI is stricter and requires `local-address` to return `invalid-state` when the socket hasn't been bound yet.
				 * 
				 * # Typical errors
				 * - `invalid-state`: The socket is not bound to any local address.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getsockname.html>
				 * - <https://man7.org/linux/man-pages/man2/getsockname.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getsockname>
				 * - <https://man.freebsd.org/cgi/man.cgi?getsockname>
				 *
				 * @throws ErrorCode.Error_
				 */
				localAddress(): IpSocketAddress;

				/**
				 * Get the address the socket is currently streaming to.
				 * 
				 * # Typical errors
				 * - `invalid-state`: The socket is not streaming to a specific remote address. (ENOTCONN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getpeername.html>
				 * - <https://man7.org/linux/man-pages/man2/getpeername.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getpeername>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=getpeername&sektion=2&n=1>
				 *
				 * @throws ErrorCode.Error_
				 */
				remoteAddress(): IpSocketAddress;

				/**
				 * Whether this is a IPv4 or IPv6 socket.
				 * 
				 * Equivalent to the SO_DOMAIN socket option.
				 */
				addressFamily(): IpAddressFamily;

				/**
				 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The TTL value must be 1 or higher.
				 *
				 * @throws ErrorCode.Error_
				 */
				unicastHopLimit(): u8;

				/**
				 * @throws ErrorCode.Error_
				 */
				setUnicastHopLimit(value: u8): void;

				/**
				 * The kernel buffer space reserved for sends/receives on this socket.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * Any other value will never cause an error, but it might be silently clamped and/or rounded.
				 * I.e. after setting a value, reading the same setting back may return a different value.
				 * 
				 * Equivalent to the SO_RCVBUF and SO_SNDBUF socket options.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The provided value was 0.
				 *
				 * @throws ErrorCode.Error_
				 */
				receiveBufferSize(): u64;

				/**
				 * @throws ErrorCode.Error_
				 */
				setReceiveBufferSize(value: u64): void;

				/**
				 * @throws ErrorCode.Error_
				 */
				sendBufferSize(): u64;

				/**
				 * @throws ErrorCode.Error_
				 */
				setSendBufferSize(value: u64): void;

				/**
				 * Create a `pollable` which will resolve once the socket is ready for I/O.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(): Pollable;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type UdpSocket = UdpSocket.Interface;

		export namespace IncomingDatagramStream {
			export interface Interface extends $wcm.Resource {
				/**
				 * Receive messages on the socket.
				 * 
				 * This function attempts to receive up to `max-results` datagrams on the socket without blocking.
				 * The returned list may contain fewer elements than requested, but never more.
				 * 
				 * This function returns successfully with an empty list when either:
				 * - `max-results` is 0, or:
				 * - `max-results` is greater than 0, but no results are immediately available.
				 * This function never returns `error(would-block)`.
				 * 
				 * # Typical errors
				 * - `remote-unreachable`: The remote address is not reachable. (ECONNRESET, ENETRESET on Windows, EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN, ENONET)
				 * - `connection-refused`: The connection was refused. (ECONNREFUSED)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/recvfrom.html>
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/recvmsg.html>
				 * - <https://man7.org/linux/man-pages/man2/recv.2.html>
				 * - <https://man7.org/linux/man-pages/man2/recvmmsg.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-recv>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-recvfrom>
				 * - <https://learn.microsoft.com/en-us/previous-versions/windows/desktop/legacy/ms741687(v=vs.85)>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=recv&sektion=2>
				 *
				 * @throws ErrorCode.Error_
				 */
				receive(maxResults: u64): IncomingDatagram[];

				/**
				 * Create a `pollable` which will resolve once the stream is ready to receive again.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(): Pollable;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type IncomingDatagramStream = IncomingDatagramStream.Interface;

		export namespace OutgoingDatagramStream {
			export interface Interface extends $wcm.Resource {
				/**
				 * Check readiness for sending. This function never blocks.
				 * 
				 * Returns the number of datagrams permitted for the next call to `send`,
				 * or an error. Calling `send` with more datagrams than this function has
				 * permitted will trap.
				 * 
				 * When this function returns ok(0), the `subscribe` pollable will
				 * become ready when this function will report at least ok(1), or an
				 * error.
				 * 
				 * Never returns `would-block`.
				 *
				 * @throws ErrorCode.Error_
				 */
				checkSend(): u64;

				/**
				 * Send messages on the socket.
				 * 
				 * This function attempts to send all provided `datagrams` on the socket without blocking and
				 * returns how many messages were actually sent (or queued for sending). This function never
				 * returns `error(would-block)`. If none of the datagrams were able to be sent, `ok(0)` is returned.
				 * 
				 * This function semantically behaves the same as iterating the `datagrams` list and sequentially
				 * sending each individual datagram until either the end of the list has been reached or the first error occurred.
				 * If at least one datagram has been sent successfully, this function never returns an error.
				 * 
				 * If the input list is empty, the function returns `ok(0)`.
				 * 
				 * Each call to `send` must be permitted by a preceding `check-send`. Implementations must trap if
				 * either `check-send` was not called or `datagrams` contains more items than `check-send` permitted.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:        The `remote-address` has the wrong address family. (EAFNOSUPPORT)
				 * - `invalid-argument`:        The IP address in `remote-address` is set to INADDR_ANY (`0.0.0.0` / `::`). (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `invalid-argument`:        The port in `remote-address` is set to 0. (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `invalid-argument`:        The socket is in "connected" mode and `remote-address` is `some` value that does not match the address passed to `stream`. (EISCONN)
				 * - `invalid-argument`:        The socket is not "connected" and no value for `remote-address` was provided. (EDESTADDRREQ)
				 * - `remote-unreachable`:      The remote address is not reachable. (ECONNRESET, ENETRESET on Windows, EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN, ENONET)
				 * - `connection-refused`:      The connection was refused. (ECONNREFUSED)
				 * - `datagram-too-large`:      The datagram is too large. (EMSGSIZE)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/sendto.html>
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/sendmsg.html>
				 * - <https://man7.org/linux/man-pages/man2/send.2.html>
				 * - <https://man7.org/linux/man-pages/man2/sendmmsg.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-send>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-sendto>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasendmsg>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=send&sektion=2>
				 *
				 * @throws ErrorCode.Error_
				 */
				send(datagrams: OutgoingDatagram[]): u64;

				/**
				 * Create a `pollable` which will resolve once the stream is ready to send again.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(): Pollable;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type OutgoingDatagramStream = OutgoingDatagramStream.Interface;
	}
	export type Udp = {
		UdpSocket: Udp.UdpSocket.Class;
		IncomingDatagramStream: Udp.IncomingDatagramStream.Class;
		OutgoingDatagramStream: Udp.OutgoingDatagramStream.Class;
	};

	export namespace UdpCreateSocket {
		export type Network = sockets.Network.Network;

		export type ErrorCode = sockets.Network.ErrorCode;
		export const ErrorCode = sockets.Network.ErrorCode;

		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		export const IpAddressFamily = sockets.Network.IpAddressFamily;

		export type UdpSocket = sockets.Udp.UdpSocket;

		/**
		 * Create a new UDP socket.
		 * 
		 * Similar to `socket(AF_INET or AF_INET6, SOCK_DGRAM, IPPROTO_UDP)` in POSIX.
		 * On IPv6 sockets, IPV6_V6ONLY is enabled by default and can't be configured otherwise.
		 * 
		 * This function does not require a network capability handle. This is considered to be safe because
		 * at time of creation, the socket is not bound to any `network` yet. Up to the moment `bind` is called,
		 * the socket is effectively an in-memory configuration object, unable to communicate with the outside world.
		 * 
		 * All sockets are non-blocking. Use the wasi-poll interface to block on asynchronous operations.
		 * 
		 * # Typical errors
		 * - `not-supported`:     The specified `address-family` is not supported. (EAFNOSUPPORT)
		 * - `new-socket-limit`:  The new socket resource could not be created because of a system limit. (EMFILE, ENFILE)
		 * 
		 * # References:
		 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/socket.html>
		 * - <https://man7.org/linux/man-pages/man2/socket.2.html>
		 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasocketw>
		 * - <https://man.freebsd.org/cgi/man.cgi?query=socket&sektion=2>
		 *
		 * @throws ErrorCode.Error_
		 */
		export type createUdpSocket = (addressFamily: IpAddressFamily) => UdpSocket;
	}
	export type UdpCreateSocket = {
		createUdpSocket: UdpCreateSocket.createUdpSocket;
	};
}

export namespace sockets {
	export namespace Network.$ {
		export const Network = new $wcm.ResourceType<sockets.Network.Network>('network', 'wasi:sockets@0.2.1/network/network');
		export const Network_Handle = new $wcm.ResourceHandleType('network');
		export const ErrorCode = new $wcm.EnumType<sockets.Network.ErrorCode>(['unknown', 'accessDenied', 'notSupported', 'invalidArgument', 'outOfMemory', 'timeout', 'concurrencyConflict', 'notInProgress', 'wouldBlock', 'invalidState', 'newSocketLimit', 'addressNotBindable', 'addressInUse', 'remoteUnreachable', 'connectionRefused', 'connectionReset', 'connectionAborted', 'datagramTooLarge', 'nameUnresolvable', 'temporaryResolverFailure', 'permanentResolverFailure']);
		export const IpAddressFamily = new $wcm.EnumType<sockets.Network.IpAddressFamily>(['ipv4', 'ipv6']);
		export const Ipv4Address = new $wcm.TupleType<[u8, u8, u8, u8]>([$wcm.u8, $wcm.u8, $wcm.u8, $wcm.u8]);
		export const Ipv6Address = new $wcm.TupleType<[u16, u16, u16, u16, u16, u16, u16, u16]>([$wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16]);
		export const IpAddress = new $wcm.VariantType<sockets.Network.IpAddress, sockets.Network.IpAddress._tt, sockets.Network.IpAddress._vt>([['ipv4', Ipv4Address], ['ipv6', Ipv6Address]], sockets.Network.IpAddress._ctor);
		export const Ipv4SocketAddress = new $wcm.RecordType<sockets.Network.Ipv4SocketAddress>([
			['port', $wcm.u16],
			['address', Ipv4Address],
		]);
		export const Ipv6SocketAddress = new $wcm.RecordType<sockets.Network.Ipv6SocketAddress>([
			['port', $wcm.u16],
			['flowInfo', $wcm.u32],
			['address', Ipv6Address],
			['scopeId', $wcm.u32],
		]);
		export const IpSocketAddress = new $wcm.VariantType<sockets.Network.IpSocketAddress, sockets.Network.IpSocketAddress._tt, sockets.Network.IpSocketAddress._vt>([['ipv4', Ipv4SocketAddress], ['ipv6', Ipv6SocketAddress]], sockets.Network.IpSocketAddress._ctor);
		Network.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]network', [['inst', Network]]));
	}
	export namespace Network._ {
		export const id = 'wasi:sockets/network@0.2.1' as const;
		export const witName = 'network' as const;
		export namespace Network {
			export type WasmInterface = {
			};
			export namespace imports {
				export type WasmInterface = Network.WasmInterface & { '[resource-drop]network': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = Network.WasmInterface & { '[dtor]network': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['ErrorCode', $.ErrorCode],
			['IpAddressFamily', $.IpAddressFamily],
			['Ipv4Address', $.Ipv4Address],
			['Ipv6Address', $.Ipv6Address],
			['IpAddress', $.IpAddress],
			['Ipv4SocketAddress', $.Ipv4SocketAddress],
			['Ipv6SocketAddress', $.Ipv6SocketAddress],
			['IpSocketAddress', $.IpSocketAddress],
			['Network', $.Network]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['Network', $.Network]
		]);
		export type WasmInterface = {
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & Network.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & Network.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]network': (rep: i32) => i32;
					'[resource-rep]network': (handle: i32) => i32;
					'[resource-drop]network': (handle: i32) => void;
				};
			}
		}
	}

	export namespace InstanceNetwork.$ {
		export const Network = sockets.Network.$.Network;
		export const instanceNetwork = new $wcm.FunctionType<sockets.InstanceNetwork.instanceNetwork>('instance-network', [], new $wcm.OwnType<sockets.InstanceNetwork.Network>(Network));
	}
	export namespace InstanceNetwork._ {
		export const id = 'wasi:sockets/instance-network@0.2.1' as const;
		export const witName = 'instance-network' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['Network', $.Network]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['instanceNetwork', $.instanceNetwork]
		]);
		export type WasmInterface = {
			'instance-network': () => i32;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace IpNameLookup.$ {
		export const Pollable = io.Poll.$.Pollable;
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpAddress = sockets.Network.$.IpAddress;
		export const ResolveAddressStream = new $wcm.ResourceType<sockets.IpNameLookup.ResolveAddressStream>('resolve-address-stream', 'wasi:sockets@0.2.1/ip-name-lookup/resolve-address-stream');
		export const ResolveAddressStream_Handle = new $wcm.ResourceHandleType('resolve-address-stream');
		ResolveAddressStream.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]resolve-address-stream', [['inst', ResolveAddressStream]]));
		ResolveAddressStream.addMethod('resolveNextAddress', new $wcm.MethodType<sockets.IpNameLookup.ResolveAddressStream.Interface['resolveNextAddress']>('[method]resolve-address-stream.resolve-next-address', [], new $wcm.ResultType<sockets.IpNameLookup.IpAddress | undefined, sockets.IpNameLookup.ErrorCode>(new $wcm.OptionType<sockets.IpNameLookup.IpAddress>(IpAddress), ErrorCode)));
		ResolveAddressStream.addMethod('subscribe', new $wcm.MethodType<sockets.IpNameLookup.ResolveAddressStream.Interface['subscribe']>('[method]resolve-address-stream.subscribe', [], new $wcm.OwnType<sockets.IpNameLookup.Pollable>(Pollable)));
		export const resolveAddresses = new $wcm.FunctionType<sockets.IpNameLookup.resolveAddresses>('resolve-addresses',[
			['network', new $wcm.BorrowType<sockets.IpNameLookup.Network>(Network)],
			['name', $wcm.wstring],
		], new $wcm.ResultType<sockets.IpNameLookup.ResolveAddressStream, sockets.IpNameLookup.ErrorCode>(new $wcm.OwnType<sockets.IpNameLookup.ResolveAddressStream>(ResolveAddressStream), ErrorCode));
	}
	export namespace IpNameLookup._ {
		export const id = 'wasi:sockets/ip-name-lookup@0.2.1' as const;
		export const witName = 'ip-name-lookup' as const;
		export namespace ResolveAddressStream {
			export type WasmInterface = {
				'[method]resolve-address-stream.resolve-next-address': (self: i32, result: ptr<result<IpAddress | undefined, ErrorCode>>) => void;
				'[method]resolve-address-stream.subscribe': (self: i32) => i32;
			};
			export namespace imports {
				export type WasmInterface = ResolveAddressStream.WasmInterface & { '[resource-drop]resolve-address-stream': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = ResolveAddressStream.WasmInterface & { '[dtor]resolve-address-stream': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['Pollable', $.Pollable],
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpAddress', $.IpAddress],
			['ResolveAddressStream', $.ResolveAddressStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['resolveAddresses', $.resolveAddresses]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['ResolveAddressStream', $.ResolveAddressStream]
		]);
		export type WasmInterface = {
			'resolve-addresses': (network: i32, name_ptr: i32, name_len: i32, result: ptr<result<ResolveAddressStream, ErrorCode>>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & ResolveAddressStream.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & ResolveAddressStream.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]resolve-address-stream': (rep: i32) => i32;
					'[resource-rep]resolve-address-stream': (handle: i32) => i32;
					'[resource-drop]resolve-address-stream': (handle: i32) => void;
				};
			}
		}
	}

	export namespace Tcp.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Pollable = io.Poll.$.Pollable;
		export const Duration = clocks.MonotonicClock.$.Duration;
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpSocketAddress = sockets.Network.$.IpSocketAddress;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const ShutdownType = new $wcm.EnumType<sockets.Tcp.ShutdownType>(['receive', 'send', 'both']);
		export const TcpSocket = new $wcm.ResourceType<sockets.Tcp.TcpSocket>('tcp-socket', 'wasi:sockets@0.2.1/tcp/tcp-socket');
		export const TcpSocket_Handle = new $wcm.ResourceHandleType('tcp-socket');
		TcpSocket.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]tcp-socket', [['inst', TcpSocket]]));
		TcpSocket.addMethod('startBind', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['startBind']>('[method]tcp-socket.start-bind', [
			['network', new $wcm.BorrowType<sockets.Tcp.Network>(Network)],
			['localAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('finishBind', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['finishBind']>('[method]tcp-socket.finish-bind', [], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('startConnect', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['startConnect']>('[method]tcp-socket.start-connect', [
			['network', new $wcm.BorrowType<sockets.Tcp.Network>(Network)],
			['remoteAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('finishConnect', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['finishConnect']>('[method]tcp-socket.finish-connect', [], new $wcm.ResultType<[sockets.Tcp.InputStream, sockets.Tcp.OutputStream], sockets.Tcp.ErrorCode>(new $wcm.TupleType<[sockets.Tcp.InputStream, sockets.Tcp.OutputStream]>([new $wcm.OwnType<sockets.Tcp.InputStream>(InputStream), new $wcm.OwnType<sockets.Tcp.OutputStream>(OutputStream)]), ErrorCode)));
		TcpSocket.addMethod('startListen', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['startListen']>('[method]tcp-socket.start-listen', [], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('finishListen', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['finishListen']>('[method]tcp-socket.finish-listen', [], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('accept', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['accept']>('[method]tcp-socket.accept', [], new $wcm.ResultType<[sockets.Tcp.TcpSocket, sockets.Tcp.InputStream, sockets.Tcp.OutputStream], sockets.Tcp.ErrorCode>(new $wcm.TupleType<[sockets.Tcp.TcpSocket, sockets.Tcp.InputStream, sockets.Tcp.OutputStream]>([new $wcm.OwnType<sockets.Tcp.TcpSocket>(TcpSocket), new $wcm.OwnType<sockets.Tcp.InputStream>(InputStream), new $wcm.OwnType<sockets.Tcp.OutputStream>(OutputStream)]), ErrorCode)));
		TcpSocket.addMethod('localAddress', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['localAddress']>('[method]tcp-socket.local-address', [], new $wcm.ResultType<sockets.Tcp.IpSocketAddress, sockets.Tcp.ErrorCode>(IpSocketAddress, ErrorCode)));
		TcpSocket.addMethod('remoteAddress', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['remoteAddress']>('[method]tcp-socket.remote-address', [], new $wcm.ResultType<sockets.Tcp.IpSocketAddress, sockets.Tcp.ErrorCode>(IpSocketAddress, ErrorCode)));
		TcpSocket.addMethod('isListening', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['isListening']>('[method]tcp-socket.is-listening', [], $wcm.bool));
		TcpSocket.addMethod('addressFamily', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['addressFamily']>('[method]tcp-socket.address-family', [], IpAddressFamily));
		TcpSocket.addMethod('setListenBacklogSize', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setListenBacklogSize']>('[method]tcp-socket.set-listen-backlog-size', [
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('keepAliveEnabled', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['keepAliveEnabled']>('[method]tcp-socket.keep-alive-enabled', [], new $wcm.ResultType<boolean, sockets.Tcp.ErrorCode>($wcm.bool, ErrorCode)));
		TcpSocket.addMethod('setKeepAliveEnabled', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setKeepAliveEnabled']>('[method]tcp-socket.set-keep-alive-enabled', [
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('keepAliveIdleTime', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['keepAliveIdleTime']>('[method]tcp-socket.keep-alive-idle-time', [], new $wcm.ResultType<sockets.Tcp.Duration, sockets.Tcp.ErrorCode>(Duration, ErrorCode)));
		TcpSocket.addMethod('setKeepAliveIdleTime', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setKeepAliveIdleTime']>('[method]tcp-socket.set-keep-alive-idle-time', [
			['value', Duration],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('keepAliveInterval', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['keepAliveInterval']>('[method]tcp-socket.keep-alive-interval', [], new $wcm.ResultType<sockets.Tcp.Duration, sockets.Tcp.ErrorCode>(Duration, ErrorCode)));
		TcpSocket.addMethod('setKeepAliveInterval', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setKeepAliveInterval']>('[method]tcp-socket.set-keep-alive-interval', [
			['value', Duration],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('keepAliveCount', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['keepAliveCount']>('[method]tcp-socket.keep-alive-count', [], new $wcm.ResultType<u32, sockets.Tcp.ErrorCode>($wcm.u32, ErrorCode)));
		TcpSocket.addMethod('setKeepAliveCount', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setKeepAliveCount']>('[method]tcp-socket.set-keep-alive-count', [
			['value', $wcm.u32],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('hopLimit', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['hopLimit']>('[method]tcp-socket.hop-limit', [], new $wcm.ResultType<u8, sockets.Tcp.ErrorCode>($wcm.u8, ErrorCode)));
		TcpSocket.addMethod('setHopLimit', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setHopLimit']>('[method]tcp-socket.set-hop-limit', [
			['value', $wcm.u8],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('receiveBufferSize', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['receiveBufferSize']>('[method]tcp-socket.receive-buffer-size', [], new $wcm.ResultType<u64, sockets.Tcp.ErrorCode>($wcm.u64, ErrorCode)));
		TcpSocket.addMethod('setReceiveBufferSize', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setReceiveBufferSize']>('[method]tcp-socket.set-receive-buffer-size', [
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('sendBufferSize', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['sendBufferSize']>('[method]tcp-socket.send-buffer-size', [], new $wcm.ResultType<u64, sockets.Tcp.ErrorCode>($wcm.u64, ErrorCode)));
		TcpSocket.addMethod('setSendBufferSize', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['setSendBufferSize']>('[method]tcp-socket.set-send-buffer-size', [
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addMethod('subscribe', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['subscribe']>('[method]tcp-socket.subscribe', [], new $wcm.OwnType<sockets.Tcp.Pollable>(Pollable)));
		TcpSocket.addMethod('shutdown', new $wcm.MethodType<sockets.Tcp.TcpSocket.Interface['shutdown']>('[method]tcp-socket.shutdown', [
			['shutdownType', ShutdownType],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
	}
	export namespace Tcp._ {
		export const id = 'wasi:sockets/tcp@0.2.1' as const;
		export const witName = 'tcp' as const;
		export namespace TcpSocket {
			export type WasmInterface = {
				'[method]tcp-socket.start-bind': (self: i32, network: i32, localAddress_IpSocketAddress_case: i32, localAddress_IpSocketAddress_0: i32, localAddress_IpSocketAddress_1: i32, localAddress_IpSocketAddress_2: i32, localAddress_IpSocketAddress_3: i32, localAddress_IpSocketAddress_4: i32, localAddress_IpSocketAddress_5: i32, localAddress_IpSocketAddress_6: i32, localAddress_IpSocketAddress_7: i32, localAddress_IpSocketAddress_8: i32, localAddress_IpSocketAddress_9: i32, localAddress_IpSocketAddress_10: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.finish-bind': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.start-connect': (self: i32, network: i32, remoteAddress_IpSocketAddress_case: i32, remoteAddress_IpSocketAddress_0: i32, remoteAddress_IpSocketAddress_1: i32, remoteAddress_IpSocketAddress_2: i32, remoteAddress_IpSocketAddress_3: i32, remoteAddress_IpSocketAddress_4: i32, remoteAddress_IpSocketAddress_5: i32, remoteAddress_IpSocketAddress_6: i32, remoteAddress_IpSocketAddress_7: i32, remoteAddress_IpSocketAddress_8: i32, remoteAddress_IpSocketAddress_9: i32, remoteAddress_IpSocketAddress_10: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.finish-connect': (self: i32, result: ptr<result<[InputStream, OutputStream], ErrorCode>>) => void;
				'[method]tcp-socket.start-listen': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.finish-listen': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.accept': (self: i32, result: ptr<result<[TcpSocket, InputStream, OutputStream], ErrorCode>>) => void;
				'[method]tcp-socket.local-address': (self: i32, result: ptr<result<IpSocketAddress, ErrorCode>>) => void;
				'[method]tcp-socket.remote-address': (self: i32, result: ptr<result<IpSocketAddress, ErrorCode>>) => void;
				'[method]tcp-socket.is-listening': (self: i32) => i32;
				'[method]tcp-socket.address-family': (self: i32) => i32;
				'[method]tcp-socket.set-listen-backlog-size': (self: i32, value: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.keep-alive-enabled': (self: i32, result: ptr<result<boolean, ErrorCode>>) => void;
				'[method]tcp-socket.set-keep-alive-enabled': (self: i32, value: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.keep-alive-idle-time': (self: i32, result: ptr<result<Duration, ErrorCode>>) => void;
				'[method]tcp-socket.set-keep-alive-idle-time': (self: i32, value_Duration: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.keep-alive-interval': (self: i32, result: ptr<result<Duration, ErrorCode>>) => void;
				'[method]tcp-socket.set-keep-alive-interval': (self: i32, value_Duration: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.keep-alive-count': (self: i32, result: ptr<result<u32, ErrorCode>>) => void;
				'[method]tcp-socket.set-keep-alive-count': (self: i32, value: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.hop-limit': (self: i32, result: ptr<result<u8, ErrorCode>>) => void;
				'[method]tcp-socket.set-hop-limit': (self: i32, value: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.receive-buffer-size': (self: i32, result: ptr<result<u64, ErrorCode>>) => void;
				'[method]tcp-socket.set-receive-buffer-size': (self: i32, value: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.send-buffer-size': (self: i32, result: ptr<result<u64, ErrorCode>>) => void;
				'[method]tcp-socket.set-send-buffer-size': (self: i32, value: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]tcp-socket.subscribe': (self: i32) => i32;
				'[method]tcp-socket.shutdown': (self: i32, shutdownType_ShutdownType: i32, result: ptr<result<void, ErrorCode>>) => void;
			};
			export namespace imports {
				export type WasmInterface = TcpSocket.WasmInterface & { '[resource-drop]tcp-socket': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = TcpSocket.WasmInterface & { '[dtor]tcp-socket': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream],
			['Pollable', $.Pollable],
			['Duration', $.Duration],
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpSocketAddress', $.IpSocketAddress],
			['IpAddressFamily', $.IpAddressFamily],
			['ShutdownType', $.ShutdownType],
			['TcpSocket', $.TcpSocket]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TcpSocket', $.TcpSocket]
		]);
		export type WasmInterface = {
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & TcpSocket.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & TcpSocket.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]tcp-socket': (rep: i32) => i32;
					'[resource-rep]tcp-socket': (handle: i32) => i32;
					'[resource-drop]tcp-socket': (handle: i32) => void;
				};
			}
		}
	}

	export namespace TcpCreateSocket.$ {
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const TcpSocket = sockets.Tcp.$.TcpSocket;
		export const createTcpSocket = new $wcm.FunctionType<sockets.TcpCreateSocket.createTcpSocket>('create-tcp-socket',[
			['addressFamily', IpAddressFamily],
		], new $wcm.ResultType<sockets.TcpCreateSocket.TcpSocket, sockets.TcpCreateSocket.ErrorCode>(new $wcm.OwnType<sockets.TcpCreateSocket.TcpSocket>(TcpSocket), ErrorCode));
	}
	export namespace TcpCreateSocket._ {
		export const id = 'wasi:sockets/tcp-create-socket@0.2.1' as const;
		export const witName = 'tcp-create-socket' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpAddressFamily', $.IpAddressFamily],
			['TcpSocket', $.TcpSocket]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['createTcpSocket', $.createTcpSocket]
		]);
		export type WasmInterface = {
			'create-tcp-socket': (addressFamily_IpAddressFamily_IpAddressFamily: i32, result: ptr<result<TcpSocket, ErrorCode>>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace Udp.$ {
		export const Pollable = io.Poll.$.Pollable;
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpSocketAddress = sockets.Network.$.IpSocketAddress;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const IncomingDatagram = new $wcm.RecordType<sockets.Udp.IncomingDatagram>([
			['data', new $wcm.Uint8ArrayType()],
			['remoteAddress', IpSocketAddress],
		]);
		export const OutgoingDatagram = new $wcm.RecordType<sockets.Udp.OutgoingDatagram>([
			['data', new $wcm.Uint8ArrayType()],
			['remoteAddress', new $wcm.OptionType<sockets.Udp.IpSocketAddress>(IpSocketAddress)],
		]);
		export const UdpSocket = new $wcm.ResourceType<sockets.Udp.UdpSocket>('udp-socket', 'wasi:sockets@0.2.1/udp/udp-socket');
		export const UdpSocket_Handle = new $wcm.ResourceHandleType('udp-socket');
		export const IncomingDatagramStream = new $wcm.ResourceType<sockets.Udp.IncomingDatagramStream>('incoming-datagram-stream', 'wasi:sockets@0.2.1/udp/incoming-datagram-stream');
		export const IncomingDatagramStream_Handle = new $wcm.ResourceHandleType('incoming-datagram-stream');
		export const OutgoingDatagramStream = new $wcm.ResourceType<sockets.Udp.OutgoingDatagramStream>('outgoing-datagram-stream', 'wasi:sockets@0.2.1/udp/outgoing-datagram-stream');
		export const OutgoingDatagramStream_Handle = new $wcm.ResourceHandleType('outgoing-datagram-stream');
		UdpSocket.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]udp-socket', [['inst', UdpSocket]]));
		UdpSocket.addMethod('startBind', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['startBind']>('[method]udp-socket.start-bind', [
			['network', new $wcm.BorrowType<sockets.Udp.Network>(Network)],
			['localAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addMethod('finishBind', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['finishBind']>('[method]udp-socket.finish-bind', [], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addMethod('stream', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['stream']>('[method]udp-socket.stream', [
			['remoteAddress', new $wcm.OptionType<sockets.Udp.IpSocketAddress>(IpSocketAddress)],
		], new $wcm.ResultType<[sockets.Udp.IncomingDatagramStream, sockets.Udp.OutgoingDatagramStream], sockets.Udp.ErrorCode>(new $wcm.TupleType<[sockets.Udp.IncomingDatagramStream, sockets.Udp.OutgoingDatagramStream]>([new $wcm.OwnType<sockets.Udp.IncomingDatagramStream>(IncomingDatagramStream), new $wcm.OwnType<sockets.Udp.OutgoingDatagramStream>(OutgoingDatagramStream)]), ErrorCode)));
		UdpSocket.addMethod('localAddress', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['localAddress']>('[method]udp-socket.local-address', [], new $wcm.ResultType<sockets.Udp.IpSocketAddress, sockets.Udp.ErrorCode>(IpSocketAddress, ErrorCode)));
		UdpSocket.addMethod('remoteAddress', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['remoteAddress']>('[method]udp-socket.remote-address', [], new $wcm.ResultType<sockets.Udp.IpSocketAddress, sockets.Udp.ErrorCode>(IpSocketAddress, ErrorCode)));
		UdpSocket.addMethod('addressFamily', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['addressFamily']>('[method]udp-socket.address-family', [], IpAddressFamily));
		UdpSocket.addMethod('unicastHopLimit', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['unicastHopLimit']>('[method]udp-socket.unicast-hop-limit', [], new $wcm.ResultType<u8, sockets.Udp.ErrorCode>($wcm.u8, ErrorCode)));
		UdpSocket.addMethod('setUnicastHopLimit', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['setUnicastHopLimit']>('[method]udp-socket.set-unicast-hop-limit', [
			['value', $wcm.u8],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addMethod('receiveBufferSize', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['receiveBufferSize']>('[method]udp-socket.receive-buffer-size', [], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		UdpSocket.addMethod('setReceiveBufferSize', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['setReceiveBufferSize']>('[method]udp-socket.set-receive-buffer-size', [
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addMethod('sendBufferSize', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['sendBufferSize']>('[method]udp-socket.send-buffer-size', [], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		UdpSocket.addMethod('setSendBufferSize', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['setSendBufferSize']>('[method]udp-socket.set-send-buffer-size', [
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addMethod('subscribe', new $wcm.MethodType<sockets.Udp.UdpSocket.Interface['subscribe']>('[method]udp-socket.subscribe', [], new $wcm.OwnType<sockets.Udp.Pollable>(Pollable)));
		IncomingDatagramStream.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]incoming-datagram-stream', [['inst', IncomingDatagramStream]]));
		IncomingDatagramStream.addMethod('receive', new $wcm.MethodType<sockets.Udp.IncomingDatagramStream.Interface['receive']>('[method]incoming-datagram-stream.receive', [
			['maxResults', $wcm.u64],
		], new $wcm.ResultType<sockets.Udp.IncomingDatagram[], sockets.Udp.ErrorCode>(new $wcm.ListType<sockets.Udp.IncomingDatagram>(IncomingDatagram), ErrorCode)));
		IncomingDatagramStream.addMethod('subscribe', new $wcm.MethodType<sockets.Udp.IncomingDatagramStream.Interface['subscribe']>('[method]incoming-datagram-stream.subscribe', [], new $wcm.OwnType<sockets.Udp.Pollable>(Pollable)));
		OutgoingDatagramStream.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]outgoing-datagram-stream', [['inst', OutgoingDatagramStream]]));
		OutgoingDatagramStream.addMethod('checkSend', new $wcm.MethodType<sockets.Udp.OutgoingDatagramStream.Interface['checkSend']>('[method]outgoing-datagram-stream.check-send', [], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		OutgoingDatagramStream.addMethod('send', new $wcm.MethodType<sockets.Udp.OutgoingDatagramStream.Interface['send']>('[method]outgoing-datagram-stream.send', [
			['datagrams', new $wcm.ListType<sockets.Udp.OutgoingDatagram>(OutgoingDatagram)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		OutgoingDatagramStream.addMethod('subscribe', new $wcm.MethodType<sockets.Udp.OutgoingDatagramStream.Interface['subscribe']>('[method]outgoing-datagram-stream.subscribe', [], new $wcm.OwnType<sockets.Udp.Pollable>(Pollable)));
	}
	export namespace Udp._ {
		export const id = 'wasi:sockets/udp@0.2.1' as const;
		export const witName = 'udp' as const;
		export namespace UdpSocket {
			export type WasmInterface = {
				'[method]udp-socket.start-bind': (self: i32, network: i32, localAddress_IpSocketAddress_case: i32, localAddress_IpSocketAddress_0: i32, localAddress_IpSocketAddress_1: i32, localAddress_IpSocketAddress_2: i32, localAddress_IpSocketAddress_3: i32, localAddress_IpSocketAddress_4: i32, localAddress_IpSocketAddress_5: i32, localAddress_IpSocketAddress_6: i32, localAddress_IpSocketAddress_7: i32, localAddress_IpSocketAddress_8: i32, localAddress_IpSocketAddress_9: i32, localAddress_IpSocketAddress_10: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]udp-socket.finish-bind': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]udp-socket.stream': (self: i32, remoteAddress_case: i32, remoteAddress_option_IpSocketAddress_case: i32, remoteAddress_option_IpSocketAddress_0: i32, remoteAddress_option_IpSocketAddress_1: i32, remoteAddress_option_IpSocketAddress_2: i32, remoteAddress_option_IpSocketAddress_3: i32, remoteAddress_option_IpSocketAddress_4: i32, remoteAddress_option_IpSocketAddress_5: i32, remoteAddress_option_IpSocketAddress_6: i32, remoteAddress_option_IpSocketAddress_7: i32, remoteAddress_option_IpSocketAddress_8: i32, remoteAddress_option_IpSocketAddress_9: i32, remoteAddress_option_IpSocketAddress_10: i32, result: ptr<result<[IncomingDatagramStream, OutgoingDatagramStream], ErrorCode>>) => void;
				'[method]udp-socket.local-address': (self: i32, result: ptr<result<IpSocketAddress, ErrorCode>>) => void;
				'[method]udp-socket.remote-address': (self: i32, result: ptr<result<IpSocketAddress, ErrorCode>>) => void;
				'[method]udp-socket.address-family': (self: i32) => i32;
				'[method]udp-socket.unicast-hop-limit': (self: i32, result: ptr<result<u8, ErrorCode>>) => void;
				'[method]udp-socket.set-unicast-hop-limit': (self: i32, value: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]udp-socket.receive-buffer-size': (self: i32, result: ptr<result<u64, ErrorCode>>) => void;
				'[method]udp-socket.set-receive-buffer-size': (self: i32, value: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]udp-socket.send-buffer-size': (self: i32, result: ptr<result<u64, ErrorCode>>) => void;
				'[method]udp-socket.set-send-buffer-size': (self: i32, value: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]udp-socket.subscribe': (self: i32) => i32;
			};
			export namespace imports {
				export type WasmInterface = UdpSocket.WasmInterface & { '[resource-drop]udp-socket': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = UdpSocket.WasmInterface & { '[dtor]udp-socket': (self: i32) => void };
			}
		}
		export namespace IncomingDatagramStream {
			export type WasmInterface = {
				'[method]incoming-datagram-stream.receive': (self: i32, maxResults: i64, result: ptr<result<IncomingDatagram[], ErrorCode>>) => void;
				'[method]incoming-datagram-stream.subscribe': (self: i32) => i32;
			};
			export namespace imports {
				export type WasmInterface = IncomingDatagramStream.WasmInterface & { '[resource-drop]incoming-datagram-stream': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = IncomingDatagramStream.WasmInterface & { '[dtor]incoming-datagram-stream': (self: i32) => void };
			}
		}
		export namespace OutgoingDatagramStream {
			export type WasmInterface = {
				'[method]outgoing-datagram-stream.check-send': (self: i32, result: ptr<result<u64, ErrorCode>>) => void;
				'[method]outgoing-datagram-stream.send': (self: i32, datagrams_ptr: i32, datagrams_len: i32, result: ptr<result<u64, ErrorCode>>) => void;
				'[method]outgoing-datagram-stream.subscribe': (self: i32) => i32;
			};
			export namespace imports {
				export type WasmInterface = OutgoingDatagramStream.WasmInterface & { '[resource-drop]outgoing-datagram-stream': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = OutgoingDatagramStream.WasmInterface & { '[dtor]outgoing-datagram-stream': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['Pollable', $.Pollable],
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpSocketAddress', $.IpSocketAddress],
			['IpAddressFamily', $.IpAddressFamily],
			['IncomingDatagram', $.IncomingDatagram],
			['OutgoingDatagram', $.OutgoingDatagram],
			['UdpSocket', $.UdpSocket],
			['IncomingDatagramStream', $.IncomingDatagramStream],
			['OutgoingDatagramStream', $.OutgoingDatagramStream]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['UdpSocket', $.UdpSocket],
			['IncomingDatagramStream', $.IncomingDatagramStream],
			['OutgoingDatagramStream', $.OutgoingDatagramStream]
		]);
		export type WasmInterface = {
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & UdpSocket.imports.WasmInterface & IncomingDatagramStream.imports.WasmInterface & OutgoingDatagramStream.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & UdpSocket.exports.WasmInterface & IncomingDatagramStream.exports.WasmInterface & OutgoingDatagramStream.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]udp-socket': (rep: i32) => i32;
					'[resource-rep]udp-socket': (handle: i32) => i32;
					'[resource-drop]udp-socket': (handle: i32) => void;
					'[resource-new]incoming-datagram-stream': (rep: i32) => i32;
					'[resource-rep]incoming-datagram-stream': (handle: i32) => i32;
					'[resource-drop]incoming-datagram-stream': (handle: i32) => void;
					'[resource-new]outgoing-datagram-stream': (rep: i32) => i32;
					'[resource-rep]outgoing-datagram-stream': (handle: i32) => i32;
					'[resource-drop]outgoing-datagram-stream': (handle: i32) => void;
				};
			}
		}
	}

	export namespace UdpCreateSocket.$ {
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const UdpSocket = sockets.Udp.$.UdpSocket;
		export const createUdpSocket = new $wcm.FunctionType<sockets.UdpCreateSocket.createUdpSocket>('create-udp-socket',[
			['addressFamily', IpAddressFamily],
		], new $wcm.ResultType<sockets.UdpCreateSocket.UdpSocket, sockets.UdpCreateSocket.ErrorCode>(new $wcm.OwnType<sockets.UdpCreateSocket.UdpSocket>(UdpSocket), ErrorCode));
	}
	export namespace UdpCreateSocket._ {
		export const id = 'wasi:sockets/udp-create-socket@0.2.1' as const;
		export const witName = 'udp-create-socket' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpAddressFamily', $.IpAddressFamily],
			['UdpSocket', $.UdpSocket]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['createUdpSocket', $.createUdpSocket]
		]);
		export type WasmInterface = {
			'create-udp-socket': (addressFamily_IpAddressFamily_IpAddressFamily: i32, result: ptr<result<UdpSocket, ErrorCode>>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}
}

export namespace sockets._ {
	export const version = '0.2.1' as const;
	export const id = 'wasi:sockets@0.2.1' as const;
	export const witName = 'sockets' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Network', Network._],
		['InstanceNetwork', InstanceNetwork._],
		['IpNameLookup', IpNameLookup._],
		['Tcp', Tcp._],
		['TcpCreateSocket', TcpCreateSocket._],
		['Udp', Udp._],
		['UdpCreateSocket', UdpCreateSocket._]
	]);
}