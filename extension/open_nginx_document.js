//@ts-check
/// <reference path="../vscode.d.ts" />

let vscode = require('vscode'),
	fs = require('fs'),
	extension = require('./vscode_helper');

const schemeNginxDocument = 'nginx-doc';
const templatesFolder = `${__dirname}/document_templates/`;

const DIRECTIVES_DOC_FILE = `${__dirname}/../hint_data/directives_document.json`;
const VARIABLES_DOC_FILE = `${__dirname}/../hint_data/variables_document.json`;

const UNAVAILABLE = 'This document is unavailable now, please reopen this document';
let templates = {
	directive_item: UNAVAILABLE,
	directive_container: UNAVAILABLE,
	variables: UNAVAILABLE,
};

let directivesDocItems = [];
let variablesDocItems = [],
	mapVarName2Module = {},
	mapVarName2VarId = {};

let openURI = uri => vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.parse(uri)),
	getDocURI = (type, name) => `${schemeNginxDocument}://authority/nginx/${type}/${name}.html`;

/**
 * Load templates HTML content string into `templates` map
 */
function loadTemplatesAsync() {
	Promise.all(Object.keys(templates).map(key => read(key)))
		.catch(error => extension.showErrorMessage(`Could not load document template!\n` +
			`${error.message || error}`));

	function read(name) {
		let filePath = templatesFolder + name + '.html';
		return new Promise((resolve, reject) =>
			fs.readFile(filePath, {encoding: 'utf8'},  (err, content) => {
				if (err) return reject(err);
				templates[name] = content;
				return resolve(true);
			}));
	}
}

/**
 *
 * @param {"directive_item" |"directive_container" |"variables"} name
 * @param {{[name: string]: any}} variables
 */
function renderTemplate(name, variables) {
	return templates[name].replace(/\$\{(\w+?)\}/g, (_, name) => variables[name]);
}

/**
 * @param {string} directiveName
 * @param {Array<object>} docs
 * @returns {string}
 */
function generateDirectivesHTML(directiveName, docs) {
	let items = docs.map((doc, i) =>
		renderTemplate('directive_item', Object.assign({ index: i + 1 }, doc)));

	let context = {
		name: directiveName,
		items: items.join('\n'),
		length: items.length == 1 ? '' : `[${items.length}]`
	};
	return renderTemplate('directive_container', context);
}
function generateVariablesHTML(nginxModule) {
	return renderTemplate('variables', nginxModule);
}


function initialize(context) {
	let subscriptions = context.subscriptions;

	directivesDocItems = require(DIRECTIVES_DOC_FILE);
	variablesDocItems = require(VARIABLES_DOC_FILE);

	for(let module of variablesDocItems) {
		for (let varName in module.vars) {
			mapVarName2VarId[varName] = module.vars[varName];
			mapVarName2Module[varName] = module.module;
		}
	}

	loadTemplatesAsync();

	subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(schemeNginxDocument, {
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
		}));
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
	openURI(getDocURI(`directive`, directiveName));
}
function openVariableDoc(variableName) {
	variableName = `$${variableName}`;
	openURI(getDocURI(`variable`, mapVarName2Module[variableName])
		+ `#${mapVarName2VarId[variableName]}`);
}


module.exports = {
	initialize,
	openDirectiveDoc,
	openVariableDoc,
	containsThisDirective,
	containsThisVariable
};
