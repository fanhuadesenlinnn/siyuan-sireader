<div align="center">

# 思阅 SiReader

一款免费、开源的思源笔记电子书阅读器。

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/mm-o/siyuan-sireader/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![SiYuan](https://img.shields.io/badge/SiYuan-2.10.14+-orange.svg)](https://github.com/siyuan-note/siyuan)

[English](README.md) · [更新日志](CHANGELOG.md) · [问题反馈](https://github.com/mm-o/siyuan-sireader/issues)

</div>

SiReader 支持 EPUB、PDF、MOBI、AZW3、FB2、CBZ、TXT 和在线网页阅读。项目不包含会员、激活码或付费功能限制，仓库内提供的功能均可免费使用。

## 主要功能

- 专业书架：导入、分组、筛选、编辑、批量整理和阅读统计。
- EPUB/TXT 阅读：目录、搜索、主题、字体、排版、书签、标注和回链。
- PDF 阅读：搜索、目录、缩略图、表单、签名、印章、截图、打印、导出和丰富批注。
- 笔记联动：将摘录、笔记和图片发送到思源文档，支持自定义链接模板。
- 阅读辅助：TTS 朗读、翻译、在线词典和 StarDict/dictd 离线词典。
- 在线内容：网页转阅读模式、Project Gutenberg、Standard Ebooks 和用户自定义书源。
- 微信读书：使用用户自行申请和配置的 API Key 连接相关能力。

![SiReader 预览](preview.png)

## 安装

### 思源集市

在思源笔记中打开“集市 → 插件”，搜索 `SiReader` 或“思阅”并安装。

### 手动安装

1. 从 [Releases](https://github.com/mm-o/siyuan-sireader/releases) 下载 `package.zip`。
2. 解压到思源工作空间的 `data/plugins/siyuan-sireader` 目录。
3. 重启思源笔记并启用插件。

## 本地开发

要求 Node.js 22.13 或更高版本，并使用仓库声明的 pnpm 版本。

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

在 `.env` 中把 `VITE_SIYUAN_WORKSPACE_PATH` 设置为本机思源工作空间路径。生产构建：

```bash
pnpm test:run
pnpm build
```

构建结果位于 `dist/`，同时生成用于发布的 `package.zip`。

## 数据与第三方服务

- 书籍、标注、设置和离线词典保存在用户自己的思源工作空间中。
- 翻译、在线词典、在线书源、TTS 和微信读书会访问相应第三方服务，其可用性和条款由服务提供方决定。
- SiReader 不提供或托管受版权保护的电子书。使用网络书源时，请遵守所在地法律和内容来源的许可协议。
- 微信读书 API Key 由用户自行配置；请勿把个人 Key 提交到仓库或分享给他人。

## 参与贡献

欢迎提交 Issue 和 Pull Request。开始之前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，安全问题请按 [SECURITY.md](SECURITY.md) 中的方式报告。

## 许可证

SiReader 使用 [MIT License](LICENSE)。第三方组件和随包资源仍受各自许可证约束。
