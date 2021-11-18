import { CancellationToken, Disposable, Range, languages, TextDocument, Uri, workspace, FileType, DocumentLinkProvider, DocumentLink } from "vscode";
import { DOCUMENT_SELECTOR } from "./utils";

export class NginxDocumentLinkProvider implements DocumentLinkProvider {

	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerDocumentLinkProvider(DOCUMENT_SELECTOR, this));
	}

	async provideDocumentLinks(document: TextDocument, token: CancellationToken) {
		const INCLUDE_REGEXP = /(include\s+['"]?)(\S+)(?:$|['";])/g;
		let code: string = document.getText();
		let matched: RegExpMatchArray = null;
		let result = [];

		try {
			while ((matched = INCLUDE_REGEXP.exec(code)) != null) {
				let p = matched[2];
				const uri = Uri.joinPath(document.uri, '..', p);
				try {
					const stat = await workspace.fs.stat(uri);
					if (stat.type !== FileType.File && stat.type !== FileType.SymbolicLink)
						continue;
				} catch (error) {
					continue;
				}

				let offset1 = matched.index + matched[1].length, offset2 = offset1 + matched[2].length;
				result.push(new DocumentLink(
					new Range(document.positionAt(offset1), document.positionAt(offset2)),
					uri));
			}
		} catch (ex) { console.error(ex); }
		return result;
	}

	resolveDocumentLink(link: DocumentLink, token: CancellationToken) {
		return link;
	}
}

