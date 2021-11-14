//@ts-check
/// <reference path="../vscode.d.ts" />
const vscode = require('vscode');
const fs = require('fs');
const nginxDocument = require('./documents/open_nginx_document');
const hint = require('./hint_data_manager');
const { getCurrentSyntaxType, applySyntaxFile, isValidType } = require('./syntax_manager');
const {
	getTextAroundCursor, getTextBeforeCursor,
	showErrorMessage, showConfirm,
	WARNING, AS_MODAL,
} = require('./vscode_helper');

const nginxBeautifier = require("./nginxbeautifier.js");

const DEFAULT_SYNTAX = 'original';

let NGINX_LANGUAGE_ID = 'NGINX';
let DOCUMENT_SELECTOR = [NGINX_LANGUAGE_ID];

let enableStrictCompletion = true;
let enableFormatAlign = false;
let editorConfigTabSize = 4

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
	enableFormatAlign = configurations.get("format").align;
	editorConfigTabSize = vscode.workspace.getConfiguration("editor").get("tabSize", 4);

	let newSyntaxInConfig = configurations.get('syntax', DEFAULT_SYNTAX);
	if (!isValidType(newSyntaxInConfig))
		return showErrorMessage(`"${newSyntaxInConfig}" is invalid syntax type!`);

	getCurrentSyntaxType().then(oldSyntax => {
		if (oldSyntax == newSyntaxInConfig)
			return;
		//@ts-ignore
		return applySyntaxFile(newSyntaxInConfig).then(() => {
			showConfirm(`please reload Visual Studio Code to enable nginx.conf syntax style: ${newSyntaxInConfig}`,
				'Reload now', null, WARNING | AS_MODAL).then(reloadNow => {
					if (reloadNow)
						vscode.commands.executeCommand("workbench.action.reloadWindow");
				});
		});
	}).catch(error => showErrorMessage(`error: ${String(error.message || error)}`));
}

function displayNewSyntaxTip() {
	let configurations = vscode.workspace.getConfiguration('nginx-conf-hint');
	/** @type {string} */
	let syntaxConfig = configurations.get('syntax', DEFAULT_SYNTAX);
	if (syntaxConfig === 'sublime') return;

	const newSyntaxTipLockFile = `${__dirname}/new_syntax_tip_has_been_shown`;
	fs.stat(newSyntaxTipLockFile, (err, stat) => {
		if (stat) return; // file is existed

		showConfirm(`sublime style syntax is supported now. Do you use it now ?`,
			'Goto Settings', 'Not now').then(gotoSettings => {
				if (gotoSettings)
					vscode.commands.executeCommand("workbench.action.openGlobalSettings");

				fs.writeFile(newSyntaxTipLockFile, new Date().toJSON(), err =>
					showErrorMessage(`error: can not create new syntax tip lock file! ${String(err.message || err)}`));
			});
	});
}

function activate(context) {
	console.log('nginx-conf-hint activating...');

	let subscriptions = context.subscriptions, disposable = [];

	hint.initialize();
	nginxDocument.initialize(context);

	displayNewSyntaxTip();
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

	disposable[5] = vscode.languages.registerDocumentFormattingEditProvider(NGINX_LANGUAGE_ID, {
		provideDocumentFormattingEdits(document) {
			return formatDocument(document);
		}
	});

	disposable[6] = vscode.languages.registerDocumentRangeFormattingEditProvider(NGINX_LANGUAGE_ID, {
		provideDocumentRangeFormattingEdits(document, range) {
			return formatDocument(document, range);
		}
	});

	subscriptions.push(...disposable);

	console.log('nginx-conf-hint activated');
}

function deactivate() { }


/**
 *
 * @param {vscode.TextDocument} document
 * @param {vscode.Range} range
 */
function formatDocument(document, range = null) {
	return new Promise((resolve, reject) => {
		const body = document.getText();

		nginxBeautifier.modifyOptions({INDENTATION: " ".repeat(editorConfigTabSize)});

		var cleanLines = nginxBeautifier.clean_lines(body);
		cleanLines = nginxBeautifier.join_opening_bracket(cleanLines);
		cleanLines = nginxBeautifier.perform_indentation(cleanLines);
		if (enableFormatAlign) {
			cleanLines = nginxBeautifier.perform_alignment(cleanLines);
		}

		const firstLine = document.lineAt(0);
		const lastLine  = document.lineAt(document.lineCount - 1);
		range = range || new vscode.Range(
			firstLine.range.start.line,
			firstLine.range.start.character,
			lastLine.range.end.line,
			lastLine.range.end.character
		);

		var newBody = cleanLines
			.slice(range.start.line, range.end.line + 1)
			.join(endOfLine(document.eol));
		resolve([vscode.TextEdit.replace(range, newBody)]);
	});
}

function endOfLine(eol) {
	return eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
}

exports.activate = activate;
exports.deactivate = deactivate;
