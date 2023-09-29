import * as $wcm from '@vscode/wasm-component-model';
import * as $1 from './poll';
import * as $2 from './clocks';
import * as $3 from './io';
import * as $4 from './filesystem';
import * as $5 from './sockets';
import * as $6 from './random';
import * as $7 from './cli';
import * as $8 from './http';
import * as $9 from './logging';

export namespace poll {
	export type Poll = $1.Poll;
	export namespace Poll {
		export type Pollable = $1.Poll.Pollable;
	}
}
export namespace clocks {
	export type MonotonicClock = $2.MonotonicClock;
	export namespace MonotonicClock {
		export type Instant = $2.MonotonicClock.Instant;
	}
	export type WallClock = $2.WallClock;
	export type Timezone = $2.Timezone;
	export namespace Timezone {
		export type Timezone = $2.Timezone.Timezone;
	}
}
export namespace io {
	export type Streams = $3.Streams;
	export namespace Streams {
		export type InputStream = $3.Streams.InputStream;
		export type OutputStream = $3.Streams.OutputStream;
	}
}
export namespace filesystem {
	export type Types = $4.Types;
	export namespace Types {
		export type Filesize = $4.Types.Filesize;
		export type LinkCount = $4.Types.LinkCount;
		export type Descriptor = $4.Types.Descriptor;
		export type DirectoryEntryStream = $4.Types.DirectoryEntryStream;
	}
	export type Preopens = $4.Preopens;
}
export namespace sockets {
	export type Network = $5.Network;
	export namespace Network {
		export type Network = $5.Network.Network;
		export type Ipv4Address = $5.Network.Ipv4Address;
		export type Ipv6Address = $5.Network.Ipv6Address;
	}
	export type InstanceNetwork = $5.InstanceNetwork;
	export type IpNameLookup = $5.IpNameLookup;
	export namespace IpNameLookup {
		export type ResolveAddressStream = $5.IpNameLookup.ResolveAddressStream;
	}
	export type Tcp = $5.Tcp;
	export namespace Tcp {
		export type TcpSocket = $5.Tcp.TcpSocket;
	}
	export type TcpCreateSocket = $5.TcpCreateSocket;
	export type Udp = $5.Udp;
	export namespace Udp {
		export type UdpSocket = $5.Udp.UdpSocket;
	}
	export type UdpCreateSocket = $5.UdpCreateSocket;
}
export namespace random {
	export type InsecureSeed = $6.InsecureSeed;
	export type Insecure = $6.Insecure;
	export type Random = $6.Random;
}
export namespace cli {
	export type Environment = $7.Environment;
	export type Exit = $7.Exit;
	export type Run = $7.Run;
	export type Stdin = $7.Stdin;
	export type Stdout = $7.Stdout;
	export type Stderr = $7.Stderr;
	export type TerminalInput = $7.TerminalInput;
	export namespace TerminalInput {
		export type TerminalInput = $7.TerminalInput.TerminalInput;
	}
	export type TerminalOutput = $7.TerminalOutput;
	export namespace TerminalOutput {
		export type TerminalOutput = $7.TerminalOutput.TerminalOutput;
	}
	export type TerminalStdin = $7.TerminalStdin;
	export type TerminalStdout = $7.TerminalStdout;
	export type TerminalStderr = $7.TerminalStderr;
}
export namespace http {
	export type Types = $8.Types;
	export namespace Types {
		export type Fields = $8.Types.Fields;
		export type IncomingRequest = $8.Types.IncomingRequest;
		export type OutgoingRequest = $8.Types.OutgoingRequest;
		export type ResponseOutparam = $8.Types.ResponseOutparam;
		export type StatusCode = $8.Types.StatusCode;
		export type IncomingResponse = $8.Types.IncomingResponse;
		export type IncomingBody = $8.Types.IncomingBody;
		export type FutureTrailers = $8.Types.FutureTrailers;
		export type OutgoingResponse = $8.Types.OutgoingResponse;
		export type OutgoingBody = $8.Types.OutgoingBody;
		export type FutureIncomingResponse = $8.Types.FutureIncomingResponse;
	}
	export type IncomingHandler = $8.IncomingHandler;
	export type OutgoingHandler = $8.OutgoingHandler;
}
export namespace logging {
	export type Logging = $9.Logging;
}