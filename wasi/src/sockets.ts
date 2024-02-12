/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u8, u16, u32, resource, own, borrow, result, u64, i32, option, ptr, i64 } from '@vscode/wasm-component-model';
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
			 * The connection was forcefully rejected
			 */
			connectionRefused = 'connectionRefused',
			
			/**
			 * The connection was reset.
			 */
			connectionReset = 'connectionReset',
			
			/**
			 * A connection was aborted.
			 */
			connectionAborted = 'connectionAborted',
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
			permanentResolverFailure = 'permanentResolverFailure',
		}
		
		export enum IpAddressFamily {
			
			/**
			 * Similar to `AF_INET` in POSIX.
			 */
			ipv4 = 'ipv4',
			
			/**
			 * Similar to `AF_INET6` in POSIX.
			 */
			ipv6 = 'ipv6',
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
			port: u16;
			address: Ipv4Address;
		};
		
		export type Ipv6SocketAddress = {
			port: u16;
			flowInfo: u32;
			address: Ipv6Address;
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
			export type Module = {
			};
			export interface Interface {
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type Network = resource;
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
		export type instanceNetwork = () => own<Network>;
	}
	export type InstanceNetwork = {
		instanceNetwork: InstanceNetwork.instanceNetwork;
	};
	
	export namespace IpNameLookup {
		
		export type Pollable = io.Poll.Pollable;
		
		export type Network = sockets.Network.Network;
		
		export type ErrorCode = sockets.Network.ErrorCode;
		
		export type IpAddress = sockets.Network.IpAddress;
		
		export namespace ResolveAddressStream {
			export type Module = {
				
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
				 */
				resolveNextAddress(self: borrow<ResolveAddressStream>): result<IpAddress | undefined, ErrorCode>;
				
				/**
				 * Create a `pollable` which will resolve once the stream is ready for I/O.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(self: borrow<ResolveAddressStream>): own<Pollable>;
			};
			export interface Interface {
				resolveNextAddress(): result<IpAddress | undefined, ErrorCode>;
				subscribe(): own<Pollable>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type ResolveAddressStream = resource;
		
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
		 */
		export type resolveAddresses = (network: borrow<Network>, name: string) => result<own<ResolveAddressStream>, ErrorCode>;
	}
	export type IpNameLookup<RAS extends sockets.IpNameLookup.ResolveAddressStream.Module | sockets.IpNameLookup.ResolveAddressStream.Manager = sockets.IpNameLookup.ResolveAddressStream.Module | sockets.IpNameLookup.ResolveAddressStream.Manager> = {
		ResolveAddressStream: RAS;
		resolveAddresses: IpNameLookup.resolveAddresses;
	};
	
	export namespace Tcp {
		
		export type InputStream = io.Streams.InputStream;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type Pollable = io.Poll.Pollable;
		
		export type Duration = clocks.MonotonicClock.Duration;
		
		export type Network = sockets.Network.Network;
		
		export type ErrorCode = sockets.Network.ErrorCode;
		
		export type IpSocketAddress = sockets.Network.IpSocketAddress;
		
		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		
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
			both = 'both',
		}
		
		export namespace TcpSocket {
			export type Module = {
				
				/**
				 * Bind the socket to a specific network on the provided IP address and port.
				 * 
				 * If the IP address is zero (`0.0.0.0` in IPv4, `::` in IPv6), it is left to the implementation to decide which
				 * network interface(s) to bind to.
				 * If the TCP/UDP port is zero, the socket will be bound to a random free port.
				 * 
				 * When a socket is not explicitly bound, the first invocation to a listen or connect operation will
				 * implicitly bind the socket.
				 * 
				 * Unlike in POSIX, this function is async. This enables interactive WASI hosts to inject permission prompts.
				 * 
				 * # Typical `start` errors
				 * - `invalid-argument`:          The `local-address` has the wrong address family. (EAFNOSUPPORT, EFAULT on Windows)
				 * - `invalid-argument`:          `local-address` is not a unicast address. (EINVAL)
				 * - `invalid-argument`:          `local-address` is an IPv4-mapped IPv6 address, but the socket has `ipv6-only` enabled. (EINVAL)
				 * - `invalid-state`:             The socket is already bound. (EINVAL)
				 * 
				 * # Typical `finish` errors
				 * - `address-in-use`:            No ephemeral ports available. (EADDRINUSE, ENOBUFS on Windows)
				 * - `address-in-use`:            Address is already in use. (EADDRINUSE)
				 * - `address-not-bindable`:      `local-address` is not an address that the `network` can bind to. (EADDRNOTAVAIL)
				 * - `not-in-progress`:           A `bind` operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/bind.html>
				 * - <https://man7.org/linux/man-pages/man2/bind.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-bind>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=bind&sektion=2&format=html>
				 */
				startBind(self: borrow<TcpSocket>, network: borrow<Network>, localAddress: IpSocketAddress): result<void, ErrorCode>;
				
				finishBind(self: borrow<TcpSocket>): result<void, ErrorCode>;
				
				/**
				 * Connect to a remote endpoint.
				 * 
				 * On success:
				 * - the socket is transitioned into the Connection state
				 * - a pair of streams is returned that can be used to read & write to the connection
				 * 
				 * POSIX mentions:
				 * > If connect() fails, the state of the socket is unspecified. Conforming applications should
				 * > close the file descriptor and create a new socket before attempting to reconnect.
				 * 
				 * WASI prescribes the following behavior:
				 * - If `connect` fails because an input/state validation error, the socket should remain usable.
				 * - If a connection was actually attempted but failed, the socket should become unusable for further network communication.
				 * Besides `drop`, any method after such a failure may return an error.
				 * 
				 * # Typical `start` errors
				 * - `invalid-argument`:          The `remote-address` has the wrong address family. (EAFNOSUPPORT)
				 * - `invalid-argument`:          `remote-address` is not a unicast address. (EINVAL, ENETUNREACH on Linux, EAFNOSUPPORT on MacOS)
				 * - `invalid-argument`:          `remote-address` is an IPv4-mapped IPv6 address, but the socket has `ipv6-only` enabled. (EINVAL, EADDRNOTAVAIL on Illumos)
				 * - `invalid-argument`:          `remote-address` is a non-IPv4-mapped IPv6 address, but the socket was bound to a specific IPv4-mapped IPv6 address. (or vice versa)
				 * - `invalid-argument`:          The IP address in `remote-address` is set to INADDR_ANY (`0.0.0.0` / `::`). (EADDRNOTAVAIL on Windows)
				 * - `invalid-argument`:          The port in `remote-address` is set to 0. (EADDRNOTAVAIL on Windows)
				 * - `invalid-argument`:          The socket is already attached to a different network. The `network` passed to `connect` must be identical to the one passed to `bind`.
				 * - `invalid-state`:             The socket is already in the Connection state. (EISCONN)
				 * - `invalid-state`:             The socket is already in the Listener state. (EOPNOTSUPP, EINVAL on Windows)
				 * 
				 * # Typical `finish` errors
				 * - `timeout`:                   Connection timed out. (ETIMEDOUT)
				 * - `connection-refused`:        The connection was forcefully rejected. (ECONNREFUSED)
				 * - `connection-reset`:          The connection was reset. (ECONNRESET)
				 * - `connection-aborted`:        The connection was aborted. (ECONNABORTED)
				 * - `remote-unreachable`:        The remote address is not reachable. (EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN, ENONET)
				 * - `address-in-use`:            Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE, EADDRNOTAVAIL on Linux, EAGAIN on BSD)
				 * - `not-in-progress`:           A `connect` operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/connect.html>
				 * - <https://man7.org/linux/man-pages/man2/connect.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-connect>
				 * - <https://man.freebsd.org/cgi/man.cgi?connect>
				 */
				startConnect(self: borrow<TcpSocket>, network: borrow<Network>, remoteAddress: IpSocketAddress): result<void, ErrorCode>;
				
				finishConnect(self: borrow<TcpSocket>): result<[own<InputStream>, own<OutputStream>], ErrorCode>;
				
				/**
				 * Start listening for new connections.
				 * 
				 * Transitions the socket into the Listener state.
				 * 
				 * Unlike POSIX:
				 * - this function is async. This enables interactive WASI hosts to inject permission prompts.
				 * - the socket must already be explicitly bound.
				 * 
				 * # Typical `start` errors
				 * - `invalid-state`:             The socket is not bound to any local address. (EDESTADDRREQ)
				 * - `invalid-state`:             The socket is already in the Connection state. (EISCONN, EINVAL on BSD)
				 * - `invalid-state`:             The socket is already in the Listener state.
				 * 
				 * # Typical `finish` errors
				 * - `address-in-use`:            Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE)
				 * - `not-in-progress`:           A `listen` operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/listen.html>
				 * - <https://man7.org/linux/man-pages/man2/listen.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-listen>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=listen&sektion=2>
				 */
				startListen(self: borrow<TcpSocket>): result<void, ErrorCode>;
				
				finishListen(self: borrow<TcpSocket>): result<void, ErrorCode>;
				
				/**
				 * Accept a new client socket.
				 * 
				 * The returned socket is bound and in the Connection state. The following properties are inherited from the listener socket:
				 * - `address-family`
				 * - `ipv6-only`
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
				 * - `invalid-state`:      Socket is not in the Listener state. (EINVAL)
				 * - `would-block`:        No pending connections at the moment. (EWOULDBLOCK, EAGAIN)
				 * - `connection-aborted`: An incoming connection was pending, but was terminated by the client before this listener could accept it. (ECONNABORTED)
				 * - `new-socket-limit`:   The new socket resource could not be created because of a system limit. (EMFILE, ENFILE)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/accept.html>
				 * - <https://man7.org/linux/man-pages/man2/accept.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-accept>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=accept&sektion=2>
				 */
				accept(self: borrow<TcpSocket>): result<[own<TcpSocket>, own<InputStream>, own<OutputStream>], ErrorCode>;
				
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
				 */
				localAddress(self: borrow<TcpSocket>): result<IpSocketAddress, ErrorCode>;
				
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
				 */
				remoteAddress(self: borrow<TcpSocket>): result<IpSocketAddress, ErrorCode>;
				
				/**
				 * Whether the socket is listening for new connections.
				 * 
				 * Equivalent to the SO_ACCEPTCONN socket option.
				 */
				isListening(self: borrow<TcpSocket>): boolean;
				
				/**
				 * Whether this is a IPv4 or IPv6 socket.
				 * 
				 * Equivalent to the SO_DOMAIN socket option.
				 */
				addressFamily(self: borrow<TcpSocket>): IpAddressFamily;
				
				/**
				 * Whether IPv4 compatibility (dual-stack) mode is disabled or not.
				 * 
				 * Equivalent to the IPV6_V6ONLY socket option.
				 * 
				 * # Typical errors
				 * - `invalid-state`:        (set) The socket is already bound.
				 * - `not-supported`:        (get/set) `this` socket is an IPv4 socket.
				 * - `not-supported`:        (set) Host does not support dual-stack sockets. (Implementations are not required to.)
				 */
				ipv6Only(self: borrow<TcpSocket>): result<boolean, ErrorCode>;
				
				setIpv6Only(self: borrow<TcpSocket>, value: boolean): result<void, ErrorCode>;
				
				/**
				 * Hints the desired listen queue size. Implementations are free to ignore this.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * Any other value will never cause an error, but it might be silently clamped and/or rounded.
				 * 
				 * # Typical errors
				 * - `not-supported`:        (set) The platform does not support changing the backlog size after the initial listen.
				 * - `invalid-argument`:     (set) The provided value was 0.
				 * - `invalid-state`:        (set) The socket is already in the Connection state.
				 */
				setListenBacklogSize(self: borrow<TcpSocket>, value: u64): result<void, ErrorCode>;
				
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
				 */
				keepAliveEnabled(self: borrow<TcpSocket>): result<boolean, ErrorCode>;
				
				setKeepAliveEnabled(self: borrow<TcpSocket>, value: boolean): result<void, ErrorCode>;
				
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
				 */
				keepAliveIdleTime(self: borrow<TcpSocket>): result<Duration, ErrorCode>;
				
				setKeepAliveIdleTime(self: borrow<TcpSocket>, value: Duration): result<void, ErrorCode>;
				
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
				 */
				keepAliveInterval(self: borrow<TcpSocket>): result<Duration, ErrorCode>;
				
				setKeepAliveInterval(self: borrow<TcpSocket>, value: Duration): result<void, ErrorCode>;
				
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
				 */
				keepAliveCount(self: borrow<TcpSocket>): result<u32, ErrorCode>;
				
				setKeepAliveCount(self: borrow<TcpSocket>, value: u32): result<void, ErrorCode>;
				
				/**
				 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The TTL value must be 1 or higher.
				 * - `invalid-state`:        (set) The socket is already in the Connection state.
				 * - `invalid-state`:        (set) The socket is already in the Listener state.
				 */
				hopLimit(self: borrow<TcpSocket>): result<u8, ErrorCode>;
				
				setHopLimit(self: borrow<TcpSocket>, value: u8): result<void, ErrorCode>;
				
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
				 * - `invalid-state`:        (set) The socket is already in the Connection state.
				 * - `invalid-state`:        (set) The socket is already in the Listener state.
				 */
				receiveBufferSize(self: borrow<TcpSocket>): result<u64, ErrorCode>;
				
				setReceiveBufferSize(self: borrow<TcpSocket>, value: u64): result<void, ErrorCode>;
				
				sendBufferSize(self: borrow<TcpSocket>): result<u64, ErrorCode>;
				
				setSendBufferSize(self: borrow<TcpSocket>, value: u64): result<void, ErrorCode>;
				
				/**
				 * Create a `pollable` which will resolve once the socket is ready for I/O.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(self: borrow<TcpSocket>): own<Pollable>;
				
				/**
				 * Initiate a graceful shutdown.
				 * 
				 * - receive: the socket is not expecting to receive any more data from the peer. All subsequent read
				 * operations on the `input-stream` associated with this socket will return an End Of Stream indication.
				 * Any data still in the receive queue at time of calling `shutdown` will be discarded.
				 * - send: the socket is not expecting to send any more data to the peer. All subsequent write
				 * operations on the `output-stream` associated with this socket will return an error.
				 * - both: same effect as receive & send combined.
				 * 
				 * The shutdown function does not close (drop) the socket.
				 * 
				 * # Typical errors
				 * - `invalid-state`: The socket is not in the Connection state. (ENOTCONN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/shutdown.html>
				 * - <https://man7.org/linux/man-pages/man2/shutdown.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-shutdown>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=shutdown&sektion=2>
				 */
				shutdown(self: borrow<TcpSocket>, shutdownType: ShutdownType): result<void, ErrorCode>;
			};
			export interface Interface {
				startBind(network: borrow<Network>, localAddress: IpSocketAddress): result<void, ErrorCode>;
				finishBind(): result<void, ErrorCode>;
				startConnect(network: borrow<Network>, remoteAddress: IpSocketAddress): result<void, ErrorCode>;
				finishConnect(): result<[own<InputStream>, own<OutputStream>], ErrorCode>;
				startListen(): result<void, ErrorCode>;
				finishListen(): result<void, ErrorCode>;
				accept(): result<[own<TcpSocket>, own<InputStream>, own<OutputStream>], ErrorCode>;
				localAddress(): result<IpSocketAddress, ErrorCode>;
				remoteAddress(): result<IpSocketAddress, ErrorCode>;
				isListening(): boolean;
				addressFamily(): IpAddressFamily;
				ipv6Only(): result<boolean, ErrorCode>;
				setIpv6Only(value: boolean): result<void, ErrorCode>;
				setListenBacklogSize(value: u64): result<void, ErrorCode>;
				keepAliveEnabled(): result<boolean, ErrorCode>;
				setKeepAliveEnabled(value: boolean): result<void, ErrorCode>;
				keepAliveIdleTime(): result<Duration, ErrorCode>;
				setKeepAliveIdleTime(value: Duration): result<void, ErrorCode>;
				keepAliveInterval(): result<Duration, ErrorCode>;
				setKeepAliveInterval(value: Duration): result<void, ErrorCode>;
				keepAliveCount(): result<u32, ErrorCode>;
				setKeepAliveCount(value: u32): result<void, ErrorCode>;
				hopLimit(): result<u8, ErrorCode>;
				setHopLimit(value: u8): result<void, ErrorCode>;
				receiveBufferSize(): result<u64, ErrorCode>;
				setReceiveBufferSize(value: u64): result<void, ErrorCode>;
				sendBufferSize(): result<u64, ErrorCode>;
				setSendBufferSize(value: u64): result<void, ErrorCode>;
				subscribe(): own<Pollable>;
				shutdown(shutdownType: ShutdownType): result<void, ErrorCode>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type TcpSocket = resource;
	}
	export type Tcp<TS extends sockets.Tcp.TcpSocket.Module | sockets.Tcp.TcpSocket.Manager = sockets.Tcp.TcpSocket.Module | sockets.Tcp.TcpSocket.Manager> = {
		TcpSocket: TS;
	};
	
	export namespace TcpCreateSocket {
		
		export type Network = sockets.Network.Network;
		
		export type ErrorCode = sockets.Network.ErrorCode;
		
		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		
		export type TcpSocket = sockets.Tcp.TcpSocket;
		
		/**
		 * Create a new TCP socket.
		 * 
		 * Similar to `socket(AF_INET or AF_INET6, SOCK_STREAM, IPPROTO_TCP)` in POSIX.
		 * 
		 * This function does not require a network capability handle. This is considered to be safe because
		 * at time of creation, the socket is not bound to any `network` yet. Up to the moment `bind`/`listen`/`connect`
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
		 */
		export type createTcpSocket = (addressFamily: IpAddressFamily) => result<own<TcpSocket>, ErrorCode>;
	}
	export type TcpCreateSocket = {
		createTcpSocket: TcpCreateSocket.createTcpSocket;
	};
	
	export namespace Udp {
		
		export type Pollable = io.Poll.Pollable;
		
		export type Network = sockets.Network.Network;
		
		export type ErrorCode = sockets.Network.ErrorCode;
		
		export type IpSocketAddress = sockets.Network.IpSocketAddress;
		
		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		
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
			export type Module = {
				
				/**
				 * Bind the socket to a specific network on the provided IP address and port.
				 * 
				 * If the IP address is zero (`0.0.0.0` in IPv4, `::` in IPv6), it is left to the implementation to decide which
				 * network interface(s) to bind to.
				 * If the port is zero, the socket will be bound to a random free port.
				 * 
				 * Unlike in POSIX, this function is async. This enables interactive WASI hosts to inject permission prompts.
				 * 
				 * # Typical `start` errors
				 * - `invalid-argument`:          The `local-address` has the wrong address family. (EAFNOSUPPORT, EFAULT on Windows)
				 * - `invalid-state`:             The socket is already bound. (EINVAL)
				 * 
				 * # Typical `finish` errors
				 * - `address-in-use`:            No ephemeral ports available. (EADDRINUSE, ENOBUFS on Windows)
				 * - `address-in-use`:            Address is already in use. (EADDRINUSE)
				 * - `address-not-bindable`:      `local-address` is not an address that the `network` can bind to. (EADDRNOTAVAIL)
				 * - `not-in-progress`:           A `bind` operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/bind.html>
				 * - <https://man7.org/linux/man-pages/man2/bind.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-bind>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=bind&sektion=2&format=html>
				 */
				startBind(self: borrow<UdpSocket>, network: borrow<Network>, localAddress: IpSocketAddress): result<void, ErrorCode>;
				
				finishBind(self: borrow<UdpSocket>): result<void, ErrorCode>;
				
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
				 * - `invalid-argument`:          `remote-address` is a non-IPv4-mapped IPv6 address, but the socket was bound to a specific IPv4-mapped IPv6 address. (or vice versa)
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
				 */
				stream(self: borrow<UdpSocket>, remoteAddress: IpSocketAddress | undefined): result<[own<IncomingDatagramStream>, own<OutgoingDatagramStream>], ErrorCode>;
				
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
				 */
				localAddress(self: borrow<UdpSocket>): result<IpSocketAddress, ErrorCode>;
				
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
				 */
				remoteAddress(self: borrow<UdpSocket>): result<IpSocketAddress, ErrorCode>;
				
				/**
				 * Whether this is a IPv4 or IPv6 socket.
				 * 
				 * Equivalent to the SO_DOMAIN socket option.
				 */
				addressFamily(self: borrow<UdpSocket>): IpAddressFamily;
				
				/**
				 * Whether IPv4 compatibility (dual-stack) mode is disabled or not.
				 * 
				 * Equivalent to the IPV6_V6ONLY socket option.
				 * 
				 * # Typical errors
				 * - `not-supported`:        (get/set) `this` socket is an IPv4 socket.
				 * - `invalid-state`:        (set) The socket is already bound.
				 * - `not-supported`:        (set) Host does not support dual-stack sockets. (Implementations are not required to.)
				 */
				ipv6Only(self: borrow<UdpSocket>): result<boolean, ErrorCode>;
				
				setIpv6Only(self: borrow<UdpSocket>, value: boolean): result<void, ErrorCode>;
				
				/**
				 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
				 * 
				 * If the provided value is 0, an `invalid-argument` error is returned.
				 * 
				 * # Typical errors
				 * - `invalid-argument`:     (set) The TTL value must be 1 or higher.
				 */
				unicastHopLimit(self: borrow<UdpSocket>): result<u8, ErrorCode>;
				
				setUnicastHopLimit(self: borrow<UdpSocket>, value: u8): result<void, ErrorCode>;
				
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
				 */
				receiveBufferSize(self: borrow<UdpSocket>): result<u64, ErrorCode>;
				
				setReceiveBufferSize(self: borrow<UdpSocket>, value: u64): result<void, ErrorCode>;
				
				sendBufferSize(self: borrow<UdpSocket>): result<u64, ErrorCode>;
				
				setSendBufferSize(self: borrow<UdpSocket>, value: u64): result<void, ErrorCode>;
				
				/**
				 * Create a `pollable` which will resolve once the socket is ready for I/O.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(self: borrow<UdpSocket>): own<Pollable>;
			};
			export interface Interface {
				startBind(network: borrow<Network>, localAddress: IpSocketAddress): result<void, ErrorCode>;
				finishBind(): result<void, ErrorCode>;
				stream(remoteAddress: IpSocketAddress | undefined): result<[own<IncomingDatagramStream>, own<OutgoingDatagramStream>], ErrorCode>;
				localAddress(): result<IpSocketAddress, ErrorCode>;
				remoteAddress(): result<IpSocketAddress, ErrorCode>;
				addressFamily(): IpAddressFamily;
				ipv6Only(): result<boolean, ErrorCode>;
				setIpv6Only(value: boolean): result<void, ErrorCode>;
				unicastHopLimit(): result<u8, ErrorCode>;
				setUnicastHopLimit(value: u8): result<void, ErrorCode>;
				receiveBufferSize(): result<u64, ErrorCode>;
				setReceiveBufferSize(value: u64): result<void, ErrorCode>;
				sendBufferSize(): result<u64, ErrorCode>;
				setSendBufferSize(value: u64): result<void, ErrorCode>;
				subscribe(): own<Pollable>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type UdpSocket = resource;
		
		export namespace IncomingDatagramStream {
			export type Module = {
				
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
				 */
				receive(self: borrow<IncomingDatagramStream>, maxResults: u64): result<IncomingDatagram[], ErrorCode>;
				
				/**
				 * Create a `pollable` which will resolve once the stream is ready to receive again.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(self: borrow<IncomingDatagramStream>): own<Pollable>;
			};
			export interface Interface {
				receive(maxResults: u64): result<IncomingDatagram[], ErrorCode>;
				subscribe(): own<Pollable>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type IncomingDatagramStream = resource;
		
		export namespace OutgoingDatagramStream {
			export type Module = {
				
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
				 */
				checkSend(self: borrow<OutgoingDatagramStream>): result<u64, ErrorCode>;
				
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
				 * - `invalid-argument`:        `remote-address` is a non-IPv4-mapped IPv6 address, but the socket was bound to a specific IPv4-mapped IPv6 address. (or vice versa)
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
				 */
				send(self: borrow<OutgoingDatagramStream>, datagrams: OutgoingDatagram[]): result<u64, ErrorCode>;
				
				/**
				 * Create a `pollable` which will resolve once the stream is ready to send again.
				 * 
				 * Note: this function is here for WASI Preview2 only.
				 * It's planned to be removed when `future` is natively supported in Preview3.
				 */
				subscribe(self: borrow<OutgoingDatagramStream>): own<Pollable>;
			};
			export interface Interface {
				checkSend(): result<u64, ErrorCode>;
				send(datagrams: OutgoingDatagram[]): result<u64, ErrorCode>;
				subscribe(): own<Pollable>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type OutgoingDatagramStream = resource;
	}
	export type Udp<US extends sockets.Udp.UdpSocket.Module | sockets.Udp.UdpSocket.Manager = sockets.Udp.UdpSocket.Module | sockets.Udp.UdpSocket.Manager, IDS extends sockets.Udp.IncomingDatagramStream.Module | sockets.Udp.IncomingDatagramStream.Manager = sockets.Udp.IncomingDatagramStream.Module | sockets.Udp.IncomingDatagramStream.Manager, ODS extends sockets.Udp.OutgoingDatagramStream.Module | sockets.Udp.OutgoingDatagramStream.Manager = sockets.Udp.OutgoingDatagramStream.Module | sockets.Udp.OutgoingDatagramStream.Manager> = {
		UdpSocket: US;
		IncomingDatagramStream: IDS;
		OutgoingDatagramStream: ODS;
	};
	
	export namespace UdpCreateSocket {
		
		export type Network = sockets.Network.Network;
		
		export type ErrorCode = sockets.Network.ErrorCode;
		
		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		
		export type UdpSocket = sockets.Udp.UdpSocket;
		
		/**
		 * Create a new UDP socket.
		 * 
		 * Similar to `socket(AF_INET or AF_INET6, SOCK_DGRAM, IPPROTO_UDP)` in POSIX.
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
		 */
		export type createUdpSocket = (addressFamily: IpAddressFamily) => result<own<UdpSocket>, ErrorCode>;
	}
	export type UdpCreateSocket = {
		createUdpSocket: UdpCreateSocket.createUdpSocket;
	};
	
}
export type sockets<INL extends sockets.IpNameLookup = sockets.IpNameLookup, T extends sockets.Tcp = sockets.Tcp, U extends sockets.Udp = sockets.Udp> = {
	Network?: sockets.Network;
	InstanceNetwork?: sockets.InstanceNetwork;
	IpNameLookup?: INL;
	Tcp?: T;
	TcpCreateSocket?: sockets.TcpCreateSocket;
	Udp?: U;
	UdpCreateSocket?: sockets.UdpCreateSocket;
};

export namespace sockets {
	export namespace Network.$ {
		export const Network = new $wcm.ResourceType('network');
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
	}
	export namespace Network._ {
		export const id = 'wasi:sockets/network' as const;
		export const witName = 'network' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
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
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['Network', $.Network]
		]);
		export namespace Network {
			export type WasmInterface = {
			};
		}
		export type WasmInterface = {
		} & Network.WasmInterface;
		export namespace Network  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): sockets.Network.Network.Module {
				return $wcm.Module.create<sockets.Network.Network.Module>($.Network, wasmInterface, context);
			}
			export function Manager(): sockets.Network.Network.Manager {
				return new $wcm.ResourceManager<sockets.Network.Network.Interface>();
			}
		}
		export function createHost(service: sockets.Network, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): sockets.Network {
			return $wcm.Service.create<sockets.Network>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace InstanceNetwork.$ {
		export const Network = sockets.Network.$.Network;
		export const instanceNetwork = new $wcm.FunctionType<sockets.InstanceNetwork.instanceNetwork>('instance-network', [], new $wcm.OwnType<sockets.InstanceNetwork.Network>(Network));
	}
	export namespace InstanceNetwork._ {
		export const id = 'wasi:sockets/instance-network' as const;
		export const witName = 'instance-network' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Network', $.Network]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['instanceNetwork', $.instanceNetwork]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'instance-network': () => i32;
		};
		export function createHost(service: sockets.InstanceNetwork, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): sockets.InstanceNetwork {
			return $wcm.Service.create<sockets.InstanceNetwork>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace IpNameLookup.$ {
		export const Pollable = io.Poll.$.Pollable;
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpAddress = sockets.Network.$.IpAddress;
		export const ResolveAddressStream = new $wcm.ResourceType('resolve-address-stream');
		ResolveAddressStream.addFunction('resolveNextAddress', new $wcm.FunctionType<sockets.IpNameLookup.ResolveAddressStream.Module['resolveNextAddress']>('[method]resolve-address-stream.resolve-next-address', [
			['self', new $wcm.BorrowType<sockets.IpNameLookup.ResolveAddressStream>(ResolveAddressStream)],
		], new $wcm.ResultType<option<sockets.IpNameLookup.IpAddress>, sockets.IpNameLookup.ErrorCode>(new $wcm.OptionType<sockets.IpNameLookup.IpAddress>(IpAddress), ErrorCode)));
		ResolveAddressStream.addFunction('subscribe', new $wcm.FunctionType<sockets.IpNameLookup.ResolveAddressStream.Module['subscribe']>('[method]resolve-address-stream.subscribe', [
			['self', new $wcm.BorrowType<sockets.IpNameLookup.ResolveAddressStream>(ResolveAddressStream)],
		], new $wcm.OwnType<sockets.IpNameLookup.Pollable>(Pollable)));
		export const resolveAddresses = new $wcm.FunctionType<sockets.IpNameLookup.resolveAddresses>('resolve-addresses',[
			['network', new $wcm.BorrowType<sockets.IpNameLookup.Network>(Network)],
			['name', $wcm.wstring],
		], new $wcm.ResultType<own<sockets.IpNameLookup.ResolveAddressStream>, sockets.IpNameLookup.ErrorCode>(new $wcm.OwnType<sockets.IpNameLookup.ResolveAddressStream>(ResolveAddressStream), ErrorCode));
	}
	export namespace IpNameLookup._ {
		export const id = 'wasi:sockets/ip-name-lookup' as const;
		export const witName = 'ip-name-lookup' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Pollable', $.Pollable],
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpAddress', $.IpAddress],
			['ResolveAddressStream', $.ResolveAddressStream]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['resolveAddresses', $.resolveAddresses]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['ResolveAddressStream', $.ResolveAddressStream]
		]);
		export namespace ResolveAddressStream {
			export type WasmInterface = {
				'[method]resolve-address-stream.resolve-next-address': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32]>) => void;
				'[method]resolve-address-stream.subscribe': (self: i32) => i32;
			};
		}
		export type WasmInterface = {
			'resolve-addresses': (network: i32, name_ptr: i32, name_len: i32, result: ptr<[i32, i32]>) => void;
		} & ResolveAddressStream.WasmInterface;
		export namespace ResolveAddressStream  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): sockets.IpNameLookup.ResolveAddressStream.Module {
				return $wcm.Module.create<sockets.IpNameLookup.ResolveAddressStream.Module>($.ResolveAddressStream, wasmInterface, context);
			}
			export function Manager(): sockets.IpNameLookup.ResolveAddressStream.Manager {
				return new $wcm.ResourceManager<sockets.IpNameLookup.ResolveAddressStream.Interface>();
			}
		}
		export function createHost(service: sockets.IpNameLookup, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export type ClassService = sockets.IpNameLookup<sockets.IpNameLookup.ResolveAddressStream.Manager>;
		export type ModuleService = sockets.IpNameLookup<sockets.IpNameLookup.ResolveAddressStream.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): sockets.IpNameLookup;
		export function createService<RAS extends sockets.IpNameLookup.ResolveAddressStream.Module | sockets.IpNameLookup.ResolveAddressStream.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, ras: $wcm.ResourceTag<RAS>): sockets.IpNameLookup<RAS>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, ras?: $wcm.ResourceTag<any> | $wcm.ResourceKind): sockets.IpNameLookup {
			ras = ras ?? $wcm.ResourceKind.class;
			if (ras === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['ResolveAddressStream', $.ResolveAddressStream, ResolveAddressStream.Manager]], wasmInterface, context);
			} else if (ras === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['ResolveAddressStream', $.ResolveAddressStream, ResolveAddressStream.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<sockets.IpNameLookup>(functions, [['ResolveAddressStream', $.ResolveAddressStream, ras!]], wasmInterface, context);
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
		export const TcpSocket = new $wcm.ResourceType('tcp-socket');
		TcpSocket.addFunction('startBind', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['startBind']>('[method]tcp-socket.start-bind', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['network', new $wcm.BorrowType<sockets.Tcp.Network>(Network)],
			['localAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('finishBind', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['finishBind']>('[method]tcp-socket.finish-bind', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('startConnect', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['startConnect']>('[method]tcp-socket.start-connect', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['network', new $wcm.BorrowType<sockets.Tcp.Network>(Network)],
			['remoteAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('finishConnect', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['finishConnect']>('[method]tcp-socket.finish-connect', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<[own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>], sockets.Tcp.ErrorCode>(new $wcm.TupleType<[own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>]>([new $wcm.OwnType<sockets.Tcp.InputStream>(InputStream), new $wcm.OwnType<sockets.Tcp.OutputStream>(OutputStream)]), ErrorCode)));
		TcpSocket.addFunction('startListen', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['startListen']>('[method]tcp-socket.start-listen', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('finishListen', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['finishListen']>('[method]tcp-socket.finish-listen', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('accept', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['accept']>('[method]tcp-socket.accept', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<[own<sockets.Tcp.TcpSocket>, own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>], sockets.Tcp.ErrorCode>(new $wcm.TupleType<[own<sockets.Tcp.TcpSocket>, own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>]>([new $wcm.OwnType<sockets.Tcp.TcpSocket>(TcpSocket), new $wcm.OwnType<sockets.Tcp.InputStream>(InputStream), new $wcm.OwnType<sockets.Tcp.OutputStream>(OutputStream)]), ErrorCode)));
		TcpSocket.addFunction('localAddress', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['localAddress']>('[method]tcp-socket.local-address', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<sockets.Tcp.IpSocketAddress, sockets.Tcp.ErrorCode>(IpSocketAddress, ErrorCode)));
		TcpSocket.addFunction('remoteAddress', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['remoteAddress']>('[method]tcp-socket.remote-address', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<sockets.Tcp.IpSocketAddress, sockets.Tcp.ErrorCode>(IpSocketAddress, ErrorCode)));
		TcpSocket.addFunction('isListening', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['isListening']>('[method]tcp-socket.is-listening', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], $wcm.bool));
		TcpSocket.addFunction('addressFamily', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['addressFamily']>('[method]tcp-socket.address-family', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], IpAddressFamily));
		TcpSocket.addFunction('ipv6Only', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['ipv6Only']>('[method]tcp-socket.ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<boolean, sockets.Tcp.ErrorCode>($wcm.bool, ErrorCode)));
		TcpSocket.addFunction('setIpv6Only', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setIpv6Only']>('[method]tcp-socket.set-ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('setListenBacklogSize', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setListenBacklogSize']>('[method]tcp-socket.set-listen-backlog-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('keepAliveEnabled', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['keepAliveEnabled']>('[method]tcp-socket.keep-alive-enabled', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<boolean, sockets.Tcp.ErrorCode>($wcm.bool, ErrorCode)));
		TcpSocket.addFunction('setKeepAliveEnabled', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setKeepAliveEnabled']>('[method]tcp-socket.set-keep-alive-enabled', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('keepAliveIdleTime', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['keepAliveIdleTime']>('[method]tcp-socket.keep-alive-idle-time', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<sockets.Tcp.Duration, sockets.Tcp.ErrorCode>(Duration, ErrorCode)));
		TcpSocket.addFunction('setKeepAliveIdleTime', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setKeepAliveIdleTime']>('[method]tcp-socket.set-keep-alive-idle-time', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', Duration],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('keepAliveInterval', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['keepAliveInterval']>('[method]tcp-socket.keep-alive-interval', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<sockets.Tcp.Duration, sockets.Tcp.ErrorCode>(Duration, ErrorCode)));
		TcpSocket.addFunction('setKeepAliveInterval', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setKeepAliveInterval']>('[method]tcp-socket.set-keep-alive-interval', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', Duration],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('keepAliveCount', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['keepAliveCount']>('[method]tcp-socket.keep-alive-count', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<u32, sockets.Tcp.ErrorCode>($wcm.u32, ErrorCode)));
		TcpSocket.addFunction('setKeepAliveCount', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setKeepAliveCount']>('[method]tcp-socket.set-keep-alive-count', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u32],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('hopLimit', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['hopLimit']>('[method]tcp-socket.hop-limit', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<u8, sockets.Tcp.ErrorCode>($wcm.u8, ErrorCode)));
		TcpSocket.addFunction('setHopLimit', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setHopLimit']>('[method]tcp-socket.set-hop-limit', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u8],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('receiveBufferSize', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['receiveBufferSize']>('[method]tcp-socket.receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<u64, sockets.Tcp.ErrorCode>($wcm.u64, ErrorCode)));
		TcpSocket.addFunction('setReceiveBufferSize', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setReceiveBufferSize']>('[method]tcp-socket.set-receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('sendBufferSize', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['sendBufferSize']>('[method]tcp-socket.send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<u64, sockets.Tcp.ErrorCode>($wcm.u64, ErrorCode)));
		TcpSocket.addFunction('setSendBufferSize', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['setSendBufferSize']>('[method]tcp-socket.set-send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction('subscribe', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['subscribe']>('[method]tcp-socket.subscribe', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.OwnType<sockets.Tcp.Pollable>(Pollable)));
		TcpSocket.addFunction('shutdown', new $wcm.FunctionType<sockets.Tcp.TcpSocket.Module['shutdown']>('[method]tcp-socket.shutdown', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['shutdownType', ShutdownType],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
	}
	export namespace Tcp._ {
		export const id = 'wasi:sockets/tcp' as const;
		export const witName = 'tcp' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
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
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['TcpSocket', $.TcpSocket]
		]);
		export namespace TcpSocket {
			export type WasmInterface = {
				'[method]tcp-socket.start-bind': (self: i32, network: i32, localAddress_IpSocketAddress_case: i32, localAddress_IpSocketAddress_0: i32, localAddress_IpSocketAddress_1: i32, localAddress_IpSocketAddress_2: i32, localAddress_IpSocketAddress_3: i32, localAddress_IpSocketAddress_4: i32, localAddress_IpSocketAddress_5: i32, localAddress_IpSocketAddress_6: i32, localAddress_IpSocketAddress_7: i32, localAddress_IpSocketAddress_8: i32, localAddress_IpSocketAddress_9: i32, localAddress_IpSocketAddress_10: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.finish-bind': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.start-connect': (self: i32, network: i32, remoteAddress_IpSocketAddress_case: i32, remoteAddress_IpSocketAddress_0: i32, remoteAddress_IpSocketAddress_1: i32, remoteAddress_IpSocketAddress_2: i32, remoteAddress_IpSocketAddress_3: i32, remoteAddress_IpSocketAddress_4: i32, remoteAddress_IpSocketAddress_5: i32, remoteAddress_IpSocketAddress_6: i32, remoteAddress_IpSocketAddress_7: i32, remoteAddress_IpSocketAddress_8: i32, remoteAddress_IpSocketAddress_9: i32, remoteAddress_IpSocketAddress_10: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.finish-connect': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]tcp-socket.start-listen': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.finish-listen': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.accept': (self: i32, result: ptr<[i32, i32, i32, i32]>) => void;
				'[method]tcp-socket.local-address': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32]>) => void;
				'[method]tcp-socket.remote-address': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32]>) => void;
				'[method]tcp-socket.is-listening': (self: i32) => i32;
				'[method]tcp-socket.address-family': (self: i32) => i32;
				'[method]tcp-socket.ipv6-only': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-ipv6-only': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-listen-backlog-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.keep-alive-enabled': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-keep-alive-enabled': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.keep-alive-idle-time': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]tcp-socket.set-keep-alive-idle-time': (self: i32, value_Duration: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.keep-alive-interval': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]tcp-socket.set-keep-alive-interval': (self: i32, value_Duration: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.keep-alive-count': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-keep-alive-count': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.hop-limit': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-hop-limit': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.receive-buffer-size': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]tcp-socket.set-receive-buffer-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.send-buffer-size': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]tcp-socket.set-send-buffer-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.subscribe': (self: i32) => i32;
				'[method]tcp-socket.shutdown': (self: i32, shutdownType_ShutdownType: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export type WasmInterface = {
		} & TcpSocket.WasmInterface;
		export namespace TcpSocket  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): sockets.Tcp.TcpSocket.Module {
				return $wcm.Module.create<sockets.Tcp.TcpSocket.Module>($.TcpSocket, wasmInterface, context);
			}
			export function Manager(): sockets.Tcp.TcpSocket.Manager {
				return new $wcm.ResourceManager<sockets.Tcp.TcpSocket.Interface>();
			}
		}
		export function createHost(service: sockets.Tcp, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export type ClassService = sockets.Tcp<sockets.Tcp.TcpSocket.Manager>;
		export type ModuleService = sockets.Tcp<sockets.Tcp.TcpSocket.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): sockets.Tcp;
		export function createService<TS extends sockets.Tcp.TcpSocket.Module | sockets.Tcp.TcpSocket.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, ts: $wcm.ResourceTag<TS>): sockets.Tcp<TS>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, ts?: $wcm.ResourceTag<any> | $wcm.ResourceKind): sockets.Tcp {
			ts = ts ?? $wcm.ResourceKind.class;
			if (ts === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['TcpSocket', $.TcpSocket, TcpSocket.Manager]], wasmInterface, context);
			} else if (ts === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['TcpSocket', $.TcpSocket, TcpSocket.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<sockets.Tcp>(functions, [['TcpSocket', $.TcpSocket, ts!]], wasmInterface, context);
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
		], new $wcm.ResultType<own<sockets.TcpCreateSocket.TcpSocket>, sockets.TcpCreateSocket.ErrorCode>(new $wcm.OwnType<sockets.TcpCreateSocket.TcpSocket>(TcpSocket), ErrorCode));
	}
	export namespace TcpCreateSocket._ {
		export const id = 'wasi:sockets/tcp-create-socket' as const;
		export const witName = 'tcp-create-socket' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpAddressFamily', $.IpAddressFamily],
			['TcpSocket', $.TcpSocket]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['createTcpSocket', $.createTcpSocket]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'create-tcp-socket': (addressFamily_IpAddressFamily_IpAddressFamily: i32, result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: sockets.TcpCreateSocket, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): sockets.TcpCreateSocket {
			return $wcm.Service.create<sockets.TcpCreateSocket>(functions, [], wasmInterface, context);
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
		export const UdpSocket = new $wcm.ResourceType('udp-socket');
		export const IncomingDatagramStream = new $wcm.ResourceType('incoming-datagram-stream');
		export const OutgoingDatagramStream = new $wcm.ResourceType('outgoing-datagram-stream');
		UdpSocket.addFunction('startBind', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['startBind']>('[method]udp-socket.start-bind', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['network', new $wcm.BorrowType<sockets.Udp.Network>(Network)],
			['localAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction('finishBind', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['finishBind']>('[method]udp-socket.finish-bind', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction('stream', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['stream']>('[method]udp-socket.stream', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['remoteAddress', new $wcm.OptionType<sockets.Udp.IpSocketAddress>(IpSocketAddress)],
		], new $wcm.ResultType<[own<sockets.Udp.IncomingDatagramStream>, own<sockets.Udp.OutgoingDatagramStream>], sockets.Udp.ErrorCode>(new $wcm.TupleType<[own<sockets.Udp.IncomingDatagramStream>, own<sockets.Udp.OutgoingDatagramStream>]>([new $wcm.OwnType<sockets.Udp.IncomingDatagramStream>(IncomingDatagramStream), new $wcm.OwnType<sockets.Udp.OutgoingDatagramStream>(OutgoingDatagramStream)]), ErrorCode)));
		UdpSocket.addFunction('localAddress', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['localAddress']>('[method]udp-socket.local-address', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<sockets.Udp.IpSocketAddress, sockets.Udp.ErrorCode>(IpSocketAddress, ErrorCode)));
		UdpSocket.addFunction('remoteAddress', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['remoteAddress']>('[method]udp-socket.remote-address', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<sockets.Udp.IpSocketAddress, sockets.Udp.ErrorCode>(IpSocketAddress, ErrorCode)));
		UdpSocket.addFunction('addressFamily', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['addressFamily']>('[method]udp-socket.address-family', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], IpAddressFamily));
		UdpSocket.addFunction('ipv6Only', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['ipv6Only']>('[method]udp-socket.ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<boolean, sockets.Udp.ErrorCode>($wcm.bool, ErrorCode)));
		UdpSocket.addFunction('setIpv6Only', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['setIpv6Only']>('[method]udp-socket.set-ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction('unicastHopLimit', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['unicastHopLimit']>('[method]udp-socket.unicast-hop-limit', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<u8, sockets.Udp.ErrorCode>($wcm.u8, ErrorCode)));
		UdpSocket.addFunction('setUnicastHopLimit', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['setUnicastHopLimit']>('[method]udp-socket.set-unicast-hop-limit', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.u8],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction('receiveBufferSize', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['receiveBufferSize']>('[method]udp-socket.receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		UdpSocket.addFunction('setReceiveBufferSize', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['setReceiveBufferSize']>('[method]udp-socket.set-receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction('sendBufferSize', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['sendBufferSize']>('[method]udp-socket.send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		UdpSocket.addFunction('setSendBufferSize', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['setSendBufferSize']>('[method]udp-socket.set-send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction('subscribe', new $wcm.FunctionType<sockets.Udp.UdpSocket.Module['subscribe']>('[method]udp-socket.subscribe', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.OwnType<sockets.Udp.Pollable>(Pollable)));
		IncomingDatagramStream.addFunction('receive', new $wcm.FunctionType<sockets.Udp.IncomingDatagramStream.Module['receive']>('[method]incoming-datagram-stream.receive', [
			['self', new $wcm.BorrowType<sockets.Udp.IncomingDatagramStream>(IncomingDatagramStream)],
			['maxResults', $wcm.u64],
		], new $wcm.ResultType<sockets.Udp.IncomingDatagram[], sockets.Udp.ErrorCode>(new $wcm.ListType<sockets.Udp.IncomingDatagram>(IncomingDatagram), ErrorCode)));
		IncomingDatagramStream.addFunction('subscribe', new $wcm.FunctionType<sockets.Udp.IncomingDatagramStream.Module['subscribe']>('[method]incoming-datagram-stream.subscribe', [
			['self', new $wcm.BorrowType<sockets.Udp.IncomingDatagramStream>(IncomingDatagramStream)],
		], new $wcm.OwnType<sockets.Udp.Pollable>(Pollable)));
		OutgoingDatagramStream.addFunction('checkSend', new $wcm.FunctionType<sockets.Udp.OutgoingDatagramStream.Module['checkSend']>('[method]outgoing-datagram-stream.check-send', [
			['self', new $wcm.BorrowType<sockets.Udp.OutgoingDatagramStream>(OutgoingDatagramStream)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		OutgoingDatagramStream.addFunction('send', new $wcm.FunctionType<sockets.Udp.OutgoingDatagramStream.Module['send']>('[method]outgoing-datagram-stream.send', [
			['self', new $wcm.BorrowType<sockets.Udp.OutgoingDatagramStream>(OutgoingDatagramStream)],
			['datagrams', new $wcm.ListType<sockets.Udp.OutgoingDatagram>(OutgoingDatagram)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		OutgoingDatagramStream.addFunction('subscribe', new $wcm.FunctionType<sockets.Udp.OutgoingDatagramStream.Module['subscribe']>('[method]outgoing-datagram-stream.subscribe', [
			['self', new $wcm.BorrowType<sockets.Udp.OutgoingDatagramStream>(OutgoingDatagramStream)],
		], new $wcm.OwnType<sockets.Udp.Pollable>(Pollable)));
	}
	export namespace Udp._ {
		export const id = 'wasi:sockets/udp' as const;
		export const witName = 'udp' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
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
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['UdpSocket', $.UdpSocket],
			['IncomingDatagramStream', $.IncomingDatagramStream],
			['OutgoingDatagramStream', $.OutgoingDatagramStream]
		]);
		export namespace UdpSocket {
			export type WasmInterface = {
				'[method]udp-socket.start-bind': (self: i32, network: i32, localAddress_IpSocketAddress_case: i32, localAddress_IpSocketAddress_0: i32, localAddress_IpSocketAddress_1: i32, localAddress_IpSocketAddress_2: i32, localAddress_IpSocketAddress_3: i32, localAddress_IpSocketAddress_4: i32, localAddress_IpSocketAddress_5: i32, localAddress_IpSocketAddress_6: i32, localAddress_IpSocketAddress_7: i32, localAddress_IpSocketAddress_8: i32, localAddress_IpSocketAddress_9: i32, localAddress_IpSocketAddress_10: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.finish-bind': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.stream': (self: i32, remoteAddress_case: i32, remoteAddress_option_IpSocketAddress_case: i32, remoteAddress_option_IpSocketAddress_0: i32, remoteAddress_option_IpSocketAddress_1: i32, remoteAddress_option_IpSocketAddress_2: i32, remoteAddress_option_IpSocketAddress_3: i32, remoteAddress_option_IpSocketAddress_4: i32, remoteAddress_option_IpSocketAddress_5: i32, remoteAddress_option_IpSocketAddress_6: i32, remoteAddress_option_IpSocketAddress_7: i32, remoteAddress_option_IpSocketAddress_8: i32, remoteAddress_option_IpSocketAddress_9: i32, remoteAddress_option_IpSocketAddress_10: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]udp-socket.local-address': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32]>) => void;
				'[method]udp-socket.remote-address': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32]>) => void;
				'[method]udp-socket.address-family': (self: i32) => i32;
				'[method]udp-socket.ipv6-only': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.set-ipv6-only': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.unicast-hop-limit': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.set-unicast-hop-limit': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.receive-buffer-size': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]udp-socket.set-receive-buffer-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.send-buffer-size': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]udp-socket.set-send-buffer-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.subscribe': (self: i32) => i32;
			};
		}
		export namespace IncomingDatagramStream {
			export type WasmInterface = {
				'[method]incoming-datagram-stream.receive': (self: i32, maxResults: i64, result: ptr<[i32, i32, i32]>) => void;
				'[method]incoming-datagram-stream.subscribe': (self: i32) => i32;
			};
		}
		export namespace OutgoingDatagramStream {
			export type WasmInterface = {
				'[method]outgoing-datagram-stream.check-send': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]outgoing-datagram-stream.send': (self: i32, datagrams_ptr: i32, datagrams_len: i32, result: ptr<[i32, i64]>) => void;
				'[method]outgoing-datagram-stream.subscribe': (self: i32) => i32;
			};
		}
		export type WasmInterface = {
		} & UdpSocket.WasmInterface & IncomingDatagramStream.WasmInterface & OutgoingDatagramStream.WasmInterface;
		export namespace UdpSocket  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): sockets.Udp.UdpSocket.Module {
				return $wcm.Module.create<sockets.Udp.UdpSocket.Module>($.UdpSocket, wasmInterface, context);
			}
			export function Manager(): sockets.Udp.UdpSocket.Manager {
				return new $wcm.ResourceManager<sockets.Udp.UdpSocket.Interface>();
			}
		}
		export namespace IncomingDatagramStream  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): sockets.Udp.IncomingDatagramStream.Module {
				return $wcm.Module.create<sockets.Udp.IncomingDatagramStream.Module>($.IncomingDatagramStream, wasmInterface, context);
			}
			export function Manager(): sockets.Udp.IncomingDatagramStream.Manager {
				return new $wcm.ResourceManager<sockets.Udp.IncomingDatagramStream.Interface>();
			}
		}
		export namespace OutgoingDatagramStream  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): sockets.Udp.OutgoingDatagramStream.Module {
				return $wcm.Module.create<sockets.Udp.OutgoingDatagramStream.Module>($.OutgoingDatagramStream, wasmInterface, context);
			}
			export function Manager(): sockets.Udp.OutgoingDatagramStream.Manager {
				return new $wcm.ResourceManager<sockets.Udp.OutgoingDatagramStream.Interface>();
			}
		}
		export function createHost(service: sockets.Udp, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export type ClassService = sockets.Udp<sockets.Udp.UdpSocket.Manager, sockets.Udp.IncomingDatagramStream.Manager, sockets.Udp.OutgoingDatagramStream.Manager>;
		export type ModuleService = sockets.Udp<sockets.Udp.UdpSocket.Module, sockets.Udp.IncomingDatagramStream.Module, sockets.Udp.OutgoingDatagramStream.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): sockets.Udp;
		export function createService<US extends sockets.Udp.UdpSocket.Module | sockets.Udp.UdpSocket.Manager, IDS extends sockets.Udp.IncomingDatagramStream.Module | sockets.Udp.IncomingDatagramStream.Manager, ODS extends sockets.Udp.OutgoingDatagramStream.Module | sockets.Udp.OutgoingDatagramStream.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, us: $wcm.ResourceTag<US>, ids: $wcm.ResourceTag<IDS>, ods: $wcm.ResourceTag<ODS>): sockets.Udp<US, IDS, ODS>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, us?: $wcm.ResourceTag<any> | $wcm.ResourceKind, ids?: $wcm.ResourceTag<any>, ods?: $wcm.ResourceTag<any>): sockets.Udp {
			us = us ?? $wcm.ResourceKind.class;
			if (us === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['UdpSocket', $.UdpSocket, UdpSocket.Manager], ['IncomingDatagramStream', $.IncomingDatagramStream, IncomingDatagramStream.Manager], ['OutgoingDatagramStream', $.OutgoingDatagramStream, OutgoingDatagramStream.Manager]], wasmInterface, context);
			} else if (us === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['UdpSocket', $.UdpSocket, UdpSocket.Module], ['IncomingDatagramStream', $.IncomingDatagramStream, IncomingDatagramStream.Module], ['OutgoingDatagramStream', $.OutgoingDatagramStream, OutgoingDatagramStream.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<sockets.Udp>(functions, [['UdpSocket', $.UdpSocket, us!], ['IncomingDatagramStream', $.IncomingDatagramStream, ids!], ['OutgoingDatagramStream', $.OutgoingDatagramStream, ods!]], wasmInterface, context);
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
		], new $wcm.ResultType<own<sockets.UdpCreateSocket.UdpSocket>, sockets.UdpCreateSocket.ErrorCode>(new $wcm.OwnType<sockets.UdpCreateSocket.UdpSocket>(UdpSocket), ErrorCode));
	}
	export namespace UdpCreateSocket._ {
		export const id = 'wasi:sockets/udp-create-socket' as const;
		export const witName = 'udp-create-socket' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Network', $.Network],
			['ErrorCode', $.ErrorCode],
			['IpAddressFamily', $.IpAddressFamily],
			['UdpSocket', $.UdpSocket]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['createUdpSocket', $.createUdpSocket]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'create-udp-socket': (addressFamily_IpAddressFamily_IpAddressFamily: i32, result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: sockets.UdpCreateSocket, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): sockets.UdpCreateSocket {
			return $wcm.Service.create<sockets.UdpCreateSocket>(functions, [], wasmInterface, context);
		}
	}
}

export namespace sockets._ {
	export const id = 'wasi:sockets' as const;
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
	export type WasmInterface = {
		'wasi:sockets/network'?: Network._.WasmInterface;
		'wasi:sockets/instance-network'?: InstanceNetwork._.WasmInterface;
		'wasi:sockets/ip-name-lookup'?: IpNameLookup._.WasmInterface;
		'wasi:sockets/tcp'?: Tcp._.WasmInterface;
		'wasi:sockets/tcp-create-socket'?: TcpCreateSocket._.WasmInterface;
		'wasi:sockets/udp'?: Udp._.WasmInterface;
		'wasi:sockets/udp-create-socket'?: UdpCreateSocket._.WasmInterface;
	};
	export function createHost(service: sockets, context: $wcm.Context): WasmInterface {
		const result: WasmInterface = Object.create(null);
		if (service.Network !== undefined) {
			result['wasi:sockets/network'] = Network._.createHost(service.Network, context);
		}
		if (service.InstanceNetwork !== undefined) {
			result['wasi:sockets/instance-network'] = InstanceNetwork._.createHost(service.InstanceNetwork, context);
		}
		if (service.IpNameLookup !== undefined) {
			result['wasi:sockets/ip-name-lookup'] = IpNameLookup._.createHost(service.IpNameLookup, context);
		}
		if (service.Tcp !== undefined) {
			result['wasi:sockets/tcp'] = Tcp._.createHost(service.Tcp, context);
		}
		if (service.TcpCreateSocket !== undefined) {
			result['wasi:sockets/tcp-create-socket'] = TcpCreateSocket._.createHost(service.TcpCreateSocket, context);
		}
		if (service.Udp !== undefined) {
			result['wasi:sockets/udp'] = Udp._.createHost(service.Udp, context);
		}
		if (service.UdpCreateSocket !== undefined) {
			result['wasi:sockets/udp-create-socket'] = UdpCreateSocket._.createHost(service.UdpCreateSocket, context);
		}
		return result;
	}
	export type ClassService = sockets<sockets.IpNameLookup._.ClassService, sockets.Tcp._.ClassService, sockets.Udp._.ClassService>;
	export type ModuleService = sockets<sockets.IpNameLookup._.ModuleService, sockets.Tcp._.ModuleService, sockets.Udp._.ModuleService>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): sockets;
	export function createService<INL extends sockets.IpNameLookup, T extends sockets.Tcp, U extends sockets.Udp>(wasmInterface: WasmInterface, context: $wcm.Context, inl: sockets.IpNameLookup, t: sockets.Tcp, u: sockets.Udp): sockets<INL, T, U>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, inl?: sockets.IpNameLookup | $wcm.ResourceKind, t?: sockets.Tcp, u?: sockets.Udp): sockets {
		const result: sockets = Object.create(null);
		inl = inl ?? $wcm.ResourceKind.class;
		if (inl === $wcm.ResourceKind.class || inl === $wcm.ResourceKind.module) {
			if (wasmInterface['wasi:sockets/network'] !== undefined) {
				result.Network = Network._.createService(wasmInterface['wasi:sockets/network'], context, inl);
			}
			if (wasmInterface['wasi:sockets/instance-network'] !== undefined) {
				result.InstanceNetwork = InstanceNetwork._.createService(wasmInterface['wasi:sockets/instance-network'], context, inl);
			}
			if (wasmInterface['wasi:sockets/ip-name-lookup'] !== undefined) {
				result.IpNameLookup = IpNameLookup._.createService(wasmInterface['wasi:sockets/ip-name-lookup'], context, inl);
			}
			if (wasmInterface['wasi:sockets/tcp'] !== undefined) {
				result.Tcp = Tcp._.createService(wasmInterface['wasi:sockets/tcp'], context, inl);
			}
			if (wasmInterface['wasi:sockets/tcp-create-socket'] !== undefined) {
				result.TcpCreateSocket = TcpCreateSocket._.createService(wasmInterface['wasi:sockets/tcp-create-socket'], context, inl);
			}
			if (wasmInterface['wasi:sockets/udp'] !== undefined) {
				result.Udp = Udp._.createService(wasmInterface['wasi:sockets/udp'], context, inl);
			}
			if (wasmInterface['wasi:sockets/udp-create-socket'] !== undefined) {
				result.UdpCreateSocket = UdpCreateSocket._.createService(wasmInterface['wasi:sockets/udp-create-socket'], context, inl);
			}
		} else {
			if (wasmInterface['wasi:sockets/network'] !== undefined) {
				result.Network = Network._.createService(wasmInterface['wasi:sockets/network'], context);
			}
			if (wasmInterface['wasi:sockets/instance-network'] !== undefined) {
				result.InstanceNetwork = InstanceNetwork._.createService(wasmInterface['wasi:sockets/instance-network'], context);
			}
			if (wasmInterface['wasi:sockets/ip-name-lookup'] !== undefined) {
				result.IpNameLookup = inl;
			}
			if (wasmInterface['wasi:sockets/tcp'] !== undefined) {
				result.Tcp = t;
			}
			if (wasmInterface['wasi:sockets/tcp-create-socket'] !== undefined) {
				result.TcpCreateSocket = TcpCreateSocket._.createService(wasmInterface['wasi:sockets/tcp-create-socket'], context);
			}
			if (wasmInterface['wasi:sockets/udp'] !== undefined) {
				result.Udp = u;
			}
			if (wasmInterface['wasi:sockets/udp-create-socket'] !== undefined) {
				result.UdpCreateSocket = UdpCreateSocket._.createService(wasmInterface['wasi:sockets/udp-create-socket'], context);
			}
		}
		return result;
	}
}