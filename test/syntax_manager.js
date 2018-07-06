//@ts-check

const fs = require('fs');
const { Assert } = require('@hangxingliu/assert');
const syntaxManager = require('../extension/syntax_manager');

describe('syntax manager', () => {
	it('# isValidType', () => {
		Assert(syntaxManager.isValidType('original')).isTrue();
		Assert(syntaxManager.isValidType('sublime')).isTrue();

		Assert(syntaxManager.isValidType('')).isFalse();
		Assert(syntaxManager.isValidType('invalid')).isFalse();
	});
	it('# current syntax is original', () => {
		return syntaxManager.getCurrentSyntaxType()
			.then(type => Assert(type).equals('original'));
	});
	it('# syntax files', () => {
		const ext = '.nginx.tmLanguage';
		const files = fs.readdirSync(syntaxManager.getSyntaxFilesDir())
			.filter(name => name.endsWith(ext))
			.sort();
		const expectedTypes = ['original', 'sublime'].sort();
		const dir = syntaxManager.getSyntaxFilesDir();

		Assert(files).equalsInJSON(expectedTypes.map(t => t + ext));
		return Promise.all(files.map(file => syntaxManager.getFileSyntaxType(`${dir}/${file}`)))
			.then(types => Assert(types).equalsInJSON(expectedTypes));
	});
	it('# apply syntax type', () => {
		syntaxManager.applySyntaxFile('original')
			.then(updated => Assert(updated).isFalse())
			// =========================================
			.then(() => syntaxManager.applySyntaxFile('sublime'))
			.then(updated => Assert(updated).isTrue())
			.then(() => syntaxManager.getCurrentSyntaxType())
			.then(type => Assert(type).equals('sublime'))
			// =========================================
			.then(() => syntaxManager.applySyntaxFile('original'))
			.then(updated => Assert(updated).isTrue())
			.then(() => syntaxManager.getCurrentSyntaxType())
			.then(type => Assert(type).equals('original'))
	});
});
