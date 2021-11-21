import { URL } from "url";
import { Cheerio, Element } from "cheerio";
import { httpHeadersWikiURLs, manifestFiles, ManifestItemType } from "./config";
import {
	bold,
	getText,
	initHttpCache,
	JsonFileWriter,
	lengthShouldBeEqual,
	lengthShouldBeMoreThanOrEqual,
	loadHtml,
	print,
	toMarkdown,
} from "./helper";

main().catch((error) => print.error(error.stack));
async function main() {
	initHttpCache();

	// English
	{
		const baseUrl = httpHeadersWikiURLs.en;
		const output = new JsonFileWriter(manifestFiles.httpHeaders("en"));
		const html = await getText("english wikipedia", baseUrl);
		const $ = loadHtml(html);
		const handleEnglishRow = ($row: Cheerio<Element>, type: ManifestItemType) => {
			const $cols = $row.find("td");
			if ($cols.length === 0) return;
			const headerNames = normalizeHeaderName($cols.eq(0).text());
			const description = getDescriptionMarkdown($cols.eq(1), baseUrl);
			if (!description) print.warning(`header ${headerNames[0]} has no description`);
			const example: string[] = [];
			const $example = $cols.eq(2).find("code");
			lengthShouldBeMoreThanOrEqual(`example code of "${headerNames[0]}"`, $example, 1);
			$example.each((i, el) => {
				const code = $(el).text().trim();
				example.push(code);
			});
			const moreInfo = [];
			if ($cols.length > 3) {
				const status = normalizeStatus($cols.eq(3).text());
				moreInfo.push(status);
			}
			for (let j = 0; j < headerNames.length; j++) {
				const headerName = headerNames[j];
				output.writeItem(
					j === 0 ? [type, headerName, description, example, ...moreInfo] : [type, headerName, -1]
				);
			}
		};

		const $reqH2 = $("h2 #Request_fields");
		lengthShouldBeEqual("request fields h2", $reqH2, 1);
		let $tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("request fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpReqHeader);
			}
		}

		const $resH2 = $("h2 #Response_fields");
		lengthShouldBeEqual("response fields h2", $resH2, 1);
		$tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("response fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpResHeader);
			}
		}
		output.close();
	}

	// zh-Hans
	{
		const baseUrl = httpHeadersWikiURLs["zh-Hans"];
		const output = new JsonFileWriter(manifestFiles.httpHeaders("zh-Hans"));
		const html = await getText("zh-Hans wikipedia", baseUrl);
		const $ = loadHtml(html);
		const handleEnglishRow = ($row: Cheerio<Element>, type: ManifestItemType) => {
			const $cols = $row.find("td");
			if ($cols.length === 0) return;
			const headerNames = normalizeHeaderName($cols.eq(0).text());
			const description = getDescriptionMarkdown($cols.eq(1), baseUrl);
			if (!description) print.warning(`header ${headerNames[0]} has no description`);
			for (let j = 0; j < headerNames.length; j++) {
				const headerName = headerNames[j];
				output.writeItem(j === 0 ? [type, headerName, description] : [type, headerName, -1]);
			}
		};

		const $reqH2 = $("h2 #请求字段");
		lengthShouldBeEqual("request fields h2", $reqH2, 1);
		let $tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("request fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpReqHeader);
			}
		}

		const $resH2 = $("h2 #回应字段");
		lengthShouldBeEqual("response fields h2", $resH2, 1);
		$tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("response fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpResHeader);
			}
		}
		output.close();
	}

	// zh-Hant-TW
	{
		const baseUrl = httpHeadersWikiURLs["zh-Hant-TW"];
		const output = new JsonFileWriter(manifestFiles.httpHeaders("zh-Hant-TW"));
		const html = await getText("zh-Hant-TW wikipedia", baseUrl);
		const $ = loadHtml(html);
		const handleEnglishRow = ($row: Cheerio<Element>, type: ManifestItemType) => {
			const $cols = $row.find("td");
			if ($cols.length === 0) return;
			const headerNames = normalizeHeaderName($cols.eq(0).text());
			const description = getDescriptionMarkdown($cols.eq(1), baseUrl);
			if (!description) print.warning(`header ${headerNames[0]} has no description`);
			for (let j = 0; j < headerNames.length; j++) {
				const headerName = headerNames[j];
				output.writeItem(j === 0 ? [type, headerName, description] : [type, headerName, -1]);
			}
		};

		const $reqH2 = $("h2 #请求字段");
		lengthShouldBeEqual("request fields h2", $reqH2, 1);
		let $tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("request fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpReqHeader);
			}
		}

		const $resH2 = $("h2 #回应字段");
		lengthShouldBeEqual("response fields h2", $resH2, 1);
		$tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("response fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpResHeader);
			}
		}
		output.close();
	}

	// zh-Hant-HK
	{
		const baseUrl = httpHeadersWikiURLs["zh-Hant-HK"];
		const output = new JsonFileWriter(manifestFiles.httpHeaders("zh-Hant-HK"));
		const html = await getText("zh-Hant-HK wikipedia", baseUrl);
		const $ = loadHtml(html);
		const handleEnglishRow = ($row: Cheerio<Element>, type: ManifestItemType) => {
			const $cols = $row.find("td");
			if ($cols.length === 0) return;
			const headerNames = normalizeHeaderName($cols.eq(0).text());
			const description = getDescriptionMarkdown($cols.eq(1), baseUrl);
			if (!description) print.warning(`header ${headerNames[0]} has no description`);
			for (let j = 0; j < headerNames.length; j++) {
				const headerName = headerNames[j];
				output.writeItem(j === 0 ? [type, headerName, description] : [type, headerName, -1]);
			}
		};

		const $reqH2 = $("h2 #请求字段");
		lengthShouldBeEqual("request fields h2", $reqH2, 1);
		let $tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("request fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpReqHeader);
			}
		}

		const $resH2 = $("h2 #回应字段");
		lengthShouldBeEqual("response fields h2", $resH2, 1);
		$tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("response fields table", $tables, 2);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpResHeader);
			}
		}
		output.close();
	}

	// es
	{
		const baseUrl = httpHeadersWikiURLs.es;
		const output = new JsonFileWriter(manifestFiles.httpHeaders("es"));
		const html = await getText("es", baseUrl);
		const $ = loadHtml(html);
		const handleEnglishRow = ($row: Cheerio<Element>, type: ManifestItemType) => {
			const $cols = $row.find("td");
			if ($cols.length === 0) return;
			const headerNames = normalizeHeaderName($cols.eq(0).text());
			const description = getDescriptionMarkdown($cols.eq(1), baseUrl);
			if (!description) print.warning(`header ${headerNames[0]} has no description`);
			for (let j = 0; j < headerNames.length; j++) {
				const headerName = headerNames[j];
				output.writeItem(j === 0 ? [type, headerName, description] : [type, headerName, -1]);
			}
		};

		const $reqH2 = $("h2 #Cabeceras_de_petición");
		lengthShouldBeEqual("request fields h2", $reqH2, 1);
		const $tables = getNextTables($reqH2.parent(), "h2");
		lengthShouldBeEqual("request fields table", $tables, 1);
		for (let i = 0; i < $tables.length; i++) {
			const $rows = $tables[i].find("tr");
			for (let row = 0; row < $rows.length; row++) {
				const $row = $rows.eq(row);
				handleEnglishRow($row, ManifestItemType.HttpReqHeader);
			}
		}
		output.close();
	}

	if (print.warnings) console.log(`Total warnings:   ${bold(print.warnings)}`);
}

function getDescriptionMarkdown($el: Cheerio<Element>, baseUrl: string) {
	const $links = $el.find("a");
	for (let i = 0; i < $links.length; i++) {
		const $link = $links.eq(i);
		const href = $link.attr("href");
		if (href) $link.attr("href", resolveURL(baseUrl, href));
	}
	return toMarkdown($el.html()).trim();
}
function resolveURL(from: string, to: string) {
	const resolvedUrl = new URL(to, new URL(from, "resolve://"));
	if (resolvedUrl.protocol === "resolve:") {
		// `from` is a relative URL.
		const { pathname, search, hash } = resolvedUrl;
		return pathname + search + hash;
	}
	return resolvedUrl.toString();
}

function getNextTables($el: Cheerio<Element>, endTag: string) {
	endTag = endTag.toUpperCase();
	let $ptr = $el.next();
	const $tables: Array<Cheerio<Element>> = [];
	while ($ptr.length === 1) {
		const tagName = $ptr[0].tagName.toUpperCase();
		if (tagName === endTag) break;
		else if (tagName === "TABLE") $tables.push($ptr);
		$ptr = $ptr.next();
	}
	return $tables;
}

function normalizeStatus(_status: string) {
	const status = _status.trim().toLowerCase();
	if (status.startsWith("obsolete")) return "Obsolete";
	if (status.startsWith("permanent")) return "Permanent";
	if (status.startsWith("provisional")) return "Provisional";
	if (status.startsWith("experimental")) return "Experimental";
	return print.error(`Invalid standard status ${JSON.stringify(_status)}`);
}

function normalizeHeaderName(_name: string) {
	// remove foot notes
	const names = _name
		.replace(/\[\w+]/g, "")
		.split(/[,;]/)
		.map((it) => it.trim())
		.filter((it) => it);
	for (let i = 0; i < names.length; i++)
		if (!/^[\w\-]+$/.test(names[i])) return print.error(`Invalid http header name ${JSON.stringify(_name)}`);
	return names;
}
