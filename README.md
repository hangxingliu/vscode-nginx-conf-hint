# Nginx config file hint(auto-completion) for VS Code

[![Build Status](https://travis-ci.org/hangxingliu/vscode-nginx-conf-hint.svg?branch=master)](https://travis-ci.org/hangxingliu/vscode-nginx-conf-hint)

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

### 0.1.0 (2018-07-xx) Developing...

1. update Nginx config syntaxes to latest from [sublime-nginx](https://github.com/brandonwamboldt/sublime-nginx).
	- Thanks for contribution from [@tiansin](https://github.com/tiansin).
2. remove dependent extension `shanoor.vscode-nginx` (because this extension provide latest syntaxes file from this version).
3. update Nginx hint data(directives and variables) to latest.

[CHANGELOG.md][changelog]

## Declaration

1. Nginx config syntaxes file from [sublime-nginx][sublime-nginx] repo.
2. Icon image of this extension is from extension [nginx.conf][icon-nginx] 
3. This extension is published under the [GPL-3.0 license](LICENSE)

## Contributing to the Extension

- useful nginx.conf snippets 
- report bug via Github issues
- helpful pull request
- give me coffee to make extension better and better via [Paypal][paypal]

[Pull Request][pr] & [Issues][issues]

[CONTRIBUTING.md](CONTRIBUTING.md)

## Author

[LiuYue(hangxingliu)](https://github.com/hangxingliu)

## Contributor

- [@tiansin](https://github.com/tiansin)


[nginx-doc]: https://nginx.org/en/docs/
[doc-script]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/utils/hint_data_getter.js
[sublime-nginx]: https://github.com/brandonwamboldt/sublime-nginx
[icon-nginx]: https://github.com/shanoor/vscode-nginx/blob/master/nginx_logo.png
[issues]: https://github.com/hangxingliu/vscode-nginx-conf-hint/issues
[pr]: https://github.com/hangxingliu/vscode-nginx-conf-hint/pulls
[changelog]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/CHANGELOG.md
[paypal]: https://www.paypal.me/hangxingliu
