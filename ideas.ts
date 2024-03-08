export namespace proxy {
	export type imports = {
		OutgoingHandler: http.OutgoingHandler;
	};
	export type exports = {
		IncomingHandler: http.IncomingHandler;
	};

	export function createHost(imports: proxy.imports, context: $wcm.WasmContext): WasmInterface {

	}
}


	export namespace command {
		export type Imports = {
			environment: Environment;
			exit: cli_Exit;
			error: io_Error;
			poll: io_Poll;
			streams: io_Streams;
			stdin: cli_Stdin;
			stdout: cli_Stdout;
			stderr: cli_Stderr;
			terminalInput: cli_TerminalInput;
			terminalOutput: cli_TerminalOutput;
			terminalStdin: cli_TerminalStdin;
			terminalStdout: cli_TerminalStdout;
			terminalStderr: cli_TerminalStderr;
			monotonicClock: clocks_MonotonicClock;
			wallClock: clocks_WallClock;
			types: filesystem_Types;
			preopens: filesystem_Preopens;
			network: sockets_Network;
			instanceNetwork: sockets_InstanceNetwork;
			udp: sockets_Udp;
			udpCreateSocket: sockets_UdpCreateSocket;
			tcp: sockets_Tcp;
			tcpCreateSocket: sockets_TcpCreateSocket;
			ipNameLookup: sockets_IpNameLookup;
			random: random_Random;
			insecure: random_Insecure;
			insecureSeed: random_InsecureSeed;
		};
		export type Exports = {
			run: Run;
		};
		export namespace Wasm {
			export type Imports = {
				'wasi:cli/environment@0.2.0': cli.Environment._.WasmInterface;
			};
			export type Exports = {
				'wasi:cli/run@0.2.0#run': Run['run'];
			};
		}
	}
