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
			.then(type => Assert(type).equals('original'))
			.then(() => {
				const packageObject = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'));
				const configuration = packageObject.contributes.configuration[0];
				const defaultType = configuration['properties']['nginx-conf-hint.syntax']['default'];
				Assert(defaultType).equals('original');

				const extensionMainCode = fs.readFileSync(`${__dirname}/../extension/main.js`, 'utf8');
				const defaultTypeInCode = extensionMainCode.match(/DEFAULT_SYNTAX\s+=\s+['"`](\w+)/);
				Assert(defaultTypeInCode[1]).equals('original');
			});
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
