# CHANGELOG

### 0.3.0 (2021-11-20)

:mega: There are a lot of updates in this version:

1. The syntax of the Nginx configuration file is updated completely
	- Because the syntax from sublime extension and shanoor's repo are long time no updates. So I write a syntax generator for better highlight
	- New syntax is generated from codes. You can find them in [generate-tmLanguage.ts](../src/syntax/generate-tmLanguage.ts)
	- New syntax supports embedded Lua block
	- New syntax supports the directive statement in multiple lines
	- And extension configuration `nginx-conf-hint.syntax` is removed
2. Optimize hint data loader and document loader. They use less memory now and load data on demand
3. This extension can run as a web extension. So you can use this extension on <https://vscode.dev/> now
4. The coverage of auto-completion is more, and auto-completion is smarter
	1. Auto completion is based on the context and grammar of the configuration now
	2. Fix some wrong auto-completion items
	3. Autocomplete named location
	4. Autocomplete directive's named argument
	5. Autocomplete media types 
5. Add editor definition support for `location` directive
6. Add new extension configuration `nginx-conf-hint.externalModules` for controlling enabled of external modules hint data
7. The source code is rewritten by using Typescript


### 0.2.0 (2021-11-14)

1. update syntax and hint data.
	- Contributor: [@latipun7](https://github.com/latipun7)
2. add support for lua module and conf formatter
	- Contributor: [@tiansin](https://github.com/tiansin)
3. add `goto nginx document` into tooltip hover (issue#9)

### 0.1.0 (2018-07-09)

1. syntax of nginx.conf is provided inside.
	- `original` syntax is from [shanoor/vscode-nginx][shanoor-syntax] (**by default**)
	- `sublime` syntax is from [sublime-nginx][sublime-syntax]
	- you can switch it by configuration: `nginx-conf-hint.syntax`
2. remove dependent extension `shanoor.vscode-nginx`.
3. update Nginx hint data(directives and variables) to latest.

### 0.0.5 (2018-03-29)

1. fix invalid links in nginx documents.
2. add a configuration to enable/disable strict auto-completion.
3. update Nginx directives and variables to latest.

### 0.0.4 (2017-07-24)

1. update Nginx directives and variables to latest.
2. add access_log into block server snippet
3. modify snippet project structure

### 0.0.3 (2017-04-15)

1. add "Goto Nginx Document" context menu to watching directives and variables document
2. filter directive completion items according to context(block)
3. add more useful snippet
4. fixed directives and variables completion item order 
5. fixed auto completion insert wrong text

### 0.0.2 (2017-04-11)

1. fixed wrong description in `README.md`
2. add devDependencies into `package.json`

[shanoor-syntax]: https://github.com/shanoor/vscode-nginx/blob/master/syntaxes/nginx.tmLanguage
[sublime-syntax]: https://github.com/brandonwamboldt/sublime-nginx/blob/master/Syntaxes/nginx.tmLanguage
