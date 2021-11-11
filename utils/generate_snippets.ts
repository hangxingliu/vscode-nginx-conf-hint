#!/usr/bin/env node

import { print, writeJSON } from "./helper";
import { hintDataFiles } from "./config";
import type { DirectiveItem } from "../extension/types";

main();
function main() {
	const directives: DirectiveItem[] = require(hintDataFiles.directives);
	const allContextBlocks = new Set<string>();
	for (let i = 0; i < directives.length; i++) {
		const { contexts } = directives[i];
		for (let j = 0; j < contexts.length; j++) {
			allContextBlocks.add(contexts[j]);
		}
	}
	const snippets: any = {};
	allContextBlocks.forEach(context => {
		if (context === 'any' || context === 'main') return;
		snippets[`Block ${context}`] = {
			prefix: context,
			body: `${context} {\n\t$0\n}`,
		}
	});
	const addtionalSnippets = require('../src/additonal_snippets/nginx');
	Object.assign(snippets, addtionalSnippets);
	writeJSON(hintDataFiles.snippets, snippets);
	print.ok(`writed ${Object.keys(snippets).length} snippets`)
}

