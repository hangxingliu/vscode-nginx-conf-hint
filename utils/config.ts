import { resolve } from "path";

export const cacheDir = resolve(__dirname, 'cache')
export const syntaxesDir = resolve(__dirname, '../syntaxes');
export const hintDataDir = resolve(__dirname, '../hint_data');

export const docsTemplatesDir = resolve(__dirname, '../src/extension/documents/templates');
export const docsTemplateTarget = resolve(docsTemplatesDir, 'index.ts');

export const syntaxFiles = {
	default: resolve(syntaxesDir, 'nginx.tmLanguage'),
	original: resolve(syntaxesDir, 'original.nginx.tmLanguage'),
	sublime: resolve(syntaxesDir, 'sublime.nginx.tmLanguage'),
}
export const syntaxURLs = {
	original: 'https://raw.githubusercontent.com/shanoor/vscode-nginx/master/syntaxes/nginx.tmLanguage',
	sublime: 'https://raw.githubusercontent.com/brandonwamboldt/sublime-nginx/master/Syntaxes/nginx.tmLanguage',
}

export const nginxDocsBaseURL = 'https://nginx.org/en/docs/';
export const nginxLuaDocsBaseURL = 'https://github.com/openresty/lua-nginx-module/blob/master/README.markdown';
export const luaRestyDocsURLs = [
	{ prefix: 'memcached', url: 'https://github.com/openresty/lua-resty-memcached' },
	{ prefix: 'mysql', url: 'https://github.com/openresty/lua-resty-mysql' },
	{ prefix: 'redis', url: 'https://github.com/openresty/lua-resty-redis' },
	{ prefix: 'dns', url: 'https://github.com/openresty/lua-resty-dns' },
	{ prefix: 'lock', url: 'https://github.com/openresty/lua-resty-lock' },
	{ prefix: 'lrucache', url: 'https://github.com/openresty/lua-resty-lrucache' },
]

export const hintDataFiles = {
	directivesDocs: resolve(hintDataDir, 'directives_document.json'),
	directives: resolve(hintDataDir, 'directives.json'),
	snippets: resolve(hintDataDir, 'snippets.json'),
	variablesDocs: resolve(hintDataDir, 'variables_document.json'),
	variables: resolve(hintDataDir, 'variables.json'),
	links: resolve(hintDataDir, 'links.json'),
	lua: {
		directivesDocs: resolve(hintDataDir, 'lua/directives_document.json'),
		directives: resolve(hintDataDir, 'lua/directives.json'),
		snippets: resolve(hintDataDir, 'lua/snippets.json'),
		variablesDocs: resolve(hintDataDir, 'lua/variables_document.json'),
		variables: resolve(hintDataDir, 'lua/variables.json'),
	},
}
