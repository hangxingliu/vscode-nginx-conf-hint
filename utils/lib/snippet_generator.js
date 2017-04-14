
let getABlockSnippetObject = blockName => ({
	prefix: blockName,
	body: `${blockName} {\n\t$0\n}`
});

/**
 * @param {Array<object>} directives 
 */
function generate(directives) {
	let contextsMap = {},
		result = {};	
	directives.forEach(directive =>
		directive.contexts.forEach(context => 
			contextsMap[context] = true));
	//Ignore some contexts
	delete contextsMap.main;
	delete contextsMap.any;

	Object.keys(contextsMap).forEach(blockName =>
		result[`Block ${blockName}`] = getABlockSnippetObject(blockName));

	return result;
}

module.exports = {
	generate
};