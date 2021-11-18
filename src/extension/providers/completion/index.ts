/* eslint-disable @typescript-eslint/no-unused-vars */

import {
	CancellationToken,
	CompletionContext,
	CompletionItem,
	CompletionItemProvider,
	Disposable,
	Range,
	languages,
	Position,
	TextDocument,
	Uri,
	CompletionItemKind,
	CompletionList,
} from "vscode";
import { getDirectivesManifest, getVariablesManifest } from "../../hint-data/manifest";
import { NginxDirective } from "../../hint-data/types";
import { logger } from "../../logger";
import { getNginxConfCursorContext, getNginxConfDefinitionInfo } from "../../parser";
import { getDirectiveCompletionItemBase, getVariableCompletionItemBase, resolveDirectiveCompletionItem } from "./item";
import { extensionConfig } from "../config";
import { DOCUMENT_SELECTOR } from "../utils";
import { mediaTypePrefixes, mediaTypePrefixSet, mediaTypes, MediaTypeTuple } from "../../hint-data/media-types";
import { _completePath, _doesDirectiveNeedCompletePath } from "./path";
import { getDirectiveLocationCItem } from "./directive-location";
import { _completeNameArgs } from "./named-arguments";
import { _completeNameLocation, _doesDirectiveCanUseNamedLocation } from "./named-location";

const zeroPos = new Position(0, 0);

export class NginxCompletionItemsProvider implements CompletionItemProvider {
	mediaTypePrefixItems: CompletionItem[] = [];

	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, this, "$", "/", " ",'@'));
		this.mediaTypePrefixItems = mediaTypePrefixes.map((it) => {
			const item = new CompletionItem(`${it}/`, CompletionItemKind.Value);
			item.detail = "Media Type";
			return item;
		});
	}
	createMediaTypeCompletionItem(mediaType: MediaTypeTuple) {
		const [it, description] = mediaType;
		const item = new CompletionItem(it, CompletionItemKind.Value);
		if (description) item.detail = description;
		return item;
	}

	async provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext
	) {
		try {
			const result = await this._provideCompletionItems(document, position, token, context);
			return result;
		} catch (error) {
			logger.error(error);
		}
	}

	async _provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext
	) {
		const beforeText = document.getText(new Range(zeroPos, position));
		const cursorContext = getNginxConfCursorContext(beforeText);

		// in comment
		if (cursorContext.c) return null;
		const { n, v, list, context: nginxContext } = cursorContext;

		// typing directive
		if (list.length === (n ? 0 : 1)) {
			if (nginxContext === "types") return this.completeMediaType(list[0] || "");

			// Empty preifx
			if (!list[0]) {
				return new CompletionList(getDirectivesManifest().onEmpty.map(getDirectiveCompletionItemBase), true);
			}

			const inputPrefix = list[0];
			const matchedDirectives: NginxDirective[] = [];
			const addDirectives = (directives: NginxDirective[]) => {
				if (extensionConfig.enableStrictCompletion && nginxContext) {
					directives.forEach((it) => {
						if (it.contexts.indexOf(nginxContext) == -1 && it.contexts[0] != "any") return;
						if (it.name.startsWith(inputPrefix)) matchedDirectives.push(it);
					});
				} else {
					directives.forEach((it) => {
						if (it.name.startsWith(inputPrefix)) matchedDirectives.push(it);
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

		const currentInput = n || list.length === 0 ? "" : list[list.length - 1];

		// complete file
		if (_doesDirectiveNeedCompletePath(list[0]) && (n || list.length > 1)) {
			return _completePath(Uri.joinPath(document.uri, ".."), currentInput);
		}

		// variable
		if (v || v === "") {
			const variables = getVariablesManifest();
			let list = variables.core.map(getVariableCompletionItemBase);
			if (extensionConfig.hasJsModule) list = list.concat(variables.js.map(getVariableCompletionItemBase));
			if (extensionConfig.hasLuaModule) list = list.concat(variables.lua.map(getVariableCompletionItemBase));
			return list;
		}

		// other args
		if (n && !list[0].startsWith("$")) return _completeNameArgs(list[0]);

		// use named location
		if (currentInput[0] === '@' && _doesDirectiveCanUseNamedLocation(list[0]))
			return _completeNameLocation(document, currentInput);
	}

	async resolveCompletionItem(item: CompletionItem) {
		return resolveDirectiveCompletionItem(item);
	}

	private async completeMediaType(input: string) {
		const index = input.indexOf("/");
		if (index >= 0) {
			const prefix = input.slice(0, index);
			const partialSuffix = input.slice(index + 1).toLowerCase();
			let suffix = mediaTypePrefixSet.has(prefix) ? mediaTypes[prefix] : [];
			if (partialSuffix) suffix = suffix.filter((it) => it[0].toLowerCase().startsWith(partialSuffix));

			let incomplete = false;
			if (suffix.length >= 200) {
				suffix = suffix.slice(0, 200);
				incomplete = true;
			}
			return new CompletionList(suffix.map(this.createMediaTypeCompletionItem), incomplete);
		}
		return this.mediaTypePrefixItems;
	}
}
