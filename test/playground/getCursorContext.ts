import { readFileSync } from "fs";
import { getNginxConfCursorContext } from "../../src/extension/parser";

const conf = readFileSync(__dirname + '/file1.conf', 'utf8');
const conf2 = readFileSync(__dirname + '/file2.conf', 'utf8');

console.log(0, getNginxConfCursorContext(conf.slice(0, 0)))

console.log(100, getNginxConfCursorContext(conf.slice(0, 100)))

console.log(124, getNginxConfCursorContext(conf.slice(0, 124)))

console.log(124, getNginxConfCursorContext(conf.slice(0, 124)))
console.log(126, getNginxConfCursorContext(conf.slice(0, 126)))
console.log(130, getNginxConfCursorContext(conf.slice(0, 130)))


console.log(233, getNginxConfCursorContext(conf.slice(0, 233)))

console.log(267, getNginxConfCursorContext(conf.slice(0, 267)))

console.log(304, getNginxConfCursorContext(conf.slice(0, 304)))

console.log(27, getNginxConfCursorContext(conf2.slice(0, 27)))


const conf3 = readFileSync(__dirname + '/../workspace/example3.conf', 'utf8');

// 129 { n: false, context: 'map', s: true, list: [ '~*text/html', '1;' ] }
console.log(129, getNginxConfCursorContext(conf3.slice(0, 129)))
