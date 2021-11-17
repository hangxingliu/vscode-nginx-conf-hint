#!/usr/bin/env node

import { getText, print } from "./helper";
import { syntaxFiles, syntaxURLs } from "./config";
import { writeFileSync } from "fs";

main();
async function main() {
	await Promise.all([
		download('original'),
		download('sublime')
	]).then(() => {
		print.ok('downloaded syntaxes')
	}).catch(error => {
		print.error(error.message);
	})
}

async function download(syntaxName: keyof typeof syntaxURLs) {
	const url = syntaxURLs[syntaxName];
	const targetFiles = [syntaxFiles[syntaxName]];
	let text = await getText(`${syntaxName} syntax`, url);
	text = text.replace('?>', `?>\n<!-- vscode-nginx-conf-hint { syntax-type: ${syntaxName} }  -->`)
	for (let i = 0; i < targetFiles.length; i++)
		writeFileSync(targetFiles[i], text);
}
