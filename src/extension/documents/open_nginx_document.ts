import { window, ViewColumn, commands, Uri, workspace, TextDocumentContentProvider, Disposable } from "vscode";
import { getModuleDetails, getMultiModuleDetails } from "../hint-data/details";
import { getNginxExternalDocsLink } from "../hint-data/link";
import { findManifestByName } from "../hint-data/manifest";
import { NginxDirective, NginxDirectiveDetails, NginxVariable } from "../hint-data/types";
import { HTMLView } from "./html_view";
import { templateDirectiveContainer, templateDirectiveItem, templateVariables } from "./templates";
import { getNginxDocsUri, nginxDocsScheme, NginxDocsType, parseNginxDocsUri } from "./utils";

const docsContentProvider = generateContentProvider();
const htmlView = new HTMLView(docsContentProvider);

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

function generateDirectivesHTML(
	directives: NginxDirective[],
	details: NginxDirectiveDetails[]
): string {
	const items = details.map((it, i) => {
		const context = {
			index: i + 1,
			module: directives[i].module,
			link: getNginxExternalDocsLink(directives[i]),
			html: it.html,
			table: it.table,
		};
		return templateDirectiveItem(context);
	});

	const context = {
		name: directives[0].name,
		items: items.join('\n'),
		length: items.length == 1 ? '' : `[${items.length}]`
	};
	return templateDirectiveContainer(context);
}

function generateVariablesHTML(moduleName: string, docsHTML: string) {
	return templateVariables({ module: moduleName, doc: docsHTML });
}

function generateContentProvider() {
	const provider: TextDocumentContentProvider = {

		provideTextDocumentContent: async (uri: Uri) => {
			// validate document uri
			const parsed = parseNginxDocsUri(uri);
			if (!parsed)
				return `Invalid nginx document uri "${uri.toString()}"`;

			const { type } = parsed;
			if (type === NginxDocsType.variable) {
				const variableName = parsed.name.replace(/^\$?/, '$');
				const variables = findManifestByName(variableName) as NginxVariable[];
				if (variables.length < 1) return `Unknown Nginx variable "${variableName}"`;

				const variable = variables[0];
				const nginxModule = await getModuleDetails(variable.module);
				if (!nginxModule) return `Unknown Nginx module "${variable.module}"`;

				return generateVariablesHTML(variable.module, nginxModule.varDocs);

			} else if (type == NginxDocsType.directive) {
				const directiveName = parsed.name;
				const directives = findManifestByName(directiveName) as NginxDirective[];
				if (directives.length < 1) return `Unknown Nginx directive "${directiveName}"`;

				const modules = await getMultiModuleDetails(directives.map(it => it.module));
				const directiveDetails = modules.filter(it => it).map(it => it.diretives.get(directiveName));
				return generateDirectivesHTML(directives, directiveDetails);

			}
			return `Invalid document type ${type}`;
		}
	};
	return provider;
}

export function initializeNginxDocument(disposable: Disposable[]) {
	disposable.push(
		workspace.registerTextDocumentContentProvider(nginxDocsScheme, docsContentProvider));
	disposable.push(htmlView);
}

export function openDirectiveDoc(directiveName: string) {
	openDocURI(getNginxDocsUri(NginxDocsType.directive, directiveName), directiveName);
}

export function openVariableDoc(variableName: string) {
	variableName = variableName.replace(/^\$/, '');
	const docsUri = getNginxDocsUri(NginxDocsType.variable, variableName);
	openDocURI(docsUri, variableName);
}
