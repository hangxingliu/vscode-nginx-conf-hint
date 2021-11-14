# Nginx config file hint(auto-completion) for VS Code

[![.github/workflows/ci.yaml](https://github.com/hangxingliu/vscode-nginx-conf-hint/actions/workflows/ci.yaml/badge.svg)](https://github.com/hangxingliu/vscode-nginx-conf-hint/actions/workflows/ci.yaml)

An **experimental** extension.   
And the hint data generated from [nginx document web page][nginx-doc] by [scripts][doc-script]    
You can report bug or send a feature suggestion in [Github Issues Page][issues].

## Installation

1. Click `Extension` button in left side of VSCode. (Shortcut: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>)
2. Search `nginx.conf hint`. Found this extension and click `Install` button.
3. Reload VSCode.

## Screenshots

![screenshots](https://raw.githubusercontent.com/hangxingliu/vscode-nginx-conf-hint/master/images/screenshots.gif)

## Features

1. provide highlight for Nginx configuration file.
2. auto complete nginx directives and embedded variables
3. hint directive default parameters
4. hint directives syntax 
5. nginx block snippets
6. "Goto Nginx Document" for each directives and variables

## Changelog

### 0.2.0 (2021-11-14)

1. update syntax and hint data.
	- Contributor: [@latipun7](https://github.com/latipun7)
2. add support for lua module and conf formatter
	- Contributor: [@tiansin](https://github.com/tiansin)

### 0.1.0 (2018-07-09)

1. syntax of nginx.conf is provided inside.
	- `original` syntax is from [shanoor/vscode-nginx][shanoor-syntax] (**by default**)
	- `sublime` syntax is from [sublime-nginx][sublime-syntax]
	- you can switch it by configuration: `nginx-conf-hint.syntax`
2. remove dependent extension `shanoor.vscode-nginx`.
3. update Nginx hint data(directives and variables) to latest.

[CHANGELOG.md][docs/changelog]

## Declaration

1. Nginx config syntaxes file from [sublime-nginx][sublime-nginx] repo and [shanoor/vscode-nginx][shanoor-nginx] repo 
2. Icon image of this extension is from extension [nginx.conf][icon-nginx] 
3. This extension is published under the [GPL-3.0 license](LICENSE)

## Contributing to the Extension

- useful nginx.conf snippets 
- report bug via Github issues
- helpful pull request
- give me coffee to make extension better and better via [Paypal][paypal]

[Pull Request][pr] & [Issues][issues]

[CONTRIBUTING.md](docs/CONTRIBUTING.md)

## Author

[LiuYue(hangxingliu)](https://github.com/hangxingliu)

## Contributor

- [@tiansin](https://github.com/tiansin)
- [@latipun7](https://github.com/latipun7)


[nginx-doc]: https://nginx.org/en/docs/
[doc-script]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/utils/download_hint_data.js
[shanoor-syntax]: https://github.com/shanoor/vscode-nginx/blob/master/syntaxes/nginx.tmLanguage
[sublime-syntax]: https://github.com/brandonwamboldt/sublime-nginx/blob/master/Syntaxes/nginx.tmLanguage
[shanoor-nginx]: https://github.com/shanoor/vscode-nginx
[sublime-nginx]: https://github.com/brandonwamboldt/sublime-nginx
[icon-nginx]: https://github.com/shanoor/vscode-nginx/blob/master/nginx_logo.png
[issues]: https://github.com/hangxingliu/vscode-nginx-conf-hint/issues
[pr]: https://github.com/hangxingliu/vscode-nginx-conf-hint/pulls
[changelog]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/docs/CHANGELOG.md
[paypal]: https://www.paypal.me/hangxingliu
