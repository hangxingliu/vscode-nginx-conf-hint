# Manifest format

``` javascript
line = [1, moduleName1, moduleName2, ...]


line = [2, name, syntax, defaultValue, contexts, moduleNameIndex, since, link, completionItem];
// Eg:
line = [2,"accept_mutex",["accept_mutex on | off;"],"accept_mutex off;",["events"],"ngx_core_module",null,"ngx_core_module.html#accept_mutex",null]
```
