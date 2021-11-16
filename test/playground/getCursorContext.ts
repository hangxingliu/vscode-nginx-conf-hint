import { readFileSync } from "fs";
import { NginxConfParser } from "../../src/extension/parser";

const conf = readFileSync(__dirname + '/file1.conf', 'utf8');

console.log(0, NginxConfParser.getCursorContext(conf.slice(0, 0)))

console.log(100, NginxConfParser.getCursorContext(conf.slice(0, 100)))

console.log(124, NginxConfParser.getCursorContext(conf.slice(0, 124)))

console.log(124, NginxConfParser.getCursorContext(conf.slice(0, 124)))
console.log(126, NginxConfParser.getCursorContext(conf.slice(0, 126)))
console.log(130, NginxConfParser.getCursorContext(conf.slice(0, 130)))


console.log(233, NginxConfParser.getCursorContext(conf.slice(0, 233)))

console.log(267, NginxConfParser.getCursorContext(conf.slice(0, 267)))

console.log(304, NginxConfParser.getCursorContext(conf.slice(0, 304)))

const conf2 = readFileSync(__dirname + '/../../example_files/example3.conf', 'utf8');

// 129 { n: false, context: 'map', s: true, list: [ '~*text/html', '1;' ] }
console.log(129, NginxConfParser.getCursorContext(conf2.slice(0, 129)))
