import { syntaxRepository } from "./repository";
import { syntaxPatterns } from "./patterns";

/**
 * @see https://macromates.com/manual/en/language_grammars
 */
export namespace syntax {

	export const name = 'nginx';

	/**
	 * this should be a unique name for the grammar, following the convention of being a dot-separated name where each new (left-most) part specializes the name. Normally it would be a two-part name where the first is either text or source and the second is the name of the language or document type. But if you are specializing an existing type, you probably want to derive the name from the type you are specializing. For example Markdown is text.html.markdown and Ruby on Rails (rhtml files) is text.html.rails. The advantage of deriving it from (in this case) text.html is that everything which works in the text.html scope will also work in the text.html.«something» scope (but with a lower precedence than something specifically targeting text.html.«something»).
	 */
	export const scopeName = 'source.nginx';

	export const uuid = '0C04066A-12D2-43CA-8238-00A12CE4C12D';

	/**
	 * this is an array of file type extensions that the grammar should (by default) be used with. This is referenced when TextMate does not know what grammar to use for a file the user opens. If however the user selects a grammar from the language pop-up in the status bar, TextMate will remember that choice
	 */
	export const fileTypes: string[] = [
		'conf.erb',
		'conf',
		'ngx',
		'nginx.conf',
		'mime.types',
		'fastcgi_params',
		'scgi_params',
		'uwsgi_params'
	];

	/**
	 * these are regular expressions that lines (in the document) are matched against. If a line matches one of the patterns (but not both), it becomes a folding marker (see the foldings section for more info).
	 */
	export const foldingStartMarker = /\{\s*$/;

	/**
	 * these are regular expressions that lines (in the document) are matched against. If a line matches one of the patterns (but not both), it becomes a folding marker (see the foldings section for more info).
	 */
	export const foldingStopMarker = /^\s*\}/;

	/** Unknown */
	export const keyEquivalent = /^~N/;

	export const patterns = syntaxPatterns;

	export const repository = syntaxRepository;
}

