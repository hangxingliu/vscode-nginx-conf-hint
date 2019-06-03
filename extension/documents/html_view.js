//@ts-check
/// <reference path="../../vscode.d.ts" />
/*
	This module is used for newer version VSCode:
	https://code.visualstudio.com/api/extension-guides/webview
*/

const vscode = require('vscode');

class HTMLView {
	constructor(contentProvider) {
		/** @type {vscode.Disposable[]} */
		this._disposable = [];

		/** @type {vscode.TextDocumentContentProvider} */
		this._contentProvider = contentProvider;

		/** @type {Map<string, vscode.WebviewPanel>} */
		this._urlToWebviewPanel = new Map();

		/** Is current vscode support Webview */
		this.supported = typeof vscode.window.createWebviewPanel === 'function';
    }
	dispose() {
		let disposable = this._disposable.pop();
		while (disposable) {
			disposable.dispose();
			disposable = this._disposable.pop();
		}
	}

	/**
	 *
	 * @param {string} uri
	 * @param {vscode.ViewColumn} column
	 * @param {string} title
	 */
	loadHTML(uri, column, title) {
        return this._getWebview(vscode.Uri.parse(uri), column, title);
	}

	/**
	 *
	 * @param {vscode.Uri} uri
	 * @param {vscode.ViewColumn} column
	 * @param {string} title
	 * @returns {vscode.Webview}
	 */
	_getWebview(uri, column, title) {
		if (!this.supported)
			return null;

		const oldWebviewPanel = this._urlToWebviewPanel.get(uri.toString());
		if (oldWebviewPanel)
			return oldWebviewPanel.webview;

		const webviewPanel = vscode.window.createWebviewPanel(
			'nginx-conf-hint-html-view',
			title,
			column, { enableScripts: true, retainContextWhenHidden: true });

        this._urlToWebviewPanel.set(uri.toString(), webviewPanel);
        webviewPanel.onDidDispose(() => {
            if (this._urlToWebviewPanel.has(uri.toString())) {
                this._urlToWebviewPanel.delete(uri.toString());
            }
		});

		Promise.resolve(true)
			.then(() => this._contentProvider.provideTextDocumentContent(uri, undefined))
			.then(html => webviewPanel.webview.html = html);

        return webviewPanel.webview;
    }
}

module.exports = { HTMLView };
