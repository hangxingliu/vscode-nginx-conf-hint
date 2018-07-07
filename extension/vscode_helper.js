//@ts-check
/// <reference path="../vscode.d.ts" />

const vscode = require('vscode');

const INFORMATION = 1;
const WARNING = 2;
const AS_MODAL = 128;

/**
 * @param {string} msg
 */
function showErrorMessage(msg) {
	vscode.window.showErrorMessage(`nginx-conf-hint: ${msg}`);
}


function showConfirm(title, btnOk, btnCancel, flags = 0) {
	return new Promise(resolve => {
		const showConfirm = flags & WARNING
			? vscode.window.showWarningMessage
			: vscode.window.showInformationMessage;

		const btn1 = { title: btnOk, code: 1 };
		const btn2 = btnCancel ? { title: btnCancel, code: 2 } : undefined;
		showConfirm(`nginx-conf-hint: ${title}`, { modal: !!(flags & AS_MODAL) }, btn1, btn2)
			.then(result => resolve(result && result.code == 1));
	});
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
	WARNING,
	INFORMATION,
	AS_MODAL,
	showConfirm,

	getTextBeforeCursor,
	getTextAroundCursor,
	showErrorMessage
};
