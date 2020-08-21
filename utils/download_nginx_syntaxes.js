#!/usr/bin/env node
//@ts-check

const chalk = require('chalk');
const request = require('request');
const fs = require('fs');

const downloadDescription = {
	original: 'https://raw.githubusercontent.com/shanoor/vscode-nginx/master/syntaxes/nginx.tmLanguage',
	sublime: 'https://raw.githubusercontent.com/brandonwamboldt/sublime-nginx/master/Syntaxes/nginx.tmLanguage',
};
const defaultSyntax = 'original';
const defaultFileName = `${__dirname}/../syntaxes/nginx.tmLanguage`;
const getTargetFileName = type => `${__dirname}/../syntaxes/${type}.nginx.tmLanguage`;

Promise.all(Object.keys(downloadDescription).map(it => download(it)))
	.then(() => { console.log(chalk.green.bold('success: all done!')); })
	.catch(() => { console.log(chalk.red.bold('fatal: exit with code 1')); process.exit(1); });

function download(name) {
	const url = downloadDescription[name];
	const targetFile = getTargetFileName(name);

	return new Promise((resolve, reject) => {
		console.log(chalk.cyan(`Downloading syntax ${name} ...`));
		console.log(chalk.cyan.dim(`  ${url}`));

		request(url, {}, (err, response, body) => {
			if (err) {
				console.error(chalk.red(`Download failed! ${err.message}`));
				console.error(chalk.red(err.stack));
				return reject(err);
			}
			if (response.statusCode != 200) {
				console.error(chalk.red(`Download failed! because the response code is not 200`));
				console.error(chalk.red(`    actual: ${response.statusCode} ${response.statusMessage}`));
				return reject(new Error(`response code is not 200, but ${response.statusCode}`));
			}

			if (body instanceof Buffer)
				body = body.toString('utf8');
			console.log(chalk.green(`Download success! (length: ${body.length})`));

			writeFile(targetFile, name, body);
			console.log(chalk.green(`Written to "${targetFile}" success!`));

			if (name == defaultSyntax) {
				writeFile(defaultFileName, name, body);
				console.log(chalk.green(`Written to "${defaultFileName}" success!`));
			}
			return resolve(body);
		});
	});
}


/**
 * @param {string} targetFile
 * @param {string} type
 * @param {string} ctx
 */
function writeFile(targetFile, type, ctx) {
	fs.writeFileSync(targetFile, ctx.replace('?>', `?>\n<!-- vscode-nginx-conf-hint { syntax-type: ${type} }  -->`));
}
