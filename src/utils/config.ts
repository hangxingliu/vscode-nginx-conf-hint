import { resolve } from "path";

export const enum ManifestItemType {
	ModuleNames = 1,
	Directive = 2,
	Variable = 3,
	DirectiveDetails = 4,
	VariableDetails = 5,
	HttpReqHeader = 6,
	HttpResHeader = 7,
}

export const cacheDir = resolve(__dirname, 'cache')
export const projectDir = resolve(__dirname, '../..');
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
export const syntaxURLs = {
	original: 'https://raw.githubusercontent.com/shanoor/vscode-nginx/master/syntaxes/nginx.tmLanguage',
	sublime: 'https://raw.githubusercontent.com/brandonwamboldt/sublime-nginx/master/Syntaxes/nginx.tmLanguage',
}
export const mediaTypesURL = 'https://www.iana.org/assignments/media-types/media-types.xhtml'

export const nginxDocsBaseURL = 'https://nginx.org/en/docs/';
export const nginxLuaDocsBaseURL = 'https://github.com/openresty/lua-nginx-module/blob/master/README.markdown';
export const luaRestyDocsURLs = [
	{ prefix: 'memcached', url: 'https://github.com/openresty/lua-resty-memcached' },
	{ prefix: 'mysql', url: 'https://github.com/openresty/lua-resty-mysql' },
	{ prefix: 'redis', url: 'https://github.com/openresty/lua-resty-redis' },
	{ prefix: 'dns', url: 'https://github.com/openresty/lua-resty-dns' },
	{ prefix: 'upload', url: 'https://github.com/openresty/lua-resty-upload' },
	{ prefix: 'websocket', url: 'https://github.com/openresty/lua-resty-websocket' },
	{ prefix: 'lock', url: 'https://github.com/openresty/lua-resty-lock' },
	{ prefix: 'lrucache', url: 'https://github.com/openresty/lua-resty-lrucache' },
]
export const nginxLuaModuleURLs = [
	// { name: 'ngx_memc', url: 'http://github.com/openresty/memc-nginx-module' },
	// { name: 'ngx_postgres', url: 'https://github.com/FRiCKLE/ngx_postgres' },
	// { name: 'ngx_redis2', url: 'http://github.com/openresty/redis2-nginx-module' },
	// { name: 'ngx_redis', url: 'http://wiki.nginx.org/HttpRedisModule' },
	// { name: 'ngx_proxy', url: 'http://nginx.org/en/docs/http/ngx_http_proxy_module.html' },
	// { name: 'ngx_fastcgi', url: 'http://nginx.org/en/docs/http/ngx_http_fastcgi_module.html' },
]

export const httpHeadersWikiURLs = {
	en: 'https://en.wikipedia.org/wiki/List_of_HTTP_header_fields',
	es: 'https://es.wikipedia.org/wiki/Anexo:Cabeceras_HTTP',
	'zh-Hans': 'https://zh.wikipedia.org/zh-cn/HTTP%E5%A4%B4%E5%AD%97%E6%AE%B5',
	'zh-Hant-HK': 'https://zh.wikipedia.org/zh-hk/HTTP%E5%A4%B4%E5%AD%97%E6%AE%B5',
	'zh-Hant-TW': 'https://zh.wikipedia.org/zh-tw/HTTP%E5%A4%B4%E5%AD%97%E6%AE%B5',
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
