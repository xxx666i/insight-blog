# DuDuLu

DuDuLu 的 Git 驱动个人网站。使用 Astro Content Collections 管理文章、随记和项目，静态生成后部署到 GitHub Pages。

## 本地开发

```bash
npm install
npm run dev
```

常用检查：

```bash
npm run check       # Astro 与 TypeScript
npm run build       # 生产构建
npm run test        # 类型、构建、路由和浏览器验收
npm run test:pages  # 验证 GitHub Pages 构建路径
```

## 写内容

内容分别放在：

- `src/content/posts/`：长文章，必填标题、摘要、日期与稳定英文 `slug`；
- `src/content/notes/`：短随记，标题可省略；
- `src/content/projects/`：项目案例或外部项目条目。

建议每篇内容单独放在一个目录中，正文使用 `index.md` 或 `index.mdx`，图片与正文同目录。`draft: true` 的内容会在本地开发时显示，但不会进入生产页面、搜索、RSS 或站点地图。

文章代码块支持文件名、行号、行高亮与 diff：

````md
```ts title="src/example.ts" showLineNumbers {2}
const ready = true;
console.log(ready);
```
````

Mermaid 和数学公式需在文章 frontmatter 中分别启用 `mermaid: true`、`math: true`。数学样式只会出现在启用它的页面。

## 个人信息

网站名称、简介、头像和可选链接集中在 `src/config.ts`。当前头像为空，界面只保留中性的头像槽位，不包含虚构人物图像。

## 部署

仓库内的 `.github/workflows/deploy.yml` 提供完整的 GitHub Actions 工作流。Pull Request 会运行检查与浏览器验收；合并或推送到 `main` 后，会再次验证并部署到 GitHub Pages。

如使用自定义域名，在仓库环境中设置 `PUBLIC_SITE_URL=https://你的域名`。未设置时，网站地址为 `https://xxx666i.github.io/`。

## 版权

网站原创文字与图片默认保留所有权利。文章中的代码示例只有在文章元数据明确给出 `codeLicense` 时，才按对应许可使用。
