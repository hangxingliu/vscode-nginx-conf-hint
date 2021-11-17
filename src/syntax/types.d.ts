export type SyntaxPattern = {
	comment?: string;
	match?: string | RegExp;
	name?: string;
	contentName?: string;
	beginCaptures?: { [x in string]: string | { name: string } };
	captures?: { [x in string]: string | { name: string } };
	endCaptures?: { [x in string]: string | { name: string } };
	include?: string;
	begin?: string | RegExp;
	end?: string | RegExp;
	patterns?: SyntaxPattern[];
}
