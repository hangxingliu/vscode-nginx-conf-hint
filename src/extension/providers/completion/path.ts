import { CompletionItem, CompletionItemKind, FileType, Uri, workspace } from "vscode";

const _directives = new Set<string>([
	"include",
	"pid",
	"lock_file",
	"ssl_certificate",
	"ssl_certificate_key",
	"ssl_crl",
	"ssl_dhparam",
	"js_include",
]);
export function _doesDirectiveNeedCompletePath(directive: string) {
	if (_directives.has(directive)) return true;
	if (directive.endsWith('_lua_file')) return true;
	return false;
}

export async function _completePath(baseUri: Uri, input = "") {
	if (/[\/\\]$/.test(input)) input = input.slice(0, input.length - 1) + "/";
	else input += "/..";

	const inputUri = input ? Uri.joinPath(baseUri, input) : baseUri;

	const result: CompletionItem[] = [];
	try {
		const files = await workspace.fs.readDirectory(inputUri);
		files
			.filter((it) => it[1] === FileType.Directory)
			.forEach((it) => result.push(new CompletionItem(it[0], CompletionItemKind.Folder)));
		files
			.filter((it) => it[1] === FileType.File)
			.forEach((it) => result.push(new CompletionItem(it[0], CompletionItemKind.File)));
	} catch (error) {
		// noop
	}

	return result;
}
