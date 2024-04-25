export const nginxDocsBaseURL = 'https://nginx.org/en/docs/';
export const nginxLuaDocsBaseURL = 'https://github.com/openresty/lua-nginx-module/';

export const luaRestyDocsURLs = [
	{ prefix: 'memcached', url: 'https://github.com/openresty/lua-resty-memcached' },
	{ prefix: 'mysql', url: 'https://github.com/openresty/lua-resty-mysql' },
	{ prefix: 'redis', url: 'https://github.com/openresty/lua-resty-redis' },
	{ prefix: 'dns', url: 'https://github.com/openresty/lua-resty-dns' },
	{ prefix: 'upload', url: 'https://github.com/openresty/lua-resty-upload' },
	{ prefix: 'websocket', url: 'https://github.com/openresty/lua-resty-websocket' },
	{ prefix: 'lock', url: 'https://github.com/openresty/lua-resty-lock' },
	{ prefix: 'lrucache', url: 'https://github.com/openresty/lua-resty-lrucache' },
	{ prefix: 'healthcheck', url: 'https://github.com/openresty/lua-resty-upstream-healthcheck' },
	{ prefix: 'balancer', url: 'https://github.com/openresty/lua-resty-balancer' },
]
export const nginxLuaModuleURLs: Array<{ name: string, url: string }> = [
	// { name: 'ngx_memc', url: 'http://github.com/openresty/memc-nginx-module' },
	// { name: 'ngx_postgres', url: 'https://github.com/FRiCKLE/ngx_postgres' },
	// { name: 'ngx_redis2', url: 'http://github.com/openresty/redis2-nginx-module' },
	// { name: 'ngx_redis', url: 'http://wiki.nginx.org/HttpRedisModule' },
	// { name: 'ngx_proxy', url: 'http://nginx.org/en/docs/http/ngx_http_proxy_module.html' },
	// { name: 'ngx_fastcgi', url: 'http://nginx.org/en/docs/http/ngx_http_fastcgi_module.html' },
]

export const mediaTypesURL = 'https://www.iana.org/assignments/media-types/media-types.xhtml'

export const httpHeadersWikiURLs = {
	de: 'https://de.wikipedia.org/wiki/Liste_der_HTTP-Headerfelder',
	en: 'https://en.wikipedia.org/wiki/List_of_HTTP_header_fields',
	es: 'https://es.wikipedia.org/wiki/Anexo:Cabeceras_HTTP',
	pt: 'https://pt.wikipedia.org/wiki/Lista_de_campos_de_cabe%C3%A7alho_HTTP',
	'zh-Hans': 'https://zh.wikipedia.org/zh-cn/HTTP%E5%A4%B4%E5%AD%97%E6%AE%B5',
	'zh-Hant-HK': 'https://zh.wikipedia.org/zh-hk/HTTP%E5%A4%B4%E5%AD%97%E6%AE%B5',
	'zh-Hant-TW': 'https://zh.wikipedia.org/zh-tw/HTTP%E5%A4%B4%E5%AD%97%E6%AE%B5',
}

export const syntaxURLs = {
	original: 'https://raw.githubusercontent.com/shanoor/vscode-nginx/master/syntaxes/nginx.tmLanguage',
	sublime: 'https://raw.githubusercontent.com/brandonwamboldt/sublime-nginx/master/Syntaxes/nginx.tmLanguage',
}
