export type SyntaxPattern = {
	comment?: string;
	match?: any;
	name?: string;
	beginCaptures?: { [x in string]: string | { name: string } };
	captures?: { [x in string]: string | { name: string } };
	endCaptures?: { [x in string]: string | { name: string } };
	include?: string;
	begin?: any;
	end?: any;
	patterns?: SyntaxPattern[];
}
