import { HttpHeaderInfo, HttpHeaderType, NginxDirective, NginxVariable } from "./types";
import { ManifestItemType } from "./enum";
import { ExternalModuleName } from "../types";
import { getLangNameForManifest } from "./i18n";
import { ExtensionContext, Uri } from "vscode";
import { loadHintDataAsync } from "./async-loader";

const pushToMap = <T>(map: Map<string, T[]>, key: string, value: T) => {
	const list = map.get(key);
	if (list) list.push(value);
	else map.set(key, [value]);
};

const allDirectives = new Map<string, NginxDirective[]>();
const directives = {
	onEmpty: [] as NginxDirective[],

	core: [] as NginxDirective[],
	js: [] as NginxDirective[],
	lua: [] as NginxDirective[],
};

const allVariables = new Map<string, NginxVariable[]>();
const variables = {
	core: [] as NginxVariable[],
	js: [] as NginxVariable[],
	lua: [] as NginxVariable[],
};

const allHttpHeaders: HttpHeaderInfo[] = [];

export function getDirectivesManifest() {
	return directives;
}
export function getVariablesManifest() {
	return variables;
}
export function getHttpHeaders() {
	return allHttpHeaders;
}

export function findManifestByName(input: string) {
	if (input[0] === "$") return allVariables.get(input) || [];
	return allDirectives.get(input) || [];
}

export function initHintDataManifest() {
	const _core = require("../../../assets/manifest/core.json");
	const _js = require("../../../assets/manifest/js.json");
	const _lua = require("../../../assets/manifest/lua.json");
	process(_core, "core");
	process(_js, "js");
	process(_lua, "lua");

	initHttpHeaders();

	function process(items: unknown[][], storageType: keyof typeof directives) {
		let index2modName: string[] = [];
		let exmod: ExternalModuleName = undefined;
		if (storageType === "js") exmod = "js";
		else if (storageType === "lua") exmod = "lua";

		for (let i = 0; i < items.length; i++) {
			const col = items[i];
			switch (col[0]) {
				case ManifestItemType.ModuleNames:
					index2modName = col.map((it) => String(it));
					break;
				case ManifestItemType.Directive: {
					const modName = String(index2modName[col[5] as number] || "");
					const name = String(col[1] || "");
					if (!name) break;
					const filters = name.split("_").map((it) => it.toLowerCase());
					const item: NginxDirective = {
						name,
						syntax: col[2] as string[],
						def: col[3] as string,
						contexts: col[4] as string[],
						module: modName,
						since: col[6] as string,
						link: col[7] as string,
						ci: col[8] as unknown,
						filters,
						exmod,
					};
					if (modName === "ngx_core_module") directives.onEmpty.push(item);
					pushToMap(allDirectives, item.name, item);
					directives[storageType].push(item);
					break;
				}
				case ManifestItemType.Variable: {
					const modName = String(index2modName[col[3] as number] || "");
					const item: NginxVariable = {
						name: col[1] as string,
						desc: col[2] as string,
						module: modName,
						since: col[4] as string,
						link: col[5] as string,
						ci: col[6] as unknown,
					};
					pushToMap(allVariables, item.name, item);
					variables[storageType].push(item);
					break;
				}
			}
		}
	}
}

function initHttpHeaders() {
	const _headers: unknown[][] = require("../../../assets/manifest/http_headers.en.json");
	const headerBaseType = new Map<string, HttpHeaderType>();

	let prevItem: HttpHeaderInfo;
	for (let index = 0; index < _headers.length; index++) {
		const header = _headers[index];
		const name = String(header[1] || "");
		if (!name) continue;

		let type = headerBaseType.get(name) || HttpHeaderType.none;
		if (header[0] === ManifestItemType.HttpReqHeader) type += HttpHeaderType.request;
		else if (header[0] === ManifestItemType.HttpResHeader) type += HttpHeaderType.response;
		if (!type) continue;

		const _description = header[2];
		let item: HttpHeaderInfo;
		if (typeof _description === "string") {
			// full item
			item = {
				type,
				name,
				lowercase: name.toLowerCase(),
				markdown: _description,
				example: header[3] as string[],
				standard: String(header[4] || ""),
			};
		} else if (_description === -1 && prevItem) {
			// noop
			item = {
				...prevItem,
				name,
				lowercase: name.toLowerCase(),
			};
		} else {
			// invalid
			continue;
		}
		prevItem = item;
		if (!headerBaseType.has(name)) allHttpHeaders.push(item);
		headerBaseType.set(name, type);
	}
}

export async function initI18nManifest(context: ExtensionContext) {
	const language = getLangNameForManifest();
	if (language === 'en') return;

	const manifestUri = Uri.joinPath(context.extensionUri, 'assets', 'manifest');

	//#region http headers
	const httpHeadersFile = Uri.joinPath(manifestUri, `http_headers.${language}.json`);
	const items = await loadHintDataAsync(httpHeadersFile);
	const namesToMarkdown = new Map<string, string>();
	if (items) {
		for (let i = 0; i < items.length; i++) {
			const it = items[i];
			const name = String(it[1] || '');
			if (!name) continue;
			namesToMarkdown.set(name, String(it[2] || ''));
		}
		for (let i = 0; i < allHttpHeaders.length; i++) {
			const header = allHttpHeaders[i];
			const markdown = namesToMarkdown.get(header.name);
			if (markdown)
				header.markdown = markdown + '\n\n' + header.markdown;
		}
	}
	//#endregion http headers

}
