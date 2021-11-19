import { workspace } from "vscode";
import { ExternalModuleName } from "../types";

export class ExtensionConfiguration {

	//#region vscode configurations
	enableStrictCompletion = true;
	enableFormatAlign = false;
	externalModules: ExternalModuleName[] = [];
	tabSize = 4;
	//#endregion vscode configurations

	hasJsModule = false;
	hasLuaModule = false;

	reload = () => {
		const config = workspace.getConfiguration('nginx-conf-hint');

		this.enableStrictCompletion = config.get('enableStrictCompletion', true);
		this.enableFormatAlign = !!config.get('format', { align: false }).align;
		this.externalModules = config.get('externalModules', []);
		this.tabSize = workspace.getConfiguration("editor").get("tabSize", 4);

		this.hasJsModule = this.externalModules.indexOf('js') >= 0;
		this.hasLuaModule = this.externalModules.indexOf('lua') >= 0;
	}
}

export const extensionConfig = new ExtensionConfiguration();
