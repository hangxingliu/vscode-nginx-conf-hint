# CHANGELOG

### 0.3.0 (2021-11-20)

:mega: 这个版本更新了很多东西:

1. 从头到尾更新了 Nginx 配置文件的语法高亮(tmLanguage)
	- 因为之前使用来自 Sublime 插件和 Shanoor 仓库的语法已经很久没人更新了, 所以为了更好的代码高亮我写了一个新的语法
	- 新的语法是通过代码来生成的. 相关代码在这儿:  [generate-tmLanguage.ts](../src/syntax/generate-tmLanguage.ts)
	- 新的语法支持嵌入在 Nginx 配置文件中的 Lua 脚本块
	- 新的语法支持一个 Nginx 配置项写在多行
	- 旧的语法配置 `nginx-conf-hint.syntax` 被移除了
2. 优化了提示数据和文档数据的加载. 现在按需加载他们, 减少了内存使用
3. 这个插件兼容 Web 插件, 所以你可以在 <https://vscode.dev/> 上使用这个插件
4. 能自动补全的地方更多了, 并且新版的自动补全更加智能了
	1. 现在的自动补全是基于 Nginx 配置文件的语法和上下文来给出的
	2. 修复了之前许多错误的补全内容
	3. 可以自动补全命名了的 `location`
	4. 可以自动补全配置的参数
	5. 可以自动补全媒体类型
5. 支持了 `location` 的定义与使用间跳转
6. 添加了新的配置 `nginx-conf-hint.externalModules`, 可以用来控制是否开启 Nginx 外置的模块的补全
7. 这个插件现在是使用 Typescript 实现的了
