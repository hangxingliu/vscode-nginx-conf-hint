#!/usr/bin/env node

import type { CheerioAPI, Node } from "cheerio";

import { nginxLuaDocsBaseURL, luaRestyDocsURLs, manifestFiles, ManifestItemType, detailsFile, luaSnippetFile, nginxLuaModuleURLs } from "./config";
import { getText, loadHtml, print, initHttpCache, JsonFileWriter, writeJSON } from "./helper";
import type { SnippetItem } from "../extension/types";

const manifestStreams = {
	lua: new JsonFileWriter(manifestFiles.lua),
}

const SIGN_END = 'Back to TOC';
const SIGN_SYNTAX = /syntax: (.*)/;
const SIGN_DEFAULT = /default: (.*)/;
const SIGN_CONTEXT = /context: (.*)/;
const SIGN_PHASE = /phase: (.*)/;
const SIGN_SINCE_VERSION = /^This directive was first introduced in the v(\d+\.\d+\.\d+) release./;

const snippetsResult: { [x: string]: SnippetItem } = {};

main().catch(error => print.error(error.stack));
async function main() {
	initHttpCache();

	const coreModule = 'lua_nginx_module'
	const moduleNames: Array<string | number> = [ManifestItemType.ModuleNames, coreModule, ...nginxLuaModuleURLs.map(it => it.name)];
	const getModuleIndex = (mod: string) => moduleNames.indexOf(mod, 1);
	manifestStreams.lua.writeItem(moduleNames);

	{
		const modName = coreModule;
		const modIndex = getModuleIndex(modName);
		const detailsStream = new JsonFileWriter(detailsFile(modName));

		const html = await getText(modName, nginxLuaDocsBaseURL);
		const $ = loadHtml(html);
		const $directiveList = $("#user-content-directives").parent("h1").next("ul").find("li a");
		let count = 0;
		$directiveList.each((i, ele) => {
			if (processDirectiveElement($, ele, nginxLuaDocsBaseURL, modIndex, detailsStream))
				count++;
		});
		console.log(`found ${count} directives`);

		const $snippetList = $("#user-content-nginx-api-for-lua").parent("h1").next("ul").find("li a");
		$snippetList.each((i, ele) => {
			processSnippetElement($, ele);
		});

		detailsStream.close();
	}

	for (let i = 0; i < nginxLuaModuleURLs.length; i++) {
		const { name: modName, url } = nginxLuaModuleURLs[i];
		const modIndex = getModuleIndex(modName);
		const detailsStream = new JsonFileWriter(detailsFile(modName));
		const html = await getText(modName, url);
		const $ = loadHtml(html);
		print.start('Analyzing Directives');
		const $directiveList = $("#user-content-directives").parent("h1").next("ul").find("li a");
		let count = 0;
		$directiveList.each((i, ele) => {
			if (processDirectiveElement($, ele, nginxLuaDocsBaseURL, modIndex, detailsStream))
			count++;
		});
		console.log(`found ${count} directives`);
		detailsStream.close();
	}

	for (let i = 0; i < luaRestyDocsURLs.length; i++) {
		const { prefix, url } = luaRestyDocsURLs[i];
		await processRestyREADME(url, prefix);
	}
	applyConstantSnippets();
	manifestStreams.lua.close();

	print.start('Writing snippets to file');
	writeJSON(luaSnippetFile, snippetsResult);
	print.ok();
	return print.done();
}

function processDirectiveElement(
	$: CheerioAPI,
	ele: Node,
	baseUrl: string,
	modIndex: number,
	detailsStream: JsonFileWriter,
) {
	const directiveName = $(ele).text();
	const directive = $("#user-content-" + directiveName);
	if (directive.length == 0) return false;

	const item = {
		name: '',
		syntax: [],
		def: '',
		contexts: [],
		desc: '',
		notes: [],
		since: '',
		module: ''
	};
	let docsHTML = '';
	let temp = directive.parent();
	while ((temp = temp.next())) {
		const character = temp.text();
		if (character == SIGN_END)
			break;

		let match = character.match(SIGN_SYNTAX);
		if (match) {
			item.syntax = [match[1].trim()];
			continue;
		}

		match = character.match(SIGN_DEFAULT);
		if (match) {
			item.def = match[1].trim();
			continue;
		}

		match = character.match(SIGN_CONTEXT);
		if (match) {
			item.contexts = match[1].split(',').map(i => i.trim());
			continue;
		}

		match = character.match(SIGN_PHASE);
		if (match) continue;

		match = character.match(SIGN_SINCE_VERSION);
		if (match) {
			item.since = match[1].trim();
		}
		item.desc = item.desc || character;
		item.notes.push(character);

		docsHTML += temp.toString();
	}

	if (item.def.startsWith("no")) {
		item.def = directiveName + " ;";
	}
	if (item.def == "") {
		if (directiveName.endsWith("by_lua")) {
			item.def = directiveName + " '';"
		} else if (directiveName.endsWith("by_lua_block")) {
			item.def = directiveName + " {}"
		} else if (directiveName.endsWith("by_lua_file")) {
			item.def = directiveName + " .lua;"
		} else {
			item.def = directiveName + " ;";
		}
	}
	item.name = directiveName;
	item.since = item.since || null;

	const ctx = item.contexts.map(n => `<code>${n}</code>`).join(',');
	const tableHTML = `<table ><tr><th>Syntax:</th><td><code><strong>${item.syntax}</strong></code><br></td></tr><tr><th>Default:</th><td><pre>${item.def}</pre></td></tr><tr><th>Context:</th><td>${ctx}</td></tr></table>`;
	manifestStreams.lua.writeItem([
		ManifestItemType.Directive,
		directiveName,
		item.syntax,
		item.def,
		item.contexts,
		modIndex,
		item.since,
		baseUrl + `#${directiveName}`,
		{},
	]);
	detailsStream.writeItem([
		ManifestItemType.DirectiveDetails,
		directiveName,
		item.desc,
		docsHTML,
		item.notes,
		tableHTML,
	]);
	return true;
}

function processSnippetElement($: CheerioAPI, ele: Node) {
	const name = $(ele).text();
	const directive = $("#user-content-" + name.toLocaleLowerCase().replace(/[\.:]/g, ""));
	if (name == 'Introduction' || directive.length == 0) return;
	const item: SnippetItem = {
		description: '',
		prefix: '',
		body: ''
	};
	let temp = directive.parent();
	while ((temp = temp.next())) {
		const character = temp.text();
		if (character == SIGN_END)
			break;

		let match = character.match(SIGN_SYNTAX);
		if (match) {
			let body = match[1].trim();
			match = body.match(/\((\w.*?)\)/)
			if (match) {
				const params = match[1].split(",").map((val, index) => {
					val = val.trim();
					return /^[a-zA-Z]+/.test(val) ? (`\${${index + 1}:${val}}`) : val;
				});
				body = body.replace(/\(\w.*?\)/, "(" + params.join(", ") + ")");
			}

			const split = body.split("=");
			const right = split[1];
			let left = split[0];
			if (left && right) {
				if (!left.includes("local")) {
					left = "local " + left;
				}
				body = `${left}=${right}`;
			}
			item.body = body;
			continue;
		}

		match = character.match(SIGN_CONTEXT);
		if (match) continue;

		item.description += character;
	}

	item.prefix = name;
	item.body = item.body || name;
	snippetsResult[name] = item;
}
async function processRestyREADME(baseUrl: string, prefix: string) {
	const html = await getText(prefix, baseUrl);
	const $ = loadHtml(html);

	print.start(`Analyzing Resty "${prefix}"`);
	$(".entry-content ul li a").each((i, ele) => {
		processRestySnippetElement($, ele, baseUrl, prefix);
	});
}
function processRestySnippetElement($: CheerioAPI, ele: Node, baseUrl: string, prefix: string) {
	if ($(ele).attr('href') !== '#methods') return;

	const directiveLists = $(ele).next("ul").find("li a");
	directiveLists.each((i, ele) => {
		const name = $(ele).text();
		const directive = $("#user-content-" + name.toLocaleLowerCase().replace(/[\.:]/g, ""));
		if (directive.length == 0) return;

		const item: SnippetItem = {
			description: '',
			prefix: '',
			body: '',
		}
		let temp = directive.parent();
		while ((temp = temp.next())) {
			const character = temp.text();
			if (character == SIGN_END)
				break;

			let match = character.match(SIGN_SYNTAX);
			if (match) {
				let body = match[1].trim();
				match = body.match(/\((\w.*?)\)/)
				if (match) {
					const params = match[1].split(",").map(val => {
						val = val.trim();
						return /^[a-zA-Z]+/.test(val) ? "$" + val : val;
					});
					body = body.replace(/\(\w.*?\)/, "(" + params.join(", ") + ")");
				}

				const split = body.split("=");
				const right = split[1];
				let left = split[0];
				if (left && right) {
					if (!left.includes("local")) {
						left = "local " + left;
					}
					body = `${left}=${right}`;
				}
				if (item.body) {
					item.description += body + "\n";
				} else {
					item.body = body;
				}
				continue;
			}

			match = character.match(SIGN_CONTEXT);
			if (match) continue;

			item.description += character;
		}

		item.prefix = `${prefix}.${name}`
		item.body = item.body || name;
		snippetsResult[item.prefix] = item;
	})
}
function applyConstantSnippets() {
	const core = {
		"ngx.OK": "0",
		"ngx.ERROR": "-1",
		"ngx.AGAIN": "-2",
		"ngx.DONE": "-4",
		"ngx.DECLINED": "-5"
	};

	const methods = {
		"ngx.HTTP_GET": "HTTP method constants.",
		"ngx.HTTP_HEAD": "HTTP method constants.",
		"ngx.HTTP_PUT": "HTTP method constants.",
		"ngx.HTTP_POST": "HTTP method constants.",
		"ngx.HTTP_DELETE": "HTTP method constants.",
		"ngx.HTTP_OPTIONS": "HTTP method constants.(added in the v0.5.0rc24 release)",
		"ngx.HTTP_MKCOL": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_COPY": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_MOVE": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_PROPFIND": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_PROPPATCH": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_LOCK": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_UNLOCK": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_PATCH": "HTTP method constants.(added in the v0.8.2 release)",
		"ngx.HTTP_TRACE": "HTTP method constants.(added in the v0.8.2 release)",
	};

	const logConst = {
		"ngx.STDERR": "Nginx log level constants",
		"ngx.EMERG": "Nginx log level constants",
		"ngx.ALERT": "Nginx log level constants",
		"ngx.CRIT": "Nginx log level constants",
		"ngx.ERR": "Nginx log level constants",
		"ngx.WARN": "Nginx log level constants",
		"ngx.NOTICE": "Nginx log level constants",
		"ngx.INFO": "Nginx log level constants",
		"ngx.DEBUG": "Nginx log level constants",
	};

	const status = {
		"ngx.HTTP_CONTINUE": "(100) (first added in the v0.9.20 release)",
		"ngx.HTTP_SWITCHING_PROTOCOLS": "(101)(first added in the v0.9.20 release)",
		"ngx.HTTP_OK": "(200)",
		"ngx.HTTP_CREATED": "(201)",
		"ngx.HTTP_ACCEPTED": "(202) (first added in the v0.9.20 release)",
		"ngx.HTTP_NO_CONTENT": "(204) (first added in the v0.9.20 release)",
		"ngx.HTTP_PARTIAL_CONTENT": "(206) (first added in the v0.9.20 release)",
		"ngx.HTTP_SPECIAL_RESPONSE": "(300)",
		"ngx.HTTP_MOVED_PERMANENTLY": "(301)",
		"ngx.HTTP_MOVED_TEMPORARILY": "(302)",
		"ngx.HTTP_SEE_OTHER": "(303)",
		"ngx.HTTP_NOT_MODIFIED": "(304)",
		"ngx.HTTP_TEMPORARY_REDIRECT": "(307) (first added in the v0.9.20 release)",
		"ngx.HTTP_PERMANENT_REDIRECT": "(308)",
		"ngx.HTTP_BAD_REQUEST": "(400)",
		"ngx.HTTP_UNAUTHORIZED": "(401)",
		"ngx.HTTP_PAYMENT_REQUIRED": "(402) (first added in the v0.9.20 release)",
		"ngx.HTTP_FORBIDDEN": "(403)",
		"ngx.HTTP_NOT_FOUND": "(404)",
		"ngx.HTTP_NOT_ALLOWED": "(405)",
		"ngx.HTTP_NOT_ACCEPTABLE": "(406) (first added in the v0.9.20 release)",
		"ngx.HTTP_REQUEST_TIMEOUT": "(408) (first added in the v0.9.20 release)",
		"ngx.HTTP_CONFLICT": "(409) (first added in the v0.9.20 release)",
		"ngx.HTTP_GONE": "(410)",
		"ngx.HTTP_UPGRADE_REQUIRED": "(426) (first added in the v0.9.20 release)",
		"ngx.HTTP_TOO_MANY_REQUESTS": "(429) (first added in the v0.9.20 release)",
		"ngx.HTTP_CLOSE": "(444) (first added in the v0.9.20 release)",
		"ngx.HTTP_ILLEGAL": "(451) (first added in the v0.9.20 release)",
		"ngx.HTTP_INTERNAL_SERVER_ERROR": "(500)",
		"ngx.HTTP_METHOD_NOT_IMPLEMENTED": "(501)",
		"ngx.HTTP_BAD_GATEWAY": "(502) (first added in the v0.9.20 release)",
		"ngx.HTTP_SERVICE_UNAVAILABLE": "(503)",
		"ngx.HTTP_GATEWAY_TIMEOUT": "(504) (first added in the v0.3.1rc38 release)",
		"ngx.HTTP_VERSION_NOT_SUPPORTED": "(505) (first added in the v0.9.20 release)",
		"ngx.HTTP_INSUFFICIENT_STORAGE": "(507) (first added in the v0.9.20 release)",
	};

	const coll = {};
	Object.assign(coll, core, methods, logConst, status);
	Object.keys(coll).forEach(key => {
		snippetsResult[key] = {
			description: coll[key],
			prefix: key,
			body: key,
		}
	})
}
