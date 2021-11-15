/**
 * <https://macromates.com/manual/en/language_grammars#naming_conventions>
 * <https://www.sublimetext.com/docs/scope_naming.html>
 */
export namespace names {
	export const variable = {
		other: 'variable.other.nginx',
		parameter: 'variable.parameter.nginx',
	}

	export const entityName = {
		context: 'entity.name.context.location.nginx'
	}

	export const comment = 'comment.line.number-sign';

	export const ipaddr = 'string.other.ipaddress.nginx';

	export const cidr = 'constant.numeric.cidr.nginx';
	export const numeric = 'constant.numeric.nginx';

	export const languageConstant = 'constant.language.nginx';

	export const string = {
		regexp: 'string.regexp.nginx',
		doubleQuoted: 'string.quoted.double.nginx',
		singleQuoted: 'string.quoted.single.nginx',
		escaped: 'constant.character.escape.nginx',
		mimeType: 'constant.other.mimetype.nginx'
	};

	export const meta = {
		context: (name: string) => `meta.context.${name}.nginx`,
		block: 'meta.block.nginx',
	};

	export const controlKeyword = 'keyword.control.nginx';
	export const operator = 'keyword.operator.nginx';
	export const otherKeyword = 'keyword.other.nginx';
	export const directiveKeyword = 'keyword.directive.nginx';
	export const unknownDirective = 'keyword.directive.unknown.nginx';
	export const contextDirective = 'storage.type.directive.context.nginx'

	/**
	 * Symbols that are part of the variable name,
	 * should additionally be applied the following scope.
	 * For example, the `$` in PHP and Shell.
	 */
	export const $ = 'punctuation.definition.variable.nginx';

	/**
	 * Semicolons or other statement terminators should use:
	 */
	export const terminator = 'punctuation.terminator.nginx';

	export const invalid = 'invalid.illegal.nginx';
}
