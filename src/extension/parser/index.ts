export type NginxConfCursorContext = {
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
	/** in Lua script block */
	lua?: boolean;
};

export type NginxConfDefinitionInfo = {
	location: { name: string; begin: number; end: number; isDef?: boolean }[];
	var: { name: string; begin: number; end: number }[];
};

export function isLuaContext(contextName: string) {
	if (contextName.endsWith("_by_lua") || contextName.endsWith("_by_lua_block")) return true;
}

type LuaBlockContext = {
	i: number;
	/** In comment */
	c?: boolean;
	/** In string */
	s?: boolean;
	/** is Lua block ended and backed to nginx codes */
	out?: boolean;
};

export function handleLuaBlockInNginx(text: string, i: number): LuaBlockContext {
	let blockLevel = 0;
	for (; i < text.length; i++) {
		const ch = text[i];
		switch (ch) {
			// [[ ... ]] string
			case "'":
			case '"': {
				while (i >= 0 && i < text.length) {
					i = text.indexOf(ch, i + 1);
					if (i < 0) return { s: true, i: text.length + 1 };
					if (text[i - 1] === "\\") {
						if (text[i - 2] !== "\\") continue;
					}
					break;
				}
				break;
			}
			case "-": {
				const ch2 = text[i + 1];
				if (ch2 === "-") {
					// comment;
					let i2: number;
					if (text[i + 2] === "[" && text[i + 3] === "[") {
						// multi-line comment
						i2 = text.indexOf("]]", i2 + 4);
						if (i2 < 0) return { c: true, i: text.length + 1 };
					} else {
						i2 = text.indexOf("\n", i + 2);
						if (i2 < 0) return { c: true, i: text.length + 1 };
					}
					i = i2;
				}
				break;
			}
			case "{": {
				blockLevel++;
				break;
			}
			case "}": {
				blockLevel--;
				if (blockLevel < 0) return { i, out: true };
			}
		}
	}
	return { i };
}

export function getNginxConfCursorContext(confBeforeCursor: string) {
	const result: NginxConfCursorContext = { n: true, list: [], index: [] };
	const text = confBeforeCursor;

	let pending = "";
	let pendingFrom = -1;
	let inBraceVar = false;
	const contexts: string[] = [];

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		switch (ch) {
			case " ":
			case "\n":
			case "\r":
			case "\t":
			case "\v":
				if (pending) {
					result.list.push(pending);
					result.index.push(pendingFrom);
					pending = "";
					pendingFrom = -1;
				}
				result.n = true;
				break;
			case "\\":
				result.n = false;
				pending += ch;
				if (pendingFrom < 0) pendingFrom = i;
				if (i < text.length - 1) pending += text[++i];
				break;
			case "#":
				i = text.indexOf("\n", i + 1);
				if (i < 0) {
					result.c = true;
					i = text.length + 1;
				}
				break;
			case "$": {
				result.n = false;
				pending += ch;
				if (pendingFrom < 0) pendingFrom = i;
				if (text[i + 1] === "{") {
					pending += text[++i];
					inBraceVar = true;
				}
				break;
			}
			case "'":
			case '"': {
				const startedAt = i + 1;
				while (i >= 0 && i < text.length) {
					i = text.indexOf(ch, i + 1);
					if (i < 0) {
						result.s = true;
						i = text.length + 1;
						break;
					}
					if (text[i - 1] === "\\") {
						if (text[i - 2] !== "\\") continue;
					}
					break;
				}
				result.list.push(pending + text.slice(startedAt, i));
				result.index.push(pendingFrom >= 0 ? pendingFrom : startedAt - 1);
				pending = "";
				pendingFrom = -1;
				result.n = false;
				break;
			}
			case "}":
				if (inBraceVar) {
					pending += ch;
					inBraceVar = false;
				} else {
					contexts.pop();
					result.list = [];
					result.index = [];
					pending = "";
					pendingFrom = -1;
					result.n = true;
				}
				break;
			case ";":
				result.list = [];
				result.index = [];
				pending = "";
				pendingFrom = -1;
				result.n = true;
				break;
			case "{": {
				const contextName = result.list[0] || pending;
				contexts.push(contextName);

				if (isLuaContext(contextName)) {
					const lua = handleLuaBlockInNginx(text, i + 1);
					i = lua.i;
					if (lua.out) {
						// same as '}'
						contexts.pop();
						result.list = [];
						result.index = [];
						pending = "";
						pendingFrom = -1;
						result.n = true;
						break;
					}
					// still in lua block
					result.lua = true;
					if (lua.c) result.c = true;
					if (lua.s) result.s = true;
				}
				result.list = [];
				result.index = [];
				pending = "";
				pendingFrom = -1;
				result.n = true;
				break;
			}
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

	result.context = contexts.pop();
	if (result.list.length > 0) {
		const last = result.list[result.list.length - 1] || "";
		const mtx: RegExpMatchArray = last.match(/\$\{?(\w*)$/);
		if (mtx) {
			if (last[mtx.index - 1] === "\\" && last[mtx.index - 2] !== "\\") return result;
			result.v = mtx[1];
		}
	}
	return result;
}

export function getNginxConfDefinitionInfo(text: string) {
	const info: NginxConfDefinitionInfo = {
		location: [],
		var: [],
	};

	let list: string[] = [];
	let index: number[] = [];
	let pending = "";
	let pendingFrom = -1;
	let inBraceVar = false;
	const savePending = () => {
		list.push(pending);
		index.push(pendingFrom);
		if (list.length > 1 && pending[0] === "@") {
			const isDef = list.length === 2 && list[0] === "location";
			info.location.push({
				name: pending,
				begin: pendingFrom,
				end: pendingFrom + pending.length,
				isDef,
			});
		}
		pending = "";
		pendingFrom = -1;
	};

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		switch (ch) {
			case " ":
			case "\n":
			case "\r":
			case "\t":
			case "\v":
				if (pending) savePending();
				break;
			case "\\":
				pending += ch;
				if (pendingFrom < 0) pendingFrom = i;
				if (i < text.length - 1) pending += text[++i];
				break;
			case "#":
				i = text.indexOf("\n", i + 1);
				if (i < 0) i = text.length + 1;
				break;
			case "$": {
				pending += ch;
				if (pendingFrom < 0) pendingFrom = i;
				if (text[i + 1] === "{") {
					pending += text[++i];
					inBraceVar = true;
				}
				break;
			}
			case "'":
			case '"': {
				const startedAt = i + 1;
				while (i >= 0 && i < text.length) {
					i = text.indexOf(ch, i + 1);
					if (i < 0) {
						i = text.length + 1;
						break;
					}
					if (text[i - 1] === "\\") {
						if (text[i - 2] !== "\\") continue;
					}
					break;
				}
				pending += text.slice(startedAt, i);
				if (pendingFrom < 0) pendingFrom = startedAt - 1;
				savePending();
				break;
			}
			case "}":
				if (inBraceVar) {
					pending += ch;
					inBraceVar = false;
				} else {
					list = [];
					index = [];
					pending = "";
					pendingFrom = -1;
				}
				break;
			case ";":
				savePending();
				list = [];
				index = [];
				break;
			case "{": {
				const contextName = list[0] || pending;
				if (isLuaContext(contextName)) {
					const lua = handleLuaBlockInNginx(text, i + 1);
					i = lua.i;
					if (lua.out) {
						// same as '}'
						list = [];
						index = [];
						pending = "";
						pendingFrom = -1;
						break;
					}
				}
				list = [];
				index = [];
				pending = "";
				pendingFrom = -1;
				break;
			}
			default:
				pending += ch;
				if (pendingFrom < 0) pendingFrom = i;
		}
	} // end of for statement
	return info;
}
