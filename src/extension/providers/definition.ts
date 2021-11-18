import { Disposable, Range, languages, TextDocument, workspace, DefinitionProvider, Location, Position } from "vscode";
import { getNginxConfCursorContext } from "../parser";
import { DOCUMENT_SELECTOR, NGINX_LANGUAGE_ID } from "./utils";

const zeroPos = new Position(0, 0);

export class NginxDefinitionProvider implements DefinitionProvider {

	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerDefinitionProvider(DOCUMENT_SELECTOR, this));
	}

	async provideDefinition(document: TextDocument, position: Position) {

		const beforeText = document.getText(new Range(zeroPos, position));
		const { list, index } = getNginxConfCursorContext(beforeText);
		if (list.length == 0) return null;

		const last = list[list.length - 1];
		if (last.startsWith('@')) {
			// named location
			const from = index[index.length - 1];
			const fullText = document.getText();
			const mtx = fullText.slice(from).match(/^\@\w+/);
			if (mtx) {
				const name = mtx[0];
				console.log(`${name} from ${from}`);

				let base = 0;
				let found = fullText.slice(0, from).indexOf(name);
				if (found < 0) {
					base = from + name.length
					found = fullText.slice(base).indexOf(name);
				}

				if (found >= 0) {
					found += base
					return new Location(document.uri, new Range(document.positionAt(found), document.positionAt(found + name.length)))
				}

				const selfUri = document.uri.toString();
				const docs = workspace.textDocuments.filter(it => it.languageId === NGINX_LANGUAGE_ID);
				console.log(`found ${docs.length} documents`);
				const result = [];
				for (let i = 0; i < docs.length; i++) {
					const doc = docs[i];
					if (doc.uri.toString() === selfUri) continue;

					const text = doc.getText();
					const found = text.indexOf(name);
					if (found) {
						result.push(new Location(doc.uri,
							new Range(doc.positionAt(found), doc.positionAt(found + name.length))));
					}
				}
				if (result.length === 0) return null;
				if (result.length === 1) return result[0];
				return result;
			}
		}

		return null;
	}


}

