#!/usr/bin/env node

import { hintDataFiles, nginxDocsBaseURL } from "./config";
import { resolveURL, compressHTML, getText, loadHtml, print, initHttpCache, shouldBeEqual, AssertLevel, bold, lengthShouldBeMoreThanOrEqual, writeMultipleJSON, lengthShouldBeEqual } from "./helper";
import type { DirectiveDocs, DirectiveItem, LinkItem, VariableItem } from "../extension/types";

const directivesResult: DirectiveItem[] = [];
const variablesResult: VariableItem[] = [];
const directivesDocResult: DirectiveDocs[] = [];
const variablesDocResult = [];
const linksResult: LinkItem[] = [];

main().catch(error => print.error(error.stack));
async function main() {
	initHttpCache();

	const html = await getText('nginx docs', nginxDocsBaseURL);
	const $ = loadHtml(html);

	print.start('processing nginx document home page');

	const titleShouleBe = 'Modules reference'
	const $title = $('center h4').filter((i, e) => $(e).text().trim() == titleShouleBe);
	lengthShouldBeEqual(`document page title "${titleShouleBe}"`, $title, 1);

	const directiveLists = $title.parent().nextAll('ul.compact');
	lengthShouldBeEqual('length(ul.compact)', directiveLists, 6);

	const modulesUris: string[] = [];
	directiveLists.each((i, list) => {
		const $list = $(list);
		switch (i) {
			case 0: {
				const lines = $list.text().split('\n').map(it => it.trim()).filter(it => it);
				shouldBeEqual(`ul.compact[0][0]`, lines[0], 'Alphabetical index of directives');
				shouldBeEqual(`ul.compact[0][1]`, lines[1], 'Alphabetical index of variables');
				return;
			}
			default: {
				const $links = $(list).find('a');
				lengthShouldBeMoreThanOrEqual(`ul.compact[${i}] a`, $links, 1);
				$links.each((j, link) => {
					const $link = $(link);
					const linkText = $link.text().trim();
					if (linkText !== 'Core functionality' && !linkText.startsWith('ngx_')) {
						print.warning(`ul.compact[${i}][${j}] has unknown title "${linkText}"`);
						return;
					}
					modulesUris.push($link.attr('href'));
				});
			}
		}
		return;
	});
	print.ok(`Got ${bold(modulesUris.length)} module document pages`);
	for (let i = 0; i < modulesUris.length; i++)
		await processModuleDocs(modulesUris[i]);

	directivesResult.forEach(addCompletionInfoIntoDirective);

	await finish();
}

async function finish() {
	print.start('Writing hint data to files');
	await writeMultipleJSON([
		[hintDataFiles.directives, directivesResult],
		[hintDataFiles.directivesDocs, directivesDocResult],
		[hintDataFiles.variables, variablesResult],
		[hintDataFiles.variablesDocs, variablesDocResult],
		[hintDataFiles.links, linksResult],
	]);
	print.ok();
	console.log(`Total directives count: ${bold(directivesResult.length)}`);
	console.log(`Total variables count: ${bold(variablesResult.length)}`);
	if (print.warnings)
		console.log(`Total warnings: ${bold(print.warnings)}`);

	require('./generate_snippets')
	return print.done();
}

async function processModuleDocs(docsUri: string) {
	const count = { directives: 0, variables: 0 };

	const fullURL = `${nginxDocsBaseURL}${docsUri}`;

	const docsName = docsUri.match(/(?:^|\/)(\w+)\.html$/)[1];
	const html = await getText(docsName, fullURL);
	const $ = loadHtml(html);

	const $directives = $('.directive');
	const $varContainer = $('a[name=variables]');
	const info = [`$directives.length=${$directives.length}`, `$varContainer.length=${$varContainer.length}`].join(' ')
	print.start(`Processing module ${bold(docsName)} docs (${info})`);

	//#region process directives
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
		const $directive = $directives.eq(i);
		docObj.table = compressHTML($directive.html()).replace('cellspacing=\"0\"', '');

		//check table item available
		const title_check = $directive.find('table th').text().replace(/\s/g, '');
		shouldBeEqual('directive define table head', title_check, 'Syntax:Default:Context:');

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

		item.contexts = directiveContext.text().split(',')
			.map(it => {
				it = it.trim()
				const mtx = it.match(/(\w+)\s+in\s+(\w+)/);
				if (mtx) it = mtx[1];
				return it;
			}).filter(it => it);
		lengthShouldBeMoreThanOrEqual(`directive contexts (${item.name})`, item.contexts, 1);

		item.since = $directive.find('p').text().trim() || null;
		if (item.since) {
			const sinceVersionRegexp = /^This directive appeared in versions? (\d+\.\d+\.\d+)/;
			item.since = (item.since.match(sinceVersionRegexp) || ['', null])[1];
			lengthShouldBeMoreThanOrEqual(`directive since version (${item.name})`, item.since, 1);
		}

		docObj.link = $directive.prev('a').attr('name');
		lengthShouldBeMoreThanOrEqual(`document link of directive (${item.name})`, docObj.link, 1);
		docObj.link = `${docsUri}#${docObj.link}`;
		// loop after directive box div

		let elementPointer = $directive;
		while ((elementPointer =
			elementPointer.next('p, blockquote.note, blockquote.example, dl.compact')).length) {
			const tagName = elementPointer.prop('tagName');
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
				case 'BLOCKQUOTE': {
					const className = elementPointer.attr('class').trim();
					if (className == 'note')
						item.notes.push(elementPointer.text());
					else if (className != 'example')
						print.warning(`there is a blockquote tag with unknown class name (${className}) ` +
							`after directive (${item.name})`);
					docObj.doc += $.html(elementPointer);
				}
			}
		}

		lengthShouldBeMoreThanOrEqual(`description of directive (${item.name})`, item.desc, 1, AssertLevel.WARNING);
		// lengthShouldBeMoreThanOrEqual(`document content of directive (${item.name})`, item.doc, 1);

		docObj.doc = resolveDocumentHTML(docObj.doc);

		directivesResult.push(item);
		directivesDocResult.push(docObj);
		linksResult.push([item.name, docObj.link, 0]);
		count.directives++;
	});
	//#endregion process directives


	if ($varContainer.length) {
		const docObj = {
			module: '',
			vars: {},
			doc: ''
		}
		docObj.module = docsName;
		const variablesDescription = $varContainer.next('center').next('p');
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

			const elementId = elementVarName.attr('id');
			lengthShouldBeMoreThanOrEqual(`attribute "id" of element "dt" ${item.name} `,
				elementId, 'var_'.length);

			docObj.vars[item.name] = elementId;
			variablesResult.push(item);
			linksResult.push([item.name, `${docsUri}#${elementId}`, 1]);
			count.variables++;
		});
		variablesDocResult.push(docObj);
	}

	count.directives && console.log(` - Directives count: ${bold(count.directives)}`);
	count.variables && console.log(` - Variables count: ${bold(count.variables)}`);
	print.ok();

	function resolveDocumentHTML(docHTML: string) {
		return compressHTML(docHTML).replace(/href=[\"\'](.+?)[\"\']/g,
			(_, href) => `href="${encodeURI(resolveURL(fullURL, decodeURI(href)))}"`);
	}
}

function addCompletionInfoIntoDirective(directive: DirectiveItem) {
	if (directive.syntax.length === 0)
		return print.warning(`directive["${directive.name}"].syntax is empty"`);
	const ci: { insert?: string } = {};
	if (directive.syntax.length === 1) {
		const syntax = directive.syntax[0];
		// "accept_mutex on | off;"
		const params = syntax.slice(directive.name.length).replace(';', '').trim();
		const testParams = params.replace(/\s/g, '');
		if (testParams === 'on|off') {
			ci.insert = `${directive.name} $\{1|on,off|\};$0`;
		} else {
			const placeholder = params.replace(/\s+/g, ' ');
			if (placeholder)
				ci.insert = `${directive.name} $\{1:${placeholder}\};$0`;
			else
				ci.insert = `${directive.name};$0`;
		}
	}
	if (Object.keys(ci).length > 0)
		directive.ci = ci;
}
