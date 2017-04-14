#!/usr/bin/env node

require('colors');

let request = require('request'),
	fs = require('fs');

let url = {
	'vscode.d.ts': 'https://raw.githubusercontent.com/Microsoft/vscode/master/src/vs/vscode.d.ts',
	'vscode.proposed.d.ts': 'https://raw.githubusercontent.com/Microsoft/vscode/master/src/vs/vscode.proposed.d.ts'
};

let queue = Object.keys(url);

(function handler() {
	let name = queue.pop();
	if (!name)
		return console.log('DONE'.blue);
	console.log(`Downloading ${name.bold} ...`);
	request.get(url[name], {}, (err, res, body) => {
		if (err) return console.error(`Error`.red + '\n' + err.stack);
		if (res.statusCode != 200) return console.error(`Error`.red + '\n' +
			`HTTP response code: ${res.statusCode}`);
		fs.writeFileSync(`${__dirname}/../${name}`, body);
		console.log(`OK`.green);
		handler();
	})
})();