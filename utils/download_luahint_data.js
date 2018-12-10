#!/usr/bin/env node
//@ts-check

const ENABLE_CACHE = process.argv[2] != '--no-cache';

const BASE_URL = 'https://github.com/openresty/lua-nginx-module';
const SIGN_END = 'Back to TOC';
const SIGN_SYNTAX  = /syntax: (.*)/;
const SIGN_DEFAULT = /default: (.*)/;
const SIGN_CONTEXT = /context: (.*)/;
const SIGN_PHASE   = /phase: (.*)/;
const SIGN_SINCE_VERSION = /^This directive was first introduced in the v(\d+\.\d+\.\d+) release./;

const OUTPUT = `${__dirname}/../hint_data/lua`;

const DIRECTIVES_OUTPUT_FILE = `${OUTPUT}/directives.json`;
const VARIABLES_OUTPUT_FILE = `${OUTPUT}/variables.json`;
const SNIPPETS_OUTPUT_FILE = `${OUTPUT}/snippets.json`;
const DIRECTIVES_DOC_OUTPUT_FILE = `${OUTPUT}/directives_document.json`;
const VARIABLES_DOC_OUTPUT_FILE = `${OUTPUT}/variables_document.json`;

let checker = require('./lib/checker'),
	chalk = require('chalk').default,
	snippetGenerator = require('./lib/snippet_generator'),
	http = require('./lib/http_with_cache'),
	html = require('./lib/html'),
	io = require('./lib/io'),
	url = require('url'),
	cheerio = require('cheerio');

const bold = any => chalk.bold(String(any));
const removeBlank = any => String(any).replace(/\s/g, '');

let start = name => console.log(`${name} ...`),
	newVariableObject = () => ({
		name: '',
		desc: '',
		module: ''
	}), newDirectiveObject = () => ({
		name: '',
		syntax: [],
		def: '',
		contexts: [],
		desc: '',
		notes: [],
		since: '',
		module: ''
	}), newDirectiveDocObject = () => ({
		table: '',
		doc: '',
		module: '',
        link: '',
        name: ''
	}), newVariableDocObject = () => ({
		module: '',
		vars: {},
		doc: ''
	}), newSnippetsObject = () => ({
        description: '',
        prefix: '',
        body: ''
    });


//==========================
//     START      =======>
let directivesResult = [],
	variablesResult = [],
	directivesDocResult = [],
	variablesDocResult = [],
	snippetsResult = {};

http.init(ENABLE_CACHE);

directiveApply("lua-nginx-module", BASE_URL);
nginxApiApply(BASE_URL);
someConstantApply();
finish();

function directiveApply(modName, baseUrl) {
    http.get('Nginx LUA module page', baseUrl, html => {
        checker.ok();
    
        start('Analyzing Directives');
        let $ = cheerio.load(html);
        let directiveLists = $("#user-content-directives").parent("h1").next("ul").find("li a");
        directiveLists.each((i, ele) => {
            let name = $(ele).text();
            let directive = $("#user-content-"+ name);
            if (directive.length == 0) return;
    
            let item = newDirectiveObject();
            let docObj = newDirectiveDocObject();
    
            let temp = directive.parent();
            while (temp = temp.next()) {
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

                docObj.doc += temp.toString();
            }
            
            if (item.def.startsWith("no")) {
                item.def = name + " ;";
            }
            if (item.def == "") {
                if (name.endsWith("by_lua")) {
                    item.def = name + " '';"
                }else if (name.endsWith("by_lua_block")) {
                    item.def = name + " {};"
                }else if (name.endsWith("by_lua_file")) {
                    item.def = name + " .lua;"
                }else {
                    item.def = name + " ;";
                }  
            }
            item.name = name;
            item.module = modName;
            item.since = item.since || null;

            const ctx = item.contexts.map(n => `<code>${n}</code></br>`).join('');
            docObj.name  = name;
            docObj.table = `<table ><tr><th>Syntax:</th><td><code><strong>${item.syntax}</strong></code><br></td></tr><tr><th>Default:</th><td><pre>${item.def}</pre></td></tr><tr><th>Context:</th><td>${ctx}</td></tr></table>`;
            docObj.module= modName;
            docObj.link  = baseUrl + `#${name}`;
            docObj.doc   = docObj.doc;

            directivesResult.push(item);
            directivesDocResult.push(docObj);
        })
    });
}

function nginxApiApply(baseUrl) {
    http.get('Nginx LUA Api page', baseUrl, html => {
        checker.ok();
    
        start('Analyzing Lua Model Api');
        let $ = cheerio.load(html);
        let directiveLists = $("#user-content-nginx-api-for-lua").parent("h1").next("ul").find("li a");
        directiveLists.each((i, ele) => {
            let name = $(ele).text();
            let directive = $("#user-content-"+ name.toLocaleLowerCase().replace(/[\.:]/g,""));
            if (name == 'Introduction' || directive.length == 0) return;

            let item = newSnippetsObject();
 
            let temp = directive.parent();
            while (temp = temp.next()) {
                const character = temp.text();
                if (character == SIGN_END) 
                    break;
            
                let match = character.match(SIGN_SYNTAX);
                if (match) {
                    let body = match[1].trim();
                    match = body.match(/\((\w.*?)\)/)
                    if (match) {
                        let params = match[1].split(",").map(val => {
                            val = val.trim();
                            return /^[a-zA-Z]+/.test(val) ? "$" + val : val;
                        });
                        body = body.replace(/\(\w.*?\)/, "(" + params.join(", ") + ")");
                    }

                    let [left, right] = body.split("=");
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
        })
    });
}

function someConstantApply()
{
    const coreConst = {
        "ngx.OK"      : "0",
        "ngx.ERROR"   : "-1",
        "ngx.AGAIN"   : "-2",
        "ngx.DONE"    : "-4",
        "ngx.DECLINED": "-5"
    };

    const methodConst = {
        "ngx.HTTP_GET"      : "HTTP method constants.",
        "ngx.HTTP_HEAD"     : "HTTP method constants.",
        "ngx.HTTP_PUT"      : "HTTP method constants.",
        "ngx.HTTP_POST"     : "HTTP method constants.",
        "ngx.HTTP_DELETE"   : "HTTP method constants.",
        "ngx.HTTP_OPTIONS"  : "HTTP method constants.(added in the v0.5.0rc24 release)",
        "ngx.HTTP_MKCOL"    : "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_COPY"     : "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_MOVE"     : "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_PROPFIND" : "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_PROPPATCH": "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_LOCK"     : "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_UNLOCK"   : "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_PATCH"    : "HTTP method constants.(added in the v0.8.2 release)",
        "ngx.HTTP_TRACE"    : "HTTP method constants.(added in the v0.8.2 release)",
    };

    const logConst = {
        "ngx.STDERR": "Nginx log level constants",
        "ngx.EMERG" : "Nginx log level constants",
        "ngx.ALERT" : "Nginx log level constants",
        "ngx.CRIT"  : "Nginx log level constants",
        "ngx.ERR"   : "Nginx log level constants",
        "ngx.WARN"  : "Nginx log level constants",
        "ngx.NOTICE": "Nginx log level constants",
        "ngx.INFO"  : "Nginx log level constants",
        "ngx.DEBUG" : "Nginx log level constants",
    };

    const statusConst = {
       "ngx.HTTP_CONTINUE"                 : "(100) (first added in the v0.9.20 release)",
       "ngx.HTTP_SWITCHING_PROTOCOLS"      : "(101)(first added in the v0.9.20 release)",
       "ngx.HTTP_OK"                       : "(200)",
       "ngx.HTTP_CREATED"                  : "(201)",
       "ngx.HTTP_ACCEPTED"                 : "(202) (first added in the v0.9.20 release)",
       "ngx.HTTP_NO_CONTENT"               : "(204) (first added in the v0.9.20 release)",
       "ngx.HTTP_PARTIAL_CONTENT"          : "(206) (first added in the v0.9.20 release)",
       "ngx.HTTP_SPECIAL_RESPONSE"         : "(300)",
       "ngx.HTTP_MOVED_PERMANENTLY"        : "(301)",
       "ngx.HTTP_MOVED_TEMPORARILY"        : "(302)",
       "ngx.HTTP_SEE_OTHER"                : "(303)",
       "ngx.HTTP_NOT_MODIFIED"             : "(304)",
       "ngx.HTTP_TEMPORARY_REDIRECT"       : "(307) (first added in the v0.9.20 release)",
       "ngx.HTTP_PERMANENT_REDIRECT"       : "(308)",
       "ngx.HTTP_BAD_REQUEST"              : "(400)",
       "ngx.HTTP_UNAUTHORIZED"             : "(401)",
       "ngx.HTTP_PAYMENT_REQUIRED"         : "(402) (first added in the v0.9.20 release)",
       "ngx.HTTP_FORBIDDEN"                : "(403)",
       "ngx.HTTP_NOT_FOUND"                : "(404)",
       "ngx.HTTP_NOT_ALLOWED"              : "(405)",
       "ngx.HTTP_NOT_ACCEPTABLE"           : "(406) (first added in the v0.9.20 release)",
       "ngx.HTTP_REQUEST_TIMEOUT"          : "(408) (first added in the v0.9.20 release)",
       "ngx.HTTP_CONFLICT"                 : "(409) (first added in the v0.9.20 release)",
       "ngx.HTTP_GONE"                     : "(410)",
       "ngx.HTTP_UPGRADE_REQUIRED"         : "(426) (first added in the v0.9.20 release)",
       "ngx.HTTP_TOO_MANY_REQUESTS"        : "(429) (first added in the v0.9.20 release)",
       "ngx.HTTP_CLOSE"                    : "(444) (first added in the v0.9.20 release)",
       "ngx.HTTP_ILLEGAL"                  : "(451) (first added in the v0.9.20 release)",
       "ngx.HTTP_INTERNAL_SERVER_ERROR"    : "(500)",
       "ngx.HTTP_METHOD_NOT_IMPLEMENTED"   : "(501)",
       "ngx.HTTP_BAD_GATEWAY"              : "(502) (first added in the v0.9.20 release)",
       "ngx.HTTP_SERVICE_UNAVAILABLE"      : "(503)",
       "ngx.HTTP_GATEWAY_TIMEOUT"          : "(504) (first added in the v0.3.1rc38 release)",
       "ngx.HTTP_VERSION_NOT_SUPPORTED"    : "(505) (first added in the v0.9.20 release)",
       "ngx.HTTP_INSUFFICIENT_STORAGE"     : "(507) (first added in the v0.9.20 release)",
    };

    let coll = {};
    Object.assign(coll, coreConst, methodConst, logConst, statusConst);
    for (const key in coll) {
        let snippet = newSnippetsObject();
        snippet.body = key;
        snippet.prefix = key;
        snippet.description = coll[key];

        snippetsResult[key] = snippet;
    }
}

function finish() {
	start('Writing to file');
	io.writeEachJSON({
		[DIRECTIVES_OUTPUT_FILE]: directivesResult,
		[DIRECTIVES_DOC_OUTPUT_FILE]: directivesDocResult,
		[VARIABLES_OUTPUT_FILE]: variablesResult,
		[VARIABLES_DOC_OUTPUT_FILE]: variablesDocResult,
		[SNIPPETS_OUTPUT_FILE]: snippetsResult,
	});
	checker.ok();

	console.log(`Total directives number: ${bold(directivesResult.length)}`);
	console.log(`Total variables number: ${bold(variablesResult.length)}`);

	return checker.done();
}

