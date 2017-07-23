/**
 * Special body for some block with parameters. such as location, upstream...
 */
let specialSnippetBody = {
	location: 'location ${location:/} {\n\t$0\n}',
	upstream: 'upstream ${upstream_name} {\n\t$0\n}'
};

let extraSnippet = {
	"Block server with directives": {
		prefix: 'server',
		body: [
			'server {',
			'\tlisten ${address:80};',
			'\tserver_name ${server_names:server_names};',
			'\t$0',
			'}'
		]
	}
};

let generateBlockSnippetObject = blockName => ({
	prefix: blockName,
	body: specialSnippetBody[blockName] || `${blockName} {\n\t$0\n}`
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
		result[`Block ${blockName}`] = generateBlockSnippetObject(blockName));
	
	Object.keys(extraSnippet).forEach(name => result[name] = extraSnippet[name]);

	return result;
}

module.exports = {
	generate
};