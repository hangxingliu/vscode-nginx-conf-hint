/// <reference path="../vscode.d.ts" />
let vscode = require('vscode'),
	nginxDocument = require('./open_nginx_document'),
	hint = require('./hint_data_manager'),
	{ getTextAroundCursor, getTextBeforeCursor } = require('./vscode_helper');

let NGINX_LANGUAGE_ID = 'NGINX';
let DOCUMENT_SELECTOR = [NGINX_LANGUAGE_ID];

// ==============================
//      Semantization function 
//            语义化函数
// ==============================
let isCursorInTheDirectiveName = textBeforeCursor => textBeforeCursor.match(/^\s+(\w*)$/);
let getVariableNamePrefixBeforeCursor = textBeforeCursor => (textBeforeCursor.match(/\$(\w+)$/) || [])[1];
let couldNotMatchVariableName = variableNamePrefix => typeof variableNamePrefix == 'undefined';
let showErrorMessage = msg => vscode.window.showErrorMessage(`nginx-conf-hint: ${msg}`);

/**
 * get which configuration block cursor located in.
 * @returns {string|undefined}
 */
function getBlockNameCursorIn(document, position){
	let lineNum = position.line, stack = 0, match, line = '', commentMark;
	while (--lineNum >= 0) {
		line = document.lineAt(lineNum).text;
		
		// ignore comments
		commentMark = line.indexOf('#');
		if (commentMark >= 0) line = line.slice(0, commentMark);

		line = line.trim();

		if (line == '}') stack++;
		
		if (match = line.match(/^(\w+)\s+.*\{$/)) {
			if(!stack)
				return match[1];
			stack--;
		}
	}
};


function activate(context) {
	console.log('nginx-conf-hint activating...');

	let subscriptions = context.subscriptions, sub1, sub2, sub3, sub4;

	hint.initialize();
	nginxDocument.initialize(context);

	//======================================
	//          Completion Item	
	//======================================	
	sub1 = vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
		provideCompletionItems: (document, position) => {
			// console.log(getBlockNameCursorIn(document, position));
			let beforeText = getTextBeforeCursor(document, position);
			
			let isDirective = isCursorInTheDirectiveName(beforeText),
				directiveNamePrefix = isDirective && isDirective[1];
			if (isDirective)
				return hint.getDirectiveCompletionItems(directiveNamePrefix,
					getBlockNameCursorIn(document, position));
			
			let variableNamePrefix = getVariableNamePrefixBeforeCursor(beforeText);
			if (couldNotMatchVariableName(variableNamePrefix))
				return null;	
			return hint.getVariableCompletionItems(variableNamePrefix);
		},
		resolveCompletionItem: item => item
	}, '$');

	

	//======================================
	//          Hover	
	//======================================
	sub2 = vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, {
		provideHover: (document, position) => {
			
			let beforeText = getTextBeforeCursor(document, position);

			let name = getTextAroundCursor(document, position);
			if (!name) return null;

			if (beforeText.match(/^\s*(\w+)$/))
				return hint.genDirectiveHoverHintItem(hint.getDirectiveItem(name));
			
			return hint.genVariableHoverHintItem(hint.getVariableItem(name));
		}
	});

	

	//======================================
	//          Parameters Hint	
	//======================================	
	sub3 = vscode.languages.registerSignatureHelpProvider(DOCUMENT_SELECTOR, {
		provideSignatureHelp: (document, position) => {
			
			let beforeText = getTextBeforeCursor(document, position);
			let directiveName = beforeText.match(/^\s*(\w+)\s*/);

			return directiveName ?
				hint.genDirectiveParametersHintItem(hint.getDirectiveItem(directiveName[1])) :
				null;
		}
	}, ' ');

	//======================================
	//          Open document command	
	//======================================
	sub4 = vscode.commands.registerCommand('nginx-conf-hint.showDocument', () => {

		let editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId != NGINX_LANGUAGE_ID)
			return showErrorMessage('Have not opened a nginx configuration document!');

		let { document, selection } = editor;
		let text = (selection.isEmpty
			? getTextAroundCursor(document, selection.start)
			: document.getText(selection)).trim();

		console.log("request open nginx document: " + text);

		if (!text)
			return showErrorMessage(`There not any word around cursor or selected!`);	
		
		if (nginxDocument.containsThisDirective(text))
			return nginxDocument.openDirectiveDoc(text.trim());
		if (nginxDocument.containsThisVariable(text))
			return nginxDocument.openVariableDoc(text.trim());
		
		return showErrorMessage(`"${text}" is not a nginx directive or nginx embedded variables!`);	
	});	
	
	
	subscriptions.push(sub1);
	subscriptions.push(sub2);
	subscriptions.push(sub3);
	subscriptions.push(sub4);
	
	console.log('nginx-conf-hint activated');
}

function deactivate() { }

exports.activate = activate;
exports.deactivate = deactivate;