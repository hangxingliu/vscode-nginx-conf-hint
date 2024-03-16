#!/usr/bin/env node
/// <reference types="node" />

const { resolve } = require("path");
const rimraf = require("rimraf");
const patterns = [
	".tsc",
	"out",
	// old generated files
	"src/extension/**/*.{js,map}",
	"src/utils/**/*.{js,map}",
];

process.chdir(resolve(__dirname, ".."));
console.log(`$ chdir '${process.cwd()}'`);

for (const pattern of patterns) {
	console.log(`$ rimraf '${pattern}'`);
	rimraf.sync(pattern, { glob: true });
}
