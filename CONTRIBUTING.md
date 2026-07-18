# Contributing to SiReader

感谢你参与 SiReader。提交改动前，请先搜索现有 Issue，避免重复工作。

## 开发流程

1. Fork 仓库并从 `main` 创建分支。
2. 使用 Node.js 22.13+ 和 `package.json` 声明的 pnpm 版本。
3. 运行 `pnpm install --frozen-lockfile`。
4. 完成改动，并为可独立测试的逻辑补充测试。
5. 提交前运行以下检查：

```bash
pnpm test:run
pnpm build
```

Pull Request 应说明改动目的、验证方式，以及对用户数据或兼容性的影响。界面改动建议附截图。

## 代码与数据要求

- 不要提交 API Key、Cookie、Token、私人书源、用户数据或工作空间文件。
- 新增网络服务时，应说明服务条款、隐私影响和失效时的降级行为。
- 新增依赖前确认许可证与 MIT 项目兼容，并尽量避免不必要的依赖。
- 不要提交未获授权的电子书、词典或其它受版权保护内容。
