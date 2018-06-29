#!/usr/bin/env node
//@ts-check

const chalk = require('chalk').default;
const request = require('request');
const fs = require('fs');

const fileName = 'nginx.tmLanguage';
const from = `https://raw.githubusercontent.com/brandonwamboldt/sublime-nginx/master/Syntaxes/${fileName}`;
const to = `${__dirname}/../syntaxes/${fileName}`;

console.log(chalk.cyan(`Downloading ${fileName} ...`));
request(from, {}, (err, response, body) => {
	if (err) {
		console.error(chalk.red(`Download failed! ${err.message}`));
		console.error(chalk.red(err.stack));
		return process.exit(1);
	}
	if (response.statusCode != 200) {
		console.error(chalk.red(`Download failed! because the response code is not 200`));
		console.error(chalk.red(`    actual: ${response.statusCode} ${response.statusMessage}`));
		return process.exit(1);
	}
	if (body instanceof Buffer)
		body = body.toString('utf8');
	console.log(chalk.green(`Download success! (length: ${body.length})`));
	fs.writeFileSync(to, body);
	console.log(chalk.green(`Written to "${to}" success!`));
});
