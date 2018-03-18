/// <reference path="../vscode.d.ts" />
let vscode = require('vscode');

/**
 * @param {string} msg
 */
function showErrorMessage(msg) {
	vscode.window.showErrorMessage(`nginx-conf-hint: ${msg}`);
}

/**
 * @param {any} document
 * @param {any} position
 * @returns {string}
 */
function getTextBeforeCursor(document, position) {
    var start = new vscode.Position(position.line, 0);
    var range = new vscode.Range(start, position);
    return document.getText(range);
}

/**
 * @param {any} document
 * @param {any} position
 * @returns {string}
 */
function getTextAroundCursor(document, position) {
	let lineText = document.lineAt(position).text,
		pos = position.character;
	let beforeText = lineText.slice(0, pos),
		afterText = lineText.slice(pos);
	beforeText = (beforeText.match(/\w*$/) || [''] )[0];
	afterText = (afterText.match(/^\w*/) || [''] )[0];
	return beforeText + afterText;
}

module.exports = {
	getTextBeforeCursor,
	getTextAroundCursor,
	showErrorMessage
};
