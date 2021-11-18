/**
 * <https://macromates.com/manual/en/language_grammars#naming_conventions>
 * <https://www.sublimetext.com/docs/scope_naming.html>
 */
export const names = {
	variable: {
		other: 'variable.other.nginx',
		parameter: 'variable.parameter.nginx',
	},

	entityName: {
		context: 'entity.name.context.location.nginx'
	},

	comment: 'comment.line.number-sign',

	ipaddr: 'string.other.ipaddress.nginx',

	cidr: 'constant.numeric.cidr.nginx',
	numeric: 'constant.numeric.nginx',

	languageConstant: 'constant.language.nginx',

	string: {
		regexp: 'string.regexp.nginx',
		doubleQuoted: 'string.quoted.double.nginx',
		singleQuoted: 'string.quoted.single.nginx',
		escaped: 'constant.character.escape.nginx',
		mediaType: 'constant.other.mediatype.nginx'
	},

	meta: {
		context: (name: string) => `meta.context.${name}.nginx`,
		block: 'meta.block.nginx',
	},
	embedded: {
		lua: 'meta.embedded.block.lua'
	},

	controlKeyword: 'keyword.control.nginx',
	operator: 'keyword.operator.nginx',
	otherKeyword: 'keyword.other.nginx',
	directiveKeyword: 'keyword.directive.nginx',
	unknownDirective: 'keyword.directive.unknown.nginx',
	contextDirective: 'storage.type.directive.context.nginx',

	/**
	 * Symbols that are part of the variable name,
	 * should additionally be applied the following scope.
	 * For example, the `$` in PHP and Shell.
	 */
	$: 'punctuation.definition.variable.nginx',

	/**
	 * Semicolons or other statement terminators should use:
	 */
	terminator: 'punctuation.terminator.nginx',

	invalid: 'invalid.illegal.nginx',
}
