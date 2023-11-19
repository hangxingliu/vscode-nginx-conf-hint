export type ExternalModuleName = 'js' | 'lua';

export const enum HttpHeaderType {
	none = 0,
	request = 1, // 01
	response = 2, // 10
	both = 3, // 11
}

export type HttpHeaderInfo = {
	name: string;
	lowercase: string;
	type: HttpHeaderType;
	example: string[];
	markdown: string;
	standard?: string;
}

export type NginxDirective = {
	name: string;
	filters: string[];
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
