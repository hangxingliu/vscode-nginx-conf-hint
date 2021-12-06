import {
	Disposable,
	Range,
	languages,
	TextDocument,
	HoverProvider,
	Hover,
	Position,
	MarkdownString,
	workspace,
} from "vscode";
import { findManifestByName, getHttpHeaders } from "../hint-data/manifest";
import { getModuleDetailsQuick } from "../hint-data/details";
import { NginxDirective, NginxVariable } from "../hint-data/types";
import { getNginxConfCursorContext } from "../parser";
import { DOCUMENT_SELECTOR } from "./utils";
import { getNginxExternalDocsLink } from "../hint-data/link";

const zeroPos = new Position(0, 0);

export class NginxHoverProvider implements HoverProvider {
	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerHoverProvider(DOCUMENT_SELECTOR, this));
		disposables.push(workspace.onDidOpenTextDocument(this.cleanCache.bind(this)));
	}

	cache: Array<{ exp: number; hover: Hover }> = [];
	cleanCache() {
		// logger.verbose(`clean cache`);
		this.cache = [];
	}
	addCache(hover: Hover) {
		if (!hover.range) return;
		const cacheSize = this.cache.length;
		if (cacheSize > 3) this.cache = this.cache.slice(cacheSize - 3);
		this.cache.push({ exp: Date.now() + 2000, hover });
		return hover;
	}
	getCache(position: Position) {
		const now = Date.now();
		for (let i = 0; i < this.cache.length; i++) {
			const { exp, hover } = this.cache[i];
			if (now < exp && hover.range.contains(position)) {
				// logger.verbose(`matched hover cache at range`);
				return hover;
			}
		}
		this.cache = [];
	}

	async provideHover(document: TextDocument, position: Position) {
		const cache = this.getCache(position);
		if (cache) return cache;

		const beforeText = document.getText(new Range(zeroPos, position));
		const mtx = document.getText(new Range(position, new Position(position.line + 1, 0))).match(/^[\w\-]+/);
		const afterWord = mtx ? mtx[0] : "";
		const { c, list, index, v, context } = getNginxConfCursorContext(beforeText + afterWord);
		if (c) return null;

		if (list.length === 1) {
			const directiveName = list[0];
			let manifest = findManifestByName(directiveName) as NginxDirective[];
			if (manifest.length === 0) return null;
			if (manifest.length > 1 && context) {
				const _manifest = manifest.filter((it) => it.contexts.indexOf(context) >= 0);
				if (_manifest.length > 0) manifest = _manifest;
			}
			const [directive] = manifest;
			const link = new MarkdownString(`$(book) [goto nginx document](${getNginxExternalDocsLink(directive)})`);
			link.supportThemeIcons = true;

			const hover = [
				link,
				`**${directive.name}** ${directive.module}` + (directive.since ? `since **${directive.since}**` : ""),
			];
			if (directive.def) hover.push(`default: *${directive.def}*`);

			const moduleDetails = getModuleDetailsQuick(directive.module);
			if (moduleDetails) {
				const details = moduleDetails.diretives.get(directiveName);
				hover.push(details.markdown);
			}
			const range = new Range(
				document.positionAt(index[0]),
				document.positionAt(index[0] + directiveName.length)
			);
			return this.addCache(new Hover(hover, range));
		}

		if (v) {
			const variableName = v.replace(/^\$?/, "$");
			const manifest = findManifestByName(variableName) as NginxVariable[];
			if (manifest.length === 0) return null;

			const [variable] = manifest;
			const link = new MarkdownString(`$(book) [goto nginx document](${getNginxExternalDocsLink(variable)})`);
			link.supportThemeIcons = true;

			const hover = [link, `**${variable.name}** ${variable.module}`, variable.desc];
			return new Hover(hover);
		}

		if (list.length >= 1) {
			const word = list[list.length - 1] || '';
			const lcWord = word.toLowerCase();

			// http header
			const header = getHttpHeaders().find(it => it.lowercase === lcWord);
			if (header) {
				let part1 = `HTTP header **${header.name}**`;
				if (header.standard) part1 += ` (${header.standard})`;
				return new Hover([part1, header.markdown]);
			}
		}
		return null;
	}
}
