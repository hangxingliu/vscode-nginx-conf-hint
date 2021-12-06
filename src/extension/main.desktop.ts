import { workspace, Disposable, ExtensionContext } from "vscode";
import { extensionConfig } from "./providers/config";
import { NginxCompletionItemsProvider } from "./providers/completion";
import { NginxDocumentLinkProvider } from "./providers/link";
import { NginxDefinitionProvider } from "./providers/definition";
import { NginxDocumentFormatProvider } from "./providers/formatter";
import { NginxHoverProvider } from "./providers/hover";
import { NginxSignatureProvider } from "./providers/signature";
import { NginxCommandProvider } from "./providers/command";
import { logger } from "./logger";
import { initHintDataManifest, initI18nManifest } from "./hint-data/manifest";
import { initHintDataDetails } from "./hint-data/details";

export function activate(context: ExtensionContext) {
	const startedAt = Date.now();
	console.log('nginx-conf-hint activating...');
	logger.init(context);

	initHintDataManifest();
	initI18nManifest(context);
	initHintDataDetails(context);

	const subscriptions = context.subscriptions;
	const disposable: Disposable[] = [];

	extensionConfig.reload();
	new NginxDocumentLinkProvider(disposable);
	new NginxDefinitionProvider(disposable);
	new NginxCompletionItemsProvider(disposable);
	new NginxHoverProvider(disposable);
	new NginxSignatureProvider(disposable);
	new NginxCommandProvider(disposable);
	new NginxDocumentFormatProvider(disposable);

	subscriptions.push(workspace.onDidChangeConfiguration(() => {
		extensionConfig.reload();
	}));
	subscriptions.push(...disposable);

	const elapsed = Date.now() - startedAt;
	console.log(`nginx-conf-hint activated (+${elapsed}ms)`);
}
export function deactivate() {
	// noop
}
