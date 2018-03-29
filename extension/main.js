//@ts-check
/// <reference path="../vscode.d.ts" />
let vscode = require('vscode'),
	nginxDocument = require('./open_nginx_document'),
	hint = require('./hint_data_manager'),
	{ getTextAroundCursor, getTextBeforeCursor, showErrorMessage } = require('./vscode_helper');

let NGINX_LANGUAGE_ID = 'NGINX';
let DOCUMENT_SELECTOR = [NGINX_LANGUAGE_ID];

let enableStrictCompletion = true;

// ==============================
//      Semantization function
//            语义化函数
// ==============================

function isCursorInTheDirectiveName(textBeforeCursor = '') {
	return textBeforeCursor.match(/(?:^|;)\s*(\w*)$/); }

function getVariableNamePrefixBeforeCursor(textBeforeCursor = '') {
	let mtx = textBeforeCursor.match(/\$(\w*)$/);
	return mtx ? mtx[1] : undefined;
}

function getCurrentDirectiveInfo(textBeforeCursor = '') {
	let index = textBeforeCursor.lastIndexOf(';');
	if (index >= 0)
		textBeforeCursor = textBeforeCursor.slice(index + 1);
	let mtx = textBeforeCursor.match(/^\s*(\w+)\s+(.*)$/);
	return mtx ? ({ name: mtx[1], param: mtx[2] }) : undefined;
}


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

function applyConfiguration() {
	let configurations = vscode.workspace.getConfiguration('nginx-conf-hint');
	enableStrictCompletion = configurations.get('enableStrictCompletion', true);
}

function activate(context) {
	console.log('nginx-conf-hint activating...');

	let subscriptions = context.subscriptions, disposable = [];

	hint.initialize();
	nginxDocument.initialize(context);

	applyConfiguration();

	//======================================
	// Update configuration if it has changed
	//======================================
	vscode.workspace.onDidChangeConfiguration(applyConfiguration);

	//======================================
	//          Link Item for `include`
	//======================================
	disposable[0] = vscode.languages.registerDocumentLinkProvider(DOCUMENT_SELECTOR, {
		provideDocumentLinks: (document) => hint.getLinkItems(document),
		resolveDocumentLink: (item) => item
	});


	//======================================
	//          Completion Item
	//======================================
	disposable[1] = vscode.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
		provideCompletionItems: (document, position) => {
			// console.log(getBlockNameCursorIn(document, position));
			let beforeText = getTextBeforeCursor(document, position);

			let isDirective = isCursorInTheDirectiveName(beforeText),
				directiveNamePrefix = isDirective && isDirective[1];
			if (isDirective) {
				let block = enableStrictCompletion ? getBlockNameCursorIn(document, position) : null;
				return hint.getDirectiveCompletionItems(directiveNamePrefix, block);
			}

			let directive = getCurrentDirectiveInfo(beforeText);
			if (!directive)
				return null;

			if (directive.name == 'include')
				return hint.getPathCompletionItems(document.fileName, directive.param);

			let variableNamePrefix = getVariableNamePrefixBeforeCursor(beforeText);
			if (typeof variableNamePrefix == 'undefined')
				return null;
			return hint.getVariableCompletionItems(variableNamePrefix);
		},
		resolveCompletionItem: item => item
	}, '$', '/');



	//======================================
	//          Hover
	//======================================
	disposable[2] = vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, {
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
	disposable[3] = vscode.languages.registerSignatureHelpProvider(DOCUMENT_SELECTOR, {
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
	disposable[4] = vscode.commands.registerCommand('nginx-conf-hint.showDocument', () => {

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


	subscriptions.push(...disposable);

	console.log('nginx-conf-hint activated');
}

function deactivate() { }

exports.activate = activate;
exports.deactivate = deactivate;
