import { window, Disposable, TextDocumentContentProvider, WebviewPanel, ViewColumn, Uri, Webview } from "vscode";

/**
 * This module is used for newer version VSCode:
 * @see https://code.visualstudio.com/api/extension-guides/webview
 */
export class HTMLView {

	private readonly disposable: Disposable[] = [];
	private readonly urlToWebviewPanel = new Map<string, WebviewPanel>();
	readonly supported: boolean;

	constructor(private readonly contentProvider: TextDocumentContentProvider) {
		this.supported = typeof window.createWebviewPanel === 'function';
	}

	dispose() {
		let disposable = this.disposable.pop();
		while (disposable) {
			disposable.dispose();
			disposable = this.disposable.pop();
		}
	}

	loadHTML(uri: string, column: ViewColumn, title: string) {
		return this.getWebview(Uri.parse(uri), column, title);
	}

	private getWebview(uri: Uri, column: ViewColumn, title: string): Webview {
		if (!this.supported)
			return null;

		const oldWebviewPanel = this.urlToWebviewPanel.get(uri.toString());
		if (oldWebviewPanel)
			return oldWebviewPanel.webview;

		const webviewPanel = window.createWebviewPanel(
			'nginx-conf-hint-html-view',
			title,
			column, { enableScripts: true, retainContextWhenHidden: true });

		this.urlToWebviewPanel.set(uri.toString(), webviewPanel);
		webviewPanel.onDidDispose(() => {
			if (this.urlToWebviewPanel.has(uri.toString())) {
				this.urlToWebviewPanel.delete(uri.toString());
			}
		});

		Promise.resolve(true)
			.then(() => this.contentProvider.provideTextDocumentContent(uri, undefined))
			.then(html => webviewPanel.webview.html = html);
		return webviewPanel.webview;
	}
}
