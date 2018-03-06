# Nginx config file hint(auto-completion) for VS Code

An **experimental** extension.   
And the hint data generated from [nginx document web page][nginx-doc] by [scripts][doc-script]    
You can report bug or send a feature suggestion in [Github Issues Page][issues].

## Installation

1. Click `Extension` button in left side of VSCode. (Shortcut: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>)
2. Search `nginx.conf hint`. Found this extension and click `Install` button.
3. Reload VSCode.

## Screenshots

![screenshots](https://raw.githubusercontent.com/hangxingliu/vscode-nginx-conf-hint/master/images/screenshots.gif)

## Functions

1. hint nginx directives and embedded variables
2. hint directive default parameters
3. hint directives syntax 
4. nginx block snippets
5. "Goto Nginx Document" for each directives and variables

## Changelog

### 0.0.4 (2017-07-24)

1. update Nginx directives and variables to latest.
2. add access_log into block server snippet
3. modify snippet project structure

[CHANGELOG.md][changelog]

## Declaration

1. This extension is depend on extension [nginx.conf developed by shanoor][ext-nginx-conf] (**It will be install automatically by VS Code**)
2. Icon image of this extension is from extension [nginx.conf][icon-nginx] 
3. This extension is published under the [GPL-3.0 license](LICENSE)

## Contributing to the Extension

- useful nginx.conf snippets 
- report bug
- othe improving pull request


[Pull Request](pr) & [Issues](issues)

[CONTRIBUTING.md](CONTRIBUTING.md)

## Author

[LiuYue(hangxingliu)](https://github.com/hangxingliu)

[nginx-doc]: https://nginx.org/en/docs/
[doc-script]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/utils/hint_data_getter.js
[ext-nginx-conf]: https://marketplace.visualstudio.com/items?itemName=shanoor.vscode-nginx
[icon-nginx]: https://github.com/shanoor/vscode-nginx/blob/master/nginx_logo.png
[issues]: https://github.com/hangxingliu/vscode-nginx-conf-hint/issues
[pr]: https://github.com/hangxingliu/vscode-nginx-conf-hint/pulls
[changelog]: https://github.com/hangxingliu/vscode-nginx-conf-hint/blob/master/CHANGELOG.md
