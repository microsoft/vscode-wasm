/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u8, u16, u32, resource, own, borrow, result, i32, ptr, u64, i64, option } from '@vscode/wasm-component-model';
import { io } from './io';

export namespace sockets {
	export namespace Network {
		export const id = 'wasi:sockets/network' as const;
		
		
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
			 * The specified address-family is not supported.
			 */
			addressFamilyNotSupported = 'addressFamilyNotSupported',
			
			/**
			 * An IPv4 address was passed to an IPv6 resource, or vice versa.
			 */
			addressFamilyMismatch = 'addressFamilyMismatch',
			
			/**
			 * The socket address is not a valid remote address. E.g. the IP address is set to INADDR_ANY, or the port is set to 0.
			 */
			invalidRemoteAddress = 'invalidRemoteAddress',
			
			/**
			 * The operation is only supported on IPv4 resources.
			 */
			ipv4OnlyOperation = 'ipv4OnlyOperation',
			
			/**
			 * The operation is only supported on IPv6 resources.
			 */
			ipv6OnlyOperation = 'ipv6OnlyOperation',
			
			/**
			 * A new socket resource could not be created because of a system limit.
			 */
			newSocketLimit = 'newSocketLimit',
			
			/**
			 * The socket is already attached to another network.
			 */
			alreadyAttached = 'alreadyAttached',
			
			/**
			 * The socket is already bound.
			 */
			alreadyBound = 'alreadyBound',
			
			/**
			 * The socket is already in the Connection state.
			 */
			alreadyConnected = 'alreadyConnected',
			
			/**
			 * The socket is not bound to any local address.
			 */
			notBound = 'notBound',
			
			/**
			 * The socket is not in the Connection state.
			 */
			notConnected = 'notConnected',
			
			/**
			 * A bind operation failed because the provided address is not an address that the `network` can bind to.
			 */
			addressNotBindable = 'addressNotBindable',
			
			/**
			 * A bind operation failed because the provided address is already in use.
			 */
			addressInUse = 'addressInUse',
			
			/**
			 * A bind operation failed because there are no ephemeral ports available.
			 */
			ephemeralPortsExhausted = 'ephemeralPortsExhausted',
			
			/**
			 * The remote address is not reachable
			 */
			remoteUnreachable = 'remoteUnreachable',
			
			/**
			 * The socket is already in the Listener state.
			 */
			alreadyListening = 'alreadyListening',
			
			/**
			 * The socket is already in the Listener state.
			 */
			notListening = 'notListening',
			
			/**
			 * The connection was forcefully rejected
			 */
			connectionRefused = 'connectionRefused',
			
			/**
			 * The connection was reset.
			 */
			connectionReset = 'connectionReset',
			datagramTooLarge = 'datagramTooLarge',
			
			/**
			 * The provided name is a syntactically invalid domain name.
			 */
			invalidName = 'invalidName',
			
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
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
			};
		}
		export type Network = resource;
	}
	export type Network = {
	};
	
	/**
	 * This interface provides a value-export of the default network handle..
	 */
	export namespace InstanceNetwork {
		export const id = 'wasi:sockets/instance-network' as const;
		
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
		export const id = 'wasi:sockets/ip-name-lookup' as const;
		
		export type Pollable = io.Poll.Pollable;
		
		export type Network = sockets.Network.Network;
		
		export type ErrorCode = sockets.Network.ErrorCode;
		
		export type IpAddress = sockets.Network.IpAddress;
		
		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		
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
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]resolve-address-stream.resolve-next-address': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32, i32, i32, i32, i32, i32]>) => void;
				'[method]resolve-address-stream.subscribe': (self: i32) => i32;
			};
		}
		export type ResolveAddressStream = resource;
		
		/**
		 * Resolve an internet host name to a list of IP addresses.
		 * 
		 * See the wasi-socket proposal README.md for a comparison with getaddrinfo.
		 * 
		 * # Parameters
		 * - `name`: The name to look up. IP addresses are not allowed. Unicode domain names are automatically converted
		 * to ASCII using IDNA encoding.
		 * - `address-family`: If provided, limit the results to addresses of this specific address family.
		 * - `include-unavailable`: When set to true, this function will also return addresses of which the runtime
		 * thinks (or knows) can't be connected to at the moment. For example, this will return IPv6 addresses on
		 * systems without an active IPv6 interface. Notes:
		 * - Even when no public IPv6 interfaces are present or active, names like "localhost" can still resolve to an IPv6 address.
		 * - Whatever is "available" or "unavailable" is volatile and can change everytime a network cable is unplugged.
		 * 
		 * This function never blocks. It either immediately fails or immediately returns successfully with a `resolve-address-stream`
		 * that can be used to (asynchronously) fetch the results.
		 * 
		 * At the moment, the stream never completes successfully with 0 items. Ie. the first call
		 * to `resolve-next-address` never returns `ok(none)`. This may change in the future.
		 * 
		 * # Typical errors
		 * - `invalid-name`:                 `name` is a syntactically invalid domain name.
		 * - `invalid-name`:                 `name` is an IP address.
		 * - `address-family-not-supported`: The specified `address-family` is not supported. (EAI_FAMILY)
		 * 
		 * # References:
		 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getaddrinfo.html>
		 * - <https://man7.org/linux/man-pages/man3/getaddrinfo.3.html>
		 * - <https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfo>
		 * - <https://man.freebsd.org/cgi/man.cgi?query=getaddrinfo&sektion=3>
		 */
		export type resolveAddresses = (network: borrow<Network>, name: string, addressFamily: IpAddressFamily | undefined, includeUnavailable: boolean) => result<own<ResolveAddressStream>, ErrorCode>;
	}
	export type IpNameLookup<RAS extends sockets.IpNameLookup.ResolveAddressStream.Module | sockets.IpNameLookup.ResolveAddressStream.Manager = sockets.IpNameLookup.ResolveAddressStream.Module | sockets.IpNameLookup.ResolveAddressStream.Manager> = {
		ResolveAddressStream: RAS;
		resolveAddresses: IpNameLookup.resolveAddresses;
	};
	
	export namespace Tcp {
		export const id = 'wasi:sockets/tcp' as const;
		
		export type InputStream = io.Streams.InputStream;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type Pollable = io.Poll.Pollable;
		
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
				 * - `address-family-mismatch`:   The `local-address` has the wrong address family. (EINVAL)
				 * - `already-bound`:             The socket is already bound. (EINVAL)
				 * - `concurrency-conflict`:      Another `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
				 * 
				 * # Typical `finish` errors
				 * - `ephemeral-ports-exhausted`: No ephemeral ports available. (EADDRINUSE, ENOBUFS on Windows)
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
				 * # Typical `start` errors
				 * - `address-family-mismatch`:   The `remote-address` has the wrong address family. (EAFNOSUPPORT)
				 * - `invalid-remote-address`:    The IP address in `remote-address` is set to INADDR_ANY (`0.0.0.0` / `::`). (EADDRNOTAVAIL on Windows)
				 * - `invalid-remote-address`:    The port in `remote-address` is set to 0. (EADDRNOTAVAIL on Windows)
				 * - `already-attached`:          The socket is already attached to a different network. The `network` passed to `connect` must be identical to the one passed to `bind`.
				 * - `already-connected`:         The socket is already in the Connection state. (EISCONN)
				 * - `already-listening`:         The socket is already in the Listener state. (EOPNOTSUPP, EINVAL on Windows)
				 * - `concurrency-conflict`:      Another `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
				 * 
				 * # Typical `finish` errors
				 * - `timeout`:                   Connection timed out. (ETIMEDOUT)
				 * - `connection-refused`:        The connection was forcefully rejected. (ECONNREFUSED)
				 * - `connection-reset`:          The connection was reset. (ECONNRESET)
				 * - `remote-unreachable`:        The remote address is not reachable. (EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN)
				 * - `ephemeral-ports-exhausted`: Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE, EADDRNOTAVAIL on Linux, EAGAIN on BSD)
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
				 * - `not-bound`:                 The socket is not bound to any local address. (EDESTADDRREQ)
				 * - `already-connected`:         The socket is already in the Connection state. (EISCONN, EINVAL on BSD)
				 * - `already-listening`:         The socket is already in the Listener state.
				 * - `concurrency-conflict`:      Another `bind`, `connect` or `listen` operation is already in progress. (EINVAL on BSD)
				 * 
				 * # Typical `finish` errors
				 * - `ephemeral-ports-exhausted`: Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE)
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
				 * The returned socket is bound and in the Connection state.
				 * 
				 * On success, this function returns the newly accepted client socket along with
				 * a pair of streams that can be used to read & write to the connection.
				 * 
				 * # Typical errors
				 * - `not-listening`: Socket is not in the Listener state. (EINVAL)
				 * - `would-block`:   No pending connections at the moment. (EWOULDBLOCK, EAGAIN)
				 * 
				 * Host implementations must skip over transient errors returned by the native accept syscall.
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
				 * # Typical errors
				 * - `not-bound`: The socket is not bound to any local address.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getsockname.html>
				 * - <https://man7.org/linux/man-pages/man2/getsockname.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getsockname>
				 * - <https://man.freebsd.org/cgi/man.cgi?getsockname>
				 */
				localAddress(self: borrow<TcpSocket>): result<IpSocketAddress, ErrorCode>;
				
				/**
				 * Get the bound remote address.
				 * 
				 * # Typical errors
				 * - `not-connected`: The socket is not connected to a remote address. (ENOTCONN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getpeername.html>
				 * - <https://man7.org/linux/man-pages/man2/getpeername.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getpeername>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=getpeername&sektion=2&n=1>
				 */
				remoteAddress(self: borrow<TcpSocket>): result<IpSocketAddress, ErrorCode>;
				
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
				 * - `ipv6-only-operation`:  (get/set) `this` socket is an IPv4 socket.
				 * - `already-bound`:        (set) The socket is already bound.
				 * - `not-supported`:        (set) Host does not support dual-stack sockets. (Implementations are not required to.)
				 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
				 */
				ipv6Only(self: borrow<TcpSocket>): result<boolean, ErrorCode>;
				
				setIpv6Only(self: borrow<TcpSocket>, value: boolean): result<void, ErrorCode>;
				
				/**
				 * Hints the desired listen queue size. Implementations are free to ignore this.
				 * 
				 * # Typical errors
				 * - `already-connected`:    (set) The socket is already in the Connection state.
				 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
				 */
				setListenBacklogSize(self: borrow<TcpSocket>, value: u64): result<void, ErrorCode>;
				
				/**
				 * Equivalent to the SO_KEEPALIVE socket option.
				 * 
				 * # Typical errors
				 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
				 */
				keepAlive(self: borrow<TcpSocket>): result<boolean, ErrorCode>;
				
				setKeepAlive(self: borrow<TcpSocket>, value: boolean): result<void, ErrorCode>;
				
				/**
				 * Equivalent to the TCP_NODELAY socket option.
				 * 
				 * # Typical errors
				 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
				 */
				noDelay(self: borrow<TcpSocket>): result<boolean, ErrorCode>;
				
				setNoDelay(self: borrow<TcpSocket>, value: boolean): result<void, ErrorCode>;
				
				/**
				 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
				 * 
				 * # Typical errors
				 * - `already-connected`:    (set) The socket is already in the Connection state.
				 * - `already-listening`:    (set) The socket is already in the Listener state.
				 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
				 */
				unicastHopLimit(self: borrow<TcpSocket>): result<u8, ErrorCode>;
				
				setUnicastHopLimit(self: borrow<TcpSocket>, value: u8): result<void, ErrorCode>;
				
				/**
				 * The kernel buffer space reserved for sends/receives on this socket.
				 * 
				 * Note #1: an implementation may choose to cap or round the buffer size when setting the value.
				 * In other words, after setting a value, reading the same setting back may return a different value.
				 * 
				 * Note #2: there is not necessarily a direct relationship between the kernel buffer size and the bytes of
				 * actual data to be sent/received by the application, because the kernel might also use the buffer space
				 * for internal metadata structures.
				 * 
				 * Equivalent to the SO_RCVBUF and SO_SNDBUF socket options.
				 * 
				 * # Typical errors
				 * - `already-connected`:    (set) The socket is already in the Connection state.
				 * - `already-listening`:    (set) The socket is already in the Listener state.
				 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
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
				 * - `not-connected`: The socket is not in the Connection state. (ENOTCONN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/shutdown.html>
				 * - <https://man7.org/linux/man-pages/man2/shutdown.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-shutdown>
				 * - <https://man.freebsd.org/cgi/man.cgi?query=shutdown&sektion=2>
				 */
				shutdown(self: borrow<TcpSocket>, shutdownType: ShutdownType): result<void, ErrorCode>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
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
				'[method]tcp-socket.address-family': (self: i32) => i32;
				'[method]tcp-socket.ipv6-only': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-ipv6-only': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-listen-backlog-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.keep-alive': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-keep-alive': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.no-delay': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-no-delay': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.unicast-hop-limit': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.set-unicast-hop-limit': (self: i32, value: i32, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.receive-buffer-size': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]tcp-socket.set-receive-buffer-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.send-buffer-size': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]tcp-socket.set-send-buffer-size': (self: i32, value: i64, result: ptr<[i32, i32]>) => void;
				'[method]tcp-socket.subscribe': (self: i32) => i32;
				'[method]tcp-socket.shutdown': (self: i32, shutdownType_ShutdownType: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export type TcpSocket = resource;
	}
	export type Tcp<TS extends sockets.Tcp.TcpSocket.Module | sockets.Tcp.TcpSocket.Manager = sockets.Tcp.TcpSocket.Module | sockets.Tcp.TcpSocket.Manager> = {
		TcpSocket: TS;
	};
	
	export namespace TcpCreateSocket {
		export const id = 'wasi:sockets/tcp-create-socket' as const;
		
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
		 * - `not-supported`:                The host does not support TCP sockets. (EOPNOTSUPP)
		 * - `address-family-not-supported`: The specified `address-family` is not supported. (EAFNOSUPPORT)
		 * - `new-socket-limit`:             The new socket resource could not be created because of a system limit. (EMFILE, ENFILE)
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
		export const id = 'wasi:sockets/udp' as const;
		
		export type Pollable = io.Poll.Pollable;
		
		export type Network = sockets.Network.Network;
		
		export type ErrorCode = sockets.Network.ErrorCode;
		
		export type IpSocketAddress = sockets.Network.IpSocketAddress;
		
		export type IpAddressFamily = sockets.Network.IpAddressFamily;
		
		export type Datagram = {
			data: Uint8Array;
			remoteAddress: IpSocketAddress;
		};
		
		export namespace UdpSocket {
			export type Module = {
				
				/**
				 * Bind the socket to a specific network on the provided IP address and port.
				 * 
				 * If the IP address is zero (`0.0.0.0` in IPv4, `::` in IPv6), it is left to the implementation to decide which
				 * network interface(s) to bind to.
				 * If the TCP/UDP port is zero, the socket will be bound to a random free port.
				 * 
				 * When a socket is not explicitly bound, the first invocation to connect will implicitly bind the socket.
				 * 
				 * Unlike in POSIX, this function is async. This enables interactive WASI hosts to inject permission prompts.
				 * 
				 * # Typical `start` errors
				 * - `address-family-mismatch`:   The `local-address` has the wrong address family. (EINVAL)
				 * - `already-bound`:             The socket is already bound. (EINVAL)
				 * - `concurrency-conflict`:      Another `bind` or `connect` operation is already in progress. (EALREADY)
				 * 
				 * # Typical `finish` errors
				 * - `ephemeral-ports-exhausted`: No ephemeral ports available. (EADDRINUSE, ENOBUFS on Windows)
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
				 * Set the destination address.
				 * 
				 * The local-address is updated based on the best network path to `remote-address`.
				 * 
				 * When a destination address is set:
				 * - all receive operations will only return datagrams sent from the provided `remote-address`.
				 * - the `send` function can only be used to send to this destination.
				 * 
				 * Note that this function does not generate any network traffic and the peer is not aware of this "connection".
				 * 
				 * Unlike in POSIX, this function is async. This enables interactive WASI hosts to inject permission prompts.
				 * 
				 * # Typical `start` errors
				 * - `address-family-mismatch`:   The `remote-address` has the wrong address family. (EAFNOSUPPORT)
				 * - `invalid-remote-address`:    The IP address in `remote-address` is set to INADDR_ANY (`0.0.0.0` / `::`). (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `invalid-remote-address`:    The port in `remote-address` is set to 0. (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `already-attached`:          The socket is already bound to a different network. The `network` passed to `connect` must be identical to the one passed to `bind`.
				 * - `concurrency-conflict`:      Another `bind` or `connect` operation is already in progress. (EALREADY)
				 * 
				 * # Typical `finish` errors
				 * - `ephemeral-ports-exhausted`: Tried to perform an implicit bind, but there were no ephemeral ports available. (EADDRINUSE, EADDRNOTAVAIL on Linux, EAGAIN on BSD)
				 * - `not-in-progress`:           A `connect` operation is not in progress.
				 * - `would-block`:               Can't finish the operation, it is still in progress. (EWOULDBLOCK, EAGAIN)
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/connect.html>
				 * - <https://man7.org/linux/man-pages/man2/connect.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-connect>
				 * - <https://man.freebsd.org/cgi/man.cgi?connect>
				 */
				startConnect(self: borrow<UdpSocket>, network: borrow<Network>, remoteAddress: IpSocketAddress): result<void, ErrorCode>;
				
				finishConnect(self: borrow<UdpSocket>): result<void, ErrorCode>;
				
				/**
				 * Receive messages on the socket.
				 * 
				 * This function attempts to receive up to `max-results` datagrams on the socket without blocking.
				 * The returned list may contain fewer elements than requested, but never more.
				 * If `max-results` is 0, this function returns successfully with an empty list.
				 * 
				 * # Typical errors
				 * - `not-bound`:          The socket is not bound to any local address. (EINVAL)
				 * - `remote-unreachable`: The remote address is not reachable. (ECONNREFUSED, ECONNRESET, ENETRESET on Windows, EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN)
				 * - `would-block`:        There is no pending data available to be read at the moment. (EWOULDBLOCK, EAGAIN)
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
				receive(self: borrow<UdpSocket>, maxResults: u64): result<Datagram[], ErrorCode>;
				
				/**
				 * Send messages on the socket.
				 * 
				 * This function attempts to send all provided `datagrams` on the socket without blocking and
				 * returns how many messages were actually sent (or queued for sending).
				 * 
				 * This function semantically behaves the same as iterating the `datagrams` list and sequentially
				 * sending each individual datagram until either the end of the list has been reached or the first error occurred.
				 * If at least one datagram has been sent successfully, this function never returns an error.
				 * 
				 * If the input list is empty, the function returns `ok(0)`.
				 * 
				 * The remote address option is required. To send a message to the "connected" peer,
				 * call `remote-address` to get their address.
				 * 
				 * # Typical errors
				 * - `address-family-mismatch`: The `remote-address` has the wrong address family. (EAFNOSUPPORT)
				 * - `invalid-remote-address`:  The IP address in `remote-address` is set to INADDR_ANY (`0.0.0.0` / `::`). (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `invalid-remote-address`:  The port in `remote-address` is set to 0. (EDESTADDRREQ, EADDRNOTAVAIL)
				 * - `already-connected`:       The socket is in "connected" mode and the `datagram.remote-address` does not match the address passed to `connect`. (EISCONN)
				 * - `not-bound`:               The socket is not bound to any local address. Unlike POSIX, this function does not perform an implicit bind.
				 * - `remote-unreachable`:      The remote address is not reachable. (ECONNREFUSED, ECONNRESET, ENETRESET on Windows, EHOSTUNREACH, EHOSTDOWN, ENETUNREACH, ENETDOWN)
				 * - `datagram-too-large`:      The datagram is too large. (EMSGSIZE)
				 * - `would-block`:             The send buffer is currently full. (EWOULDBLOCK, EAGAIN)
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
				send(self: borrow<UdpSocket>, datagrams: Datagram[]): result<u64, ErrorCode>;
				
				/**
				 * Get the current bound address.
				 * 
				 * # Typical errors
				 * - `not-bound`: The socket is not bound to any local address.
				 * 
				 * # References
				 * - <https://pubs.opengroup.org/onlinepubs/9699919799/functions/getsockname.html>
				 * - <https://man7.org/linux/man-pages/man2/getsockname.2.html>
				 * - <https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getsockname>
				 * - <https://man.freebsd.org/cgi/man.cgi?getsockname>
				 */
				localAddress(self: borrow<UdpSocket>): result<IpSocketAddress, ErrorCode>;
				
				/**
				 * Get the address set with `connect`.
				 * 
				 * # Typical errors
				 * - `not-connected`: The socket is not connected to a remote address. (ENOTCONN)
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
				 * - `ipv6-only-operation`:  (get/set) `this` socket is an IPv4 socket.
				 * - `already-bound`:        (set) The socket is already bound.
				 * - `not-supported`:        (set) Host does not support dual-stack sockets. (Implementations are not required to.)
				 * - `concurrency-conflict`: (set) Another `bind` or `connect` operation is already in progress. (EALREADY)
				 */
				ipv6Only(self: borrow<UdpSocket>): result<boolean, ErrorCode>;
				
				setIpv6Only(self: borrow<UdpSocket>, value: boolean): result<void, ErrorCode>;
				
				/**
				 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
				 * 
				 * # Typical errors
				 * - `concurrency-conflict`: (set) Another `bind` or `connect` operation is already in progress. (EALREADY)
				 */
				unicastHopLimit(self: borrow<UdpSocket>): result<u8, ErrorCode>;
				
				setUnicastHopLimit(self: borrow<UdpSocket>, value: u8): result<void, ErrorCode>;
				
				/**
				 * The kernel buffer space reserved for sends/receives on this socket.
				 * 
				 * Note #1: an implementation may choose to cap or round the buffer size when setting the value.
				 * In other words, after setting a value, reading the same setting back may return a different value.
				 * 
				 * Note #2: there is not necessarily a direct relationship between the kernel buffer size and the bytes of
				 * actual data to be sent/received by the application, because the kernel might also use the buffer space
				 * for internal metadata structures.
				 * 
				 * Equivalent to the SO_RCVBUF and SO_SNDBUF socket options.
				 * 
				 * # Typical errors
				 * - `concurrency-conflict`: (set) Another `bind` or `connect` operation is already in progress. (EALREADY)
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
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]udp-socket.start-bind': (self: i32, network: i32, localAddress_IpSocketAddress_case: i32, localAddress_IpSocketAddress_0: i32, localAddress_IpSocketAddress_1: i32, localAddress_IpSocketAddress_2: i32, localAddress_IpSocketAddress_3: i32, localAddress_IpSocketAddress_4: i32, localAddress_IpSocketAddress_5: i32, localAddress_IpSocketAddress_6: i32, localAddress_IpSocketAddress_7: i32, localAddress_IpSocketAddress_8: i32, localAddress_IpSocketAddress_9: i32, localAddress_IpSocketAddress_10: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.finish-bind': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.start-connect': (self: i32, network: i32, remoteAddress_IpSocketAddress_case: i32, remoteAddress_IpSocketAddress_0: i32, remoteAddress_IpSocketAddress_1: i32, remoteAddress_IpSocketAddress_2: i32, remoteAddress_IpSocketAddress_3: i32, remoteAddress_IpSocketAddress_4: i32, remoteAddress_IpSocketAddress_5: i32, remoteAddress_IpSocketAddress_6: i32, remoteAddress_IpSocketAddress_7: i32, remoteAddress_IpSocketAddress_8: i32, remoteAddress_IpSocketAddress_9: i32, remoteAddress_IpSocketAddress_10: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.finish-connect': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]udp-socket.receive': (self: i32, maxResults: i64, result: ptr<[i32, i32, i32]>) => void;
				'[method]udp-socket.send': (self: i32, datagrams_ptr: i32, datagrams_len: i32, result: ptr<[i32, i64]>) => void;
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
		export type UdpSocket = resource;
	}
	export type Udp<US extends sockets.Udp.UdpSocket.Module | sockets.Udp.UdpSocket.Manager = sockets.Udp.UdpSocket.Module | sockets.Udp.UdpSocket.Manager> = {
		UdpSocket: US;
	};
	
	export namespace UdpCreateSocket {
		export const id = 'wasi:sockets/udp-create-socket' as const;
		
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
		 * at time of creation, the socket is not bound to any `network` yet. Up to the moment `bind`/`connect` is called,
		 * the socket is effectively an in-memory configuration object, unable to communicate with the outside world.
		 * 
		 * All sockets are non-blocking. Use the wasi-poll interface to block on asynchronous operations.
		 * 
		 * # Typical errors
		 * - `not-supported`:                The host does not support UDP sockets. (EOPNOTSUPP)
		 * - `address-family-not-supported`: The specified `address-family` is not supported. (EAFNOSUPPORT)
		 * - `new-socket-limit`:             The new socket resource could not be created because of a system limit. (EMFILE, ENFILE)
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

export namespace sockets {
	export namespace Network.$ {
		export const Network = new $wcm.ResourceType('Network', 'network');
		export const ErrorCode = new $wcm.EnumType<Network.ErrorCode>(['unknown', 'accessDenied', 'notSupported', 'outOfMemory', 'timeout', 'concurrencyConflict', 'notInProgress', 'wouldBlock', 'addressFamilyNotSupported', 'addressFamilyMismatch', 'invalidRemoteAddress', 'ipv4OnlyOperation', 'ipv6OnlyOperation', 'newSocketLimit', 'alreadyAttached', 'alreadyBound', 'alreadyConnected', 'notBound', 'notConnected', 'addressNotBindable', 'addressInUse', 'ephemeralPortsExhausted', 'remoteUnreachable', 'alreadyListening', 'notListening', 'connectionRefused', 'connectionReset', 'datagramTooLarge', 'invalidName', 'nameUnresolvable', 'temporaryResolverFailure', 'permanentResolverFailure']);
		export const IpAddressFamily = new $wcm.EnumType<Network.IpAddressFamily>(['ipv4', 'ipv6']);
		export const Ipv4Address = new $wcm.TupleType<[u8, u8, u8, u8]>([$wcm.u8, $wcm.u8, $wcm.u8, $wcm.u8]);
		export const Ipv6Address = new $wcm.TupleType<[u16, u16, u16, u16, u16, u16, u16, u16]>([$wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16]);
		export const IpAddress = new $wcm.VariantType<Network.IpAddress, Network.IpAddress._tt, Network.IpAddress._vt>([['ipv4', Ipv4Address], ['ipv6', Ipv6Address]], Network.IpAddress._ctor);
		export const Ipv4SocketAddress = new $wcm.RecordType<Network.Ipv4SocketAddress>([
			['port', $wcm.u16],
			['address', Ipv4Address],
		]);
		export const Ipv6SocketAddress = new $wcm.RecordType<Network.Ipv6SocketAddress>([
			['port', $wcm.u16],
			['flowInfo', $wcm.u32],
			['address', Ipv6Address],
			['scopeId', $wcm.u32],
		]);
		export const IpSocketAddress = new $wcm.VariantType<Network.IpSocketAddress, Network.IpSocketAddress._tt, Network.IpSocketAddress._vt>([['ipv4', Ipv4SocketAddress], ['ipv6', Ipv6SocketAddress]], Network.IpSocketAddress._ctor);
	}
	export namespace Network._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.ResourceType[] = [$.Network];
		export type WasmInterface = {
		} & sockets.Network.Network.WasmInterface;
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
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): sockets.Network {
			return $wcm.Service.create<sockets.Network>(functions, [], wasmInterface, context);
		}
		type ClassService = sockets.Network;
		export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {
			return $wcm.Service.create<ClassService>(functions, [], wasmInterface, context);
		}
		type ModuleService = sockets.Network;
		export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {
			return $wcm.Service.create<ModuleService>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace InstanceNetwork.$ {
		export const Network = sockets.Network.$.Network;
		export const instanceNetwork = new $wcm.FunctionType<InstanceNetwork.instanceNetwork>('instanceNetwork', 'instance-network', [], new $wcm.OwnType<sockets.InstanceNetwork.Network>(Network));
	}
	export namespace InstanceNetwork._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.instanceNetwork];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'instance-network': () => i32;
		};
		export function createHost(service: sockets.InstanceNetwork, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): sockets.InstanceNetwork {
			return $wcm.Service.create<sockets.InstanceNetwork>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace IpNameLookup.$ {
		export const Pollable = io.Poll.$.Pollable;
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpAddress = sockets.Network.$.IpAddress;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const ResolveAddressStream = new $wcm.ResourceType('ResolveAddressStream', 'resolve-address-stream');
		ResolveAddressStream.addFunction(new $wcm.FunctionType<IpNameLookup.ResolveAddressStream.Module['resolveNextAddress']>('resolveNextAddress', '[method]resolve-address-stream.resolve-next-address', [
			['self', new $wcm.BorrowType<sockets.IpNameLookup.ResolveAddressStream>(ResolveAddressStream)],
		], new $wcm.ResultType<option<sockets.IpNameLookup.IpAddress>, sockets.IpNameLookup.ErrorCode>(new $wcm.OptionType<sockets.IpNameLookup.IpAddress>(IpAddress), ErrorCode)));
		ResolveAddressStream.addFunction(new $wcm.FunctionType<IpNameLookup.ResolveAddressStream.Module['subscribe']>('subscribe', '[method]resolve-address-stream.subscribe', [
			['self', new $wcm.BorrowType<sockets.IpNameLookup.ResolveAddressStream>(ResolveAddressStream)],
		], new $wcm.OwnType<sockets.IpNameLookup.Pollable>(Pollable)));
		export const resolveAddresses = new $wcm.FunctionType<IpNameLookup.resolveAddresses>('resolveAddresses', 'resolve-addresses',[
			['network', new $wcm.BorrowType<sockets.IpNameLookup.Network>(Network)],
			['name', $wcm.wstring],
			['addressFamily', new $wcm.OptionType<sockets.IpNameLookup.IpAddressFamily>(IpAddressFamily)],
			['includeUnavailable', $wcm.bool],
		], new $wcm.ResultType<own<sockets.IpNameLookup.ResolveAddressStream>, sockets.IpNameLookup.ErrorCode>(new $wcm.OwnType<sockets.IpNameLookup.ResolveAddressStream>(ResolveAddressStream), ErrorCode));
	}
	export namespace IpNameLookup._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.resolveAddresses];
		const resources: $wcm.ResourceType[] = [$.ResolveAddressStream];
		export type WasmInterface = {
			'resolve-addresses': (network: i32, name_ptr: i32, name_len: i32, addressFamily_case: i32, addressFamily_option_IpAddressFamily_IpAddressFamily: i32, includeUnavailable: i32, result: ptr<[i32, i32]>) => void;
		} & sockets.IpNameLookup.ResolveAddressStream.WasmInterface;
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
		export function createService<RAS extends sockets.IpNameLookup.ResolveAddressStream.Module | sockets.IpNameLookup.ResolveAddressStream.Manager>(ras: $wcm.ResourceKind<RAS>, wasmInterface: WasmInterface, context: $wcm.Context): sockets.IpNameLookup<RAS> {
			return $wcm.Service.create<sockets.IpNameLookup<RAS>>(functions, [[$.ResolveAddressStream, ras]], wasmInterface, context);
		}
		type ClassService = sockets.IpNameLookup<sockets.IpNameLookup.ResolveAddressStream.Manager>;
		export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {
			return $wcm.Service.create<ClassService>(functions, [[$.ResolveAddressStream, ResolveAddressStream.Manager]], wasmInterface, context);
		}
		type ModuleService = sockets.IpNameLookup<sockets.IpNameLookup.ResolveAddressStream.Module>;
		export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {
			return $wcm.Service.create<ModuleService>(functions, [[$.ResolveAddressStream, ResolveAddressStream.Module]], wasmInterface, context);
		}
	}
	
	export namespace Tcp.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Pollable = io.Poll.$.Pollable;
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpSocketAddress = sockets.Network.$.IpSocketAddress;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const ShutdownType = new $wcm.EnumType<Tcp.ShutdownType>(['receive', 'send', 'both']);
		export const TcpSocket = new $wcm.ResourceType('TcpSocket', 'tcp-socket');
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['startBind']>('startBind', '[method]tcp-socket.start-bind', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['network', new $wcm.BorrowType<sockets.Tcp.Network>(Network)],
			['localAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['finishBind']>('finishBind', '[method]tcp-socket.finish-bind', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['startConnect']>('startConnect', '[method]tcp-socket.start-connect', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['network', new $wcm.BorrowType<sockets.Tcp.Network>(Network)],
			['remoteAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['finishConnect']>('finishConnect', '[method]tcp-socket.finish-connect', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<[own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>], sockets.Tcp.ErrorCode>(new $wcm.TupleType<[own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>]>([new $wcm.OwnType<sockets.Tcp.InputStream>(InputStream), new $wcm.OwnType<sockets.Tcp.OutputStream>(OutputStream)]), ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['startListen']>('startListen', '[method]tcp-socket.start-listen', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['finishListen']>('finishListen', '[method]tcp-socket.finish-listen', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['accept']>('accept', '[method]tcp-socket.accept', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<[own<sockets.Tcp.TcpSocket>, own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>], sockets.Tcp.ErrorCode>(new $wcm.TupleType<[own<sockets.Tcp.TcpSocket>, own<sockets.Tcp.InputStream>, own<sockets.Tcp.OutputStream>]>([new $wcm.OwnType<sockets.Tcp.TcpSocket>(TcpSocket), new $wcm.OwnType<sockets.Tcp.InputStream>(InputStream), new $wcm.OwnType<sockets.Tcp.OutputStream>(OutputStream)]), ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['localAddress']>('localAddress', '[method]tcp-socket.local-address', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<sockets.Tcp.IpSocketAddress, sockets.Tcp.ErrorCode>(IpSocketAddress, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['remoteAddress']>('remoteAddress', '[method]tcp-socket.remote-address', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<sockets.Tcp.IpSocketAddress, sockets.Tcp.ErrorCode>(IpSocketAddress, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['addressFamily']>('addressFamily', '[method]tcp-socket.address-family', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], IpAddressFamily));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['ipv6Only']>('ipv6Only', '[method]tcp-socket.ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<boolean, sockets.Tcp.ErrorCode>($wcm.bool, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['setIpv6Only']>('setIpv6Only', '[method]tcp-socket.set-ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['setListenBacklogSize']>('setListenBacklogSize', '[method]tcp-socket.set-listen-backlog-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['keepAlive']>('keepAlive', '[method]tcp-socket.keep-alive', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<boolean, sockets.Tcp.ErrorCode>($wcm.bool, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['setKeepAlive']>('setKeepAlive', '[method]tcp-socket.set-keep-alive', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['noDelay']>('noDelay', '[method]tcp-socket.no-delay', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<boolean, sockets.Tcp.ErrorCode>($wcm.bool, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['setNoDelay']>('setNoDelay', '[method]tcp-socket.set-no-delay', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['unicastHopLimit']>('unicastHopLimit', '[method]tcp-socket.unicast-hop-limit', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<u8, sockets.Tcp.ErrorCode>($wcm.u8, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['setUnicastHopLimit']>('setUnicastHopLimit', '[method]tcp-socket.set-unicast-hop-limit', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u8],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['receiveBufferSize']>('receiveBufferSize', '[method]tcp-socket.receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<u64, sockets.Tcp.ErrorCode>($wcm.u64, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['setReceiveBufferSize']>('setReceiveBufferSize', '[method]tcp-socket.set-receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['sendBufferSize']>('sendBufferSize', '[method]tcp-socket.send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.ResultType<u64, sockets.Tcp.ErrorCode>($wcm.u64, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['setSendBufferSize']>('setSendBufferSize', '[method]tcp-socket.set-send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['subscribe']>('subscribe', '[method]tcp-socket.subscribe', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
		], new $wcm.OwnType<sockets.Tcp.Pollable>(Pollable)));
		TcpSocket.addFunction(new $wcm.FunctionType<Tcp.TcpSocket.Module['shutdown']>('shutdown', '[method]tcp-socket.shutdown', [
			['self', new $wcm.BorrowType<sockets.Tcp.TcpSocket>(TcpSocket)],
			['shutdownType', ShutdownType],
		], new $wcm.ResultType<void, sockets.Tcp.ErrorCode>(undefined, ErrorCode)));
	}
	export namespace Tcp._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.ResourceType[] = [$.TcpSocket];
		export type WasmInterface = {
		} & sockets.Tcp.TcpSocket.WasmInterface;
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
		export function createService<TS extends sockets.Tcp.TcpSocket.Module | sockets.Tcp.TcpSocket.Manager>(ts: $wcm.ResourceKind<TS>, wasmInterface: WasmInterface, context: $wcm.Context): sockets.Tcp<TS> {
			return $wcm.Service.create<sockets.Tcp<TS>>(functions, [[$.TcpSocket, ts]], wasmInterface, context);
		}
		type ClassService = sockets.Tcp<sockets.Tcp.TcpSocket.Manager>;
		export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {
			return $wcm.Service.create<ClassService>(functions, [[$.TcpSocket, TcpSocket.Manager]], wasmInterface, context);
		}
		type ModuleService = sockets.Tcp<sockets.Tcp.TcpSocket.Module>;
		export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {
			return $wcm.Service.create<ModuleService>(functions, [[$.TcpSocket, TcpSocket.Module]], wasmInterface, context);
		}
	}
	
	export namespace TcpCreateSocket.$ {
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const TcpSocket = sockets.Tcp.$.TcpSocket;
		export const createTcpSocket = new $wcm.FunctionType<TcpCreateSocket.createTcpSocket>('createTcpSocket', 'create-tcp-socket',[
			['addressFamily', IpAddressFamily],
		], new $wcm.ResultType<own<sockets.TcpCreateSocket.TcpSocket>, sockets.TcpCreateSocket.ErrorCode>(new $wcm.OwnType<sockets.TcpCreateSocket.TcpSocket>(TcpSocket), ErrorCode));
	}
	export namespace TcpCreateSocket._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.createTcpSocket];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'create-tcp-socket': (addressFamily_IpAddressFamily_IpAddressFamily: i32, result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: sockets.TcpCreateSocket, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): sockets.TcpCreateSocket {
			return $wcm.Service.create<sockets.TcpCreateSocket>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace Udp.$ {
		export const Pollable = io.Poll.$.Pollable;
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpSocketAddress = sockets.Network.$.IpSocketAddress;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const Datagram = new $wcm.RecordType<Udp.Datagram>([
			['data', new $wcm.Uint8ArrayType()],
			['remoteAddress', IpSocketAddress],
		]);
		export const UdpSocket = new $wcm.ResourceType('UdpSocket', 'udp-socket');
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['startBind']>('startBind', '[method]udp-socket.start-bind', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['network', new $wcm.BorrowType<sockets.Udp.Network>(Network)],
			['localAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['finishBind']>('finishBind', '[method]udp-socket.finish-bind', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['startConnect']>('startConnect', '[method]udp-socket.start-connect', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['network', new $wcm.BorrowType<sockets.Udp.Network>(Network)],
			['remoteAddress', IpSocketAddress],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['finishConnect']>('finishConnect', '[method]udp-socket.finish-connect', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['receive']>('receive', '[method]udp-socket.receive', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['maxResults', $wcm.u64],
		], new $wcm.ResultType<sockets.Udp.Datagram[], sockets.Udp.ErrorCode>(new $wcm.ListType<sockets.Udp.Datagram>(Datagram), ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['send']>('send', '[method]udp-socket.send', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['datagrams', new $wcm.ListType<sockets.Udp.Datagram>(Datagram)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['localAddress']>('localAddress', '[method]udp-socket.local-address', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<sockets.Udp.IpSocketAddress, sockets.Udp.ErrorCode>(IpSocketAddress, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['remoteAddress']>('remoteAddress', '[method]udp-socket.remote-address', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<sockets.Udp.IpSocketAddress, sockets.Udp.ErrorCode>(IpSocketAddress, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['addressFamily']>('addressFamily', '[method]udp-socket.address-family', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], IpAddressFamily));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['ipv6Only']>('ipv6Only', '[method]udp-socket.ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<boolean, sockets.Udp.ErrorCode>($wcm.bool, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['setIpv6Only']>('setIpv6Only', '[method]udp-socket.set-ipv6-only', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.bool],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['unicastHopLimit']>('unicastHopLimit', '[method]udp-socket.unicast-hop-limit', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<u8, sockets.Udp.ErrorCode>($wcm.u8, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['setUnicastHopLimit']>('setUnicastHopLimit', '[method]udp-socket.set-unicast-hop-limit', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.u8],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['receiveBufferSize']>('receiveBufferSize', '[method]udp-socket.receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['setReceiveBufferSize']>('setReceiveBufferSize', '[method]udp-socket.set-receive-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['sendBufferSize']>('sendBufferSize', '[method]udp-socket.send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.ResultType<u64, sockets.Udp.ErrorCode>($wcm.u64, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['setSendBufferSize']>('setSendBufferSize', '[method]udp-socket.set-send-buffer-size', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
			['value', $wcm.u64],
		], new $wcm.ResultType<void, sockets.Udp.ErrorCode>(undefined, ErrorCode)));
		UdpSocket.addFunction(new $wcm.FunctionType<Udp.UdpSocket.Module['subscribe']>('subscribe', '[method]udp-socket.subscribe', [
			['self', new $wcm.BorrowType<sockets.Udp.UdpSocket>(UdpSocket)],
		], new $wcm.OwnType<sockets.Udp.Pollable>(Pollable)));
	}
	export namespace Udp._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.ResourceType[] = [$.UdpSocket];
		export type WasmInterface = {
		} & sockets.Udp.UdpSocket.WasmInterface;
		export namespace UdpSocket  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): sockets.Udp.UdpSocket.Module {
				return $wcm.Module.create<sockets.Udp.UdpSocket.Module>($.UdpSocket, wasmInterface, context);
			}
			export function Manager(): sockets.Udp.UdpSocket.Manager {
				return new $wcm.ResourceManager<sockets.Udp.UdpSocket.Interface>();
			}
		}
		export function createHost(service: sockets.Udp, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService<US extends sockets.Udp.UdpSocket.Module | sockets.Udp.UdpSocket.Manager>(us: $wcm.ResourceKind<US>, wasmInterface: WasmInterface, context: $wcm.Context): sockets.Udp<US> {
			return $wcm.Service.create<sockets.Udp<US>>(functions, [[$.UdpSocket, us]], wasmInterface, context);
		}
		type ClassService = sockets.Udp<sockets.Udp.UdpSocket.Manager>;
		export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {
			return $wcm.Service.create<ClassService>(functions, [[$.UdpSocket, UdpSocket.Manager]], wasmInterface, context);
		}
		type ModuleService = sockets.Udp<sockets.Udp.UdpSocket.Module>;
		export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {
			return $wcm.Service.create<ModuleService>(functions, [[$.UdpSocket, UdpSocket.Module]], wasmInterface, context);
		}
	}
	
	export namespace UdpCreateSocket.$ {
		export const Network = sockets.Network.$.Network;
		export const ErrorCode = sockets.Network.$.ErrorCode;
		export const IpAddressFamily = sockets.Network.$.IpAddressFamily;
		export const UdpSocket = sockets.Udp.$.UdpSocket;
		export const createUdpSocket = new $wcm.FunctionType<UdpCreateSocket.createUdpSocket>('createUdpSocket', 'create-udp-socket',[
			['addressFamily', IpAddressFamily],
		], new $wcm.ResultType<own<sockets.UdpCreateSocket.UdpSocket>, sockets.UdpCreateSocket.ErrorCode>(new $wcm.OwnType<sockets.UdpCreateSocket.UdpSocket>(UdpSocket), ErrorCode));
	}
	export namespace UdpCreateSocket._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.createUdpSocket];
		const resources: $wcm.ResourceType[] = [];
		export type WasmInterface = {
			'create-udp-socket': (addressFamily_IpAddressFamily_IpAddressFamily: i32, result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: sockets.UdpCreateSocket, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): sockets.UdpCreateSocket {
			return $wcm.Service.create<sockets.UdpCreateSocket>(functions, [], wasmInterface, context);
		}
	}
}