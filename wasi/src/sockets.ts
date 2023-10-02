import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u8, u16, result, u64 } from '@vscode/wasm-component-model';
import { io } from './io';
import { poll } from './poll';

export namespace sockets {
	export namespace Network {
		
		/**
		 * An opaque resource that represents access to (a subset of) the network.
		 * This enables context-based security for networking.
		 * There is no need for this to map 1:1 to a physical network interface.
		 * 
		 * FYI, In the future this will be replaced by handle types.
		 */
		export type Network = u32;
		
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
			unknown = 0,
			accessDenied = 1,
			notSupported = 2,
			outOfMemory = 3,
			timeout = 4,
			concurrencyConflict = 5,
			notInProgress = 6,
			wouldBlock = 7,
			addressFamilyNotSupported = 8,
			addressFamilyMismatch = 9,
			invalidRemoteAddress = 10,
			ipv4OnlyOperation = 11,
			ipv6OnlyOperation = 12,
			newSocketLimit = 13,
			alreadyAttached = 14,
			alreadyBound = 15,
			alreadyConnected = 16,
			notBound = 17,
			notConnected = 18,
			addressNotBindable = 19,
			addressInUse = 20,
			ephemeralPortsExhausted = 21,
			remoteUnreachable = 22,
			alreadyListening = 23,
			notListening = 24,
			connectionRefused = 25,
			connectionReset = 26,
			datagramTooLarge = 27,
			invalidName = 28,
			nameUnresolvable = 29,
			temporaryResolverFailure = 30,
			permanentResolverFailure = 31,
		}
		
		export enum IpAddressFamily {
			ipv4 = 0,
			ipv6 = 1,
		}
		
		export type Ipv4Address = [u8, u8, u8, u8];
		
		export type Ipv6Address = [u16, u16, u16, u16, u16, u16, u16, u16];
		
		export namespace IpAddress {
			export const ipv4 = 0 as const;
			export type ipv4 = { readonly case: typeof ipv4; readonly value: Ipv4Address } & _common;
			
			export const ipv6 = 1 as const;
			export type ipv6 = { readonly case: typeof ipv6; readonly value: Ipv6Address } & _common;
			
			export type _ct = typeof ipv4 | typeof ipv6;
			export type _vt = Ipv4Address | Ipv6Address;
			type _common = Omit<VariantImpl, 'case' | 'value'>;
			export function _ctor(c: _ct, v: _vt): IpAddress {
				return new VariantImpl(c, v) as IpAddress;
			}
			export function _ipv4(value: Ipv4Address): ipv4 {
				return new VariantImpl(ipv4, value) as ipv4;
			}
			export function _ipv6(value: Ipv6Address): ipv6 {
				return new VariantImpl(ipv6, value) as ipv6;
			}
			class VariantImpl {
				private readonly _case: _ct;
				private readonly _value: _vt;
				constructor(c: _ct, value: _vt) {
					this._case = c;
					this._value = value;
				}
				get case(): _ct {
					return this._case;
				}
				get value(): _vt {
					return this._value;
				}
				ipv4(): this is ipv4 {
					return this._case === IpAddress.ipv4;
				}
				ipv6(): this is ipv6 {
					return this._case === IpAddress.ipv6;
				}
			}
		}
		export type IpAddress = IpAddress.ipv4 | IpAddress.ipv6;
		
		export interface Ipv4SocketAddress extends $wcm.JRecord {
			port: u16;
			address: Ipv4Address;
		}
		
		export interface Ipv6SocketAddress extends $wcm.JRecord {
			port: u16;
			flowInfo: u32;
			address: Ipv6Address;
			scopeId: u32;
		}
		
		export namespace IpSocketAddress {
			export const ipv4 = 0 as const;
			export type ipv4 = { readonly case: typeof ipv4; readonly value: Ipv4SocketAddress } & _common;
			
			export const ipv6 = 1 as const;
			export type ipv6 = { readonly case: typeof ipv6; readonly value: Ipv6SocketAddress } & _common;
			
			export type _ct = typeof ipv4 | typeof ipv6;
			export type _vt = Ipv4SocketAddress | Ipv6SocketAddress;
			type _common = Omit<VariantImpl, 'case' | 'value'>;
			export function _ctor(c: _ct, v: _vt): IpSocketAddress {
				return new VariantImpl(c, v) as IpSocketAddress;
			}
			export function _ipv4(value: Ipv4SocketAddress): ipv4 {
				return new VariantImpl(ipv4, value) as ipv4;
			}
			export function _ipv6(value: Ipv6SocketAddress): ipv6 {
				return new VariantImpl(ipv6, value) as ipv6;
			}
			class VariantImpl {
				private readonly _case: _ct;
				private readonly _value: _vt;
				constructor(c: _ct, value: _vt) {
					this._case = c;
					this._value = value;
				}
				get case(): _ct {
					return this._case;
				}
				get value(): _vt {
					return this._value;
				}
				ipv4(): this is ipv4 {
					return this._case === IpSocketAddress.ipv4;
				}
				ipv6(): this is ipv6 {
					return this._case === IpSocketAddress.ipv6;
				}
			}
		}
		export type IpSocketAddress = IpSocketAddress.ipv4 | IpSocketAddress.ipv6;
		
		/**
		 * Dispose of the specified `network`, after which it may no longer be used.
		 * 
		 * Note: this function is scheduled to be removed when Resources are natively supported in Wit.
		 */
		export declare function dropNetwork(this_: Network): void;
	}
	export type Network = Pick<typeof Network, 'dropNetwork'>;
	
	/**
	 * This interface provides a value-export of the default network handle..
	 */
	export namespace InstanceNetwork {
		
		type Network = Network.Network;
		
		/**
		 * Get a handle to the default network.
		 */
		export declare function instanceNetwork(): Network;
	}
	export type InstanceNetwork = Pick<typeof InstanceNetwork, 'instanceNetwork'>;
	
	export namespace IpNameLookup {
		
		type Pollable = poll.Poll.Pollable;
		
		type Network = Network.Network;
		
		type ErrorCode = Network.ErrorCode;
		
		type IpAddress = Network.IpAddress;
		
		type IpAddressFamily = Network.IpAddressFamily;
		
		export type ResolveAddressStream = u32;
		
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
		export declare function resolveAddresses(network: Network, name: string, addressFamily: IpAddressFamily | undefined, includeUnavailable: boolean): result<ResolveAddressStream, ErrorCode>;
		
		/**
		 * Returns the next address from the resolver.
		 * 
		 * This function should be called multiple times. On each call, it will
		 * return the next address in connection order preference. If all
		 * addresses have been exhausted, this function returns `none`.
		 * After which, you should release the stream with `drop-resolve-address-stream`.
		 * 
		 * This function never returns IPv4-mapped IPv6 addresses.
		 * 
		 * # Typical errors
		 * - `name-unresolvable`:          Name does not exist or has no suitable associated IP addresses. (EAI_NONAME, EAI_NODATA, EAI_ADDRFAMILY)
		 * - `temporary-resolver-failure`: A temporary failure in name resolution occurred. (EAI_AGAIN)
		 * - `permanent-resolver-failure`: A permanent failure in name resolution occurred. (EAI_FAIL)
		 * - `would-block`:                A result is not available yet. (EWOULDBLOCK, EAGAIN)
		 */
		export declare function resolveNextAddress(this_: ResolveAddressStream): result<IpAddress | undefined, ErrorCode>;
		
		/**
		 * Dispose of the specified `resolve-address-stream`, after which it may no longer be used.
		 * 
		 * Note: this function is scheduled to be removed when Resources are natively supported in Wit.
		 */
		export declare function dropResolveAddressStream(this_: ResolveAddressStream): void;
		
		/**
		 * Create a `pollable` which will resolve once the stream is ready for I/O.
		 * 
		 * Note: this function is here for WASI Preview2 only.
		 * It's planned to be removed when `future` is natively supported in Preview3.
		 */
		export declare function subscribe(this_: ResolveAddressStream): Pollable;
	}
	export type IpNameLookup = Pick<typeof IpNameLookup, 'resolveAddresses' | 'resolveNextAddress' | 'dropResolveAddressStream' | 'subscribe'>;
	
	export namespace Tcp {
		
		type InputStream = io.Streams.InputStream;
		
		type OutputStream = io.Streams.OutputStream;
		
		type Pollable = poll.Poll.Pollable;
		
		type Network = Network.Network;
		
		type ErrorCode = Network.ErrorCode;
		
		type IpSocketAddress = Network.IpSocketAddress;
		
		type IpAddressFamily = Network.IpAddressFamily;
		
		/**
		 * A TCP socket handle.
		 */
		export type TcpSocket = u32;
		
		export enum ShutdownType {
			receive = 0,
			send = 1,
			both = 2,
		}
		
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
		export declare function startBind(this_: TcpSocket, network: Network, localAddress: IpSocketAddress): result<void, ErrorCode>;
		
		export declare function finishBind(this_: TcpSocket): result<void, ErrorCode>;
		
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
		export declare function startConnect(this_: TcpSocket, network: Network, remoteAddress: IpSocketAddress): result<void, ErrorCode>;
		
		/**
		 * Note: the returned `input-stream` and `output-stream` are child
		 * resources of the `tcp-socket`. Implementations may trap if the
		 * `tcp-socket` is dropped before both of these streams are dropped.
		 */
		export declare function finishConnect(this_: TcpSocket): result<[InputStream, OutputStream], ErrorCode>;
		
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
		export declare function startListen(this_: TcpSocket): result<void, ErrorCode>;
		
		export declare function finishListen(this_: TcpSocket): result<void, ErrorCode>;
		
		/**
		 * Accept a new client socket.
		 * 
		 * The returned socket is bound and in the Connection state.
		 * 
		 * On success, this function returns the newly accepted client socket along with
		 * a pair of streams that can be used to read & write to the connection.
		 * 
		 * Note: the returned `input-stream` and `output-stream` are child
		 * resources of the returned `tcp-socket`. Implementations may trap if the
		 * `tcp-socket` is dropped before its child streams are dropped.
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
		export declare function accept(this_: TcpSocket): result<[TcpSocket, InputStream, OutputStream], ErrorCode>;
		
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
		export declare function localAddress(this_: TcpSocket): result<IpSocketAddress, ErrorCode>;
		
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
		export declare function remoteAddress(this_: TcpSocket): result<IpSocketAddress, ErrorCode>;
		
		/**
		 * Whether this is a IPv4 or IPv6 socket.
		 * 
		 * Equivalent to the SO_DOMAIN socket option.
		 */
		export declare function addressFamily(this_: TcpSocket): IpAddressFamily;
		
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
		export declare function ipv6Only(this_: TcpSocket): result<boolean, ErrorCode>;
		
		export declare function setIpv6Only(this_: TcpSocket, value: boolean): result<void, ErrorCode>;
		
		/**
		 * Hints the desired listen queue size. Implementations are free to ignore this.
		 * 
		 * # Typical errors
		 * - `already-connected`:    (set) The socket is already in the Connection state.
		 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
		 */
		export declare function setListenBacklogSize(this_: TcpSocket, value: u64): result<void, ErrorCode>;
		
		/**
		 * Equivalent to the SO_KEEPALIVE socket option.
		 * 
		 * # Typical errors
		 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
		 */
		export declare function keepAlive(this_: TcpSocket): result<boolean, ErrorCode>;
		
		export declare function setKeepAlive(this_: TcpSocket, value: boolean): result<void, ErrorCode>;
		
		/**
		 * Equivalent to the TCP_NODELAY socket option.
		 * 
		 * # Typical errors
		 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
		 */
		export declare function noDelay(this_: TcpSocket): result<boolean, ErrorCode>;
		
		export declare function setNoDelay(this_: TcpSocket, value: boolean): result<void, ErrorCode>;
		
		/**
		 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
		 * 
		 * # Typical errors
		 * - `already-connected`:    (set) The socket is already in the Connection state.
		 * - `already-listening`:    (set) The socket is already in the Listener state.
		 * - `concurrency-conflict`: (set) A `bind`, `connect` or `listen` operation is already in progress. (EALREADY)
		 */
		export declare function unicastHopLimit(this_: TcpSocket): result<u8, ErrorCode>;
		
		export declare function setUnicastHopLimit(this_: TcpSocket, value: u8): result<void, ErrorCode>;
		
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
		export declare function receiveBufferSize(this_: TcpSocket): result<u64, ErrorCode>;
		
		export declare function setReceiveBufferSize(this_: TcpSocket, value: u64): result<void, ErrorCode>;
		
		export declare function sendBufferSize(this_: TcpSocket): result<u64, ErrorCode>;
		
		export declare function setSendBufferSize(this_: TcpSocket, value: u64): result<void, ErrorCode>;
		
		/**
		 * Create a `pollable` which will resolve once the socket is ready for I/O.
		 * 
		 * The created `pollable` is a child resource of the `tcp-socket`.
		 * Implementations may trap if the `tcp-socket` is dropped before all
		 * derived `pollable`s created with this function are dropped.
		 * 
		 * Note: this function is here for WASI Preview2 only.
		 * It's planned to be removed when `future` is natively supported in Preview3.
		 */
		export declare function subscribe(this_: TcpSocket): Pollable;
		
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
		export declare function shutdown(this_: TcpSocket, shutdownType: ShutdownType): result<void, ErrorCode>;
		
		/**
		 * Dispose of the specified `tcp-socket`, after which it may no longer be used.
		 * 
		 * Similar to the POSIX `close` function.
		 * 
		 * Note: this function is scheduled to be removed when Resources are natively supported in Wit.
		 */
		export declare function dropTcpSocket(this_: TcpSocket): void;
	}
	export type Tcp = Pick<typeof Tcp, 'startBind' | 'finishBind' | 'startConnect' | 'finishConnect' | 'startListen' | 'finishListen' | 'accept' | 'localAddress' | 'remoteAddress' | 'addressFamily' | 'ipv6Only' | 'setIpv6Only' | 'setListenBacklogSize' | 'keepAlive' | 'setKeepAlive' | 'noDelay' | 'setNoDelay' | 'unicastHopLimit' | 'setUnicastHopLimit' | 'receiveBufferSize' | 'setReceiveBufferSize' | 'sendBufferSize' | 'setSendBufferSize' | 'subscribe' | 'shutdown' | 'dropTcpSocket'>;
	
	export namespace TcpCreateSocket {
		
		type Network = Network.Network;
		
		type ErrorCode = Network.ErrorCode;
		
		type IpAddressFamily = Network.IpAddressFamily;
		
		type TcpSocket = Tcp.TcpSocket;
		
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
		export declare function createTcpSocket(addressFamily: IpAddressFamily): result<TcpSocket, ErrorCode>;
	}
	export type TcpCreateSocket = Pick<typeof TcpCreateSocket, 'createTcpSocket'>;
	
	export namespace Udp {
		
		type Pollable = poll.Poll.Pollable;
		
		type Network = Network.Network;
		
		type ErrorCode = Network.ErrorCode;
		
		type IpSocketAddress = Network.IpSocketAddress;
		
		type IpAddressFamily = Network.IpAddressFamily;
		
		/**
		 * A UDP socket handle.
		 */
		export type UdpSocket = u32;
		
		export interface Datagram extends $wcm.JRecord {
			data: Uint8Array;
			remoteAddress: IpSocketAddress;
		}
		
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
		export declare function startBind(this_: UdpSocket, network: Network, localAddress: IpSocketAddress): result<void, ErrorCode>;
		
		export declare function finishBind(this_: UdpSocket): result<void, ErrorCode>;
		
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
		export declare function startConnect(this_: UdpSocket, network: Network, remoteAddress: IpSocketAddress): result<void, ErrorCode>;
		
		export declare function finishConnect(this_: UdpSocket): result<void, ErrorCode>;
		
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
		export declare function receive(this_: UdpSocket, maxResults: u64): result<Datagram[], ErrorCode>;
		
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
		export declare function send(this_: UdpSocket, datagrams: Datagram[]): result<u64, ErrorCode>;
		
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
		export declare function localAddress(this_: UdpSocket): result<IpSocketAddress, ErrorCode>;
		
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
		export declare function remoteAddress(this_: UdpSocket): result<IpSocketAddress, ErrorCode>;
		
		/**
		 * Whether this is a IPv4 or IPv6 socket.
		 * 
		 * Equivalent to the SO_DOMAIN socket option.
		 */
		export declare function addressFamily(this_: UdpSocket): IpAddressFamily;
		
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
		export declare function ipv6Only(this_: UdpSocket): result<boolean, ErrorCode>;
		
		export declare function setIpv6Only(this_: UdpSocket, value: boolean): result<void, ErrorCode>;
		
		/**
		 * Equivalent to the IP_TTL & IPV6_UNICAST_HOPS socket options.
		 * 
		 * # Typical errors
		 * - `concurrency-conflict`: (set) Another `bind` or `connect` operation is already in progress. (EALREADY)
		 */
		export declare function unicastHopLimit(this_: UdpSocket): result<u8, ErrorCode>;
		
		export declare function setUnicastHopLimit(this_: UdpSocket, value: u8): result<void, ErrorCode>;
		
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
		export declare function receiveBufferSize(this_: UdpSocket): result<u64, ErrorCode>;
		
		export declare function setReceiveBufferSize(this_: UdpSocket, value: u64): result<void, ErrorCode>;
		
		export declare function sendBufferSize(this_: UdpSocket): result<u64, ErrorCode>;
		
		export declare function setSendBufferSize(this_: UdpSocket, value: u64): result<void, ErrorCode>;
		
		/**
		 * Create a `pollable` which will resolve once the socket is ready for I/O.
		 * 
		 * Note: this function is here for WASI Preview2 only.
		 * It's planned to be removed when `future` is natively supported in Preview3.
		 */
		export declare function subscribe(this_: UdpSocket): Pollable;
		
		/**
		 * Dispose of the specified `udp-socket`, after which it may no longer be used.
		 * 
		 * Note: this function is scheduled to be removed when Resources are natively supported in Wit.
		 */
		export declare function dropUdpSocket(this_: UdpSocket): void;
	}
	export type Udp = Pick<typeof Udp, 'startBind' | 'finishBind' | 'startConnect' | 'finishConnect' | 'receive' | 'send' | 'localAddress' | 'remoteAddress' | 'addressFamily' | 'ipv6Only' | 'setIpv6Only' | 'unicastHopLimit' | 'setUnicastHopLimit' | 'receiveBufferSize' | 'setReceiveBufferSize' | 'sendBufferSize' | 'setSendBufferSize' | 'subscribe' | 'dropUdpSocket'>;
	
	export namespace UdpCreateSocket {
		
		type Network = Network.Network;
		
		type ErrorCode = Network.ErrorCode;
		
		type IpAddressFamily = Network.IpAddressFamily;
		
		type UdpSocket = Udp.UdpSocket;
		
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
		export declare function createUdpSocket(addressFamily: IpAddressFamily): result<UdpSocket, ErrorCode>;
	}
	export type UdpCreateSocket = Pick<typeof UdpCreateSocket, 'createUdpSocket'>;
	
}

export namespace sockets {
	export namespace Network.$ {
		export const Network = $wcm.u32;
		export const ErrorCode = new $wcm.EnumType<sockets.Network.ErrorCode>(32);
		export const IpAddressFamily = new $wcm.EnumType<sockets.Network.IpAddressFamily>(2);
		export const Ipv4Address = [$wcm.u8, $wcm.u8, $wcm.u8, $wcm.u8];
		export const Ipv6Address = [$wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16, $wcm.u16];
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
	}
	export namespace InstanceNetwork.$ {
		export const Network = Network.$.Network;
	}
	export namespace IpNameLookup.$ {
		export const Pollable = poll.Poll.$.Pollable;
		export const Network = Network.$.Network;
		export const ErrorCode = Network.$.ErrorCode;
		export const IpAddress = Network.$.IpAddress;
		export const IpAddressFamily = Network.$.IpAddressFamily;
		export const ResolveAddressStream = $wcm.u32;
	}
	export namespace Tcp.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Pollable = poll.Poll.$.Pollable;
		export const Network = Network.$.Network;
		export const ErrorCode = Network.$.ErrorCode;
		export const IpSocketAddress = Network.$.IpSocketAddress;
		export const IpAddressFamily = Network.$.IpAddressFamily;
		export const TcpSocket = $wcm.u32;
		export const ShutdownType = new $wcm.EnumType<sockets.Tcp.ShutdownType>(3);
	}
	export namespace TcpCreateSocket.$ {
		export const Network = Network.$.Network;
		export const ErrorCode = Network.$.ErrorCode;
		export const IpAddressFamily = Network.$.IpAddressFamily;
		export const TcpSocket = Tcp.$.TcpSocket;
	}
	export namespace Udp.$ {
		export const Pollable = poll.Poll.$.Pollable;
		export const Network = Network.$.Network;
		export const ErrorCode = Network.$.ErrorCode;
		export const IpSocketAddress = Network.$.IpSocketAddress;
		export const IpAddressFamily = Network.$.IpAddressFamily;
		export const UdpSocket = $wcm.u32;
		export const Datagram = new $wcm.RecordType<sockets.Udp.Datagram>([
			['data', new $wcm.Uint8ArrayType()],
			['remoteAddress', IpSocketAddress],
		]);
	}
	export namespace UdpCreateSocket.$ {
		export const Network = Network.$.Network;
		export const ErrorCode = Network.$.ErrorCode;
		export const IpAddressFamily = Network.$.IpAddressFamily;
		export const UdpSocket = Udp.$.UdpSocket;
	}
}