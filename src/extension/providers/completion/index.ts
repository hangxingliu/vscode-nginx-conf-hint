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
import { getVariablesManifest } from "../../hint-data/manifest";
import { logger } from "../../logger";
import { getNginxConfCursorContext } from "../../parser";
import { getVariableCompletionItemBase, resolveDirectiveCompletionItem } from "./item";
import { extensionConfig } from "../config";
import { DOCUMENT_SELECTOR } from "../utils";
import { mediaTypePrefixes, mediaTypePrefixSet, mediaTypes, MediaTypeTuple } from "../../hint-data/media-types";
import { _completePath, _doesDirectiveNeedCompletePath } from "./path";
import { _completeNameArgs } from "./named-arguments";
import { _completeNameLocation, _doesDirectiveCanUseNamedLocation } from "./named-location";
import { _completeHttpHeader, _doesDirectiveNeedHttpHeader } from "./http-header";
import { _completeDirectives } from "./directives";

const zeroPos = new Position(0, 0);

export class NginxCompletionItemsProvider implements CompletionItemProvider {
	mediaTypePrefixItems: CompletionItem[] = [];

	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, this, "$", "/", " ", "@", "-"));
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
		const { n, v, list } = cursorContext;

		// typing directive
		if (list.length === (n ? 0 : 1)) {
			const result = _completeDirectives(cursorContext);
			if (result) return result;
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

		const completePos = list.length - (n ? 0 : 1);
		const completeHeaderPos = _doesDirectiveNeedHttpHeader(list[0]);
		if (completeHeaderPos === true || completePos === completeHeaderPos)
			return _completeHttpHeader(document, position, currentInput);

		// other args
		if (n && !list[0].startsWith("$")) return _completeNameArgs(list[0]);

		// use named location
		if (currentInput[0] === "@" && _doesDirectiveCanUseNamedLocation(list[0]))
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
