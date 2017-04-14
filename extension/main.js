/// <reference path="../vscode.d.ts" />
let vscode = require('vscode'),
	helper = require('./vscode_helper'),
	hint = require('./hint_data_manager');

let DOCUMENT_SELECTOR = ['NGINX'];

function activate(context) {
	let subscriptions = context.subscriptions,
		sub1, sub2, sub3;
	
	hint.initialize();

	//======================================
	//          Completion Item	
	//======================================	
	sub1 = vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
		provideCompletionItems: (document, position /*, token*/ ) => {
			let beforeText = helper.getTextBeforeCursor(document, position);
			let directiveMatch = beforeText.match(/^\s+(\w*)$/);
			if (directiveMatch) {
				//directive
				directiveMatch = directiveMatch[1];
				if (!directiveMatch) return hint.getAllDirectivesItems();
				return hint.getDirectiveCompletionItems(directiveMatch);
			}
			beforeText = (
				beforeText.match(/\$(\w+)$/) ||
				beforeText.match(/(\d{1,3})$/) || [])[1];
			// console.log(beforeText);
			if (!beforeText) return null;
			if (beforeText == '$') return hint.getAllVarCompletionItems();
			let items = hint.getVariableCompletionItems(beforeText.toLowerCase());
			return items;
		},
		resolveCompletionItem: (item /*, token*/ ) => item
	}, '$');



	//======================================
	//          Hover	
	//======================================
	sub2 = vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, {
		provideHover: (document, position /*, token*/) => {
			
			let beforeText = helper.getTextBeforeCursor(document, position);

			let name = helper.getTextAroundCursor(document, position);
			if (!name) return null;

			if (beforeText.match(/^\s*(\w+)$/))
				return hint.genDirectiveHoverHintItem(hint.getDirectiveItem(name));
			
			name = name.match(/^\d{3}$/) ? name : `$${name}`;
			return hint.genVariableHoverHintItem(hint.getVariableItem(name));
		}
	});



	//======================================
	//          Parameters Hint	
	//======================================	
	sub3 = vscode.languages.registerSignatureHelpProvider(DOCUMENT_SELECTOR, {
		provideSignatureHelp: (document, position /*, token*/) => {
			
			let beforeText = helper.getTextBeforeCursor(document, position);
			let directiveName = beforeText.match(/^\s*(\w+)\s*/);

			return directiveName ?
				hint.genDirectiveParametersHintItem(hint.getDirectiveItem(directiveName[1])) :
				null;
		}
	}, ' ');


	subscriptions.push(sub1);
	subscriptions.push(sub2);
	subscriptions.push(sub3);
}

function deactivate() { }

exports.activate = activate;
exports.deactivate = deactivate;