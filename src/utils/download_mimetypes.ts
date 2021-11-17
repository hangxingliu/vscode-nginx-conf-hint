#!/usr/bin/env node

import { getText, initHttpCache, JsonFileWriter, loadHtml, print } from "./helper";
import { mimeTypeFile, mimeTypesURL } from "./config";

main().catch(print.error)
async function main() {
	initHttpCache();
	const html = await getText('Media Types', mimeTypesURL)
	const $ = loadHtml(html);

	const streams: { [x: string]: JsonFileWriter } = {};
	const $links = $('table tr td:nth-child(2) a');
	console.log(`found ${$links.length} mimetypes`)

	for (let i = 0, i2 = $links.length; i < i2; i++) {
		const $link = $links.eq(i);
		const mimeType = $link.text().trim();
		const mtx = mimeType.match(/^(\w+)\/([\w\.\-+]+)$/);
		if (!mtx) return print.error(`$links[${i}] is invalid mimetype "${$link.text()}"`);

		const $name = $link.parents('tr').children('td:nth-child(1)')
		const mimeTypeName = $name.text().trim();
		if(!mimeTypeName) return print.error(`$links[${i}] is invalid mimetype "${$name.text()}"`);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, prefix, suffix] = mtx;
		let stream = streams[prefix];
		if (!stream) {
			stream = new JsonFileWriter(mimeTypeFile(prefix));
			streams[prefix] = stream;
			console.log(`new mime type prefix: "${prefix}"`);
		}
		if (suffix === mimeTypeName) stream.writeItem([suffix]);
		else stream.writeItem([suffix, mimeTypeName]);
	}

	Object.keys(streams).forEach(it => streams[it].close());
}
