export type DirectiveDocs = {
	table: string;
	doc: string;
	module: string;
	link: string;
	name: string;
}
export type DirectiveItem = {
	name: string;
	syntax: string[],
	def: string;
	contexts: string[],
	desc: string;
	notes: string[],
	since: string;
	module: string;
}
export type VariableItem = {
	name: string;
	desc: string;
	module: string;
}
export type SnippetItem = {
	description: string;
	prefix: string;
	body: string;
}

export type LinkItem = [name: string, link: string, isVar: 0 | 1];
