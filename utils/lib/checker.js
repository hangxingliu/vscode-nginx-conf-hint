require('colors')

const OK = ' - ' + 'OK'.green;
const WARN = ' - ' + 'WARN'.yellow;
const ERROR = ' - ' + 'ERROR'.red;
const DONE = 'DONE'.blue.bold;
const LEVEL_WARN = true;
const LEVEL_ERROR = false;

/**
 * @param {String} reason
 */
function error(reason = '') {
	console.error(ERROR, '\n', reason);
	process.exit(1);
}
function warn(reason = '') {
	console.warn(WARN, '\n', reason);
}
function ok(what = '') {
	console.log(OK, what);
}
function done() {
	console.log(DONE);
}

/**
 * @param {string} name 
 * @param {string|Array<string>} arrOrStr 
 * @param {number} length 
 * @param {boolean} justWarn 
 */
function lengthEquals(name = '', arrOrStr = [], length = 1, justWarn = false) {
	return (arrOrStr && arrOrStr.length == length) ?
		arrOrStr :
		(justWarn ? warn : error)(`length of ${name.bold} (${
			arrOrStr ? arrOrStr.length : 'undefined'})is not equal ${String(length).bold}!`);
}
/**
 * 
 * @param {string} name 
 * @param {string|Array<any>} arrOrStr 
 * @param {number} length 
 * @param {boolean} justWarn 
 */
function lengthAtLease(name, arrOrStr, length = 1, justWarn = false) {
	return (arrOrStr && arrOrStr.length >= length) ?
		arrOrStr :
		(justWarn ? warn : error)(`length of ${name.bold} (${
			arrOrStr ? arrOrStr.length : 'undefined'})less than ${String(length).bold}!`);
}
function responseOK(name, err, res, html) {
	err && error(err.stack);
	res.statusCode != 200 && error(`${name.bold} statusCode != 200`);
	!html && error(`${name.bold} empty response content`);
}
function equal(name = '', actual = '', expected = '', justWarn = false) {
	if (actual === expected)
		return true;	
	(justWarn ? warn : error)(`${name.bold}: expected: ${expected.green} .But actual: ${actual.red}.`);
}

module.exports = {
	ok, error, warn, done, LEVEL_ERROR, LEVEL_WARN,
	lengthEquals, 
	lengthAtLease,
	responseOK,
	equal
};