import { createWriteStream } from "fs";
import { Writable } from "stream";
import { resolve as resolvePath } from "path";

import { syntax } from "./syntax";
import type { SyntaxPattern } from "./types";

const tab = '  ';
const escapeMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;'
};
const escapeRegexp = /[&<>]/g
const escapeCharFn = (ch: string) => escapeMap[ch] || ch;
const captureKeys: Array<keyof SyntaxPattern> = [
	'captures',
	'beginCaptures',
	'endCaptures',
]

export const targetFile = resolvePath(__dirname, 'nginx.tmLanguage');

main();
export function main() {
	const stream = createWriteStream(targetFile);
	generate(stream);
	stream.close();
	console.log(`created '${targetFile}'`);
}

export function generate(file: Writable) {
	let currentTab = '';
	const indent = () => currentTab += tab;
	const outdent = () => currentTab = currentTab.slice(0, currentTab.length - tab.length);
	const write = (input: string | string[], indentType: (-1 | 0 | 1) = 0) => {
		if (indentType < 0) outdent();
		if (Array.isArray(input)) input = input.join('\n');
		input = input.split('\n').map(it => `${currentTab}${it}`).join('\n') + '\n';
		file.write(input);
		if (indentType > 0) indent();
	}


	write([
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
		'<plist version="1.0">',
		'<dict>',
	], 1);
	write(
		keyTag('fileTypes', 'array',
			syntax.fileTypes.map(it => tag('string', it))))
	write(keyTag('foldingStartMarker', 'string', syntax.foldingStartMarker))
	write(keyTag('foldingStopMarker', 'string', syntax.foldingStopMarker))
	write(keyTag('keyEquivalent', 'string', syntax.keyEquivalent))
	write(keyTag('name', 'string', syntax.name))

	//#region patterns
	const patterns: SyntaxPattern[] = [];
	syntax.patterns.forEach(it => Array.isArray(it)
		? it.forEach(nested => nested && patterns.push(nested))
		: (it && patterns.push(it)));
	writePatterns(patterns);
	//#endregion patterns

	//#region repository
	const repoKeys = Object.keys(syntax.repository);
	write(tag('key', 'repository'));
	write('<dict>', 1)
	for (let i = 0; i < repoKeys.length; i++) {
		const key = repoKeys[i];
		const rule = syntax.repository[key];
		write(tag('key', key));
		write('<dict>', 1)
		writePatterns(rule.patterns);
		write('</dict>', -1)
	}
	write('</dict>', -1)
	//#endregion repository

	write(keyTag('scopeName', 'string', syntax.scopeName))
	write(keyTag('uuid', 'string', syntax.uuid))
	write([
		'</dict>',
		'</plist>'
	], -1)

	function writePatterns(patterns: SyntaxPattern[]) {
		write(tag('key', 'patterns'))
		write('<array>', 1)
		for (let i = 0; i < patterns.length; i++) {
			const pattern = patterns[i];
			write('<dict>', 1)
			if (pattern.comment)
				write(`<!-- ${pattern.comment.replace(escapeRegexp, escapeCharFn)} -->`);
			if (pattern.include) {
				write(keyTag('include', 'string', pattern.include));
				write('</dict>', -1)
				continue;
			}

			if (pattern.name) write(keyTag('name', 'string', pattern.name));
			if (pattern.begin) write(keyTag('begin', 'string', pattern.begin));
			if (pattern.end) write(keyTag('end', 'string', pattern.end));
			if (pattern.match)
				write(keyTag('match', 'string', pattern.match))

			captureKeys.forEach(key => {
				if (!pattern[key]) return;
				write(tag('key', key))
				write('<dict>', 1)
				const captures = pattern[key];
				const capKeys = Object.keys(captures);
				for (let j = 0; j < capKeys.length; j++) {
					const capKey = capKeys[j];
					let cap = captures[capKey];
					if (typeof cap === 'string')
						cap = { name: cap };
					write(keyTag(capKey, 'dict',
						keyTag('name', 'string', cap.name)));
				}
				write('</dict>', -1)
			});

			if (pattern.contentName)
				write(keyTag('contentName', 'string', pattern.contentName));
			if (pattern.patterns)
				writePatterns(pattern.patterns);
			write('</dict>', -1)
		}
		write('</array>', -1)
	}
	function keyTag(key: string, ...args: Parameters<typeof tag>) {
		return [tag('key', key), tag(...args)];
	}
	function tag(
		tagName: 'dict' | 'array' | 'key' | 'string',
		content: string | number | RegExp | Array<string | number | RegExp>
	) {
		if (!Array.isArray(content))
			content = [content];
		content = content.map(it => {
			if (Object.prototype.toString.call(it) === '[object RegExp]') {
				it = String(it);
				it = it.slice(1, it.length - 1);
				return it.replace(escapeRegexp, escapeCharFn);
			} else if (typeof it !== 'string') {
				return String(it);
			}
			return it;
		});
		content = content.join('\n')
		if (content.indexOf('\n') >= 0)
			content = '\n' + content.split('\n').map(it => `${tab}${it}`).join('\n') + '\n';
		return `<${tagName}>${content}</${tagName}>`;
	}
}
