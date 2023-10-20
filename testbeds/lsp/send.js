const parts = [
	'Content-Length: 85\r\n\r\n',
	'{"jsonrpc": "2.0", "method": "initialize", "id": 1, "params": {"capabilities": {}}}',
	'Content-Length: 59\r\n\r\n',
	'{"jsonrpc": "2.0", "method": "initialized", "params": {}}',
	'Content-Length: 159\r\n\r\n',
	'{"jsonrpc": "2.0", "method": "textDocument/definition", "id": 2, "params": {"textDocument": {"uri": "file://temp"}, "position": {"line": 1, "character": 1}}}'
];

process.stdin.on('data', (data) => {
	const content = data.toString();
	process.stderr.write(content);
});

setTimeout(() => {
	for (let item of parts) {
		process.stderr.write(item)
		process.stdout.write(item);
	}
}, 1000);