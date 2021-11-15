import { RawHintDataGetter } from "../types";

class RawHintData implements RawHintDataGetter {
	directives() { return require('../../../hint_data/directives.json') }
	variables() { return require('../../../hint_data/variables.json') }
	links() { return require('../../../hint_data/links.json') }
	async directivesDocs() { return require('../../../hint_data/directives_document.json') }
	async variablesDocs() { return require('../../../hint_data/variables_document.json') }
}
class RawLuaHintData implements RawHintDataGetter {
	directives() { return require('../../../hint_data/lua/directives.json') }
	variables() { return require('../../../hint_data/lua/variables.json') }
	links() { return []; }
	async directivesDocs() { return require('../../../hint_data/lua/directives_document.json') }
	async variablesDocs() { return require('../../../hint_data/lua/variables_document.json') }
}

export const rawNginxHintData = new RawHintData();
export const rawLuaHintData = new RawLuaHintData();
