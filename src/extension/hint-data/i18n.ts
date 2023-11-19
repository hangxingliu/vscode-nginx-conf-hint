import { env } from "vscode";

export function getLangNameForManifest() {
	const lang = env.language.toLowerCase();
	if (lang.startsWith('de')) return 'de';
	if (lang.startsWith('es')) return 'es';
	if (lang.startsWith('zh-cn')) return 'zh-Hans';
	if (lang.startsWith('zh')) return 'zh-Hant-TW';
	return 'en';
}
