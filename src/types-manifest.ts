export const enum ManifestItemType {
	ModuleNames = 1,
	Directive = 2,
	Variable = 3,
	DirectiveDetails = 4,
	VariableDetails = 5,
	HttpReqHeader = 6,
	HttpResHeader = 7,
}

export type ManifestItemForModuleNames = [
	type: ManifestItemType.ModuleNames,
	/** @example "ngx_http_access_module" */
	...moduleNames: string[]
];

export type ManifestItemForDirective = [
	type: ManifestItemType.Directive,
	/** @example "accept_mutex" */
	directiveName: string,
	/** @example ["on | off"] */
	signature: string[],
	/** @example "accept_mutex off;" */
	def: string,
	/** @example ["events"] */
	contexts: string[],
	/** The index of its module name */
	moduleIndex: number,
	/** @example "1.9.11" */
	since: null | string,
	/** A uri to this directive's docs */
	link: string,
	completionItemPatch: null | { insert: string }
];

export type ManifestItemForVariable = [
	type: ManifestItemType.Variable,
	varName: `$${string}`,
	desc: string,
	/** The index of its module name */
	moduleIndex: number,
	/** @example "1.9.11" */
	since: null | string,
	/** A uri to this directive's docs */
	link: string,
	completionItemPatch: null | { insert: string }
];

export type ManifestItemForDirectiveDetails = [
	type: ManifestItemType.DirectiveDetails,
	name: string,
	markdown: string,
	html: string,
	nites: string,
	table: string
];
export type ManifestItemForVariableDetails = [
	//
	type: ManifestItemType.VariableDetails,
	docs: string
];

export type ManifestItemForHttpReqHeader = [
	//
	type: ManifestItemType.HttpReqHeader,
	name: string,
	description: string,
	example: string,
	standard: string | null,
];
export type ManifestItemForHttpResHeader = [
	//
	type: ManifestItemType.HttpResHeader,
	name: string,
	description: string,
	example: string,
	standard: string | null,
];

export function isManifestItemForModuleNames(row: unknown[]): row is ManifestItemForModuleNames {
	return row && row[0] === ManifestItemType.ModuleNames;
}
export function isManifestItemForDirective(row: unknown[]): row is ManifestItemForDirective {
	return row && row[0] === ManifestItemType.Directive;
}
export function isManifestItemForVariable(row: unknown[]): row is ManifestItemForVariable {
	return row && row[0] === ManifestItemType.Variable;
}
export function isManifestItemForDirectiveDetails(row: unknown[]): row is ManifestItemForDirectiveDetails {
	return row && row[0] === ManifestItemType.DirectiveDetails;
}
export function isManifestItemForVariableDetails(row: unknown[]): row is ManifestItemForVariableDetails {
	return row && row[0] === ManifestItemType.VariableDetails;
}
export function isManifestItemForHttpReqHeader(row: unknown[]): row is ManifestItemForHttpReqHeader {
	return row && row[0] === ManifestItemType.HttpReqHeader;
}
export function isManifestItemForHttpResHeader(row: unknown[]): row is ManifestItemForHttpResHeader {
	return row && row[0] === ManifestItemType.HttpResHeader;
}
