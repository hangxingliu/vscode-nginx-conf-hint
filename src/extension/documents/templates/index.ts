/* eslint-disable */
///
/// DON'T edit this file manually, it is generated from util scripts
///

export type TemplateDirectiveContainerInput = {
	name: any;
	length: any;
	items: any;
};
export function templateDirectiveContainer(input: TemplateDirectiveContainerInput) {
	return "<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<meta charset=\"UTF-8\" />\n\t\t<title>nginx directive: " + input.name +
		"</title>\n\t\t<style type=\"text/css\">\n\t\t\tbody {line-height: 1.4em;}\n\t\t\th1, h2, h3 {font-weight: 100}\n\t\t\th1 small {font-size: 60%}\n\t\t\th2 small {font-size: 80%}\n\n\t\t\t.directive {margin: 1em 1em 1em 0;padding: .7em .7em .7em 1em;}\n\t\t\t.vscode-light .directive{\n\t\t\t\tborder-top: 2px solid rgba(0, 0, 0, .2);\n\t\t\t\tbackground: rgba(0,0,0,.1);\n\t\t\t}\n\t\t\t.vscode-dark .directive{\n\t\t\t\tborder-top: 2px solid rgba(255, 255, 255, .2);\n\t\t\t\tbackground: rgba(255,255,255,.1);\n\t\t\t}\n\t\t\t/*.vscode-high-contrast .directive{}*/\n\n\t\t\t.directive th,\n\t\t\t.directive td {vertical-align: baseline;}\n\t\t\t.directive th {padding-right: .5em;text-align: left;}\n\n\t\t\tblockquote {margin: 1em ;padding: .5em 0 .5em .5em;}\n\t\t\tblockquote.note {\n\t\t\t\tborder: 2px dotted rgba(0, 0, 0, .2);\n\t\t\t\tline-height: 1.2em;\n\t\t\t\ttext-align: justify;\n\t\t\t}\n\t\t\tblockquote.example {\n\t\t\t\tborder-left: 2px solid rgba(0, 0, 0, .2);\n\t\t\t\tpadding: 0 0 0 .5em;\n\t\t\t}\n\n\t\t\tdl dt {margin: .5em 0 .2em 0;}\n\t\t</style>\n\t</head>\n\n\t<body>\n\t\t<h1><strong>" + input.name +
		"</strong> <small>" + input.length +
		" (Nginx Directive) </small></h1>\n\t\t<br/>\n\t\t" + input.items +
		"\n\t</body>\n</html>\n"
}

export type TemplateDirectiveItemInput = {
	index: any;
	module: any;
	link: any;
	table: any;
	html: any;
};
export function templateDirectiveItem(input: TemplateDirectiveItemInput) {
	return "<h2><small>(" + input.index +
		")</small> " + input.module +
		"</h2>\n<a href=\"" + input.link +
		"\">Open in browser</a>\n<div class=\"directive\">\n\t" + input.table +
		"\n</div>\n" + input.html +
		"\n<hr/>\n<br/>\n"
}

export type TemplateVariablesInput = {
	module: any;
	doc: any;
};
export function templateVariables(input: TemplateVariablesInput) {
	return "<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<meta charset=\"UTF-8\" />\n\t\t<title>nginx module: " + input.module +
		"</title>\n\t\t<style type=\"text/css\">\n\t\t\tbody {line-height: 1.4em;}\n\t\t\th1, h2, h3 {font-weight: 100}\n\t\t\th1 small {font-size: 60%}\n\t\t\tdl dt {\n\t\t\t\tmargin: .5em 0 .2em 0;\n\t\t\t\tfont-size: 120%;\n\t\t\t\tfont-weight: 120;\n\t\t\t}\n\t\t</style>\n\t</head>\n\n\t<body>\n\t\t<h1><strong>" + input.module +
		"</strong> <small>Embedded Variables</small></h1>\n\t\t" + input.doc +
		"\n\t</body>\n</html>\n"
}

