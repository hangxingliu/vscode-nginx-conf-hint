import { CompletionItem, CompletionItemKind, Position, TextDocument, Range, MarkdownString } from "vscode";
import { getHttpHeaders } from "../../hint-data/manifest";

const _directives = new Set<string>([
	"add_header",
	"auth_http_header",
	"fastcgi_pass_header",
	"fastcgi_hide_header",
	"grpc_hide_header",
	"grpc_set_header",
	"grpc_pass_header",
	"proxy_hide_header",
	"proxy_ignore_headers",
	"proxy_pass_header",
	"proxy_set_header",
	"real_ip_header",
	"scgi_hide_header",
	"scgi_ignore_headers",
	"scgi_pass_header",
	"uwsgi_hide_header",
	"uwsgi_ignore_headers",
	"uwsgi_pass_header",
]);
export function _doesDirectiveNeedHttpHeader(directive: string): boolean | number {
	if (!_directives.has(directive)) false;
	if (directive.endsWith("s")) return true;
	return 1;
}

export function _completeHttpHeader(document: TextDocument, position: Position, currentInput: string) {
	let headers = getHttpHeaders();
	let prefix: string;
	const lastDash = currentInput.lastIndexOf("-");
	if (lastDash >= 0) {
		prefix = currentInput.slice(0, lastDash + 1);
		const lcPrefix = prefix.toLowerCase();
		headers = headers.filter((it) => it.lowercase.startsWith(lcPrefix));
	}
	const range = prefix ? new Range(position.translate(0, -prefix.length), position) : null;
	return headers.map((it) => {
		const ci = new CompletionItem(it.name, CompletionItemKind.Constant);
		ci.detail = 'HTTP Header';
		if(it.markdown)
			ci.documentation = new MarkdownString(it.markdown);
		if (range) {
			// ci.insertText = it.name.slice(prefix.length);
			ci.range = range;
		}
		return ci;
	});
}
