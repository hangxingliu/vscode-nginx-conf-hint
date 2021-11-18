#!/usr/bin/env node

import { ManifestItemType, detailsFile, manifestFiles, nginxDocsBaseURL } from "./config";
import {
	resolveURL,
	compressHTML,
	getText,
	loadHtml,
	print,
	initHttpCache,
	shouldBeEqual,
	AssertLevel,
	bold,
	lengthShouldBeMoreThanOrEqual,
	lengthShouldBeEqual,
	toMarkdown,
	JsonFileWriter,
} from "./helper";

const manifestStreams = {
	core: new JsonFileWriter(manifestFiles.core),
	js: new JsonFileWriter(manifestFiles.js),
};
const coreModuleNames: unknown[] = [ManifestItemType.ModuleNames];
const jsModuleNames: unknown[] = [ManifestItemType.ModuleNames];
const isJsModule = (moduleName: string) => moduleName.endsWith("_js_module");

main().catch((error) => print.error(error.stack));
async function main() {
	initHttpCache();

	const html = await getText("nginx docs", nginxDocsBaseURL);
	const $ = loadHtml(html);

	print.start("processing nginx document home page");

	const titleShouleBe = "Modules reference";
	const $title = $("center h4").filter((i, e) => $(e).text().trim() == titleShouleBe);
	lengthShouldBeEqual(`document page title "${titleShouleBe}"`, $title, 1);

	const directiveLists = $title.parent().nextAll("ul.compact");
	lengthShouldBeEqual("length(ul.compact)", directiveLists, 6);

	const modules: Array<{ moduleName: string; moduleIndex: number; uri: string }> = [];
	directiveLists.each((i, list) => {
		const $list = $(list);
		switch (i) {
			case 0: {
				const lines = $list
					.text()
					.split("\n")
					.map((it) => it.trim())
					.filter((it) => it);
				shouldBeEqual(`ul.compact[0][0]`, lines[0], "Alphabetical index of directives");
				shouldBeEqual(`ul.compact[0][1]`, lines[1], "Alphabetical index of variables");
				return;
			}
			default: {
				const $links = $(list).find("a");
				lengthShouldBeMoreThanOrEqual(`ul.compact[${i}] a`, $links, 1);
				$links.each((j, link) => {
					const $link = $(link);
					const linkText = $link.text().trim();
					if (linkText !== "Core functionality" && !linkText.startsWith("ngx_")) {
						print.warning(`ul.compact[${i}][${j}] has unknown title "${linkText}"`);
						return;
					}
					const docsUri = $link.attr("href");
					const moduleName = docsUri.match(/(?:^|\/)(\w+)\.html$/)[1];

					let moduleIndex = isJsModule(moduleName)
						? jsModuleNames.push(moduleName)
						: coreModuleNames.push(moduleName);
					moduleIndex--;
					modules.push({ moduleName, moduleIndex, uri: docsUri });
				});
			}
		}
		return;
	});
	manifestStreams.core.writeItem(coreModuleNames);
	manifestStreams.js.writeItem(jsModuleNames);

	print.ok(`Got ${bold(modules.length)} module document pages`);

	const count = { directives: 0, variables: 0 };
	for (let i = 0; i < modules.length; i++) {
		const c = await processModuleDocs(modules[i]);
		count.variables += c.variables;
		count.directives += c.directives;
	}

	print.start("Writing hint data to files");
	manifestStreams.core.close();
	manifestStreams.js.close();

	print.ok();
	console.log(`Total modules:    ${bold(modules.length)}`);
	console.log(`Total directives: ${bold(count.directives)}`);
	console.log(`Total variables:  ${bold(count.variables)}`);
	if (print.warnings) console.log(`Total warnings:   ${bold(print.warnings)}`);
	return print.done();
}

async function processModuleDocs(context: { moduleName: string; moduleIndex: number; uri: string }) {
	const { moduleName, moduleIndex, uri } = context;

	const count = { details: 0, directives: 0, variables: 0 };
	const detailsStream = new JsonFileWriter(detailsFile(moduleName));

	const manifestName: keyof typeof manifestStreams = isJsModule(moduleName) ? "js" : "core";

	const fullURL = `${nginxDocsBaseURL}${uri}`;
	const html = await getText(moduleName, fullURL);
	const $ = loadHtml(html);
	const $directives = $(".directive");
	const $varContainer = $("a[name=variables]");
	const info = [`$directives.length=${$directives.length}`, `$varContainer.length=${$varContainer.length}`].join(" ");
	print.start(`Processing module ${bold(moduleName)} docs (${info})`);

	//#region process directives
	lengthShouldBeMoreThanOrEqual(`directives info of ${moduleName}: $directives`, $directives, 1);
	$directives.each((i) => {
		const $directive = $directives.eq(i);
		const tableHTML = compressHTML($directive.html()).replace('cellspacing="0"', "");

		//check table item available
		const title_check = $directive.find("table th").text().replace(/\s/g, "");
		shouldBeEqual("directive define table head", title_check, "Syntax:Default:Context:");

		const directiveDef = $directive.find("table td");
		shouldBeEqual("directive define item", directiveDef.length, 3);

		const directiveSyntax = directiveDef.eq(0);
		const directiveContext = directiveDef.eq(2);
		const directiveDefault = directiveDef.eq(1);

		const directiveName = directiveSyntax.find("code strong").eq(0).text().trim();
		lengthShouldBeMoreThanOrEqual(`directive name in module(${moduleName})`, directiveName, 1);

		let syntaxArray: string[] = [];
		directiveSyntax.children("code").each((i, e) => {
			syntaxArray.push($(e).text().trim());
		});
		lengthShouldBeMoreThanOrEqual(`directive syntax (${directiveName})`, syntaxArray, 1);
		syntaxArray = syntaxArray.map((syntax, i) => {
			if (syntax.startsWith(syntax) === false)
				print.error(`syntax[${i}] of directive "${directiveName}" is invalid: "${syntax}"`);
			return syntax.slice(directiveName.length).replace(";", "").trim();
		});

		let defaults = directiveDefault.text().trim();
		if (defaults === "—") defaults = null;

		const contexts = directiveContext
			.text()
			.split(",")
			.map((it) => {
				it = it.trim();
				const mtx = it.match(/(\w+)\s+in\s+(\w+)/);
				if (mtx) it = mtx[1];
				return it;
			})
			.filter((it) => it);
		lengthShouldBeMoreThanOrEqual(`directive contexts (${directiveName})`, contexts, 1);

		let since = $directive.find("p").text().trim() || null;
		if (since) {
			const sinceVersionRegexp = /^This directive appeared in versions? (\d+\.\d+\.\d+)/;
			since = (since.match(sinceVersionRegexp) || ["", null])[1];
			lengthShouldBeMoreThanOrEqual(`directive since version (${directiveName})`, since, 1);
		}

		let link = $directive.prev("a").attr("name");
		lengthShouldBeMoreThanOrEqual(`document link of directive (${directiveName})`, link, 1);
		link = `${uri}#${link}`;
		// loop after directive box div

		let elementPointer = $directive;
		let markdownDocs = "";
		let fullDocs = "";
		const markdownNotes: string[] = [];
		while ((elementPointer = elementPointer.next("p, blockquote.note, blockquote.example, dl.compact")).length) {
			const tagName = elementPointer.prop("tagName");
			switch (tagName) {
				case "P": {
					if (!elementPointer.text().trim()) continue;
					const html = $.html(elementPointer);
					if (!markdownDocs) markdownDocs = toMarkdown(html);
					fullDocs += html;
					break;
				}
				case "DL":
					fullDocs += $.html(elementPointer);
					break;
				case "BLOCKQUOTE": {
					const className = elementPointer.attr("class").trim();
					if (className == "note") markdownNotes.push(toMarkdown(elementPointer.html()));
					else if (className != "example")
						print.warning(
							`there is a blockquote tag with unknown class name (${className}) ` +
								`after directive (${directiveName})`
						);
					fullDocs += $.html(elementPointer);
				}
			}
		}

		lengthShouldBeMoreThanOrEqual(`description of directive (${directiveName})`, fullDocs, 1, AssertLevel.WARNING);
		// lengthShouldBeMoreThanOrEqual(`document content of directive (${directiveName})`, item.doc, 1);

		const ci: { insert?: string; args?: string[] } = {};
		if (syntaxArray.length === 1) {
			const syntax = syntaxArray[0];
			// "accept_mutex on | off;"
			const testParams = syntax.replace(/\s/g, "");
			if (testParams === "on|off") {
				ci.insert = `${directiveName} $\{1|on,off|\};$0`;
			} else {
				const placeholder = syntax.replace(/\s+/g, " ");
				const mtx = placeholder.match(/^(\w+)\s(\w+)$/);
				if (mtx) ci.insert = `${directiveName} $\{1:${mtx[1]}\} $\{2:${mtx[2]}\};$0`;
				else if (placeholder) ci.insert = `${directiveName} $\{1:${placeholder.replace(/\}/g, '\\}')}\};$0`;
				else ci.insert = `${directiveName};$0`;
			}
		}
		const ciArgs: string[] = [];
		syntaxArray.forEach((syntax) => {
			// [buffer=size] [gzip[=level]]
			// if=condition
			const re = /[\s\[](\w+)(\[?\=)(\w+)/g;
			let m: RegExpMatchArray;
			while ((m = re.exec(syntax)) !== null) ciArgs.push(m[2] === "[=" ? `?${m[1]}=${m[3]}` : `${m[1]}=${m[3]}`);
		});
		if (ciArgs.length > 0) ci.args = ciArgs;

		count.directives++;
		fullDocs = resolveDocumentHTML(fullDocs);
		manifestStreams[manifestName].writeItem([
			ManifestItemType.Directive,
			directiveName,
			syntaxArray,
			defaults,
			contexts,
			moduleIndex,
			since,
			link,
			ci,
		]);
		detailsStream.writeItem([
			ManifestItemType.DirectiveDetails,
			directiveName,
			markdownDocs,
			fullDocs,
			markdownNotes,
			tableHTML,
		]);
	});
	//#endregion process directives

	if ($varContainer.length) {
		const variablesDescription = $varContainer.next("center").next("p");
		let container = variablesDescription.next("dl");
		let fullDocs = "";

		//Because page of ngx_http_auth_jwt_module
		if (!container.length) container = variablesDescription.next("p").next("dl");

		shouldBeEqual(
			`variables info of ${moduleName}: a[name=variables]+center+p+dl or ` + `a[name=variables]+center+p+p+dl`,
			container.length,
			1
		);

		fullDocs = $.html(variablesDescription);
		if (variablesDescription.next("p").length)
			fullDocs += $.html(variablesDescription.next("p")) + $.html(container);
		else fullDocs += $.html(container);
		fullDocs = resolveDocumentHTML(fullDocs);

		// too many page has not compact class in variable
		// if ((container.attr('class')||'').trim() != 'compact')
		// 	checker.warn(`variables dl tag has not class name "compact" in ${name}`);

		container.children("dt").each((i, e) => {
			const $varName = $(e);
			const $varDesc = $varName.next("dd");
			const $tailCheck = $varName.next().next();

			const varName = ($varName.text() || "").trim();
			lengthShouldBeMoreThanOrEqual(`variable name ${i} of ${moduleName}`, varName, 2);

			const varDesc = ($varDesc.text() || "").trim();
			lengthShouldBeMoreThanOrEqual(`description of variable ${varName}`, varDesc, 1);

			if ($tailCheck.length && $tailCheck.prop("tagName") != "DT")
				print.warning(`the tag after description of variable ${varName} is not "dt"`);

			const elementId = $varName.attr("id");
			lengthShouldBeMoreThanOrEqual(`attribute "id" of element "dt" ${varName} `, elementId, "var_".length);
			// varsId[varName] = elementId;
			// variablesResult.push(item);
			count.variables++;

			manifestStreams[manifestName].writeItem([
				ManifestItemType.Variable,
				varName,
				varDesc,
				moduleIndex,
				null, // since
				`${uri}#${elementId}`,
				null, // ci
			]);
		});
		detailsStream.writeItem([ManifestItemType.VariableDetails, fullDocs]);
	}

	count.directives && console.log(` - Directives count: ${bold(count.directives)}`);
	count.variables && console.log(` - Variables count: ${bold(count.variables)}`);
	detailsStream.close();
	print.ok();
	return count;

	function resolveDocumentHTML(docHTML: string) {
		return compressHTML(docHTML).replace(
			/href=[\"\'](.+?)[\"\']/g,
			(_, href) => `href="${encodeURI(resolveURL(fullURL, decodeURI(href)))}"`
		);
	}
}
