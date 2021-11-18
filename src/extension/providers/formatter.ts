import { CancellationToken, Disposable, Range, languages, TextDocument, DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider, FormattingOptions, ProviderResult, TextEdit, EndOfLine } from "vscode";
import { DOCUMENT_SELECTOR } from "./utils";
import * as nginxBeautifier from "../../libs/nginxbeautifier";
import { extensionConfig } from "./config";


export class NginxDocumentFormatProvider implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider {

	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerDocumentFormattingEditProvider(DOCUMENT_SELECTOR, this));
		disposables.push(languages.registerDocumentRangeFormattingEditProvider(DOCUMENT_SELECTOR, this));
	}

	provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
		return this.formatDocument(document, null, options);
	}
	provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
		return this.formatDocument(document, range, options);
	}

	private formatDocument(document: TextDocument, range: Range, options: FormattingOptions) {
		const body = document.getText();

		if (options.insertSpaces) {
			const tabSize = options.tabSize || extensionConfig.tabSize;
			const INDENTATION = new Array(tabSize).fill(' ').join('');
			nginxBeautifier.modifyOptions({ INDENTATION });
		} else {
			nginxBeautifier.modifyOptions({ INDENTATION: '\t' });
		}

		let cleanLines = nginxBeautifier.clean_lines(body);
		cleanLines = nginxBeautifier.join_opening_bracket(cleanLines);
		cleanLines = nginxBeautifier.perform_indentation(cleanLines);
		if (extensionConfig.enableFormatAlign) {
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

		const newBody = cleanLines
			.slice(range.start.line, range.end.line + 1)
			.join(document.eol === EndOfLine.LF ? '\n' : '\r\n');
		return [TextEdit.replace(range, newBody)];
	}

}

