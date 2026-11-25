# 光影厨房

**说出你想让观众感受到什么，看着例图选拍法，再决定这一镜怎么拍。**

光影厨房是 DSH 里为 AI 视频创作者准备的镜头试拍台。当你清楚这一幕的情绪和故事，却拿不准该换景别、调光线还是加运镜时，先看摄影例图确定拍法，再生成参考图或视频、并排对照、沿着更贴近故事的那一版继续。

比如「雨停后，她在街角等人」，想让观众感到她的孤单：用**远景**留出空街，孤单来自环境比例，但很难看清表情；换成**特写**靠近面部，等待时的神情更清楚，街道也会退到画面外。同一场戏，先看清不同拍法的取舍，再决定怎么拍。[看看这一镜怎么选](https://github.com/shenzhongchao/lumina-kitchen/blob/main/docs/shot-workbench.md)

[![观看 35 秒产品演示《街角的两种光》](https://github.com/shenzhongchao/lumina-kitchen/releases/download/promo-v1/promo-cover.jpg)](https://github.com/shenzhongchao/lumina-kitchen/releases/download/promo-v1/LUMINA-Streetlight.mp4)

> 点击封面查看 35 秒演示[《街角的两种光》（MP4，1080p）](https://github.com/shenzhongchao/lumina-kitchen/releases/download/promo-v1/LUMINA-Streetlight.mp4)，片中对照画面采用内置摄影例图演示。

## 可以做什么

- **把感觉落成摄影「配料」**：写下镜头想法后可生成推荐配料，或在构图、光影、色彩、光学、材质、运镜、风格 7 个维度（454 条概念）里对照例图、原理和常见误区挑选配料，并调节主导、辅助或点缀程度。
- **整理拍法，按需试拍**：在「创作详情」里将想法和配料整理成拍法说明与图片/视频提示词，可调整画幅和视频时长；先出参考图看构图光影，或直接生成短视频检验动态节奏。
- **保留条件，并排对照继续改**：每一版作品都会记录当时的想法、配料与提示词。支持「选两版对照」（视频可同步从头播放），选中更合适的一版后点「从这一版继续」带回设置微调。

## 安装

- **DSH 插件市场**：在插件市场搜索 `lumina-kitchen` 点击安装。
- **CLI 从 GitHub 仓库直接安装**（默认安装 `main` 分支，也可将 `#main` 替换为具体版本标签如 `#v3.2.3`）：

```bash
dsh plugin --profile web add "github:shenzhongchao/lumina-kitchen#main"
```

- **CLI 从 GitHub Release 安装固定版本压缩包**（预构建包，更多版本见 [Releases](https://github.com/shenzhongchao/lumina-kitchen/releases)）：

```bash
dsh plugin --profile web add https://github.com/shenzhongchao/lumina-kitchen/releases/download/v3.2.3/local-lumina-kitchen-3.2.3.tgz
```

> 也可在 DSH 网页端「插件 → 添加插件」中直接粘贴上述 `github:` 或 `.tgz` 地址。通过 CLI 安装后，重启或重载 DSH Web（`dsh web`）即可生效。

## 开始创作

在 DSH 侧栏打开「光影厨房」：

1. 在「想法与配料」写下画面想法，点「生成推荐配料表」，或直接从左侧摄影图谱挑选配料。
2. 进入「创作详情」，点「准备拍法」生成画面说明与提示词，可按需调整画幅和时长。
3. 生成图片或视频前，在右上角「API配置」中添加自己的媒体服务（支持 OpenAI 兼容图片接口、火山方舟、MiniMax 等）。
4. 生成多版后在作品区并排对照，挑出满意的一版继续调整。

## 运镜动态演示

拿不准镜头该怎么动时，可在运镜页点击「加载动态演示」，批量下载 97 个 GIF（约 308 MB）。支持取消、继续和失败重试，下载后缓存到本机，再次查看无需重复下载；仅播放可见卡片，也可随时切回静态图。

## 费用、数据与边界

- **费用**：推荐配料与准备拍法使用 DSH 的文字模型；图片和视频生成使用你配置的服务，可能产生费用，每次调用前会弹出确认。浏览图谱与下载动态演示不调用生成模型。
- **数据**：创作记录、生成作品、动态演示缓存和 API 密钥均保存在本机（`DSH_HOME/lumina-kitchen`），不会上传到本仓库。
- **边界**：摄影图谱与例图由 AI 辅助整理，供拍法参考；最终成片质量取决于你接入的生成模型。当前视频生成为文生视频，不会将本地参考图作为首帧上传。

[安装与配置](https://github.com/shenzhongchao/lumina-kitchen/blob/main/INSTALL.md) · [源码与反馈](https://github.com/shenzhongchao/lumina-kitchen)
