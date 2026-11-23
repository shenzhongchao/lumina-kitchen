# LUMINA 创作台

面向 DeepSeek Harness（DSH）的摄影知识与 AI 画面创作插件。通过构图、光影、色彩、光学、材质、运镜和风格七个维度选择画面效果，再把想法和配料转化为图片或视频创作方案。

## 安装

在 DSH CLI 中安装固定版本的发布包：

```powershell
dsh plugin --profile web add https://github.com/shenzhongchao/lumina-kitchen/releases/download/v3.2.1/local-lumina-kitchen-3.2.1.tgz
```

重启或重载目标 DSH，在侧栏打开 LUMINA。此版本使用 `@local/lumina-kitchen` 包身份以兼容已有安装；暂不发布 npm，也未提交 DSH 插件市场。

已验证 DSH 0.2.2-rc.3；其他宿主版本尚未验证。

## 运镜动态演示

安装包约 25 MB，包含 454 个概念和 453 张静态预览。运镜页点击「加载动态演示」后，从本仓库 [media-v1 Release](https://github.com/shenzhongchao/lumina-kitchen/releases/tag/media-v1) 批量下载 97 个 GIF（307.8 MB），显示进度，支持取消、继续和失败重试。

全部文件通过大小、GIF 签名和 SHA-256 校验后统一替换静态图。只有可见卡片播放，离屏或隐藏标签页时恢复静态预览。可以切回静态图；已下载文件保存在本机，重启后无需重复下载。首次下载速度取决于用户到 GitHub 的网络；失败时可继续使用静态图并重试。

## 模型与数据

文字方案使用 DSH 的模型能力。图片/视频服务在插件的「API 配置」中设置，需要用户自己的服务账号，可能产生费用。下载教学 GIF 不调用生成模型。

用户数据保存在 `DSH_HOME/lumina-kitchen`（默认 `~/.dsh/lumina-kitchen`），API 密钥保存在本机配置文件中，不随插件发布。不要分享该数据目录。插件不会把本机实验和密钥上传到素材仓库。

## 开发与验证

需要 Node.js >= 20.3.0。仓库自带知识快照和静态图片，不依赖 LUMINA 主仓库。

```powershell
npm run build
node --test --test-concurrency=1 tests/*.test.mjs
npm pack
```

`npm pack` 会重建客户端并验证资源快照。详见 [INSTALL.md](INSTALL.md)。源码中的 `resources/data/motion-manifest.json` 固定远程资源的文件名、大小和 SHA-256。GIF 本体只作为 Releases 附件分发，不进入 Git 历史。

发布验收范围与限制见 [VALIDATION.md](VALIDATION.md)。
