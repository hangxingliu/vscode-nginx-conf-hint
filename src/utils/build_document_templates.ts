#!/usr/bin/env node

import { resolve as resolvePath } from "path";
import { readFileSync, readdirSync, createWriteStream } from "fs";
import { docsTemplatesDir, docsTemplateTarget } from "./config";

const tab = '\t';

main();
function main() {
	const files = readdirSync(docsTemplatesDir, { withFileTypes: true }).filter(it => !it.name.startsWith('.') && /\.html$/.test(it.name) && it.isFile());

	const targetFile = createWriteStream(docsTemplateTarget);
	targetFile.write([
		'/* eslint-disable */',
		'///',
		"/// DON'T edit this file manually, it is generated from util scripts",
		'///',
		'',
		'',
	].join('\n'));
	for (let i = 0; i < files.length; i++) {
		const fileName = files[i].name;
		const absPath = resolvePath(docsTemplatesDir, fileName);

		const html = readFileSync(absPath, 'utf8');
		targetFile.write(resolveHTML(fileName.replace(/\..+$/, ''), html));
	}
	targetFile.close();
	console.log(`created '${docsTemplateTarget}' from ${files.length} HTML files`);
}

function resolveHTML(_name: string, html: string) {
	html = JSON.stringify(html)

	const templName = _name[0].toUpperCase() + _name.slice(1).replace(/_(\w)/g, (_, ch: string) => ch.toUpperCase());
	const types = [`export type Template${templName}Input = {\n`];
	const func = [
		`export function template${templName}(input: Template${templName}Input) {\n`,
		`${tab}return `
	];

	const inputNames = new Set<string>();
	func.push(
		html.replace(/\$\{(\w+?)\}/g, (_, name) => {
			if (!inputNames.has(name)) {
				types.push(`${tab}${name}: any;\n`);
				inputNames.add(name);
			}
			return `" + input.${name} +\n${tab}${tab}"`;
		})
	);
	types.push('};\n');
	func.push('\n}\n\n');
	return types.join('') + func.join('');
}
