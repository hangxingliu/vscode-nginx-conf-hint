import { ExtensionContext, ExtensionMode, window } from "vscode";

export const logPrefix = "nginx-conf-hint:";

class _Logger {
	inProduction = true;

	init(context: ExtensionContext) {
		if (context.extensionMode === ExtensionMode.Development || context.extensionMode === ExtensionMode.Test)
			this.inProduction = false;
	}

	verbose(...args: unknown[]) {
		if (this.inProduction) return;
		console.log(logPrefix, ...args);
	}
	log(...args: unknown[]) {
		console.log(logPrefix, ...args);
	}
	error(...args: unknown[]) {
		if (!this.inProduction) return this.fatal(...args);
		console.error(logPrefix, ...args);
	}
	fatal(...args: unknown[]) {
		console.error(logPrefix, ...args);
		const [message, detailObj] = args;
		if (detailObj) {
			let detail = String(detailObj);
			if (detailObj instanceof Error) detail = detailObj.stack;
			window.showErrorMessage(`${logPrefix} ${message}`, { detail });
		} else {
			window.showErrorMessage(`${logPrefix} ${message}`);
		}
	}
}
export type Logger = _Logger;
export const logger = new _Logger();
