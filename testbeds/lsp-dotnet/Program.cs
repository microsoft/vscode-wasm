using Microsoft.LanguageServer.Protocol;
using Newtonsoft.Json.Linq;
using StreamJsonRpc;

var server = new LSPServer(Console.OpenStandardOutput(), Console.OpenStandardInput());

public static class Methods
{
	public const string Initialize = "initialize";
	public const string Initialized = "initialized";
	public const string Shutdown = "shutdown";
	public const string Exit = "exit";
	public const string TextDocumentPublishDiagnostics = "textDocument/publishDiagnostics";
	public const string TextDocumentImplementation = "textDocument/implementation";
	public const string TextDocumentTypeDefinition = "textDocument/typeDefinition";
	public const string TextDocumentReferences = "textDocument/references";
	public const string TextDocumentRename = "textDocument/rename";
	public const string TextDocumentSignatureHelp = "textDocument/signatureHelp";
	public const string TextDocumentWillSave = "textDocument/willSave";
	public const string TextDocumentWillSaveWaitUntil = "textDocument/willSaveWaitUntil";
	public const string WindowLogMessage = "window/logMessage";
	public const string TextDocumentRangeFormatting = "textDocument/rangeFormatting";
	public const string WindowShowMessage = "window/showMessage";
	public const string WorkspaceApplyEdit = "workspace/applyEdit";
	public const string WorkspaceDidChangeConfiguration = "workspace/didChangeConfiguration";
	public const string WorkspaceExecuteCommand = "workspace/executeCommand";
	public const string WorkspaceSymbol = "workspace/symbol";
	public const string WorkspaceDidChangeWatchedFiles = "workspace/didChangeWatchedFiles";
	public const string ClientRegisterCapability = "client/registerCapability";
	public const string ClientUnregisterCapability = "client/unregisterCapability";
	public const string WindowShowMessageRequest = "window/showMessageRequest";
	public const string TextDocumentOnTypeFormatting = "textDocument/onTypeFormatting";
	public const string TelemetryEvent = "telemetry/event";
	public const string TextDocumentFormatting = "textDocument/formatting";
	public const string TextDocumentHover = "textDocument/hover";
	public const string PartialResultToken = "partialResultToken";
	public const string PartialResultTokenProperty = "PartialResultToken";
	public const string ProgressNotificationToken = "token";
	public const string TextDocumentCodeAction = "textDocument/codeAction";
	public const string TextDocumentCodeLens = "textDocument/codeLens";
	public const string CodeLensResolve = "codeLens/resolve";
	public const string TextDocumentCompletion = "textDocument/completion";
	public const string TextDocumentCompletionResolve = "completionItem/resolve";
	public const string ProgressNotification = "$/progress";
	public const string TextDocumentDidOpen = "textDocument/didOpen";
	public const string TextDocumentDefinition = "textDocument/definition";
	public const string TextDocumentDocumentSymbol = "textDocument/documentSymbol";
	public const string DocumentLinkResolve = "documentLink/resolve";
	public const string TextDocumentDocumentLink = "textDocument/documentLink";
	public const string TextDocumentFoldingRange = "textDocument/foldingRange";
	public const string TextDocumentDidSave = "textDocument/didSave";
	public const string TextDocumentDidChange = "textDocument/didChange";
	public const string TextDocumentDidClose = "textDocument/didClose";
	public const string TextDocumentDocumentHighlight = "textDocument/documentHighlight";
	public const string TextDocumentSemanticTokensFull = "textDocument/semanticTokens/full";
	public const string TextDocumentSemanticTokensFullDelta = "textDocument/semanticTokens/full/delta";
	public const string TextDocumentSemanticTokensRange = "textDocument/semanticTokens/range";

}

class LSPServer {

    private readonly JsonRpc jsonRpc;

	public LSPServer(Stream sender, Stream reader) {
		jsonRpc = JsonRpc.Attach(sender, reader, this);
		jsonRpc.StartListening();
	}

	[JsonRpcMethod(Methods.Initialize)]
	public object Initialize(JToken arg) {
		var init_params = arg.ToObject<InitializeParams>();
		ServerCapabilities capabilities = new ServerCapabilities(declarationProvider: new (true));
		return capabilities;
	}

	[JsonRpcMethod(Methods.TextDocumentDefinition)]
	public object Definition(JToken arg) {
		var declaration_params = arg.ToObject<TextDocumentPositionParams>();
		var result = new Location(declaration_params.TextDocument.Uri, new Microsoft.LanguageServer.Protocol.Range(new Position(0, 0), new Position(0, 0)));
		return result;
	}
}