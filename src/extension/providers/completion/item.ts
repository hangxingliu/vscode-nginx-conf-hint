import { CompletionItem, CompletionItemKind, MarkdownString, SnippetString } from "vscode";
import { getModuleDetails } from "../../hint-data/details";
import { NginxDirective, NginxVariable } from "../../hint-data/types";

export type DirectiveCompletionItemBase = CompletionItem & {
	resolved?: boolean;
	module?: string;
	directive?: string;
	filter?: string[];
	contexts?: string[];
};

export function getDirectiveCompletionItemBase(directive: NginxDirective) {
	const moduleName = directive.module;
	const isCoreFunc = moduleName == "ngx_core_module";

	const item: DirectiveCompletionItemBase = new CompletionItem(directive.name, CompletionItemKind.Property);

	const documentation = ["``` NGINX", directive.syntax.join("\n"), "```\n"].join("\n");
	item.documentation = new MarkdownString(documentation);
	item.detail = isCoreFunc ? "" : moduleName;
	item.module = directive.module;
	item.directive = directive.name;

	//#region insertText
	if (directive.ci?.insert) {
		item.insertText = new SnippetString(directive.ci.insert);
	} else {
		item.insertText = new SnippetString(
			directive.def // has default value
				? directive.def.replace(/^(\w+)(\s+)(.+);$/, (_, a, b, c) => `${a}${b}\${1:${c}};`)
				: `${directive.name}\$\{0\};`
		);
	}
	//#endregion insertText

	//for fuzzy matching
	item.filter = directive.name.split("_");
	//for checking parent block name
	item.contexts = directive.contexts || [];
	return item;
}

export async function resolveDirectiveCompletionItem(item: DirectiveCompletionItemBase) {
	if (!item || !item.module || !item.directive || item.resolved) return item;
	const moduleDetails = await getModuleDetails(item.module);
	if (moduleDetails) {
		const d = moduleDetails.diretives.get(item.directive);
		if (item.documentation instanceof MarkdownString) {
			item.documentation = item.documentation.appendMarkdown(d.markdown);
		}
		item.resolved = true;
	}
	return item;
}

function removeUglyCharactersInCompletionItem(text = "") {
	return (
		text
			.replace(/&#x(\w{4});/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
			//remove <code></code> mark
			.replace(/“`(.+?)`”/g, "“$1”")
	);
}
export function getVariableCompletionItemBase(variable: NginxVariable) {
	const item = new CompletionItem(variable.name, CompletionItemKind.Variable);
	item.documentation = removeUglyCharactersInCompletionItem(variable.desc);
	item.detail = variable.module;
	item.insertText = variable.name.replace(/^\$/, "");
	return item;
}
