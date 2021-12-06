import { window, Disposable, commands } from "vscode";
import { NGINX_LANGUAGE_ID } from "./utils";
import {initializeNginxDocument, openDirectiveDoc, openVariableDoc} from "../documents/open_nginx_document";
import { findManifestByName } from "../hint-data/manifest";
import { logger } from "../logger";

export class NginxCommandProvider {

	constructor(disposables: Disposable[]) {
		initializeNginxDocument(disposables);

		disposables.push(commands.registerCommand('nginx-conf-hint.showDocument', () => {

			const editor = window.activeTextEditor;
			if (!editor || editor.document.languageId != NGINX_LANGUAGE_ID)
				return logger.fatal('Have not opened a nginx configuration document!');

			const { document, selection } = editor;
			let text = (selection.isEmpty
				? document.getText(document.getWordRangeAtPosition(selection.start))
				: document.getText(selection)).trim();

			console.log("request open nginx document: " + text);

			if (!text)
				return logger.fatal(`There not any word around cursor or selected!`);

			text = text.trim();
			if (findManifestByName(text)?.length > 0)
				return openDirectiveDoc(text);

			if (findManifestByName(text.replace(/^\$?/, '$'))?.length > 0)
				return openVariableDoc(text);

			return logger.fatal(`"${text}" is not a nginx directive or nginx embedded variables!`);
		}));

	}
}

