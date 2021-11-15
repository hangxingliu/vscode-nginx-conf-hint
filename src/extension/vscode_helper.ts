import { window, Position, Range, TextDocument } from 'vscode'

export const INFORMATION = 1;
export const WARNING = 2;
export const AS_MODAL = 128;

export function showErrorMessage(msg: string) {
	window.showErrorMessage(`nginx-conf-hint: ${msg}`);
}

export function showConfirm(title: string, btnOk: string, btnCancel?: string, flags = 0) {
	return new Promise(resolve => {
		const showConfirm = flags & WARNING
			? window.showWarningMessage
			: window.showInformationMessage;

		const btn1 = { title: btnOk, code: 1 };
		const btn2 = btnCancel ? { title: btnCancel, code: 2 } : undefined;
		showConfirm(`nginx-conf-hint: ${title}`, { modal: !!(flags & AS_MODAL) }, btn1, btn2)
			.then(result => resolve(result && result.code == 1));
	});
}

export function getTextBeforeCursor(document: TextDocument, position: Position): string {
	var start = new Position(position.line, 0);
	var range = new Range(start, position);
	return document.getText(range);
}

export function getTextAroundCursor(document: TextDocument, position: Position): string {
	let lineText = document.lineAt(position).text,
		pos = position.character;
	let beforeText = lineText.slice(0, pos),
		afterText = lineText.slice(pos);
	beforeText = (beforeText.match(/\w*$/) || [''])[0];
	afterText = (afterText.match(/^\w*/) || [''])[0];
	return beforeText + afterText;
}
