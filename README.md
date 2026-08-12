# Insight Blog

[简体中文](./README.md) · [English](./README.en.md)

Xiaoxin 的 Git 驱动个人博客。使用 Astro Content Collections 管理文章、随记和项目，通过静态生成获得简单、快速且可迁移的发布体验。

- 在线地址：[https://xxx666i.github.io/insight-blog/](https://xxx666i.github.io/insight-blog/)
- 源码仓库：[xxx666i/insight-blog](https://github.com/xxx666i/insight-blog)

## 功能

- 文章、随记和项目三类内容集合，frontmatter 由 Zod 校验；
- Markdown 与 MDX，支持 GFM、数学公式、Mermaid 和脚注；
- Shiki 双主题代码高亮，支持文件名、行号、高亮行与 diff；
- 标签归档、本地全文搜索、相关文章和阅读时长；
- RSS、Sitemap、robots.txt 和自动生成的 Open Graph 图片；
- 浅色、深色、跟随系统三态主题；
- 响应式布局、移动端导航和自定义 404 页面；
- 静态产物巡检、桌面端与移动端 Playwright 验收；
- GitHub Actions 验证并自动部署至 GitHub Pages。

## 技术栈

| 领域 | 技术 |
| --- | --- |
| 框架 | Astro 6、TypeScript 6、原生 JavaScript |
| 内容 | Astro Content Collections、Markdown、MDX、Zod |
| 样式 | Tailwind CSS 4、Astro Scoped CSS、Noto Serif SC |
| Markdown | Remark GFM、Remark Math、KaTeX、Mermaid、Shiki |
| 站点能力 | RSS、Sitemap、Satori、Resvg |
| 测试 | Astro Check、自定义构建巡检、Playwright |
| 工具链 | Node.js 24、pnpm 10.30.2、GitHub Actions、GitHub Pages |

站点为纯静态应用，不需要后端服务、数据库或管理后台。

## 快速开始

### 环境要求

- Node.js 24；
- pnpm 10.30.2，项目通过 `packageManager` 字段固定版本。

Corepack 可以准备匹配的 pnpm 版本：

```bash
corepack enable
corepack install
```

### 安装与启动

```bash
git clone git@github.com:xxx666i/insight-blog.git
cd insight-blog
pnpm install --frozen-lockfile
pnpm dev
```

访问 [http://localhost:4321](http://localhost:4321)。结束开发服务器时按 `Ctrl + C`。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm check` | 检查 Astro 与 TypeScript |
| `pnpm build` | 生成 `dist/` 静态产物 |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm test:routes` | 检查产物、内部链接、草稿和搜索索引 |
| `pnpm test:e2e` | 运行 Playwright 桌面端与移动端测试 |
| `pnpm test` | 依次执行检查、构建、产物巡检和 E2E 测试 |
| `pnpm test:pages` | 验证 `/insight-blog/` GitHub Pages 基路径 |

如需改变开发端口：

```bash
pnpm dev -- --port 4322
```

## 项目结构

```text
.
├─ .github/workflows/       # CI 与 GitHub Pages 部署
├─ public/                  # 原样复制的静态资源
├─ scripts/                 # 构建产物和 Pages 路径巡检
├─ src/
│  ├─ components/           # 通用界面组件
│  ├─ content/              # 文章、随记和项目内容
│  ├─ layouts/              # 页面与文章布局
│  ├─ lib/                  # 内容查询和 URL 工具
│  ├─ pages/                # Astro 文件路由与资源端点
│  ├─ styles/               # 全局设计变量和样式
│  ├─ config.ts             # 站点名称、作者、头像和导航
│  └─ content.config.ts     # Content Collections schema
├─ tests/                   # Playwright 验收测试
├─ astro.config.mjs         # Astro、Markdown 与构建配置
└─ pnpm-lock.yaml           # 可复现依赖锁文件
```

## 内容管理

| 类型 | 目录 | 主要用途 |
| --- | --- | --- |
| 文章 | `src/content/posts/` | 完整的长篇写作 |
| 随记 | `src/content/notes/` | 短片段与即时观察 |
| 项目 | `src/content/projects/` | 项目背景、取舍和结果 |

建议每篇内容使用独立目录，正文命名为 `index.md` 或 `index.mdx`，图片与正文放在一起。`slug` 应使用稳定的小写英文 kebab-case；发布后尽量不要修改，以免破坏永久链接。

### 新建文章

```md
---
slug: my-first-post
title: 我的第一篇文章
description: 一句话说明文章内容。
publishedAt: 2026-08-12
tags:
  - Astro
draft: true
lang: zh-CN
math: false
mermaid: false
---

从这里开始写正文。
```

文章还支持可选字段：`updatedAt`、`cover` 和 `codeLicense`。

### 新建随记

```md
---
slug: a-small-thought
publishedAt: 2026-08-12
tags:
  - 随想
draft: true
lang: zh-CN
---

一段不必扩展成长文的记录。
```

随记的 `title` 可以省略。

### 新建项目

项目需要 `title`、`summary` 和 `status`。其中 `status` 只能是：

- `in-progress`：进行中；
- `completed`：已完成；
- `archived`：已归档。

还可使用 `featured`、`period`、`role`、`technologies`、`image`、`externalUrl` 和 `sourceUrl`。

### 草稿与发布

`draft: true` 的内容可在开发环境预览，但不会进入生产页面、搜索索引、RSS 或 Sitemap。准备发布时改为 `draft: false`，执行 `pnpm test`，再通过 Pull Request 合并到 `main`。

## Markdown 扩展

启用数学公式或 Mermaid 时，需要同时设置文章 frontmatter：

```yaml
math: true
mermaid: true
```

代码块支持附加元数据：

````md
```ts title="src/example.ts" showLineNumbers {2}
const ready = true;
console.log(ready);
```
````

## 个性化

编辑 [`src/config.ts`](./src/config.ts) 可以修改站点名称、作者、GitHub 地址、联系邮箱、头像、关于页面内容和主导航。头像目前为空，页面会显示预留槽位；可以使用外部绝对 URL，或使用与当前部署基路径匹配的静态资源地址。

## 测试与质量门禁

提交前推荐运行：

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm test:pages
```

`pnpm test` 会检查类型、生成 15 个 HTML 页面、验证内部链接和搜索/RSS 产物，并运行桌面端与移动端浏览器测试。`pnpm test:pages` 会再次构建并验证 GitHub Pages 子路径。

## 部署

工作流位于 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)：

1. Pull Request 执行检查、构建和浏览器验收；
2. 推送或合并到 `main` 后重复验证；
3. 使用 Astro 官方 Action 构建静态产物；
4. 部署至 `https://xxx666i.github.io/insight-blog/`。

`INSIGHT_BLOG_PAGES_BUILD` 是工作流使用的内部构建开关，用来启用 `/insight-blog/` 基路径。

Astro 配置也支持在构建环境中传入 `PUBLIC_SITE_URL=https://example.com`，此时使用自定义站点地址和 `/` 基路径。若要在 GitHub Actions 中启用它，还需要在工作流中显式传递该变量，并在 GitHub Pages 设置中完成 DNS 与域名验证。

## 常见问题

### `node_modules` 可以删除吗？

可以。它是被 `.gitignore` 排除的本地产物，删除后运行 `pnpm install --frozen-lockfile` 即可恢复。

### 为什么只提交 `pnpm-lock.yaml`？

pnpm 是本项目唯一包管理器。不要生成或提交 `package-lock.json`、`yarn.lock`，避免 CI 和本地解析出不同依赖树。

### 为什么本地正常，Pages 链接却可能失效？

GitHub Project Pages 部署在 `/insight-blog/` 子路径。站内链接应通过项目现有的 `withBase()` 工具或 Astro 基路径生成，不要假设网站部署在域名根路径。

## 版权

网站原创文字与图片默认保留所有权利。文章中的代码示例只有在 frontmatter 明确提供 `codeLicense` 时，才按对应许可证使用。
