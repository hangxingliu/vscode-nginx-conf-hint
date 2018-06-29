#!/usr/bin/env node

let request = require('request'),
	chalk = require('chalk').default,
	fs = require('fs');

let url = {
	'vscode.d.ts': 'https://raw.githubusercontent.com/Microsoft/vscode/master/src/vs/vscode.d.ts',
	'vscode.proposed.d.ts': 'https://raw.githubusercontent.com/Microsoft/vscode/master/src/vs/vscode.proposed.d.ts'
};

let queue = Object.keys(url);

(function handler() {
	let name = queue.pop();
	if (!name)
		return console.log(chalk.blue('DONE'));
	console.log(`Downloading ${chalk.bold(name)} ...`);
	request.get(url[name], {}, (err, res, body) => {
		if (err) return console.error(chalk.red(`Error`) + '\n' + err.stack);
		if (res.statusCode != 200) return console.error(chalk.red(`Error`) + '\n' +
			`HTTP response code: ${res.statusCode}`);
		fs.writeFileSync(`${__dirname}/../${name}`, body);
		console.log(chalk.green(`OK`));
		handler();
	})
})();
