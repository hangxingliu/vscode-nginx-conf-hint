function convert(html = '') {
	return html
		.replace(/<code><i>(.+?)<\/i><\/code>/g, `*\`$1\`*`)
		.replace(/<code>(.+?)<\/code>/g, `\`$1\``)
}

module.exports = {
	convert
};