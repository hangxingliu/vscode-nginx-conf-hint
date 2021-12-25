# Nginx config file hint(auto-completion) for VS Code

[![.github/workflows/ci.yaml](https://github.com/hangxingliu/vscode-nginx-conf-hint/actions/workflows/ci.yaml/badge.svg)](https://github.com/hangxingliu/vscode-nginx-conf-hint/actions/workflows/ci.yaml)


A Visual Studio Code extension that helps you write Nginx configuration files. 
Many features in it include syntax highlight, auto-complete, in-editor documents, embedded Lua block, and more.


## Installation

1. Click `Extension` button in left side of VSCode. (Shortcut: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> or <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>)
2. Search for `hangxingliu.vscode-nginx-conf-hint` and click the `Install` button.

## Screenshots

![screenshots](https://raw.githubusercontent.com/hangxingliu/vscode-nginx-conf-hint/master/images/screenshots.gif)

## Features

1. Syntax highlight for Nginx configuration file
2. Support syntax of Lua block in Nginx configuration file
3. Autocomplete directives, variables, location, media types, path, and more
4. Hint directive arguments and usage
5. Provide Nginx snippets
6. Provide directives and snippets from [OpenResty](https://github.com/openresty/)
7. Menu item "Goto Nginx Document" for display related Nginx document in the editor 

## Changelog

### 0.3.0 (2021-11-20)

:mega: There are a lot of updates in this version:

1. The syntax of the Nginx configuration file is updated completely
	- Because the syntax from sublime extension and shanoor's repo are long time no updates. So I write a syntax generator for better highlight
	- New syntax is generated from codes. You can find them in [generate-tmLanguage.ts](src/syntax/generate-tmLanguage.ts)
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

[CHANGELOG.md](docs/CHANGELOG.md)   
[更新日志](docs/CHANGELOG.zh-Hans.md)

## Declaration

1. Icon image of this extension is from extension [nginx.conf][icon-nginx] 
2. This extension is published under the [GPL-3.0 license](LICENSE)

## Contributing

[Pull Request][pr] & [Issues][issues]

[CONTRIBUTING.md](docs/CONTRIBUTING.md)

## Author

[LiuYue(hangxingliu)](https://github.com/hangxingliu)

## Contributor

- [@tiansin](https://github.com/tiansin)
- [@latipun7](https://github.com/latipun7)


[nginx-doc]: https://nginx.org/en/docs/
[doc-script]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/utils/download_hint_data.js
[icon-nginx]: https://github.com/shanoor/vscode-nginx/blob/master/nginx_logo.png
[issues]: https://github.com/hangxingliu/vscode-nginx-conf-hint/issues
[pr]: https://github.com/hangxingliu/vscode-nginx-conf-hint/pulls
[changelog]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/docs/CHANGELOG.md
[paypal]: https://www.paypal.me/hangxingliu
