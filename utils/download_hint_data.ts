#!/usr/bin/env node

import { hintDataFiles, nginxDocsBaseURL } from "./config";
import { resolveURL, compressHTML, getText, loadHtml, print, initHttpCache, shouldBeEqual, AssertLevel, bold, lengthShouldBeMoreThanOrEqual, writeMultipleJSON } from "./helper";
import type { DirectiveDocs, DirectiveItem, VariableItem } from "../extension/types";

const SIGN_TITLE = 'Modules reference';
const SIGN_TABLE_HEAD = 'Syntax:Default:Context:';
const SIGN_SINCE_VERSION = /^This directive appeared in versions? (\d+\.\d+\.\d+)/;

const removeBlank = any => String(any).replace(/\s/g, '');

//==========================
//     START      =======>
let pageList = [];
let directivesResult: DirectiveItem[] = [];
let variablesResult: VariableItem[] = [];
let directivesDocResult: DirectiveDocs[] = [];
let variablesDocResult = [];

let lastDirectivesLength = 0;
let lastVariablesLength = 0;

main().catch(error => print.error(error.stack));
async function main() {
	initHttpCache();
	const html = await getText('docs index page', nginxDocsBaseURL);
	const $ = loadHtml(html);
	const $title = $('center h4').filter((i, e) => $(e).text().trim() == SIGN_TITLE);
	shouldBeEqual('document page title "Modules reference"', $title.length, 1);

	print.start('processing document index page links');

	let directiveLists = $title.parent().nextAll('ul.compact');
	shouldBeEqual('length(ul.compact)', directiveLists.length, 6, AssertLevel.WARNING);
	directiveLists.each((i, list) => {
		//ignore
		//  Alphabetical index of directives
		//  Alphabetical index of variables
		if (i == 0) return;
		const $links = $(list).find('a');
		lengthShouldBeMoreThanOrEqual(`ul.compact[${i}] a`, $links, 1);

		$links.each(i => {
			const link = $links.eq(i);
			pageList.push({ uri: link.attr('href'), name: link.text().trim() });
		});
	});
	print.ok(`Got ${bold(pageList.length)} sub document pages`);

	for (let i = 0; i < pageList.length; i++) {
		const { uri, name } = pageList[i];
		await prcoessDocsHTML(name, uri);
	}
	finish();
}

function finish() {
	// start('Generating snippet object array');
	// snippetsResult = snippetGenerator.generate(directivesResult);
	// checker.ok();

	print.start('Writing hint data to files');
	writeMultipleJSON([
		[hintDataFiles.directives, directivesResult],
		[hintDataFiles.directivesDocs, directivesDocResult],
		[hintDataFiles.variables, variablesResult],
		[hintDataFiles.variablesDocs, variablesDocResult],
	]);
	print.ok();
	console.log(`Total directives count: ${bold(directivesResult.length)}`);
	console.log(`Total variables count: ${bold(variablesResult.length)}`);
	return print.done();
}

async function prcoessDocsHTML(docsName: string, docsUri: string) {
	const fullURL = `${nginxDocsBaseURL}${docsUri}`;
	const html = await getText(docsName, fullURL);
	const $ = loadHtml(html);

	const $directives = $('.directive');
	const $varContainer = $('a[name=variables]');
	const info = [`$directives.length=${$directives.length}`, `$varContainer.length=${$varContainer.length}`].join(' ')
	print.start(`Processing docs ${bold(docsName)} (${info})`);

	lengthShouldBeMoreThanOrEqual(`directives info of ${docsName}: $directives`, $directives, 1);
	$directives.each(i => {
		const item: DirectiveItem = {
			name: '',
			syntax: [],
			def: '',
			contexts: [],
			desc: '',
			notes: [],
			since: '',
			module: ''
		};
		const docObj: DirectiveDocs = {
			table: '',
			doc: '',
			module: '',
			link: '',
			name: ''
		};
		let $directive = $directives.eq(i);
		docObj.table = compressHTML($directive.html()).replace('cellspacing=\"0\"', '');

		//check table item available
		const title_check = removeBlank($directive.find('table th').text());
		shouldBeEqual('directive define table head', title_check, SIGN_TABLE_HEAD);

		const directiveDef = $directive.find('table td');
		shouldBeEqual('directive define item', directiveDef.length, 3);

		const directiveSyntax = directiveDef.eq(0);
		const directiveContext = directiveDef.eq(2);
		const directiveDefault = directiveDef.eq(1);

		item.module = docsName;
		docObj.module = docsName;

		item.name = directiveSyntax.find('code strong').eq(0).text().trim();
		docObj.name = item.name;
		lengthShouldBeMoreThanOrEqual(`directive name in module(${docsName})`, item.name, 1);

		directiveSyntax.children('code').each((i, e) => {
			item.syntax.push($(e).text().trim())
		});
		lengthShouldBeMoreThanOrEqual(`directive syntax (${item.name})`, item.syntax, 1);
		item.syntax.forEach((syntax, i) => {
			lengthShouldBeMoreThanOrEqual(`directive syntax[${i}] (${item.name})`, syntax, item.name.length)
		});

		item.def = directiveDefault.text().trim();
		item.def = item.def == '—' ? null : item.def;

		item.contexts = removeBlank(directiveContext.text()).split(',');
		lengthShouldBeMoreThanOrEqual(`directive contexts (${item.name})`, item.contexts, 1);

		item.since = $directive.find('p').text().trim() || null;
		if (item.since) {
			item.since = (item.since.match(SIGN_SINCE_VERSION) || ['', null])[1];
			lengthShouldBeMoreThanOrEqual(`directive since version (${item.name})`, item.since, 1);
		}

		docObj.link = $directive.prev('a').attr('name');
		lengthShouldBeMoreThanOrEqual(`document link of directive (${item.name})`, docObj.link, 1);
		docObj.link = `${docsUri}#${docObj.link}`;
		// loop after directive box div

		let elementPointer = $directive;
		while ((elementPointer =
			elementPointer.next('p, blockquote.note, blockquote.example, dl.compact')).length) {
			let tagName = elementPointer.prop('tagName');
			switch (tagName) {
				case 'P':
					if (!elementPointer.text().trim()) continue;
					if (!item.desc)
						item.desc = elementPointer.text().replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
					docObj.doc += $.html(elementPointer);
					break;
				case 'DL':
					docObj.doc += $.html(elementPointer);
					break;
				case 'BLOCKQUOTE':
					let className = elementPointer.attr('class').trim();
					if (className == 'note')
						item.notes.push(elementPointer.text());
					else if (className != 'example')
						print.warning(`there is a blockquote tag with unknown class name (${className}) ` +
							`after directive (${item.name})`);
					docObj.doc += $.html(elementPointer);
			}
		}

		lengthShouldBeMoreThanOrEqual(`description of directive (${item.name})`, item.desc, 1, AssertLevel.WARNING);
		// lengthShouldBeMoreThanOrEqual(`document content of directive (${item.name})`, item.doc, 1);

		docObj.doc = resolveDocumentHTML(docObj.doc);

		directivesResult.push(item);
		directivesDocResult.push(docObj);
	});

	if ($varContainer.length) {
		const docObj = {
			module: '',
			vars: {},
			doc: ''
		}
		docObj.module = docsName;
		let variablesDescription = $varContainer.next('center').next('p');
		let container = variablesDescription.next('dl');

		//Because page of ngx_http_auth_jwt_module
		if (!container.length)
			container = variablesDescription.next('p').next('dl');

		shouldBeEqual(`variables info of ${docsName}: a[name=variables]+center+p+dl or ` +
			`a[name=variables]+center+p+p+dl`,
			container.length, 1);

		docObj.doc = $.html(variablesDescription);
		if (variablesDescription.next('p').length)
			docObj.doc += $.html(variablesDescription.next('p')) + $.html(container);
		else
			docObj.doc += $.html(container);
		docObj.doc = resolveDocumentHTML(docObj.doc);

		// too many page has not compact class in variable
		// if ((container.attr('class')||'').trim() != 'compact')
		// 	checker.warn(`variables dl tag has not class name "compact" in ${name}`);

		container.children('dt').each((i, e) => {
			const elementVarName = $(e);
			const elementVarDesc = elementVarName.next('dd');
			const elementTailCheck = elementVarName.next().next();
			const item = {
				name: '',
				desc: '',
				module: ''
			};

			item.module = docsName;
			item.name = (elementVarName.text() || '').trim();
			lengthShouldBeMoreThanOrEqual(`variable name ${i} of ${docsName}`, item.name, 2);

			item.desc = (elementVarDesc.text() || '').trim();
			lengthShouldBeMoreThanOrEqual(`description of variable ${item.name}`, item.desc, 1);

			if (elementTailCheck.length && elementTailCheck.prop('tagName') != 'DT')
				print.warning(`the tag after description of variable ${item.name} is not "dt"`);

			let elementId = elementVarName.attr('id');
			lengthShouldBeMoreThanOrEqual(`attribute "id" of element "dt" ${item.name} `,
				elementId, 'var_'.length);

			docObj.vars[item.name] = elementId;
			variablesResult.push(item);
		});

		variablesDocResult.push(docObj);
	}

	const diffDirectives = directivesResult.length - lastDirectivesLength;
	const diffVariables = variablesResult.length - lastVariablesLength;

	diffDirectives && console.log(` - Directives count: ${bold(diffDirectives)}`);
	diffVariables && console.log(` - Variables count: ${bold(diffVariables)}`);
	lastDirectivesLength += diffDirectives;
	lastVariablesLength += diffVariables;
	print.ok();

	function resolveDocumentHTML(docHTML: string) {
		return compressHTML(docHTML).replace(/href=[\"\'](.+?)[\"\']/g,
			(_, href) => `href="${encodeURI(resolveURL(fullURL, decodeURI(href)))}"`);
	}
}
