import { names } from "./match-names";
import { includeRepo } from "./repository";
import { ManifestItemType } from "../extension/hint-data/enum";
import type { SyntaxPattern } from "./types";

const commonDirectiveNames = new Set<string>();
const _directives: Array<unknown[]> = [
	...require('../../assets/manifest/core.json'),
	...require('../../assets/manifest/js.json'),
	// ...require('../../assets/manifest/lua.json'),
]
_directives.forEach(it => it[0] === ManifestItemType.Directive && commonDirectiveNames.add(String(it[1])));

const blockDirectives = [
	'events',
	'http',
	'mail',
	'stream',
	'server',
	'location',
	'limit_except',
	'if',
	'upstream',
	'types',
	'map',
];
blockDirectives.forEach(it => commonDirectiveNames.delete(it));

const noBodyDirectives = _directives.filter(it => {
	if (it[0] !== ManifestItemType.Directive) return false;
	const syntax = it[2] as string[];
	if (syntax.length !== 1) return false;
	const s = syntax[0].replace(/\s+/g, '')
	return s === "";
}).map(it => String(it[1]));
noBodyDirectives.forEach(it => commonDirectiveNames.delete(it));


const skipDirectives = [
	'return',
	'rewrite',
];
skipDirectives.forEach(it => commonDirectiveNames.delete(it));

const directivesGroupBy = Array.from(groupByPrefix(Array.from(commonDirectiveNames)).entries());

const commentPattern: SyntaxPattern = { match: /\#.*/, name: names.comment, }

/**
 * @see https://macromates.com/manual/en/language_grammars
 *
 * this is an array with the actual rules used to parse the document. In this example there are two rules (line 6-8 and 9-17). Rules will be explained in the next section.
 */
export const syntaxPatterns: Array<SyntaxPattern | SyntaxPattern[]> = [
	commentPattern,
	// support OpenResty
	{
		name: names.meta.context('lua'),
		begin: /\b((?:content|rewrite|access|init_worker|init|set|log|balancer|ssl_(?:client_hello|session_fetch|certificate))_by_lua(?:_block)?)\s*\{/,
		end: /\}/,
		beginCaptures: {
			'1': names.contextDirective,
		},
		contentName: names.embedded.lua,
		patterns: [{ include: 'source.lua' }],
	},
	{
		name: names.meta.context('lua'),
		begin: /\b((?:content|rewrite|access|init_worker|init|set|log|balancer|ssl_(?:client_hello|session_fetch|certificate))_by_lua)\s*'/,
		end: /'/,
		beginCaptures: {
			'1': names.contextDirective,
		},
		contentName: names.embedded.lua,
		patterns: [{ include: 'source.lua' }],
	},
	...blockDirectives.map((it): SyntaxPattern | SyntaxPattern[] => {
		switch (it) {
			case 'location': {
				// expaned patterns for 'location'
				// Syntax:	location [ = | ~ | ~* | ^~ ] uri { ... }
				// location @name { ... }
				// Default:	—
				// Context:	server, location
				const name = names.meta.context(it);
				return [{
					name,
					begin: /\b(location) +([\^]?~[\*]?|=) +(.*?)\{/,
					end: /\}/,
					beginCaptures: {
						'1': names.contextDirective,
						'2': names.operator,
						'3': names.string.regexp,
					},
					patterns: [{ include: '$self' }],
				},
				{
					name,
					begin: /\b(location) +(.*?)\{/,
					end: /\}/,
					beginCaptures: {
						'1': names.contextDirective,
						'2': names.entityName.context,
					},
					patterns: [{ include: '$self' }],
				}];
			}
			case 'upstream': {
				return {
					name: names.meta.context(it),
					begin: /\b(upstream) +(.*?)\{/,
					end: /\}/,
					beginCaptures: {
						'1': names.contextDirective,
						'2': names.entityName.context,
					},
					patterns: [{ include: '$self' }],
				}
			}
			case 'if': {
				return {
					name: names.meta.context(it),
					begin: /\b(if) +\(/,
					end: /\)/,
					beginCaptures: {
						'1': names.controlKeyword,
					},
					patterns: [{ include: includeRepo.if_condition }],
				}
			}
			case 'map': {
				return {
					name: names.meta.context(it),
					/** map $http_user_agent $mobile { */
					begin: /\b(map) +(\$)([A-Za-z0-9\_]+) +(\$)([A-Za-z0-9\_]+) *\{/,
					end: /\}/,
					beginCaptures: {
						'1': names.contextDirective,
						'2': names.$,
						'3': names.variable.parameter,
						'4': names.$,
						'5': names.variable.other,
					},
					patterns: [
						{ include: includeRepo.values },
						{ match: ';', name: names.terminator },
						commentPattern
					]
				}
			}
			default: return {
				name: names.meta.context(it),
				begin: new RegExp(`\\b(${it}) +\\{`),
				end: /\}/,
				beginCaptures: {
					'1': names.contextDirective,
				},
				patterns: [{ include: '$self' }],
			}
		}
	}),
	{
		name: names.meta.block,
		begin: /\{/,
		end: /\}/,
		patterns: [{ include: '$self' }],
	},
	{
		begin: /\b(return)\b/,
		end: ';',
		beginCaptures: {
			'1': names.controlKeyword,
		},
		patterns: [{ include: includeRepo.values }],
	},
	{
		begin: /\b(rewrite)\s+/,
		end: '(last|break|redirect|permanent)?(;)',
		beginCaptures: {
			'1': names.directiveKeyword,
		},
		endCaptures: {
			'1': names.otherKeyword,
			'2': names.terminator,
		},
		patterns: [{ include: includeRepo.values }],
	},
	{
		begin: /\b(server)\s+/,
		end: ';',
		beginCaptures: {
			'1': names.directiveKeyword,
		},
		endCaptures: {
			'1': names.terminator,
		},
		patterns: [{ include: includeRepo.server_parameters }],
	},
	{
		comment: 'Directives without value',
		begin: '\\b(' + noBodyDirectives.join('|') + ')\\b',
		end: '(;|$)',
		beginCaptures: {
			'1': names.directiveKeyword,
		},
		endCaptures: {
			'1': names.terminator,
		},
	},
	...directivesGroupBy.map(([prefix, suffix]) => {
		if (!prefix) {
			return {
				begin: '(["\'\\s]|^)(' + suffix.join('|') + ')(["\'\\s]|$)',
				end: /;/,
				beginCaptures: {
					'1': names.directiveKeyword,
					'2': names.directiveKeyword,
					'3': names.directiveKeyword,
				},
				endCaptures: {
					'0': names.terminator,
				},
				patterns: [{ include: includeRepo.values }],
			} as SyntaxPattern;
		}
		return {
			begin: '(["\'\\s]|^)(' + prefix + ')(' + suffix.join('|') + ')(["\'\\s]|$)',
			end: /;/,
			beginCaptures: {
				'1': names.directiveKeyword,
				'2': names.directiveKeyword,
				'3': names.directiveKeyword,
				'4': names.directiveKeyword,
			},
			endCaptures: {
				'0': names.terminator,
			},
			patterns: [{ include: includeRepo.values }],

		};
	}),
	{
		comment: 'Unknown directives',
		begin: /\b([a-zA-Z0-9\_]+)\s+/,
		end: /(;|$)/,
		beginCaptures: {
			'1': names.unknownDirective,
		},
		endCaptures: {
			'1': names.terminator,
		},
		patterns: [{ include: includeRepo.values }],
	},
	{
		comment: 'media types to file extension',
		begin: /\b([a-z]+\/[A-Za-z0-9\-\.\+]+)\b/,
		end: /(;)/,
		beginCaptures: {
			'1': names.string.mediaType,
		},
		endCaptures: {
			'1': names.terminator,
		},
		patterns: [{ include: includeRepo.values }],
	},

];


function groupByPrefix(strings: string[]) {
	const mapList = new Map<string, string[]>();
	const emptyPrefix: string[] = [];

	for (let i = 0; i < strings.length; i++) {
		const str = strings[i];
		let index = str.indexOf('_')
		if (index <= 0) {
			emptyPrefix.push(str);
			continue;
		}
		index++;
		const prefix = str.slice(0, index);
		const suffix = str.slice(index);

		if (!suffix) {
			emptyPrefix.push(str);
			continue;
		}
		const list = mapList.get(prefix);
		if (list) {
			list.push(suffix);
			continue;
		}
		mapList.set(prefix, [suffix]);
	}

	const keys = Array.from(mapList.keys());
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const values = mapList.get(key);
		if (values.length > 1) continue;
		emptyPrefix.push(key + values[0]);
		mapList.delete(key);
	}
	mapList.set('', emptyPrefix);
	return mapList;
}
