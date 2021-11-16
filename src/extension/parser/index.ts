
export namespace NginxConfParser {

	export type CursorContext = {
		/** typing a new part */
		n: boolean;
		list: string[];
		index: number[];

		/** Inputing variable name */
		v?: string;
		/** In comment */
		c?: boolean;
		/** In string */
		s?: boolean;
		context?: string;
	};

	export function getCursorContext(confBeforeCursor: string) {
		const result: CursorContext = { n: true, list: [], index: [] };
		const text = confBeforeCursor;

		let pending = '';
		let pendingFrom = -1;
		let inBraceVar = false;
		for (let i = 0; i < text.length; i++) {
			const ch = text[i];
			switch (ch) {
				case ' ':
				case '\n':
				case '\r':
				case '\t':
				case '\v':
					if (pending) {
						result.list.push(pending)
						result.index.push(pendingFrom);
						pending = '';
						pendingFrom = -1;
					}
					result.n = true;
					break;
				case '\\':
					result.n = false;
					pending += ch;
					if (pendingFrom < 0) pendingFrom = i;
					if (i < text.length - 1) pending += text[++i];
					break;
				case '#':
					i = text.indexOf('\n', i + 1);
					if (i < 0) {
						result.c = true;
						i = text.length + 1;
					}
					break;
				case '$': {
					result.n = false;
					pending += ch;
					if (pendingFrom < 0) pendingFrom = i;
					if (text[i + 1] === '{') {
						pending += text[++i];
						inBraceVar = true;
					}
					break;
				}
				case '"':
				case '"': {
					const startedAt = i + 1;
					while (i >= 0 && i < text.length) {
						i = text.indexOf(ch, i + 1);
						if (i < 0) {
							result.s = true;
							i = text.length + 1;
							break;
						}
						if (text[i - 1] === '\\') {
							if (text[i - 2] !== '\\')
								continue;
						}
						break;
					}
					result.list.push(pending + text.slice(startedAt, i));
					result.index.push(pendingFrom >= 0 ? pendingFrom : startedAt - 1);
					pending = '';
					pendingFrom = -1;
					result.n = false;
					break;
				}
				case '}':
					if (!inBraceVar) {
						delete result.context;
						result.n = true;
					}
					inBraceVar = false;
				case ';':
					result.list = [];
					result.index = [];
					pending = '';
					pendingFrom = -1;
					result.n = true;
					break;
				case '{':
					result.context = result.list[0] || pending;
					result.list = [];
					result.index = [];
					pending = '';
					pendingFrom = -1;
					result.n = true;
					break;
				default:
					result.n = false;
					pending += ch;
					if (pendingFrom < 0) pendingFrom = i;
			}
		} // end of for statement

		if (pending) {
			result.list.push(pending);
			result.index.push(pendingFrom);
		}

		if (result.list.length > 0) {
			const last = result.list[result.list.length - 1] || '';
			const mtx: RegExpMatchArray = last.match(/\$\{?(\w*)$/);
			if (mtx) {
				if (last[mtx.index - 1] === '\\' && last[mtx.index - 2] !== '\\')
					return result;
				result.v = mtx[1];
			}
		}
		return result;
	}


}
