# 安装、构建与素材维护

## 安装

优先使用 README 中固定版本的 tarball 地址；也可下载附件后运行 `dsh plugin --profile web add <本地tgz绝对路径>`。升级保留同一包身份及用户数据目录。不要同时运行多个 DSH 进程写入同一数据目录。

## 配置

无需为动态演示配置地址，内置源为 `https://github.com/shenzhongchao/lumina-kitchen/releases/download/media-v1/`。管理员可用 `LUMINA_MOTION_BASE_URL` 环境变量或插件 `motionBaseUrl` 覆盖；显式空字符串可关闭远程源。正式源必须 HTTPS。`allowLocalMotionSource` 仅供本机测试，不能用于公共部署。

知识数据优先使用 `LUMINA_KITCHEN_DATA` / `dataDir` 显式配置，其次使用包内 `resources/data`。用户实验、媒体服务密钥和动态演示缓存均位于 DSH_HOME/lumina-kitchen，不写入安装目录。

## 构建

本仓库的资源快照与客户端可直接用于安装；`npm pack` 自动重建客户端并核对资源哈希，不需要父仓库。想更新知识数据时运行 `node scripts/bundle-data.mjs <包含data及assets的web目录>`。更新前检查来源与分发权限，更新后提交快照及 manifest，运行测试。

`private: true` 保留以阻止意外发布 npm；它不阻止从 GitHub Release 安装。本仓库不添加 dsh-plugin Topic，不提交市场收录。

## 动态素材发布

每个素材版本使用独立标签，当前是 media-v1。上传 motion-manifest.json 中列出的全部 GIF 及清单本身；不可替换同一标签下不同内容的附件。未来更新素材时创建新标签，更新清单与 src/motion-source.js 的固定地址，并重新发插件版本。

并发下载数为 3，单文件最大 64 MiB、超时 120 秒；校验后才写正式缓存。取消保留完整文件并清理未完成文件；重试仅补缺失项，不支持单个文件的断点续传。全部成功后切换动图，静态/动态选择持久保存。旧版本缓存暂不自动清理。

## 隔离验证

在临时空目录安装 tgz，设置独立 DSH_HOME，执行 `node <源码目录>/scripts/verify-package.mjs <安装后的包目录>`。该脚本使用模拟宿主，不调用生成模型，也不下载 GIF。

UI 本地预览：另行在临时目录安装 React 18/ReactDOM 18，运行 `node scripts/preview-interactive.mjs <临时目录>/node_modules`。若测试下载失败/取消，先设置 LUMINA_MOTION_SOURCE_DIR 为本机 GIF 目录，启动 `node scripts/preview-motion-source.mjs`，再给预览脚本追加 `--motion-fixture`。两者只监听本机地址。真实 DSH 安装与公网下载验证应另外执行。
