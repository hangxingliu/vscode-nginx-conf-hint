import { commands, languages, workspace, window, Range, Position, TextDocument, Uri, TextEdit, EndOfLine } from "vscode";
import { getTextAroundCursor, getTextBeforeCursor, showErrorMessage, showConfirm, WARNING, AS_MODAL } from './vscode_helper';
import * as nginxDocument from "./documents/open_nginx_document";
import * as nginxBeautifier from "../libs/nginxbeautifier";

import * as hint from "./hint_data/manager";
import { rawHintDataStorage } from "./hint_data/raw_data";
import { rawLuaHintData, rawNginxHintData } from "./hint_data/raw_data.desktop";

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
	return textBeforeCursor.match(/(?:^|;)\s*(\w*)$/);
}

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
function getBlockNameCursorIn(document, position) {
	let lineNum = position.line, stack = 0, match, line = '', commentMark;
	while (--lineNum >= 0) {
		line = document.lineAt(lineNum).text;

		// ignore comments
		commentMark = line.indexOf('#');
		if (commentMark >= 0) line = line.slice(0, commentMark);

		line = line.trim();

		if (line == '}') stack++;

		if (match = line.match(/^(\w+)\s+.*\{$/)) {
			if (!stack)
				return match[1];
			stack--;
		}
	}
};

function applyConfiguration() {
	let configurations = workspace.getConfiguration('nginx-conf-hint');

	enableStrictCompletion = configurations.get('enableStrictCompletion', true);
	enableFormatAlign = (configurations.get("format") as any).align;
	editorConfigTabSize = workspace.getConfiguration("editor").get("tabSize", 4);
}

function activate(context) {
	console.log('nginx-conf-hint activating...');

	let subscriptions = context.subscriptions, disposable = [];

	rawHintDataStorage.nginx = rawNginxHintData;
	rawHintDataStorage.lua = rawLuaHintData;

	hint.initialize();
	nginxDocument.initialize(context);

	applyConfiguration();

	//======================================
	// Update configuration if it has changed
	//======================================
	workspace.onDidChangeConfiguration(applyConfiguration);

	//======================================
	//          Link Item for `include`
	//======================================
	disposable[0] = languages.registerDocumentLinkProvider(DOCUMENT_SELECTOR, {
		provideDocumentLinks: (document) => hint.getLinkItems(document),
		resolveDocumentLink: (item) => item
	});


	//======================================
	//          Completion Item
	//======================================
	disposable[1] = languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, {
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

			if (directive.name == 'include') {
				const fs = workspace.fs;
				return hint.getPathCompletionItems(document.fileName, directive.param);
			}

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
	disposable[2] = languages.registerHoverProvider(DOCUMENT_SELECTOR, {
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
	disposable[3] = languages.registerSignatureHelpProvider(DOCUMENT_SELECTOR, {
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
	disposable[4] = commands.registerCommand('nginx-conf-hint.showDocument', () => {

		let editor = window.activeTextEditor;
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

	disposable[5] = languages.registerDocumentFormattingEditProvider(NGINX_LANGUAGE_ID, {
		provideDocumentFormattingEdits(document) {
			return formatDocument(document);
		}
	});

	disposable[6] = languages.registerDocumentRangeFormattingEditProvider(NGINX_LANGUAGE_ID, {
		provideDocumentRangeFormattingEdits(document, range) {
			return formatDocument(document, range);
		}
	});

	subscriptions.push(...disposable);

	console.log('nginx-conf-hint activated');
}

function deactivate() { }


function formatDocument(document: TextDocument, range: Range = null) {
	return new Promise<any>((resolve, reject) => {
		const body = document.getText();

		nginxBeautifier.modifyOptions({ INDENTATION: " ".repeat(editorConfigTabSize) });

		var cleanLines = nginxBeautifier.clean_lines(body);
		cleanLines = nginxBeautifier.join_opening_bracket(cleanLines);
		cleanLines = nginxBeautifier.perform_indentation(cleanLines);
		if (enableFormatAlign) {
			cleanLines = nginxBeautifier.perform_alignment(cleanLines);
		}

		const firstLine = document.lineAt(0);
		const lastLine = document.lineAt(document.lineCount - 1);
		range = range || new Range(
			firstLine.range.start.line,
			firstLine.range.start.character,
			lastLine.range.end.line,
			lastLine.range.end.character
		);

		var newBody = cleanLines
			.slice(range.start.line, range.end.line + 1)
			.join(endOfLine(document.eol));
		resolve([TextEdit.replace(range, newBody)]);
	});
}

function endOfLine(eol: EndOfLine) {
	return eol === EndOfLine.LF ? "\n" : "\r\n";
}

exports.activate = activate;
exports.deactivate = deactivate;
