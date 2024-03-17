//#region main
// template: crawler-utils.ts
// author:   hangxingliu
// license:  MIT
// version:  2024-03-17
//
import axios, { AxiosResponse } from "axios";
import { load, CheerioAPI, Element, Cheerio } from "cheerio";
export { load as loadHtml } from "cheerio";

import { createHash } from "crypto";
import { Agent as HttpsAgent } from "https";
import { resolve as resolvePath } from "path";
import { deepStrictEqual } from "assert";
import { existsSync, mkdirSync, readFileSync, writeFileSync, createWriteStream, WriteStream, appendFileSync } from "fs";
import type * as TurndownType from "turndown";

//
//#region terminal style
export const hasEnv = typeof process !== "undefined" && process.env ? true : false;
export const bold = (str: unknown) => `\x1b[1m${str}\x1b[22m`;
export const italic = (str: unknown) => `\x1b[3m${str}\x1b[23m`;
export const underline = (str: unknown) => `\x1b[4m${str}\x1b[24m`;
export const dim = (str: unknown) => `\x1b[2m${str}\x1b[22m`;
export const blue = (str: unknown) => `\x1b[34m${str}\x1b[39m`;
export const cyan = (str: unknown) => `\x1b[36m${str}\x1b[39m`;
export const green = (str: unknown) => `\x1b[32m${str}\x1b[39m`;
export const yellow = (str: unknown) => `\x1b[33m${str}\x1b[39m`;
export const red = (str: unknown) => `\x1b[31m${str}\x1b[39m`;
//#endregion terminal style
//

//
//#region the format for output
let indentStyle = "\t";
export function setIndentStyle(style: string) {
	indentStyle = style;
}
//#endregion the format for output
//

//
//#region printer
class DiagnosticCollector {
	readonly stack: string[] = [];
	readonly warnings: string[] = [];
	resetWarnings() {
		this.warnings.length = 0;
	}
	enter(context: string) {
		this.stack.push(context);
	}
	leave() {
		this.stack.pop();
	}
	warn(msg: string) {
		this.warnings.push(msg);
	}
}
class Printer extends DiagnosticCollector {
	static OK = " ~ " + green("OK");
	static WARN = " ! " + yellow("WARN");
	static ERROR = " ! " + red("ERROR");
	static INFO = "   " + blue("INFO");
	static DONE = blue(bold("DONE"));
	info(msg: string) {
		console.log(Printer.INFO, msg);
	}
	debug(msg: string) {
		console.log(dim("  debug " + msg));
	}
	_error(error: unknown) {
		console.error(Printer.ERROR, error);
	}
	warn(msg: string) {
		super.warn(msg);
		console.warn(Printer.WARN, msg);
	}
	start(msg: string) {
		console.log(`>  ${msg} ...`);
	}
	allDone() {
		console.log(Printer.DONE);
	}
}
export const print = new Printer();
//#endregion printer
//

export function getErrorMessage(err?: unknown): string {
	if (!err) return `Unknown Error`;
	if (typeof err === "string") return err;
	if (typeof err === "object") {
		const { message } = err as Error;
		if (typeof message === "string") return message;
	}
	return String(err);
}

//
//#region assert functions
export const enum AssertLevel {
	WARNING = "warning",
	ERROR = "error",
}
export type AssertLengthCondition =
	| number
	| `=${number}`
	| `==${number}`
	| `>=${number}`
	| `>${number}`
	| `<${number}`
	| `<=${number}`;
export function assertLength<T extends { length: number }>(
	name: string,
	arrayOrString: T,
	cond: AssertLengthCondition,
	level = AssertLevel.ERROR
): T {
	const actualLen = arrayOrString?.length;
	let op: string;
	let expectedLen: number;
	let ok = false;
	if (typeof cond === "number") {
		op = "=";
		expectedLen = cond;
	} else {
		const mtx = cond.match(/(==?|>=?|<=?)(\d+)/)!;
		op = mtx[1];
		expectedLen = parseInt(mtx[2], 10);
	}
	if (op === "=" || op === "==") ok = actualLen === expectedLen;
	else if (op === ">=") ok = actualLen >= expectedLen;
	else if (op === ">") ok = actualLen > expectedLen;
	else if (op === "<") ok = actualLen < expectedLen;
	else if (op === "<=") ok = actualLen <= expectedLen;
	if (!ok) {
		const errPrefix = `The length of ${bold(name)} is ${actualLen}, it does not match:`;
		if (level === AssertLevel.ERROR) throw new Error(`${errPrefix} ${cond}`);
		print.warn(`${errPrefix} ${cond}`);
	}
	return arrayOrString;
}
export function assert<T>(name: string, actual: unknown, expected: T): asserts actual is T {
	if (Array.isArray(expected) && Array.isArray(actual)) {
		assertLength(name, actual, `=${expected.length}`);
		for (let i = 0; i < expected.length; i++) assert(`${name}[${i}]`, actual[i], expected[i]);
		return;
	}
	try {
		deepStrictEqual(actual, expected);
	} catch (error) {
		let errMsg = `${bold(name)} should be equal to\n  ${JSON.stringify(expected)}\n`;
		errMsg += `But the actual value is\n  ${JSON.stringify(actual)}`;
		throw new Error(errMsg);
	}
}
export function assertAxiosTextResponse(name: string, res: AxiosResponse): string {
	if (res.status !== 200) throw new Error(`status code of ${bold(name)} is ${res.status}, but not 200`);
	if (!res.data || typeof res.data !== "string") {
		if (Buffer.isBuffer(res.data)) return res.data.toString("utf8");
		throw new Error(`response is not a valid string, headers=${JSON.stringify(res.headers)}`);
	}
	return res.data;
}
//#endregion assert functions
//

export class DuplicateChecker {
	private _hasDuplicate = false;
	private readonly set = new Set<string>();
	hasDuplicate() {
		return this._hasDuplicate;
	}
	check(element: string) {
		if (this.set.has(element)) {
			print.warn(`Found duplicate ${element}`);
			this._hasDuplicate = true;
		}
		this.set.add(element);
	}
}

export class SimpleHttpCache {
	static instance?: SimpleHttpCache;
	static init(...args: ConstructorParameters<typeof SimpleHttpCache>) {
		SimpleHttpCache.instance = new SimpleHttpCache(...args);
		return SimpleHttpCache.instance!;
	}

	readonly enabled: boolean;
	/** Map<input, sha1sum>, where input is the `JSON.stringify([url, context])`  */
	readonly cachedKeys = new Map<string, string>();
	readonly manifestFile: string;
	constructor(readonly cacheDir: string) {
		this.enabled = true;
		if (hasEnv && process.env.NO_CACHE) {
			this.enabled = false;
			print.warn(`HTTP persistent cache is disabled by env NO_CACHE`);
			print.resetWarnings();
		}
		if (!existsSync(cacheDir)) {
			print.start(`Creating cache directory: ${cacheDir}`);
			mkdirSync(cacheDir);
		}
		this.manifestFile = resolvePath(cacheDir, "manifest.txt");
	}
	getKey(url: string, context?: string) {
		const input = JSON.stringify([url, context]);
		let sha1 = this.cachedKeys.get(input);
		if (!sha1) {
			sha1 = createHash("sha1").update(input).digest("hex");
			this.cachedKeys.set(input, sha1);
		}
		return sha1;
	}
	get(url: string, context?: string): Buffer | undefined {
		if (!this.enabled) return;
		const key = this.getKey(url, context);
		const cacheFile = resolvePath(this.cacheDir, key);
		if (!existsSync(cacheFile)) return;
		print.debug(`Matched http cache "${key}"`);
		return readFileSync(cacheFile);
	}
	set(resp: string | Buffer, url: string, context?: string) {
		const key = this.getKey(url, context);
		const cacheFile = resolvePath(this.cacheDir, key);
		writeFileSync(cacheFile, resp);
		const manifest = {
			url,
			context,
			cache: cacheFile,
			createdAt: new Date(),
		};
		appendFileSync(this.manifestFile, JSON.stringify(manifest, null, "\t") + "\n");
	}
}

function createDefaultHttpsAgent() {
	return new HttpsAgent({ keepAlive: true });
}
function getHttpsAgent(): HttpsAgent {
	const envNames = [`HTTPS_PROXY`, `https_proxy`, `HTTP_PROXY`, `http_proxy`, `ALL_PROXY`, `all_proxy`];
	if (!hasEnv) return createDefaultHttpsAgent();
	for (const envName of envNames) {
		const env = process.env[envName];
		if (!env || typeof env !== "string") continue;
		if (/^https?:\/\//i.test(env)) {
			print.info(`The proxy "${env}" will be used for https requests`);
			const { HttpsProxyAgent } = require("https-proxy-agent");
			return new HttpsProxyAgent(env);
		}
	}
	return createDefaultHttpsAgent();
}

let httpsAgent: HttpsAgent;
export async function getText(name: string, url: string, context?: string): Promise<string> {
	if (!httpsAgent) httpsAgent = getHttpsAgent();

	print.debug(`Getting http resource ${bold(name)} from ${underline(url)} ...`);
	const cache = SimpleHttpCache.instance?.get(url, context);
	if (cache) return cache.toString("utf-8");

	let response: AxiosResponse;
	try {
		response = await axios(url, { proxy: false, httpsAgent });
	} catch (error) {
		throw new Error(`Failed to get response: ${getErrorMessage(error)}`);
	}

	const text = assertAxiosTextResponse(name, response);
	SimpleHttpCache.instance?.set(text, url, context);
	return text;
}

export async function getHTMLDoc(name: string, url: string, context?: string): Promise<CheerioAPI> {
	const html = await getText(name, url, context);
	return load(html);
}

export function isCheerioElements($: unknown): $ is Cheerio<Element> {
	if (!$) return false;
	if (typeof ($ as Cheerio<Element>).find !== "function") return false;
	if (typeof ($ as Cheerio<Element>).parent !== "function") return false;
	return true;
}

export function getElementInfo(el: Element | undefined, baseName = ""): string {
	if (!el) return `${baseName}NULL`;
	let name = `${baseName}${el.tagName || ""}`;
	const { id, class: _class } = el.attribs;
	if (id) name += `#${id.match(/\s/) ? JSON.stringify(id) : id}`;
	if (_class) name += `.${_class}`.replace(/\s+/g, ".");
	return name;
}
export function getElementsInfo(elements: Cheerio<Element>, baseName = "elements"): string[] {
	const result: string[] = [];
	elements.each((i, el) => {
		result.push(getElementInfo(el, `${baseName}[${i}] `));
	});
	return result;
}
export function debugElements(elements: Cheerio<Element>, baseName = "elements") {
	const info = getElementsInfo(elements, baseName);
	if (info.length === 0) console.log(`elements.length = 0`);
	info.forEach((it) => console.log(it));
}

export type OptionsForMatchingElements = {
	allowDuplicate?: boolean;
	allowMissing?: boolean;
	caseSensitive?: boolean;
	deleteSubstr?: string[];
};
export function matchElementsByText<T extends Element>(
	elements: Cheerio<T>,
	text: string[],
	opts: OptionsForMatchingElements
): T[] {
	const { allowDuplicate, allowMissing, caseSensitive } = opts;
	const deleteSubstr = opts.deleteSubstr || ["¶"];
	const cleanText = (t: string) => {
		t = String(t || "")
			.trim()
			.replace(/\s+/g, " ");
		for (const substr of deleteSubstr) t = t.replaceAll(substr, "");
		t = t.trim().replace(/\s+/g, " ");
		return caseSensitive ? t : t.toLocaleLowerCase();
	};

	const result: T[] = [];
	const matchedCount = new Map<string, number>();
	text.forEach((t) => {
		const clean = cleanText(t);
		if (matchedCount.has(clean)) throw new Error(`Duplicate text "${t}"`);
		matchedCount.set(clean, 0);
	});

	const len = elements.length;
	const debugInfo: string[] = [];
	for (let i = 0; i < len; i++) {
		const element = elements.eq(i);
		const raw = elements[i];
		const name = getElementInfo(raw, `elements[${i}] `);

		const innerText = cleanText(element.text());
		const count = matchedCount.get(innerText);
		if (typeof count === "number") {
			if (!allowDuplicate && count > 0) throw new Error(`${name} has duplicate text "${element.text()}"`);
			matchedCount.set(innerText, count + 1);
			result.push(raw);
		} else {
			debugInfo.push(`${name}: ${innerText}`);
		}
	}
	if (!allowMissing) {
		let missing = 0;
		matchedCount.forEach((count, text) => {
			if (count > 0) return;
			print.warn(`Can not match the element with the text "${text}"`);
			missing++;
		});
		if (missing > 0) {
			debugInfo.forEach((it) => print._error(it));
			throw new Error(`there are ${missing} text can not be matched`);
		}
	}
	return result;
}

export type OptionsForAssertInnerText = {
	ignoreWhiteSpace?: boolean;
	caseSensitive?: boolean;
	trim?: boolean;
};
export function assertInnerText(elements: Cheerio<Element>, text: string[], opts: OptionsForAssertInnerText) {
	const { caseSensitive, ignoreWhiteSpace } = opts;
	const trim = ignoreWhiteSpace || opts.trim;
	const cleanText = (t: string) => {
		t = String(t || "");
		if (trim) t = t.trim();
		t = t.replace(/\s+/g, ignoreWhiteSpace ? "" : " ");
		return caseSensitive ? t : t.toLocaleLowerCase();
	};
	text.forEach((t, i) => {
		const raw = elements[i];
		if (!raw) throw new Error(`elements[${i}] is not an element. but expected text of it is "${t}"`);

		const element = elements.eq(i);
		const name = getElementInfo(raw, `elements[${i}] `);
		const innerText = cleanText(element.text());
		const clean = cleanText(t);
		if (innerText === clean) return;

		let errMsg = `The inner text of ${name} is "${innerText}"`;
		errMsg += ` and it does not match the expected text "${clean}"`;
		throw new Error(errMsg);
	});
}

export function findElements(
	$: Cheerio<Element> | CheerioAPI,
	selector: string,
	len: AssertLengthCondition | undefined | null,
	parentName?: string
): Cheerio<Element> {
	let findFn: (selector: string) => Cheerio<Element>;
	if (isCheerioElements($)) {
		findFn = $.find.bind($);
		if (!parentName) parentName = getElementInfo($[0]);
	} else {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		findFn = $ as any;
		if (!parentName) parentName = "Document";
	}
	let result: Cheerio<Element>;
	try {
		result = findFn(selector);
	} catch (error) {
		print._error(error);
		throw new Error(`Failed to find elements from ${parentName} by "${selector}"`);
	}
	// print.debug(`found ${result.length} elements from ${parentName} by "${selector}"`);
	if (len !== null && len !== undefined)
		assertLength(`"${selector}" in ${parentName}`, result, len, AssertLevel.ERROR);
	return result;
}

export function minifierHTML(html: string): string {
	const minifier = require("html-minifier");
	return minifier.minify(html, {
		removeComments: true,
		collapseWhitespace: true,
	});
}

export function resolveURL(from: string, to: string) {
	const resolvedUrl = new URL(to, new URL(from, "resolve://"));
	if (resolvedUrl.protocol === "resolve:") {
		// `from` is a relative URL.
		const { pathname, search, hash } = resolvedUrl;
		return pathname + search + hash;
	}
	return resolvedUrl.toString();
}

//
//#region html to markdown
let turndownService: TurndownType;
let turndownHTMLSupported = false;
export function enableHTMLSupportedInMarkdown(enabled = true) {
	turndownHTMLSupported = enabled;
}
export function toMarkdown(html: string): string {
	if (!turndownService) {
		const Turndown = require("turndown");
		const { gfm } = require("turndown-plugin-gfm");
		turndownService = new Turndown({ headingStyle: "atx", hr: "***" });
		turndownService.use(gfm);
	}
	turndownService.addRule("fix-nested-code", {
		filter(node, options) {
			const { nodeName } = node;
			if (nodeName !== "CODE") return false;
			// #text
			const childTags = Array.from(node.childNodes).filter((it) => it.nodeName && !it.nodeName.startsWith("#"));
			if (childTags.length === 0) return false;
			// console.log(childTags.map((it) => [it.nodeName, it.textContent]));
			return true;
		},
		replacement(content, node, options) {
			if (turndownHTMLSupported) {
				const html = (node as HTMLElement)["outerHTML"];
				if (typeof html === "string") {
					// simple replace for removing class names
					return html.replace(/(<\w+)\s+class="(.+?)"/g, "$1");
				}
			}
			return "`" + node.textContent + "`";
		},
	});
	return turndownService.turndown(html);
}
export function getMarkdownHelpFromElement($el: Cheerio<Element>): string {
	const $links = $el.find("a");
	for (let i = 0; i < $links.length; i++) {
		const $link = $links.eq(i);
		const href = $link.attr("href");
		if (href && href.endsWith("#")) $link.attr("href", href.replace(/#$/, ""));
	}
	const html = $el.html();
	return toMarkdown(html || "");
}
//#endregion html to markdown
//

export function writeJSON(filePath: string, object: unknown) {
	writeFileSync(filePath, JSON.stringify(object, null, indentStyle) + "\n");
}

export class JsonFileWriter<ItemType = unknown> {
	stream?: WriteStream;

	constructor(readonly filePath: string) {}
	writeItem(item: ItemType) {
		if (!this.stream) {
			this.stream = createWriteStream(this.filePath);
			this.stream.write("[\n");
		} else {
			this.stream.write(",\n");
		}
		this.stream.write(JSON.stringify(item));
	}
	writeItems(items: ItemType[]) {
		for (const item of items) this.writeItem(item);
	}
	async close() {
		if (!this.stream) return;
		const stream = this.stream;
		this.stream = undefined;
		stream.write("\n]");
		await new Promise<void>((resolve, reject) => stream.close((err) => (err ? reject(err) : resolve())));
	}
}
//#endregion main
