import { NginxDirective, NginxVariable } from "./types";
import { ManifestItemType } from "./enum";
import { ExternalModuleName } from "../types";

const pushToMap = <T>(map: Map<string, T[]>, key: string, value: T) => {
	const list = map.get(key);
	if (list) list.push(value);
	else map.set(key, [value]);
}

const allDirectives = new Map<string, NginxDirective[]>();
const directives = {
	onEmpty: [] as NginxDirective[],

	core: [] as NginxDirective[],
	js: [] as NginxDirective[],
	lua: [] as NginxDirective[],
}

const allVariables = new Map<string, NginxVariable[]>();
const variables = {
	core: [] as NginxVariable[],
	js: [] as NginxVariable[],
	lua: [] as NginxVariable[],
}

export function getDirectivesManifest() {
	return directives;
}
export function getVariablesManifest() {
	return variables;
}

export function findManifestByName(input: string) {
	if (input[0] === '$') return allVariables.get(input) || [];
	return allDirectives.get(input) || [];
}

export function initHintDataManifest() {
	const _core = require('../../../assets/manifest/core.json');
	const _js = require('../../../assets/manifest/js.json');
	const _lua = require('../../../assets/manifest/lua.json');
	process(_core, 'core');
	process(_js, 'js');
	process(_lua, 'lua');

	function process(items: unknown[][], storageType: keyof typeof directives) {
		let index2modName: string[] = [];
		let exmod: ExternalModuleName = undefined;
		if (storageType === 'js') exmod = 'js';
		else if (storageType === 'lua') exmod = 'lua';

		for (let i = 0; i < items.length; i++) {
			const col = items[i];
			switch (col[0]) {
				case ManifestItemType.ModuleNames:
					index2modName = col.map(it => String(it));
					break;
				case ManifestItemType.Directive: {
					const modName = String(index2modName[col[5] as number] || '');
					const item: NginxDirective = {
						name: col[1] as string,
						syntax: col[2] as string[],
						def: col[3] as string,
						contexts: col[4] as string[],
						module: modName,
						since: col[6] as string,
						link: col[7] as string,
						ci: col[8] as any,
						exmod,
					};
					if (modName === 'ngx_core_module')
						directives.onEmpty.push(item);
					pushToMap(allDirectives, item.name, item);
					directives[storageType].push(item);
					break;
				}
				case ManifestItemType.Variable: {
					const modName = String(index2modName[col[3] as number] || '');
					const item: NginxVariable = {
						name: col[1] as string,
						desc: col[2] as string,
						module: modName,
						since: col[4] as string,
						link: col[5] as string,
						ci: col[6] as any,
					};
					pushToMap(allVariables, item.name, item);
					variables[storageType].push(item);
					break;
				}
			}
		}
	}
}
