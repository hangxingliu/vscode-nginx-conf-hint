import { CompletionItem, CompletionItemKind, DocumentLink, Hover, SignatureHelp, SignatureInformation, SnippetString, TextDocument, Uri, Range } from "vscode";
import { isAbsolute, join, resolve, dirname } from 'path';
import { readdirSync, statSync, existsSync } from 'fs';
import { rawHintDataStorage } from "./raw_data";

let directivesCompletionItems = [];
let varCompletionItems = [];
let directivesItems = [];
let varItems = [];

function removeUglyCharactersInCompletionItem(text = '') {
	return text.replace(/&#x(\w{4});/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		//remove <code></code> mark
		.replace(/“`(.+?)`”/g, '“$1”');
}

let ZERO = ['00000', '0000', '000', '00', '0', ''];
function getSortPrefix(index) {
	let indexStr = String(index);
	return ZERO[indexStr.length] + indexStr;
}

export function initialize() {
	directivesCompletionItems = [];
	varCompletionItems = [];

	directivesItems = [].concat(rawHintDataStorage.nginx.directives(), rawHintDataStorage.lua.directives());
	varItems = [].concat(rawHintDataStorage.nginx.variables(), rawHintDataStorage.lua.variables());

	directivesItems.forEach((directive, index) => {
		let isCoreFunc = directive.module == 'Core functionality';

		let item = new CompletionItem(directive.name,
			CompletionItemKind.Property);
		item.documentation = directive.syntax.join('\n') + '\n' + directive.desc;

		// hide default core directive module name
		item.detail = isCoreFunc ? '' : directive.module;

		item.insertText = new SnippetString(
			directive.def  // has default value
				? directive.def.replace(/^(\w+)(\s+)(.+);$/, '$1$2$${params:$3};')
				: `${directive.name}\$\{0\};`);

		item.sortText = getSortPrefix(index) + item.label;

		//for fuzzy matching
		item['filter'] = directive.name.split('_');
		//for checking parent block name
		item['contexts'] = directive.contexts || [];
		directivesCompletionItems.push(item);
	});

	varItems.forEach(v => {
		let name = v.name.slice(v.name.startsWith('$') ? 1 : 0)
		let item = new CompletionItem(
			name, CompletionItemKind.Variable);
		item.documentation = removeUglyCharactersInCompletionItem(v.desc);
		item.detail = v.module;
		item['filter'] = name.split('_');
		varCompletionItems.push(item);
	});
}

export function getLinkItems(document: TextDocument) {
	const INCLUDE_REGEXP = /(include\s+['"]?)(\S+)(?:$|['";])/g;

	let code: string = document.getText();
	let baseFile: string = document.fileName;

	let matched: RegExpMatchArray = null;
	let result = [];

	try {
		while ((matched = INCLUDE_REGEXP.exec(code)) != null) {
			let p = matched[2];
			if (baseFile && !isAbsolute(p))
				p = resolve(join(dirname(baseFile), p));
			if (!existsSync(p) || !statSync(p).isFile())
				continue;

			let offset1 = matched.index + matched[1].length, offset2 = offset1 + matched[2].length;
			result.push(new DocumentLink(
				new Range(document.positionAt(offset1), document.positionAt(offset2)),
				Uri.file(p)));
		}
	} catch (ex) { console.error(ex); }
	return result;
}

export function getPathCompletionItems(baseFile = '', pathPrefix = '') {
	// console.log(baseFile, pathPrefix);
	let files = [], dirs = [];
	try {
		let base = pathPrefix;
		if (baseFile && !isAbsolute(pathPrefix))
			base = resolve(join(dirname(baseFile), pathPrefix));
		readdirSync(base).forEach(f => {
			let stat = statSync(join(base, f));
			if (stat.isFile()) files.push(f);
			else if (stat.isDirectory()) dirs.push(f);
		});
	} catch (ex) {
		return [];
	}
	let its = files.map(f => new CompletionItem(f, CompletionItemKind.File))
		.concat(dirs.map(d => new CompletionItem(d, CompletionItemKind.Folder)));
	return its;
}

export function getVariableCompletionItems(varNamePrefix) {
	return varCompletionItems.filter(v =>
		v.label.startsWith(varNamePrefix) ||
		v.filter.reduce((matched, keyword) => matched || keyword.startsWith(varNamePrefix), false));
}

/**
 * @param {string} directiveNamePrefix
 * @param {string} [parentBlockName] return completion items related this block name only if this parameter is not falsy
 */
export function getDirectiveCompletionItems(directiveNamePrefix: string, parentBlockName: string = null) {
	//Empty prefix , return all items
	if (!directiveNamePrefix)
		return directivesCompletionItems;
	return directivesCompletionItems.filter(it => {
		//If there has a specific parent block
		if (parentBlockName)
			if (it.contexts.indexOf(parentBlockName) == -1 && it.contexts[0] != 'any')
				return false;

		if (it.label.startsWith(directiveNamePrefix)) return true;

		//fuzzy matching
		for (let name of it.filter)
			if (name.startsWith(directiveNamePrefix))
				return true;
	});
}

export function getVariableItem(variableName: string) {
	variableName = `$${variableName}`;
	for (var index in varItems)
		if (varItems[index].name == variableName)
			return varItems[index];
}

export function getDirectiveItem(directiveName: string) {
	for (var index in directivesItems)
		if (directivesItems[index].name == directiveName)
			return directivesItems[index];
}

export function genDirectiveHoverHintItem(directiveItem) {
	let it = directiveItem;
	if (!it) return null;

	let hover = [
		/** @todo optimize here */
		`[goto nginx document](https://nginx.org/en/docs/http/${it.module}.html#${it.name})`,
		`**${it.name}** ${it.module}` +
		(it.since ? `since **${it.since}**` : '')
	];
	// if it has default parameters
	it.def && hover.push(`default: *${it.def}*`);
	hover.push(it.desc);
	return new Hover(hover.concat(it.notes));
}

export function genVariableHoverHintItem(variableItem) {
	let it = variableItem;
	return it ? new Hover([`**${it.name}** ${it.module}`, it.desc]) : null;
}

export function genDirectiveParametersHintItem(directiveItem) {
	let it = directiveItem;
	if (!it) return null;
	let sh = new SignatureHelp();
	sh.activeSignature = 0;
	sh.signatures = it.syntax.map(syntax =>
		new SignatureInformation(syntax, it.desc));
	return sh;
}

export const getAllDirectivesItems = () => directivesItems;
export const getAllVarCompletionItems = () => varCompletionItems;
