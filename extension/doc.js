// This is module is not finished
const ENABLE_DOC_MODULE = false;

let vscode = require('vscode'),
	fs = require('fs');

const schemeNginxDocument = 'nginx-doc';
let template = fs.readFileSync(`${__dirname}/doc_template.txt`, 'utf8');
let directiveItems = [];

function activate(context, _directiveItems) {
	if (!ENABLE_DOC_MODULE) return;
	let subscriptions = context.subscriptions;
	directiveItems = _directiveItems;
	
	subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(schemeNginxDocument, {
			provideTextDocumentContent: (uri) => {
				let matched = uri.path.match(/nginx-document-(\w+)/);
				if (!matched || !matched[1]) return 'Invalid nginx document item!';
				let name = matched[1];
				return directiveItems.filter(it => it.name == name)
					.map(it => template.replace(/\$\{(\w+?)\}/g, (_, name) => it[name]))
					.join('\n\n');
			}
		}));
}

function getUri(directiveName) {
	return vscode.Uri.parse(`${schemeNginxDocument}://authority/nginx-document-${directiveName}.js`);
}

module.exports = {
	activate,
	getUri
};