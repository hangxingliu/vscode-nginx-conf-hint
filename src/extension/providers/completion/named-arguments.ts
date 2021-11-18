import { CompletionItem, CompletionItemKind, SnippetString } from "vscode";
import { findManifestByName } from "../../hint-data/manifest";
import { NginxDirective } from "../../hint-data/types";

export function _completeNameArgs(directiveName: string) {
	const directives = findManifestByName(directiveName) as NginxDirective[];
	/** key is args, value is module name */
	const result = new Map<string, string>();
	for (let i = 0; i < directives.length; i++) {
		const directive = directives[i];
		const args = directive.ci?.args;
		if (!args) continue;
		for (let j = 0; j < args.length; j++) {
			const moduleName = result.get(args[j]);
			if (moduleName) result.set(args[j], moduleName + "," + directive.module);
			else result.set(args[j], moduleName);
		}
	}

	if (result.size > 0) {
		const items: CompletionItem[] = [];
		const args = Array.from(result.entries());
		for (let j = 0; j < args.length; j++) {
			const [arg, moduleName] = args[j];
			const part = arg.match(/^(\??)(\w+)=(.+)$/);
			if (!part) continue;
			const item = new CompletionItem(`${part[2]}=`, CompletionItemKind.Field);
			item.detail = moduleName;
			item.insertText = new SnippetString(
				part[1] === "?" ? `${part[2]}\${1:=${part[3]}}` : `${part[2]}=\${1:${part[3]}}`
			);
			items.push(item);
		}
		if (items.length > 0) return items;
	}
}
