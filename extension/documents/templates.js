//@ts-check

const fs = require('fs');
const path = require('path');

const templatesDir = path.resolve(__dirname, 'templates');

const DEFAULT_TEMPLATE_CONTENT = 'This document is unavailable now, please reopen this document';

class Templates {

	/**
	 * @param {(error: string) => any} onError
	 */
	constructor(onError) {
		this._onError = onError;
		this._templateContent = {
			directive_item: DEFAULT_TEMPLATE_CONTENT,
			directive_container: DEFAULT_TEMPLATE_CONTENT,
			variables: DEFAULT_TEMPLATE_CONTENT,
		};
	}

	init() {
		const { _templateContent } = this;
		const tasks = Object.keys(_templateContent).map(key => read(key));

		return Promise.all(tasks)
			.catch(e => this._onError(`Could not load document template!\n${e.message || e}`));

		function read(name) {
			const filePath = path.resolve(templatesDir, name + '.html');
			return new Promise((resolve, reject) => {
				fs.readFile(filePath, { encoding: 'utf8' }, (err, content) => {
					if (err) return reject(err);
					_templateContent[name] = content;
					return resolve(true);
				});
			});
		}
	}

	/**
	 *
	 * @param {"directive_item" |"directive_container" |"variables"} name
	 * @param {{[name: string]: any}} context
	 */
	render(name, context) {
		const tmpl = this._templateContent[name];
		if (!tmpl)
			return DEFAULT_TEMPLATE_CONTENT;
		return tmpl.replace(/\$\{(\w+?)\}/g, (_, name) => context[name]);
	}

}

module.exports = { Templates };
