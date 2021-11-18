#!/usr/bin/env node

import { getText, initHttpCache, JsonFileWriter, loadHtml, print } from "./helper";
import { mediaTypeFile, mediaTypesURL } from "./config";

main().catch(print.error)
async function main() {
	initHttpCache();
	const html = await getText('Media Types', mediaTypesURL)
	const $ = loadHtml(html);

	const streams: { [x: string]: JsonFileWriter } = {};
	const $links = $('table tr td:nth-child(2) a');
	console.log(`found ${$links.length} media types`)

	for (let i = 0, i2 = $links.length; i < i2; i++) {
		const $link = $links.eq(i);
		const mediaType = $link.text().trim();
		const mtx = mediaType.match(/^(\w+)\/([\w\.\-+]+)$/);
		if (!mtx) return print.error(`$links[${i}] is invalid media type "${$link.text()}"`);

		const $name = $link.parents('tr').children('td:nth-child(1)')
		const mediaTypeName = $name.text().trim();
		if(!mediaTypeName) return print.error(`$links[${i}] is invalid media type "${$name.text()}"`);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, prefix, suffix] = mtx;
		let stream = streams[prefix];
		if (!stream) {
			stream = new JsonFileWriter(mediaTypeFile(prefix));
			streams[prefix] = stream;
			console.log(`new mime type prefix: "${prefix}"`);
		}
		if (suffix === mediaTypeName) stream.writeItem([suffix]);
		else stream.writeItem([suffix, mediaTypeName]);
	}

	Object.keys(streams).forEach(it => streams[it].close());
}
