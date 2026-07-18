<div align="center">

# SiReader

A free and open-source ebook reader for SiYuan Note.

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/mm-o/siyuan-sireader/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![SiYuan](https://img.shields.io/badge/SiYuan-2.10.14+-orange.svg)](https://github.com/siyuan-note/siyuan)

[简体中文](README_zh_CN.md) · [Changelog](CHANGELOG.md) · [Issues](https://github.com/mm-o/siyuan-sireader/issues)

</div>

SiReader supports EPUB, PDF, MOBI, AZW3, FB2, CBZ, TXT, and online webpages. It has no memberships, activation codes, or paid feature gates: every feature shipped in this repository is free to use.

## Highlights

- Bookshelf management with import, groups, filters, metadata editing, batch actions, and reading statistics.
- EPUB/TXT reading with TOC, search, themes, typography, bookmarks, annotations, and backlinks.
- PDF reading with search, TOC, thumbnails, forms, signatures, stamps, screenshots, printing, export, and rich annotations.
- SiYuan integration for sending excerpts, notes, and images to documents with customizable link templates.
- TTS, translation, online dictionaries, and offline StarDict/dictd dictionaries.
- Readable webpage conversion, Project Gutenberg, Standard Ebooks, and user-defined book sources.
- WeRead integration using an API key configured by the user.

![SiReader preview](preview.png)

## Installation

### SiYuan Marketplace

Open Marketplace → Plugins in SiYuan, then search for `SiReader`.

### Manual installation

1. Download `package.zip` from [Releases](https://github.com/mm-o/siyuan-sireader/releases).
2. Extract it to `data/plugins/siyuan-sireader` in your SiYuan workspace.
3. Restart SiYuan and enable the plugin.

## Development

Node.js 20 or newer is required. Use the pnpm version declared by the repository.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Set `VITE_SIYUAN_WORKSPACE_PATH` in `.env` to your local SiYuan workspace. To verify and build a release:

```bash
pnpm test:run
pnpm build
```

The build is written to `dist/` and also produces the release `package.zip`.

## Data and external services

- Books, annotations, settings, and offline dictionaries stay in the user's SiYuan workspace.
- Translation, online dictionaries, online sources, TTS, and WeRead contact their respective third-party services and remain subject to those services' availability and terms.
- SiReader does not provide or host copyrighted ebooks. Users are responsible for complying with local law and source licenses.
- WeRead API keys are user-provided secrets and must not be committed or shared.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing and use the process in [SECURITY.md](SECURITY.md) for security reports.

## License

SiReader is released under the [MIT License](LICENSE). Bundled third-party components and assets remain subject to their own licenses.
