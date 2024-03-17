---
date: 2024-03-17
---
# Release New Version SOP

1. Modify the version field (and `preview` field) in [package.json](../package.json)
2. Add new section in [CHANGELOG.md](./CHANGELOG.md) and [CHANGELOG.zh-Hans.md](./CHANGELOG.zh-Hans.md)
3. Update changelog section in [README.md](../README.md)
4. Waiting for Github CI build to be done
5. Download the built extension `vsix` file and test it on the following platform/app: (*Install from VSIX...*)
    1. Visual Studio Code
    2. Visual Studio Code Web - (See the subsequent section to get details)
    3. VSCodium - <https://vscodium.com/>
6. Trigger `publish-vscode-extension` workflow on Github 
7. Check it on <https://marketplace.visualstudio.com/manage/publishers/hangxingliu> after 10~15 minutes
8. Create and push Git tag. e.g., `git tag 2.0.0-preview`, `git push --tags`
9. Create a new release at [github-release-new]
    - Title: `<major>.<minor>.<patch>[-pre.<no>] (<year>-<month>-<day>)`
    - Content: copying from the [CHANGELOG.md](./CHANGELOG.md)
    - Assets: `*.vsix`
10. Release vsix file to Open VSX
    - URL: <https://open-vsx.org/user-settings/extensions>
    - **ONLY** Publish vsix file built through CI from: [github-ci]

## Test extension in Visual Studio Code Web

``` bash
mkdir testdir
cd testdir
# copy the built vsix file into this directory
unzip -o -d . *.vsix
yarn add @vscode/test-web
./node_modules/.bin/vscode-test-web none --extensionDevelopmentPath extension

# OR copying the built vsix file into `vscode-test-web` project
./unzip-vsix.sh
yarn start
```


## Create a New Access Token

<https://hangxingliu.visualstudio.com/_usersSettings/tokens>

- Name: `balabalabala...`
- Organization: `hangxingliu`
- Expiration (UTC): `30days`
- Scopes: (Click "Show all scopes")
    - [x] Marketplace > Manage


[github-ci]: https://github.com/hangxingliu/vscode-nginx-conf-hint/actions/workflows/ci.yaml
[github-release-new]: https://github.com/hangxingliu/vscode-nginx-conf-hint/releases/new
