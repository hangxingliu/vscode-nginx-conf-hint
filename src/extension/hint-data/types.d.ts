export type ExternalModuleName = 'js' | 'lua';

export type NginxDirective = {
	name: string;
	syntax: string[],
	def: string;
	contexts: string[],
	since: string;
	module: string;
	link: string;
	ci: { insert?: string; args?: string[] }
	exmod?: ExternalModuleName;
}
export type NginxDirectiveDetails = {
	name: string;
	notes: string[];
	markdown: string;
	html: string;
	table: string;
}

export type NginxVariable = {
	name: string;
	desc: string;
	module: string;
	link: string;
	since: string;
	ci?: unknown;
}
