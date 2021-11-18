import { readFileSync } from "fs";
import { NginxConfCursorContext, getNginxConfCursorContext } from "../../src/extension/parser";

const conf = readFileSync(__dirname + "/syntax1.conf", "utf8");

type UnitTest = [position: string, context: Partial<NginxConfCursorContext>];

const tests: UnitTest[] = [
	["1,2", { c: true }],
	["3,6", { list: ["serve"] }],
	["3,7", { list: ["server"] }],
	["3$", { context: "server" }],
	["6$", { context: "content_by_lua_block" }],
	["11^", { context: "location" }],
	["11$", { context: "server" }],
	["14,5", { lua: true, c: true }],
	["14,6", { lua: true, c: true }],
	["15$", { lua: true, c: true }],
	["16,9", { lua: true }],
	["16,10", { context: 'location' }],
];

let error = false;
for (let i = 0; i < tests.length; i++) {
	const [position, context] = tests[i];
	const pos = getPositionNumber(conf, position);
	const actual = getNginxConfCursorContext(conf.slice(0, pos));
	const keys = Object.keys(context);
	let matched = true;
	for (let j = 0; j < keys.length; j++) {
		const key = keys[j];
		if (Array.isArray(context[key])) matched = JSON.stringify(context[key]) === JSON.stringify(actual[key]);
		else matched = actual[key] === context[key];

		if (!matched) {
			console.error('=============================');
			console.error(`position ${position}(${pos}) test failed:`);
			console.error(`expected:`, context);
			console.error(`  actual:`, actual);
			console.error('=============================');
			error = true;
			break;
		}
	}
	if(matched)
		console.log(`  passed:`, position, JSON.stringify(actual));
}
if (error) process.exit(1);

function getPositionNumber(text: string, expression: string) {
	let lineNo = parseInt(expression.match(/^\d+/)[0], 10);
	let index = 0;
	while (--lineNo > 0) {
		const nextIndex = text.indexOf("\n", index);
		if (nextIndex < 0) break;
		index = nextIndex + 1;
	}
	if (expression.endsWith("$")) {
		let nextIndex = text.indexOf("\n", index);
		if (nextIndex < 0) nextIndex = text.length - 1;
		index = nextIndex;
	} else if (expression.endsWith("^")) {
		// noop
	} else {
		const incr = parseInt(expression.match(/[,;:](\d+)$/)[1], 10);
		index += incr - 1;
	}
	return index;
}
