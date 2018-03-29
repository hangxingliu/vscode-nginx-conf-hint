let vscode = require('vscode'),
	{ isAbsolute, join, resolve, dirname } = require('path'),
	{ readdirSync, statSync, existsSync } = require('fs');

const DIRECTIVES_FILE = `${__dirname}/../hint_data/directives.json`;
const VARIABLES_FILE = `${__dirname}/../hint_data/variables.json`;

let directivesCompletionItems = [],
	varCompletionItems = [],
	directivesItems = [],
	varItems = [];

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

function initialize() {
	directivesCompletionItems = [];
	varCompletionItems = [];
	directivesItems = require(DIRECTIVES_FILE);
	varItems = require(VARIABLES_FILE);

	directivesItems.forEach((directive, index) => {
		let isCoreFunc = directive.module == 'Core functionality';

		let item = new vscode.CompletionItem(directive.name,
			vscode.CompletionItemKind.Property);
		item.documentation = directive.syntax.join('\n') + '\n' + directive.desc;

		// hide default core directive module name
		item.detail = isCoreFunc ? '' : directive.module;

		item.insertText = new vscode.SnippetString(
			directive.def  // has default value
				? directive.def.replace(/^(\w+)(\s+)(.+);$/, '$1$2$${params:$3};')
				: `${directive.name}\$\{0\};`);

		item.sortText = getSortPrefix(index) + item.label;

		//for fuzzy matching
		item.filter = directive.name.split('_');
		//for checking parent block name
		item.contexts = directive.contexts || [];
		directivesCompletionItems.push(item);
	});

	varItems.forEach(v => {
		let name =  v.name.slice(v.name.startsWith('$')?1:0)
		let item = new vscode.CompletionItem(
			name, vscode.CompletionItemKind.Variable);
		item.documentation = removeUglyCharactersInCompletionItem(v.desc);
		item.detail = v.module;
		item.filter = name.split('_');
		varCompletionItems.push(item);
	});
}

function getLinkItems(document) {
	const INCLUDE_REGEXP = /(include\s+['"]?)(\S+)(?:$|['";])/g;

	/** @type {string} */
	let code = document.getText(), baseFile = document.fileName;

	/** @type {RegExpMatchArray} */
	let matched = null;
	let result = [];

	try {
		while ((matched = INCLUDE_REGEXP.exec(code)) != null) {
			let p = matched[2];
			if (baseFile && !isAbsolute(p))
				p = resolve(join(dirname(baseFile), p));
			if (!existsSync(p) || !statSync(p).isFile())
				continue;

			let offset1 = matched.index + matched[1].length, offset2 = offset1 + matched[2].length;
			result.push(new vscode.DocumentLink(
				new vscode.Range(document.positionAt(offset1), document.positionAt(offset2)),
				vscode.Uri.file(p)));
		}
	} catch (ex) { console.error(ex); }
	return result;
}

function getPathCompletionItems(baseFile = '', pathPrefix = '') {
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
	let its = files.map(f => new vscode.CompletionItem(f, vscode.CompletionItemKind.File))
		.concat(dirs.map(d => new vscode.CompletionItem(d, vscode.CompletionItemKind.Folder)));
	return its;
}

function getVariableCompletionItems(varNamePrefix) {
	return varCompletionItems.filter(v =>
		v.label.startsWith(varNamePrefix) ||
		v.filter.reduce((matched, keyword) => matched || keyword.startsWith(varNamePrefix), false));
}

/**
 * @param {string} directiveNamePrefix
 * @param {string} [parentBlockName] return completion items related this block name only if this parameter is not falsy
 */
function getDirectiveCompletionItems(directiveNamePrefix, parentBlockName = null) {
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

function getVariableItem(variableName) {
	variableName = `$${variableName}`;
	for (var index in varItems)
		if (varItems[index].name == variableName)
			return varItems[index];
}

function getDirectiveItem(directiveName) {
	for (var index in directivesItems)
		if (directivesItems[index].name == directiveName)
			return directivesItems[index];
}

function genDirectiveHoverHintItem(directiveItem) {
	let it = directiveItem;
	if (!it) return null;

	let hover = [
		`**${it.name}** ${it.module}` +
		(it.since ? `since **${it.since}**` : '')
	];
	// if it has default parameters
	it.def && hover.push(`default: *${it.def}*`);
	hover.push(it.desc);
	return new vscode.Hover(hover.concat(it.notes));
}

function genVariableHoverHintItem(variableItem) {
	let it = variableItem;
	return it ? new vscode.Hover([`**${it.name}** ${it.module}`, it.desc]) : null;
}

function genDirectiveParametersHintItem(directiveItem) {
	let it = directiveItem;
	if (!it) return null;
	let sh = new vscode.SignatureHelp();
	sh.activeSignature = 0;
	sh.signatures = it.syntax.map(syntax =>
		new vscode.SignatureInformation(syntax, it.desc));
	return sh;
}


module.exports = {
	initialize,

	getLinkItems,

	getPathCompletionItems,
	getVariableCompletionItems,
	getDirectiveCompletionItems,

	getVariableItem,
	getDirectiveItem,

	genDirectiveHoverHintItem,
	genVariableHoverHintItem,
	genDirectiveParametersHintItem,

	getAllDirectivesItems: () => directivesItems,
	getAllVarCompletionItems: () => varCompletionItems
};
