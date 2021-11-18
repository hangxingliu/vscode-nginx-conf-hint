import { SnippetString } from "vscode";
import { NginxDirective } from "../../hint-data/types";
import { getDirectiveCompletionItemBase } from "./item";

/**
 * https://nginx.org/en/docs/http/ngx_http_core_module.html#location
 * https://code.visualstudio.com/docs/editor/userdefinedsnippets
 */
const locationSyntax: Array<[string, SnippetString]> = [
	["location", new SnippetString("location ${1:/} {\n\t$0\n}")],
	["location (named)", new SnippetString("location @${1:name} {\n\t$0\n}")],
	["location (exact match)", new SnippetString("location = ${1:/uri} {\n\t$0\n}")],
	["location (regexp)", new SnippetString("location ~* ${1:/uri} {\n\t$0\n}")],
	["location (regexp, case-sensitive)", new SnippetString("location ~ ${1:/uri} {\n\t$0\n}")],
	["location (^~)", new SnippetString("location ^~ ${1:/uri} {\n\t$0\n}")],
];

export function getDirectiveLocationCItem(directive: NginxDirective) {
	return locationSyntax.map((it) => {
		const citem = getDirectiveCompletionItemBase(directive);
		citem.label = it[0];
		citem.insertText = it[1];
		return citem;
	});
}
