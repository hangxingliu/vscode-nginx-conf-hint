import { window, ViewColumn, commands, Uri, workspace, TextDocumentContentProvider, ExtensionContext } from "vscode";
import { HTMLView } from "./html_view";
import { templateDirectiveContainer, templateDirectiveItem, templateVariables } from "./templates";
import type { DirectiveDocs } from "../types";

const schemeNginxDocument = 'nginx-doc';

let directivesDocItems: DirectiveDocs[] = []
	.concat(require('../../../hint_data/directives_document.json'))
	.concat(require('../../../hint_data/lua/directives_document.json'));
let variablesDocItems = []
	.concat(require('../../../hint_data/variables_document.json'))
	.concat(require('../../../hint_data/lua/variables_document.json'));

let mapVarName2Module = new Map<string, string>();
let mapVarName2VarId = new Map<string, string>();

const docsContentProvider = generateContentProvider();
const htmlView = new HTMLView(docsContentProvider);

export function getDocURI(type: 'directive' | 'variable', name: string): string {
	return `${schemeNginxDocument}://authority/nginx/${type}/${name}.html`;
}

function getViewColumnForNginxDocs() {
	let col = window.activeTextEditor
		? (window.activeTextEditor.viewColumn + 1)
		: ViewColumn.One;
	if (col > ViewColumn.Nine) col = ViewColumn.Nine;
	return col;
}

function openDocURI(uriString: string, title: string) {
	// since 1.33.0
	if (htmlView.supported)
		return htmlView.loadHTML(uriString, getViewColumnForNginxDocs(), `${title} - Nginx Docs`);
	return commands.executeCommand('vscode.previewHtml', Uri.parse(uriString));
}

function resolveDocumentObject(doc) {
	if (!doc || typeof doc !== 'object') return doc;
	const result = Object.assign({}, doc);
	const { link } = result;
	if (typeof link === 'string' && link) {
		if (!/^https?:\/\//i.test(link)) {
			if (link.startsWith('/')) result.link = `https://nginx.org${link}`;
			else result.link = `https://nginx.org/en/docs/${link}`;
		}
	}
	return result;
}

function generateDirectivesHTML(directiveName: string, docs: any[]): string {
	const items = docs.map((doc, i) => {
		const context = Object.assign({ index: i + 1 }, resolveDocumentObject(doc));
		return templateDirectiveItem(context);
	});

	let context = {
		name: directiveName,
		items: items.join('\n'),
		length: items.length == 1 ? '' : `[${items.length}]`
	};
	return templateDirectiveContainer(context);
}

function generateVariablesHTML(nginxModule: string) {
	return templateVariables(resolveDocumentObject(nginxModule));
}

function generateContentProvider() {
	const provider: TextDocumentContentProvider = {

		provideTextDocumentContent: (uri: Uri) => {
			// validate document uri
			let matched = uri.path.match(/nginx\/(\w+)\/(\w+)/);
			if (!matched || !matched[1] || !matched[2])
				return 'Invalid nginx document item!';

			let type = matched[1],
				name = matched[2];

			if (type == 'variable') {
				let modules = variablesDocItems.filter(it => it.module == name);
				return modules.length ? generateVariablesHTML(modules[0])
					: `Invalid nginx module ${name}`;

			} else if (type == 'directive') {
				let items = directivesDocItems.filter(it => it.name == name);
				return items.length ? generateDirectivesHTML(name, items)
					: `Invalid nginx directive ${name}`;
			}

			return `Invalid document type ${type}`;
		}
	};

	return provider;
}

export function initialize(context: ExtensionContext) {
	const { subscriptions } = context;

	for (let module of variablesDocItems) {
		for (let varName in module.vars) {
			mapVarName2VarId[varName] = module.vars[varName];
			mapVarName2Module[varName] = module.module;
		}
	}

	subscriptions.push(
		workspace.registerTextDocumentContentProvider(schemeNginxDocument, docsContentProvider));
	subscriptions.push(htmlView);
}

export function containsThisDirective(word = '') {
	if (!word) return false;
	for (let it of directivesDocItems)
		if (it.name == word)
			return true;
}
export function containsThisVariable(word = '') {
	return `$${word}` in mapVarName2VarId;
}

export function openDirectiveDoc(directiveName: string) {
	openDocURI(getDocURI(`directive`, directiveName), directiveName);
}

export function openVariableDoc(variableName: string) {
	variableName = `$${variableName}`;
	openDocURI(getDocURI(`variable`, mapVarName2Module[variableName])
		+ `#${mapVarName2VarId[variableName]}`, variableName);
}
