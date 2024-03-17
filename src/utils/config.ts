import { resolve } from "path";

export const projectDir = resolve(__dirname, '../..');
export const cacheDir = resolve(projectDir, 'cache')
export const syntaxesDir = resolve(projectDir, 'src/syntax/references');
export const hintDataDir = resolve(projectDir, 'hint_data');

export const manifestDir = resolve(projectDir, 'assets/manifest');
export const detailsDir = resolve(projectDir, 'assets/details');
export const snippetDir = resolve(projectDir, 'assets/snippets');
export const mediaTypeDir = resolve(projectDir, 'assets/mediatypes');

export const docsTemplatesDir = resolve(__dirname, '../extension/documents/templates');
export const docsTemplateTarget = resolve(docsTemplatesDir, 'index.ts');

export const syntaxFiles = {
	original: resolve(syntaxesDir, 'shanoor.nginx.tmLanguage'),
	sublime: resolve(syntaxesDir, 'sublime.nginx.tmLanguage'),
}



export const manifestFiles = {
	core: resolve(manifestDir, 'core.json'),
	js: resolve(manifestDir, 'js.json'),
	lua: resolve(manifestDir, 'lua.json'),
	httpHeaders: (language: string) =>
		resolve(manifestDir, `http_headers.${language}.json`),
}
export const detailsFile = (moduleName: string) =>
	resolve(detailsDir, `${moduleName}.json`);
export const mediaTypeFile = (prefix: string) =>
	resolve(mediaTypeDir, `${prefix}.json`);

export const luaSnippetFile = resolve(snippetDir, 'lua.json');
