let vscode = require('vscode');

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

function initialize() {
	directivesCompletionItems = [];
	varCompletionItems = [];
	directivesItems = require(DIRECTIVES_FILE);
	varItems = require(VARIABLES_FILE);
	directivesItems.forEach(directive => {
		// hide default core directive module name
		directive.module == 'Core functionality' &&
			(directive.module = '');	

		let item = new vscode.CompletionItem(directive.name,
			vscode.CompletionItemKind.Property);
		item.documentation = directive.syntax + '\n' + directive.desc;
		item.detail = directive.module;

		item.insertText = new vscode.SnippetString(
			directive.def  // has default value
				? directive.def.replace(/^(\w+)(\s+)(.+);$/, '$1$2$${params:$3};') 
				: `${directive.name} \$\{0\};`);

		item.filter = directive.name.split('_');
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

function getVariableCompletionItems(wordNo$) {
	return varCompletionItems.filter(v =>
		v.label.startsWith(wordNo$) ||
		v.filter.reduce((macthed, keyword) => macthed || keyword.startsWith(wordNo$), false));
}

function getDirectiveCompletionItems(wordNo$) {
	return directivesCompletionItems.filter(v =>
		v.label.startsWith(wordNo$) ||
		v.filter.reduce((macthed, keyword) => macthed || keyword.startsWith(wordNo$), false));
}

function getVariableItem(variableNameWith$) {
	for (var index in varItems)
		if (varItems[index].name == variableNameWith$)
			return varItems[index];
}

function getDirectiveItem(directiveNameWith$) {
	for (var index in directivesItems)
		if (directivesItems[index].name == directiveNameWith$)
			return directivesItems[index];
}

function genDirectiveHoverHintItem(directive) {
	let it = directive;
	if (!it) return null;

	let hover = [
		`**${it.name}** ${it.module}` +
		(it.since ? `since **${it.since}**` : '')
	];
	// if it has default paramters
	it.def && hover.push(`default: *${it.def}*`);
	hover.push(it.desc);
	return new vscode.Hover(hover.concat(it.notes));
}

function genVariableHoverHintItem(variable) {
	let it = variable;
	return it ? new vscode.Hover([`**${it.name}** ${it.module}`, it.desc]) : null;
}

function genDirectiveParametersHintItem(directive) {
	let it = directive;
	if (!it) return null;
	let sh = new vscode.SignatureHelp();
	sh.activeSignature = 0;
	sh.signatures = it.syntax
		.replace(/;\s*$/, '')
		.split(';').map(syntax =>
			new vscode.SignatureInformation(syntax + ';', it.desc));
	return sh;
}


module.exports = {
	initialize,
	
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