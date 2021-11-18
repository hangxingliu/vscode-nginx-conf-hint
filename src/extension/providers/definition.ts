import { Disposable, Range, languages, TextDocument, DefinitionProvider, Location, Position } from "vscode";
import { getNginxConfDefinitionInfo } from "../parser";
import { MapList } from "../utils";
import { DOCUMENT_SELECTOR } from "./utils";

export class NginxDefinitionProvider implements DefinitionProvider {
	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerDefinitionProvider(DOCUMENT_SELECTOR, this));
	}

	async provideDefinition(document: TextDocument, position: Position) {
		const { location } = getNginxConfDefinitionInfo(document.getText());
		if (location.length < 1) return null;

		const rangeMap = new MapList<{ range: Range; isDef?: boolean }>();
		let posName: string;
		let posDef: boolean;
		location.forEach((it) => {
			const range = new Range(document.positionAt(it.begin), document.positionAt(it.end));
			if (range.contains(position)) {
				posName = it.name;
				posDef = it.isDef;
			}
			rangeMap.push(it.name, { range, isDef: it.isDef });
		});
		const range = rangeMap.getList(posName);
		if (range.length > 1) {
			const r = range.filter((it) => it.isDef !== posDef).map((it) => new Location(document.uri, it.range));
			return r.length > 1 ? r : r[0];
		}
		return null;
	}
}
