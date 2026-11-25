# LUMINA Kitchen 发布流程

插件在本仓库开发和打包，以 GitHub Release 分发。DSH 市场条目的 `tarball` 固定指向某个版本的安装包。推送代码后，只有更新这个地址并等市场目录刷新，用户才会从市场装到新版。

## 1. 准备并验证安装包

在 `lumina-kitchen` 目录操作。将 `package.json` 的 `version` 改为本次版本，保留包名 `@local/lumina-kitchen`。知识或静态预览有变化时，按 [INSTALL.md](../INSTALL.md) 更新资源快照。

在新的 PowerShell 窗口中逐条执行，某一步报错时先修复再继续：

```powershell
node --test --test-concurrency=1 tests/*.test.mjs
$version = (Get-Content -Raw package.json | ConvertFrom-Json).version
$releaseDir = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ("lumina-release-" + [guid]::NewGuid()))
npm pack --pack-destination $releaseDir.FullName
$packageFile = Join-Path $releaseDir.FullName "local-lumina-kitchen-$version.tgz"
$env:DSH_HOME = Join-Path $releaseDir.FullName 'dsh-home'
Remove-Item Env:LUMINA_KITCHEN_DATA -ErrorAction SilentlyContinue
dsh plugin --profile web add $packageFile
$installed = Join-Path $env:DSH_HOME 'profiles/web/node_modules/@local/lumina-kitchen'
npm run verify:package -- $installed
```

`npm pack` 会重建客户端并检查资源。验证脚本在模拟宿主中检查已安装包的资源哈希、接口和工具。市场安装和真实 GIF 下载在第 4 步验收。

## 2. 发布 GitHub Release

检查 `git diff` 和 `git status`，把本次发布所需的代码、版本号、构建产物和资源提交并推送。确认当前提交正是刚才打包验证的版本，再在同一个 PowerShell 窗口执行：

```powershell
$releaseCommit = git rev-parse HEAD
gh release create "v$version" $packageFile --repo shenzhongchao/lumina-kitchen --target $releaseCommit --title "LUMINA Kitchen $version" --generate-notes
gh release view "v$version" --repo shenzhongchao/lumina-kitchen --json assets --jq '.assets[].url'
```

从输出复制以 `.tgz` 结尾的附件下载地址。核对标签、文件名和包内版本一致，例如 `v3.2.2/local-lumina-kitchen-3.2.2.tgz`。如果发现已发布的包有误，使用新版本号发布修复包，保留旧附件供已有安装地址使用。

**只有 GIF 内容变化时才发布新的素材版本。** 将全套 GIF 和对应的 `motion-manifest.json` 上传到新素材标签（如 `media-v2`），在插件中一并更新 `resources/data/motion-manifest.json` 和 `src/motion-source.js`。这项工作应在第 1 步打包前完成。纯代码更新继续使用原素材标签。

## 3. 更新 DSH 市场条目

LUMINA 已经[首次收录](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/18107)。以后每次发版，在市场仓库编辑[现有条目](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/data/plugins/shenzhongchao__lumina-kitchen.yml)，将 `tarball` 替换为第 2 步的附件下载地址。功能简介有变化时同步更新 `description`。向市场仓库的 `main` 提交 PR，在说明里写明旧版、新版和试装结果。

首次提交新插件时，按[贡献指南](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)新建 `data/plugins/<owner>__<repo>.yml`，填写仓库地址、名称、分类、英文简介及安装包地址，可附中文简介。仓库需创建满一天，带有 `dsh-plugin` topic，并在 `package.json` 声明可安装的 `dsh.bundle`。市场 README 由条目自动生成。

## 4. 从市场安装验收

1. 确认市场 PR 已合并，目录显示本次版本或对应的安装包地址。在另一个全新的 DSH 环境中打开插件市场，搜索 `lumina-kitchen` 并点击安装。
2. 打开插件详情，核对版本和简介。进入 LUMINA，确认知识卡片与静态预览能打开。
3. 在运镜页点击「加载动态演示」，观察进度，验证取消后可以继续。下载完成后对照本版素材清单核对数量，滚动确认可见卡片播放、离屏卡片恢复静态图。重启 DSH 后断网打开运镜页，确认动图可以从缓存播放。
4. 记录插件版本、Release 链接、市场 PR、DSH 版本以及实际验证结果。若目录仍显示旧版，先核对已合并条目的 `tarball` 和市场刷新状态，等新版可见后再验收。
