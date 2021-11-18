import type { Position, TextDocument } from "vscode";

export const NGINX_LANGUAGE_ID = 'NGINX';

export const DOCUMENT_SELECTOR = [NGINX_LANGUAGE_ID];


export function isCursorInTheDirectiveName(textBeforeCursor = '') {
	return textBeforeCursor.match(/(?:^|;)\s*(\w*)$/);
}

export function getCurrentDirectiveInfo(textBeforeCursor = '') {
	let index = textBeforeCursor.lastIndexOf(';');
	if (index >= 0)
		textBeforeCursor = textBeforeCursor.slice(index + 1);
	let mtx = textBeforeCursor.match(/^\s*(\w+)\s+(.*)$/);
	return mtx ? ({ name: mtx[1], param: mtx[2] }) : undefined;
}

export function getBlockNameCursorIn(document: TextDocument, position: Position) {
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

export function getVariableNamePrefixBeforeCursor(textBeforeCursor = '') {
	let mtx = textBeforeCursor.match(/\$(\w*)$/);
	return mtx ? mtx[1] : undefined;
}
