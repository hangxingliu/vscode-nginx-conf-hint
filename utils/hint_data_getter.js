#!/usr/bin/env node

const BASE_URL = 'https://nginx.org/en/docs/';
const SIGN_TITLE = 'Modules reference';
const SIGN_TABLE_HEAD = 'Syntax:Default:Context:';
const SIGN_SINCE_VERSION = /^This directive appeared in versions? (\d+\.\d+\.\d+)/;

const DIRECTIVES_OUTPUT_FILE = `${__dirname}/../hint_data/directives.json`;
const VARIABLES_OUTPUT_FILE = `${__dirname}/../hint_data/variables.json`;
const SNIPPETS_OUTPUT_FILE = `${__dirname}/../hint_data/snippets.json`;

const CACHE_PATH = `${__dirname}/cache/`;

String.prototype.removeWhiteChar = function () { return this.replace(/\s/g, '');}

let enable_cache = process.argv[2] != '--no-cache';

let checker = require('./lib/checker'),
	snippetGenerator = require('./lib/snippet_generator'),
	html2md = require('./lib/html2md');
let start = name => console.log(`${name} ...`),
	newVariableObject = () => ({
		name: '',
		desc: '',
		module: ''
	}),newDirectiveObject = () => ({
		name: '',
		syntax: '',
		def: '',
		contexts: [],
		desc: '',
		doc: '',
		notes: [],
		since: '',
		link: '',
		module: ''
	}),
	//Function for getting document page from internet
	get = (name, url, callback) => {
		start(`Getting ${name}`);
		let cacheName = `${CACHE_PATH}${new Buffer(url).toString('base64')}`;
		if (fs.existsSync(cacheName) && enable_cache)
			return callback(fs.readFileSync(cacheName, 'utf8'));
		request.get(url, {}, (err, res, html) => {
			checker.reponseOK(name, err, res, html);
			fs.writeFileSync(cacheName, html);
			callback(html);
		});
	};

require('colors');

let cheerio = require('cheerio'),
	request = require('request'),
	fs = require('fs-extra');

//==========================
//     START      =======>
let pageList = [];
let directivesResult = [],
	variablesResult = [],
	snippetsResult = {},
	lastDirectivesLength = 0,
	lastVariablesLength = 0;

enable_cache || console.log(`No cache mode!`.yellow.bold);

if (!fs.existsSync(CACHE_PATH))
	start(`Creating cache path: ${CACHE_PATH}`) +
		fs.mkdirSync(CACHE_PATH) + checker.ok();

get('Nginx document index page', BASE_URL, html => {
	checker.ok();
	
	start('Analyzing sub document page links');
	let $ = cheerio.load(html),
		title = $('center h4').filter((i, e) => $(e).text().trim() == SIGN_TITLE);
	checker.lengthEquals('document page title "Modules reference"', title, 1);

	let directiveLists = title.parent().nextAll('ul.compact');
	checker.lengthEquals('ul.compact', directiveLists, 6, checker.LEVEL_WARN);

	directiveLists.each((i, list) => {
		//ignore 
		//  Alphabetical index of directives
		//  Alphabetical index of variables		
		if (i == 0) return;
		let links = $(list).find('a'), link;
		checker.lengthAtlease('<a> in ul.compact', links, 1);
		links.each(i => {
			link = links.eq(i);
			pageList.push({ uri: link.attr('href'), name: link.text().trim() });
		});
	});
	checker.ok(`Got ${String(pageList.length).bold} sub document pages`);

	handlerSubDocumentPage();
});

function finish() {
	start('Generating snippet object array');
	snippetsResult = snippetGenerator.generate(directivesResult);
	checker.ok();

	start('Writing to file');
	fs.writeJSONSync(DIRECTIVES_OUTPUT_FILE, directivesResult);
	fs.writeJSONSync(VARIABLES_OUTPUT_FILE, variablesResult);
	fs.writeJSONSync(SNIPPETS_OUTPUT_FILE, snippetsResult);
	checker.ok();

	console.log(`Total directives number: ${String(directivesResult.length).bold}`);
	console.log(`Total variables number: ${String(variablesResult.length).bold}`);

	return checker.done();
}

function handlerSubDocumentPage() {
	if (pageList.length === 0)
		return finish();

	let { uri, name } = pageList.pop();

	get(`sub-page ${name.bold}`,`${BASE_URL}${uri}`, html => {
		checker.ok();
		let $ = cheerio.load(html),
			directives = $('.directive'),
			variableContainer = $('a[name=variables]')
		
		start(`Analyzing sub-page ${name.bold}`);

		checker.lengthAtlease(`directives info of ${name}: .directive`, directives, 1);
		directives.each( i => {
			let item = newDirectiveObject();
			let directive = directives.eq(i);
			//check table item avaible
			let title_check = directive.find('table th').text().removeWhiteChar();
			checker.equal('directive define table head', title_check, SIGN_TABLE_HEAD);
			
			let directiveDef = directive.find('table td');
			checker.lengthEquals('directive define item', directiveDef, 3);

			let directiveSyntax = directiveDef.eq(0),
				directiveDefault = directiveDef.eq(1),
				directiveContext = directiveDef.eq(2);
			
			item.module = name;

			item.name = directiveSyntax.find('code strong').eq(0).text().trim();
			checker.lengthAtlease(`directive name in module(${name})`, item.name, 1);

			item.syntax = directiveSyntax.text().trim();
			checker.lengthAtlease(`directive syntax (${item.name})`, item.syntax, item.name.length);
			
			item.def = directiveDefault.text().trim();
			item.def = item.def == '—' ? null : item.def;
			
			item.contexts = directiveContext.text().removeWhiteChar().split(',');
			checker.lengthAtlease(`directive contexts (${item.name})`, item.contexts, 1);

			item.since = directive.find('p').text().trim() || null;
			if (item.since) {
				item.since = (item.since.match(SIGN_SINCE_VERSION) || ['', null])[1];
				checker.lengthAtlease(`directive since version (${item.name})`, item.since, 1);
			}
			
			item.link = directive.prev('a').attr('name');
			checker.lengthAtlease(`document link of directive (${item.name})`, item.link, 1);
			item.link = `${uri}#${item.link}`;

			// loop after directive box div
			
			let elementPointer = directive, doc = '';
			while ((elementPointer =
				elementPointer.next('p, blockquote.note, blockquote.example, dl.compact')).length) {
				let tagName = elementPointer.prop('tagName');
				if (tagName == 'P') {
					if (!elementPointer.text().trim()) continue;
					if (!item.desc)
						item.desc = elementPointer.text().replace(/\n/g, '');
					doc += `<p>${html2md.convert(elementPointer.html())}</p>`;
					continue;
				}
				if (tagName == 'DL') {
					doc += `<dl class="compact">${elementPointer.html()}</dl>`;
					continue;
				}
				//BLOCKQUOTE
				let className = elementPointer.attr('class').trim();
				if (className == 'note')
					item.notes.push(elementPointer.text());
				else if (className != 'example')
					checker.warn(`there is a blockquote tag with unknown class name (${className}) ` +
						`after directive (${item.name})`);	
				doc += `<blockquote class="${className}">${elementPointer.html()}</blockquote>`;
			}
			item.doc = doc;

			checker.lengthAtlease(`descrption of directive (${item.name})`, item.desc, 1, checker.LEVEL_WARN);
			checker.lengthAtlease(`document content of directive (${item.name})`, item.doc, 1);

			directivesResult.push(item);
		});

		if (variableContainer.length) {
			let container = variableContainer.next('center').next('p').next('dl');

			//Beacuse page of ngx_http_auth_jwt_module
			if (!container.length)
				container = variableContainer.next('center').next('p').next('p').next('dl');
			
			checker.lengthEquals(`variables info of ${name}: a[name=variables]+center+p+dl or ` +
				`a[name=variables]+center+p+p+dl`,
				container, 1);
			
			// too many page has not compact class in varianle
			// if ((container.attr('class')||'').trim() != 'compact')
			// 	checker.warn(`variables dl tag has not class name "compact" in ${name}`);

			container.find('dt').each((i, e) => {
				let elementVarName = $(e),
					elementVarDesc = elementVarName.next('dd'),
					elementTailCheck = elementVarName.next().next(),
					item = newVariableObject();
				
				item.module = name;
				item.name = (elementVarName.text()||'').trim();
				checker.lengthAtlease(`variable name ${i} of ${name}`, item.name, 2);
				
				item.desc = html2md.convert((elementVarDesc.html()||'').trim());
				checker.lengthAtlease(`description of variable ${item.name}`, item.desc, 1);

				if (elementTailCheck.length && elementTailCheck.prop('tagName') != 'DT')
					checker.warn(`the tag after description of variable ${item.name} is not "dt"`);	
				
				variablesResult.push(item);
			});
		}

		let diffDirectives = directivesResult.length - lastDirectivesLength,
			diffVariables = variablesResult.length - lastVariablesLength;
		
		diffDirectives && console.log(` - Directives count: ${String(diffDirectives).bold}`);
		diffVariables && console.log(` - Variables count: ${String(diffVariables).bold}`);

		lastDirectivesLength += diffDirectives;
		lastVariablesLength += diffVariables;
		
		checker.ok();

		handlerSubDocumentPage();
	});
}
