import {
	CancellationToken,
	Disposable,
	languages,
	TextDocument,
	Position,
	SignatureHelpProvider,
	SignatureHelpContext,
	Range,
	SignatureInformation,
	SignatureHelp,
	MarkdownString,
} from "vscode";
import { DOCUMENT_SELECTOR } from "./utils";
import { getNginxConfCursorContext } from "../parser";
import { findManifestByName } from "../hint-data/manifest";
import { getModuleDetailsQuick } from "../hint-data/details";
import { NginxDirective } from "../hint-data/types";

const zeroPos = new Position(0, 0);

export class NginxSignatureProvider implements SignatureHelpProvider {
	constructor(disposables: Disposable[]) {
		disposables.push(languages.registerSignatureHelpProvider(DOCUMENT_SELECTOR, this, " "));
	}

	provideSignatureHelp(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: SignatureHelpContext
	) {
		const beforeText = document.getText(new Range(zeroPos, position));
		const { c, list, context: nginxContext } = getNginxConfCursorContext(beforeText);
		if (c) return null;

		if (list.length > 0) {
			const directiveName = list[0];
			let manifest = findManifestByName(directiveName) as NginxDirective[];
			if (manifest.length === 0) return null;
			if (manifest.length > 1 && context) {
				const _manifest = manifest.filter((it) => it.contexts.indexOf(nginxContext) >= 0);
				if (_manifest.length > 0) manifest = _manifest;
			}
			const syntax: string[] = [];
			const description: MarkdownString[] = [];
			manifest.forEach((it) => {
				it.syntax.forEach((s) => {
					const ms = new MarkdownString(it.module);
					const moduleDetails = getModuleDetailsQuick(it.module);
					if (moduleDetails) {
						const details = moduleDetails.diretives.get(it.name);
						if (details) ms.appendMarkdown('\n\n' + details.markdown);
					}
					syntax.push(s);
					description.push(ms);
				});
			});

			const help = new SignatureHelp();
			help.activeSignature = 0;
			help.signatures = syntax.map((s, index) => new SignatureInformation(s, description[index]));
			return help;
		}
	}
}
