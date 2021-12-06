# TODO

- [ ] improve snippets
- [ ] improve formatter
- [ ] add completion for `location`, `if`
- [x] autocomplete HTTP header name
	- <https://en.wikipedia.org/wiki/List_of_HTTP_header_fields>
	- <https://zh.wikipedia.org/wiki/HTTP%E5%A4%B4%E5%AD%97%E6%AE%B5>
- [x] cache the block name cursor located in
- [x] make hint senmantic
  - reference: <https://github.com/tmont/nginx-conf>
- [x] support <https://vscode.dev>
- [x] Update syntax:
	- <https://macromates.com/manual/en/language_grammars#naming_conventions>
	- <https://www.apeth.com/nonblog/stories/textmatebundle.html>

## Finished

- [x] automatic install vscode.d.ts
- [x] filter autocompletion items by checking context block
- [x] add location block param "location" and "upstream" placeholder
- [x] auto show parameters hint after directive completion
  - VSCode don't support automatic show parameters hint after auto-complete
- [x] nginx directive detail document
- [x] directive hint order
- [x] variable documents
- [x] path completion after directive `include`
- [x] make links in nginx configuration documents valid (2018-03-28)
- [x] add config to enable/disable complete directives in contextual block (strict complete). (2018-03-29)
- [x] add syntaxes switch configuration (2018-07-07)
	- switch syntaxes tmLanguage file by configuration `"nginx-conf-hint.syntax` (values: `original`, `sublime`)
