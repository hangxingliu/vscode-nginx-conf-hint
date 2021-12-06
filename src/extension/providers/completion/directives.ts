import { CompletionItem, CompletionList } from "vscode";
import { getDirectivesManifest } from "../../hint-data/manifest";
import { NginxDirective } from "../../hint-data/types";
import { NginxConfCursorContext } from "../../parser";
import { extensionConfig } from "../config";
import { getDirectiveLocationCItem } from "./directive-location";
import { getDirectiveCompletionItemBase } from "./item";

export function _completeDirectives(cursorContext: NginxConfCursorContext) {
	const { list, context: nginxContext } = cursorContext;
	if (nginxContext === "types") return this.completeMediaType(list[0] || "");
	if (nginxContext === "map") return;

	// Empty preifx
	const inputPrefix = list[0];
	if (!inputPrefix) {
		return new CompletionList(getDirectivesManifest().onEmpty.map(getDirectiveCompletionItemBase), true);
	}

	const lcPrefix = inputPrefix.toLowerCase();
	const matchedDirectives: NginxDirective[] = [];
	const addDirectives = (directives: NginxDirective[]) => {
		if (extensionConfig.enableStrictCompletion && nginxContext) {
			directives.forEach((it) => {
				if (it.contexts.indexOf(nginxContext) == -1 && it.contexts[0] != "any") return;
				if (testPrefix(it, lcPrefix)) matchedDirectives.push(it);
			});
		} else {
			directives.forEach((it) => {
				if (testPrefix(it, lcPrefix)) matchedDirectives.push(it);
			});
		}
	}; // end of addDirectives

	const manifest = getDirectivesManifest();
	addDirectives(manifest.core);
	if (extensionConfig.hasJsModule) addDirectives(manifest.js);
	if (extensionConfig.hasLuaModule) addDirectives(manifest.lua);

	const result: CompletionItem[] = [];
	for (let i = 0; i < matchedDirectives.length; i++) {
		const directive = matchedDirectives[i];
		switch (directive.name) {
			case "location":
				result.push(...getDirectiveLocationCItem(directive));
				break;
			default:
				result.push(getDirectiveCompletionItemBase(directive));
				break;
		}
	}
	return result;
}

function testPrefix(item: NginxDirective, lcPrefix: string) {
	if (item.name.startsWith(lcPrefix)) return true;
	if (item.filters.findIndex((it) => it.startsWith(lcPrefix)) >= 0) return true;
	return false;
}
