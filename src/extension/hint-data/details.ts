import { env, ExtensionContext, UIKind, Uri } from "vscode";
import { logger } from "../logger";
import { loadHintDataAsync } from "./async-loader";
import { ManifestItemType } from "./enum";
import { NginxDirectiveDetails } from "./types";

let detailsUri: Uri;
// let inBrowser = false;
const preloadModules = [
	'ngx_core_module',
	'ngx_http_core_module',
]

class ModuleDetails {
	diretives = new Map<string, NginxDirectiveDetails>();
	varDocs = '';
}
/** value is module name */
const loadings = new Set<string>();
/** key is module name and value is ModuleDetails */
const modulesMap = new Map<string, ModuleDetails>();

export async function loadModuleDetails(moduleName: string) {
	if (!detailsUri) {
		logger.error(`load module "${moduleName}" details failed: detailsUri is not initialized`);
		return null;
	}
	const moduleUri = Uri.joinPath(detailsUri, `${moduleName}.json`);
	const items = await loadHintDataAsync(moduleUri);
	if (!items) {
		loadings.delete(moduleName);
		return null;
	}

	const details = new ModuleDetails();
	for (let i = 0; i < items.length; i++) {
		const cols = items[i];
		switch (cols[0]) {
			case ManifestItemType.DirectiveDetails: {
				const item: NginxDirectiveDetails = {
					name: cols[1] as string,
					markdown: cols[2] as string,
					html: cols[3] as string,
					notes: cols[4] as string[],
					table: cols[5] as string,
				};
				details.diretives.set(item.name, item);
				break;
			}
			case ManifestItemType.VariableDetails: {
				details.varDocs += cols[1];
				break;
			}
		}
	}
	modulesMap.set(moduleName, details);
	loadings.delete(moduleName);
	logger.verbose(`loaded details of module "${moduleName}"`);
	return details;
}

export async function initHintDataDetails(context: ExtensionContext) {
	detailsUri = Uri.joinPath(context.extensionUri, 'assets', 'details');
	const logs: string[] = [`detailsUri=${detailsUri.toString()}`];
	if (env.uiKind === UIKind.Web) {
		// inBrowser = true;
		logs.push(`uiKind=Web`);
		logs.push(`indexedDB=${typeof indexedDB}`);
	}
	logs.push(`TextDecoder=${typeof TextDecoder}`);
	logger.log(logs.join(' '));

	if (preloadModules.length > 0) {
		logger.log(`start preloading ${preloadModules.length} modules: ${preloadModules}`);
		getMultiModuleDetails(preloadModules);
	}
}

export async function getModuleDetails(moduleName: string) {
	const details = modulesMap.get(moduleName);
	if (!details)
		return loadModuleDetails(moduleName);
	return details;
}

export async function getMultiModuleDetails(moduleNames: string[]) {
	return Promise.all(moduleNames.map(getModuleDetails));
}

export function getModuleDetailsQuick(moduleName: string) {
	const details = modulesMap.get(moduleName);
	if (!details && !loadings.has(moduleName)) {
		loadings.add(moduleName);
		loadModuleDetails(moduleName);
	}
	return details;
}

