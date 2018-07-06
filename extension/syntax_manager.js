//@ts-check
/// <reference path="../vscode.d.ts" />

const fs = require('fs');

const TYPE_MATCHER = /<!--\s+vscode-nginx-conf-hint\s+\{\s+syntax-type:\s+(\w+)\s+\}\s+-->/;
const SYNTAX_FILES_DIR = `${__dirname}/../syntaxes`;
const CURRENT_SYNTAX_FILE = `${SYNTAX_FILES_DIR}/nginx.tmLanguage`;

function getSyntaxFilesDir() { return SYNTAX_FILES_DIR; }
function isValidType(type) { return type == 'original' || type == 'sublime'; }

function getCurrentSyntaxType() { return getFileSyntaxType(CURRENT_SYNTAX_FILE); }

/**
 * @param {string} filepath
 * @returns {Promise<"original"|"sublime">}
 */
function getFileSyntaxType(filepath) {
	return new Promise((resolve, reject) => {
		let callbacked = false;
		const callback = (err, result) => {
			if (callbacked) return;
			callbacked = true;
			if (err)
				return reject(typeof err === 'string' ? new Error(err) : err);
			resolve(result);
		}
		const stream = fs.createReadStream(filepath, { fd: null, encoding: 'utf8' });
		stream.on('error', callback);
		stream.on('readable', () => {
			if (callbacked) return;

			/** @type {string} */
			const prefix = stream.read(1024);
			stream.destroy();

			const matched = prefix.match(TYPE_MATCHER);
			if (!matched)
				return callback(`Could not match type from syntax file "${filepath}"`);

			const type = matched[1];
			if (!isValidType(type))
				return callback(`"${type}" is invalid syntax type in file "${filepath}"`);
			return callback(null, type);
		});
	});
}

/**
 *
 * @param {"original"|"sublime"} type
 */
function applySyntaxFile(type) {
	return getCurrentSyntaxType().then(oldType => {
		if (oldType === type)
			return Promise.resolve(false);
		return new Promise((resolve, reject) => {
			fs.readFile(`${SYNTAX_FILES_DIR}/${type}.nginx.tmLanguage`, (err, buffer) => {
				if (err) return reject(err);
				fs.writeFile(CURRENT_SYNTAX_FILE, buffer, err => {
					if (err) return reject(err);
					return resolve(true);
				});
			});
		});
	});
}

module.exports = {
	isValidType,
	getCurrentSyntaxType,
	getFileSyntaxType,
	getSyntaxFilesDir,
	applySyntaxFile,
};
