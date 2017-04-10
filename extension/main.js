/// <reference path="../vscode.d.ts" />
let vscode = require('vscode'),
	doc = require('./doc');

const HINT_DATA_FILES = {
	DIRECTIVES: `${__dirname}/../hint_data/directives.json`,
	VARIABLES: `${__dirname}/../hint_data/variables.json`
};

const DOCUMENT_SELECTOR = ['NGINX'];

let directivesCompletionItems = [],
	varCompletionItems = [],
	directivesItems = [],
	varItems = [];

function getTextBeforeCursor(document, position) {
    var start = new vscode.Position(position.line, 0);
    var range = new vscode.Range(start, position);
    return document.getText(range);
}
function getTextAroundCursor(document, position) {
	let lineText = document.lineAt(position).text,
		pos = position.character;
	let beforeText = lineText.slice(0, pos),
		afterText = lineText.slice(pos);
	beforeText = (beforeText.match(/\w*$/) || [''] )[0];
	afterText = (afterText.match(/^\w*/) || [''] )[0];
	return beforeText + afterText;
}
function removeUglyCharactersInCompletionItem(text = '') {
	return text.replace(/&#x(\w{4});/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		//remove <code></code> mark
		.replace(/“`(.+?)`”/g, '“$1”');
}

function loadHintData() {
	directivesCompletionItems = [];
	varCompletionItems = [];
	directivesItems = require(HINT_DATA_FILES.DIRECTIVES);
	varItems = require(HINT_DATA_FILES.VARIABLES);
	directivesItems.forEach(directive => {
		// 隐藏默认模块
		directive.module == 'Core functionality' &&
			(directive.module = '');	

		let item = new vscode.CompletionItem(directive.name,
			vscode.CompletionItemKind.Property);
		item.documentation = directive.syntax + '\n' + directive.desc;
		item.detail = directive.module;
		item.insertText = new vscode.SnippetString(
			directive.def 
				? directive.def.replace(/^(\w+)(\s+)(.+);$/, '$1$2$${params:$3}') 
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
} function getDirectiveCompletionItems(wordNo$) {
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


function activate(context) {
	let subscriptions = context.subscriptions;
	
	loadHintData();

	doc.activate(context, directivesItems);	

	subscriptions.push(
		vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
			provideCompletionItems: (document, position/*, token*/) => {
				let beforeText = getTextBeforeCursor(document, position);
				let directiveMatch = beforeText.match(/^\s+(\w*)$/);
				if (directiveMatch) {
					//directive
					directiveMatch = directiveMatch[1];
					if (!directiveMatch) return directivesCompletionItems;
					return getDirectiveCompletionItems(directiveMatch);
				}
				beforeText = (
					beforeText.match(/\$(\w+)$/) ||
					beforeText.match(/(\d{1,3})$/) || [])[1];
				// console.log(beforeText);
				if (!beforeText) return null;
				if (beforeText == '$') return varCompletionItems;
				let items = getVariableCompletionItems(beforeText.toLowerCase());
				return items;
			},
			resolveCompletionItem: (item/*, token*/) => item
		}, '$'
	));
	subscriptions.push(
		vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, {
			provideHover: (document, position/*, token*/) => {
				let beforeText = getTextBeforeCursor(document, position);
				let name = getTextAroundCursor(document, position);
				if (!name) return null;

				if (beforeText.match(/^\s*(\w+)$/)) {
					//directive
					let it = getDirectiveItem(name);
					if (!it) return null;
					let hover = [
						`**${it.name}** ${it.module}` +
						(it.since ? `since **${it.since}**` : '')
					];
					it.def && hover.push(`default: *${it.def}*`);
					hover.push(it.desc);
					return new vscode.Hover(hover.concat(it.notes));
				}
				// maybe variable
				name = name.match(/^\d{3}$/) ? name : `$${name}`;
				let it = getVariableItem(name);
				return it ? new vscode.Hover([`**${it.name}** ${it.module}`, it.desc]) : null;
			}
		}));
	
	subscriptions.push(
		vscode.languages.registerSignatureHelpProvider(DOCUMENT_SELECTOR, {
			provideSignatureHelp: (document, position/*, token*/) => {
				let beforeText = getTextBeforeCursor(document, position);
				//end of the function
				let directiveName = beforeText.match(/^\s*(\w+)\s*/);
				if (!directiveName) return null;
				directiveName = directiveName[1];

				let it = getDirectiveItem(directiveName);
				if (!it) return null;	
				let sh = new vscode.SignatureHelp();
				sh.activeSignature = 0;
				sh.signatures = it.syntax
					.replace(/;\s*$/, '')
					.split(';').map(syntax =>
						new vscode.SignatureInformation(syntax + ';', it.desc));
				return sh;
			}
		}, ' '));
	
	// subscriptions.push(
	// 	vscode.languages.registerDefinitionProvider(DOCUMENT_SELECTOR, {
	// 		provideDefinition: (document, position) => {
	// 			let beforeText = getTextBeforeCursor(document, position);
	// 			let name = getTextAroundCursor(document, position);
	// 			if (!name) return null;
	// 			if (beforeText.match(/^\s*(\w+)$/)) {
	// 				//directive
	// 				let it = getDirectiveItem(name);
	// 				if (!it) return null;
	// 				return new vscode.Location(doc.getUri(it.name), new vscode.Position(0, 0));
	// 			}
	// 			//TODO there is variable document
	// 		}
	// 	}));
}

function deactivate() {

}

exports.activate = activate;
exports.deactivate = deactivate;