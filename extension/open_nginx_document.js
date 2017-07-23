let vscode = require('vscode'),
	fs = require('fs');

const schemeNginxDocument = 'nginx-doc';
const templatesFolder = `${__dirname}/document_templates/`;

const DIRECTIVES_DOC_FILE = `${__dirname}/../hint_data/directives_document.json`;
const VARIABLES_DOC_FILE = `${__dirname}/../hint_data/variables_document.json`;

let templates = {};
let directivesDocItems = [];
let variablesDocItems = [],
	mapVarName2Module = {},
	mapVarName2VarId = {};

let openURI = uri => vscode.commands.executeCommand('vscode.previewHtml', vscode.Uri.parse(uri)),
	getDocURI = (type, name) => `${schemeNginxDocument}://authority/nginx/${type}/${name}.html`;

function loadTemplates() {
	fs.readdirSync(templatesFolder)
		.filter(fname => fname.endsWith('.html'))
		.forEach(fname =>
			templates[fname.replace('.html', '')] =
				fs.readFileSync(templatesFolder + fname, 'utf8'));
}

/**
 * @param {string} directiveName 
 * @param {Array<object>} docs
 * @returns {string}
 */
function generateDirectivesHTML(directiveName, docs) {
	let items = docs.map((directive,index) =>
		templates.directive_item.replace(/\$\{(\w+?)\}/g, (_, name) =>
			name == 'index' ? (index+1) : directive[name]));
	let context = {
		name: directiveName,
		items: items.join('\n'),
		length: items.length == 1 ? '' : `[${items.length}]`
	};
	return templates.directive_container.replace(/\$\{(\w+?)\}/g, (_, name) => context[name]);
}
function generateVariablesHTML(module) {
	return templates.variables.replace(/\$\{(\w+?)\}/g, (_, name) => module[name]);
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

	loadTemplates();

	subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(schemeNginxDocument, {
			provideTextDocumentContent: (uri) => {
				let matched = uri.path.match(/nginx\/(\w+)\/(\w+)/);
				if (!matched || !matched[1] || !matched[2])
					return 'Invalid nginx document item!';
				let type = matched[1];
				let name = matched[2];
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