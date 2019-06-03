//@ts-check
/// <reference path="../../vscode.d.ts" />

const vscode = require('vscode');
const url = require('url');
const path = require('path');
const extension = require('../vscode_helper');
const { HTMLView } = require('./html_view');
const { Templates } = require('./templates');
const { resolve } = path;


const schemeNginxDocument = 'nginx-doc';

const hintDataDir = resolve(__dirname, '..', '..', 'hint_data');
const hintDataLuaDir = resolve(hintDataDir, 'lua');

const DIRECTIVES_DOC_FILES = [
	resolve(hintDataDir, `directives_document.json`),
	resolve(hintDataLuaDir, `directives_document.json`),
];
const VARIABLES_DOC_FILES = [
	resolve(hintDataDir, `variables_document.json`),
	resolve(hintDataLuaDir, `variables_document.json`),
];


let directivesDocItems = [];
let variablesDocItems = [];
let mapVarName2Module = {};
let mapVarName2VarId = {};

const docsContentProvider = generateContentProvider();
const htmlView = new HTMLView(docsContentProvider);
const templates = new Templates(extension.showErrorMessage);

/**
 * @param {string} type
 * @param {string} name
 */
function getDocURI(type, name) {
	return `${schemeNginxDocument}://authority/nginx/${type}/${name}.html`;
}

function getViewColumnForDoc() {
	return vscode.window.activeTextEditor
		? vscode.window.activeTextEditor.viewColumn
		: vscode.ViewColumn.One;
}

function openDocURI(uriString, title) {
	// since 1.33.0
	if (htmlView.supported)
		return htmlView.loadHTML(uriString, getViewColumnForDoc(), `${title} - Nginx Docs`);
	return vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.parse(uriString));
}

function resolveDocumentObject(doc) {
	if (!doc || typeof doc !== 'object') return doc;
	const result = Object.assign({}, doc);
	const { link } = result;
	if (typeof link === 'string' && link) {
		if (!/^https?:\/\//i.test(link))
			result.link = url.resolve('https://nginx.org/en/docs/', link);
	}
	return result;
}

/**
 * @param {string} directiveName
 * @param {Array<object>} docs
 * @returns {string}
 */
function generateDirectivesHTML(directiveName, docs) {
	const items = docs.map((doc, i) => {
		const context = Object.assign({ index: i + 1 }, resolveDocumentObject(doc));
		return templates.render('directive_item', context);
	});

	let context = {
		name: directiveName,
		items: items.join('\n'),
		length: items.length == 1 ? '' : `[${items.length}]`
	};
	return templates.render('directive_container', context);
}

function generateVariablesHTML(nginxModule) {
	return templates.render('variables', resolveDocumentObject(nginxModule));
}

function generateContentProvider() {
	/** @type {vscode.TextDocumentContentProvider} */
	const provider = {
		provideTextDocumentContent: (uri) => {
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

function initialize(context) {
	const { subscriptions } = context;

	directivesDocItems = [].concat.apply([], DIRECTIVES_DOC_FILES.map(it => require(it)));
	variablesDocItems = [].concat.apply([], VARIABLES_DOC_FILES.map(it => require(it)));

	for(let module of variablesDocItems) {
		for (let varName in module.vars) {
			mapVarName2VarId[varName] = module.vars[varName];
			mapVarName2Module[varName] = module.module;
		}
	}

	templates.init();

	subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(schemeNginxDocument, docsContentProvider));
	subscriptions.push(htmlView);
}

function containsThisDirective(word = '') {
	if (!word) return false;
	for(let it of directivesDocItems)
		if (it.name == word)
			return true;
}
function containsThisVariable(word = '') {
	return `$${word}` in mapVarName2VarId;
}

function openDirectiveDoc(directiveName) {
	openDocURI(getDocURI(`directive`, directiveName), directiveName);
}
function openVariableDoc(variableName) {
	variableName = `$${variableName}`;
	openDocURI(getDocURI(`variable`, mapVarName2Module[variableName])
		+ `#${mapVarName2VarId[variableName]}`, variableName);
}


module.exports = {
	initialize,
	openDirectiveDoc,
	openVariableDoc,
	containsThisDirective,
	containsThisVariable
};
