import { CompletionItem, CompletionItemKind, TextDocument } from "vscode";
import { getNginxConfDefinitionInfo } from "../../parser";

const _directives = new Set<string>(["error_page", "try_files"]);
export function _doesDirectiveCanUseNamedLocation(directive: string) {
	return _directives.has(directive);
}

export function _completeNameLocation(document: TextDocument, input: string) {
	const { location } = getNginxConfDefinitionInfo(document.getText());
	const locationNames = Array.from(new Set(location.map((it) => it.name)));
	if (locationNames.length < 1) return;

	input = input.toLowerCase();
	return locationNames
		.map((it) => {
			if (input && !it.toLowerCase().startsWith(input)) return null;
			const ci = new CompletionItem(it, CompletionItemKind.Reference);
			ci.insertText = it.slice(1);
			return ci;
		})
		.filter((it) => it);
}
