import axios, { AxiosResponse } from "axios";
export { load as loadHtml } from "cheerio";

import Turndown = require("turndown");
import { Agent as HttpsAgent } from "https";
import { existsSync, writeFile, mkdirSync, readFileSync, writeFileSync, createWriteStream, WriteStream } from "fs";
import { resolve as resolvePath } from "path";
import { yellow, bold as _bold, green, red, blue } from "chalk";
import { cacheDir } from "./config";

export const hasEnv = typeof process !== 'undefined' && process.env ? true : false;
export const bold = (input: unknown) => _bold(String(input));

const turndownService = new Turndown({ headingStyle: 'atx', hr: '***' })

const OK = ' - ' + green('OK');
const WARN = ' - ' + yellow('WARN');
const ERROR = ' - ' + red('ERROR');
const DONE = blue.bold('DONE');

export const print = {
	warnings: 0,
	error: (reason = '') => {
		console.error(ERROR, reason);
		process.exit(1);
	},
	warning: (reason = '') => {
		print.warnings++;
		console.warn(WARN, reason);
	},
	ok: (msg = '') => {
		console.log(OK, msg);
	},
	start: (name: string) => {
		console.log(`>  ${name} ...`);
	},
	done: () => console.log(DONE),
};

export const enum AssertLevel {
	WARNING = 'warning',
	ERROR = 'error',
}
export function lengthShouldBeMoreThanOrEqual<T extends { length: number }>(
	name: string,
	arrayOrString: T,
	length = 1,
	level = AssertLevel.WARNING
): T {
	const actual = arrayOrString?.length;
	if ((arrayOrString?.length >= length) === false)
		print[level](`length of ${bold(name)} is ${String(actual)}, it is less than ${bold(length)}`);
	return arrayOrString;
}
export function lengthShouldBeEqual<T extends { length: number }>(
	name: string,
	arrayOrString: T,
	length = 1,
	level = AssertLevel.WARNING
): T {
	const actual = arrayOrString?.length;
	if (arrayOrString?.length !== length)
		print[level](`length of ${bold(name)} is ${String(actual)}, it is not equal to ${bold(length)}`);
	return arrayOrString;
}

export function shouldBeEqual(
	name: string,
	actual: string | number,
	expected: string | number,
	level = AssertLevel.WARNING
) {
	if (actual !== expected)
		print[level](`${bold(name)} is ${JSON.stringify(actual)}, it is not equals to ${bold(JSON.stringify(expected))}`);
	return actual;
}

export function shouldBeValidTextResponse(
	name: string,
	res: AxiosResponse
): string {
	if (res.status !== 200)
		return print.error(`status code of ${bold(name)} is ${res.status}, but not 200`);
	if (!res.data || typeof res.data !== 'string') {
		if (Buffer.isBuffer(res.data))
			return res.data.toString('utf8');
		return print.error(`response is not a valid string, headers=${JSON.stringify(res.headers)}`);
	}
	return res.data;
}


let httpCacheEnabled = true;
if (hasEnv && process.env.NO_CACHE)
	httpCacheEnabled = false;

export function initHttpCache() {
	if (!httpCacheEnabled) return console.log(yellow.bold('HTTP Cache is disabled!'));
	if (!existsSync(cacheDir)) {
		console.log(`Creating HTTP cache directory: ${cacheDir} ...`);
		mkdirSync(cacheDir);
		print.ok();
	}
}

function getHttpsAgent(): HttpsAgent {
	const envNames = [`HTTPS_PROXY`, `https_proxy`, `HTTP_PROXY`, `http_proxy`, `ALL_PROXY`, `all_proxy`];
	if (hasEnv) {
		for (let i = 0; i < envNames.length; i++) {
			const envName = envNames[i];
			const env = process.env[envName];
			if (typeof env === 'string' && env && /^https?:\/\//i.test(env)) {
				console.log(`Use proxy "${env}" for https request`);
				const HttpsProxyAgent = require('https-proxy-agent');
				return new HttpsProxyAgent(env);
			}
		}
	}
	return new HttpsAgent({ keepAlive: true });
}

function encodeUrlSafeBase64(buffer: Buffer) {
	return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let httpsAgent: HttpsAgent;
export async function getText(name: string, url: string): Promise<string> {
	if (!httpsAgent) httpsAgent = getHttpsAgent();
	const cacheName = encodeUrlSafeBase64(Buffer.from(url));
	const cacheFile = resolvePath(cacheDir, cacheName);
	if (existsSync(cacheFile) && httpCacheEnabled) {
		console.log(`Get http resource "${name}" from cache "${cacheName}"`);
		return readFileSync(cacheFile, 'utf8');
	}
	console.log(`Getting http resource "${name}" ...`);
	let response: AxiosResponse;
	try {
		response = await axios(url, { proxy: false, httpsAgent });
	} catch (error) {
		console.error(error);
		print.error(`Get http resource failed: ${error.message}`);
		return
	}
	const text = shouldBeValidTextResponse(name, response);
	writeFileSync(cacheFile, response.data);
	return text;
}


export function compressHTML(html: string): string {
	const compressor = require('html-minifier');
	return compressor.minify(html, {
		removeComments: true,
		collapseWhitespace: true,
	});
}

export function writeMultipleJSON(multiple: Array<[filePath: string, object: unknown]>) {
	return Promise.all(multiple.map(m => writeJSON(m[0], m[1])));
}

export function writeJSON(filePath: string, object: unknown) {
	return new Promise<void>((resolve, reject) => {
		writeFile(filePath, JSON.stringify(object, null, 2) + '\n', err =>
			err ? reject(err) : resolve());
	});
}

export function resolveURL(from: string, to: string) {
	const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
	if (resolvedUrl.protocol === 'resolve:') {
		// `from` is a relative URL.
		const { pathname, search, hash } = resolvedUrl;
		return pathname + search + hash;
	}
	return resolvedUrl.toString();
}

export function toMarkdown(html: string): string {
	return turndownService.turndown(html)
}


export class JsonFileWriter {
	stream: WriteStream;
	isFirst = true;

	constructor(filePath: string) {
		this.stream = createWriteStream(filePath);
		this.stream.write('[');
	}
	writeItem(item: unknown) {
		this.stream.write((this.isFirst ? '\n' : ',\n') + JSON.stringify(item));
		this.isFirst = false;
	}
	close() {
		this.stream.write('\n]');
		this.stream.close();
	}
}
