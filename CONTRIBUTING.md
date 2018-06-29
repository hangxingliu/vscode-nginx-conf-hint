# Contributing

Welcome contributing:

- useful nginx.conf snippets reporting bug 
- helpful pull request
- report bug

[Pull Request][pr] & [Issues][issues]

## Executing npm install

Remember `npm install` if you want to rebuilding hint data or developing extension codes.

## How to add snippets

Putting your vscode style snippets javascript file into `snippets_src`.  
You can refer file `snippets_src/block_server.js`.

## File description

- `utils/*.js` scripts for getting hint data from nginx document web page and generating snippets
- `snippets_src` snippets
- `extension/*.js` extension main script files
- `hint_data/*.json` hint data json file generated automatically
- `syntaxes/nginx.tmLanguage` nginx config syntaxes description file 

[issues]: https://github.com/hangxingliu/vscode-nginx-conf-hint/issues
[pr]: https://github.com/hangxingliu/vscode-nginx-conf-hint/pulls
