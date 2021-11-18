import { CompletionItem, CompletionItemKind, MarkdownString, SnippetString } from "vscode";
import { NginxDirective, ExternalModuleName, NginxVariable } from "../hint-data/types";

export type DirectiveCompletionItemBase = CompletionItem & {
	exmod?: ExternalModuleName;
	filter?: string[];
	contexts?: string[];
}

export function getDirectiveCompletionItemBase(directive: NginxDirective) {
	const moduleName = directive.module;
	const isCoreFunc = moduleName == 'ngx_core_module';

	const item: DirectiveCompletionItemBase = new CompletionItem(directive.name,
		CompletionItemKind.Property);
	if (!isCoreFunc) {
		if (moduleName.startsWith('lua-')) item.exmod = 'lua';
		else if (moduleName.endsWith('_js_module')) item.exmod = 'js';
	}

	const documentation = [
		'``` NGINX',
		directive.syntax.join('\n'),
		'```\n',
	].join('\n')
	item.documentation = new MarkdownString(documentation)
	item.detail = isCoreFunc ? '' : moduleName;

	//#region insertText
	if (directive.ci?.insert) {
		item.insertText = new SnippetString(directive.ci.insert)
	} else {
		item.insertText = new SnippetString(
			directive.def  // has default value
				? directive.def.replace(/^(\w+)(\s+)(.+);$/, (_, a, b, c) => `${a}${b}\${1:${c}};`)
				: `${directive.name}\$\{0\};`);
	}
	//#endregion insertText

	//for fuzzy matching
	item.filter = directive.name.split('_');
	//for checking parent block name
	item.contexts = directive.contexts || [];
	return item;
}


function removeUglyCharactersInCompletionItem(text = '') {
	return text.replace(/&#x(\w{4});/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		//remove <code></code> mark
		.replace(/“`(.+?)`”/g, '“$1”');
}
export function getVariableCompletionItemBase(variable: NginxVariable) {
	let item = new CompletionItem(variable.name, CompletionItemKind.Variable);
	item.documentation = removeUglyCharactersInCompletionItem(variable.desc);
	item.detail = variable.module;
	item.insertText = variable.name.replace(/^\$/, '');
	return item;
}
