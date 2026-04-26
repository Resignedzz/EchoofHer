# resigned's Blog

个人博客，使用 Astro 构建。

## ✨ 功能

- 📝 Markdown / MDX 文章
- 🏷️ 标签分类
- 🔍 全文搜索 (Pagefind)
- 💬 评论系统 (Giscus)
- 📡 RSS 订阅
- 🌙 暗色模式
- 📱 响应式设计
- ⚡ 静态生成，极速加载

## 🚀 开始使用

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:4321

### 构建

```bash
npm run build
```

构建产物在 `dist/` 目录，包含 Pagefind 搜索索引。

### 预览构建结果

```bash
npm run preview
```

## 📁 项目结构

```
blog/
├── src/
│   ├── components/     # 组件（Header, Footer, ThemeToggle, Giscus）
│   ├── content/
│   │   └── blog/       # 📝 把 Markdown 文章放这里
│   ├── layouts/        # 页面布局
│   ├── pages/          # 路由页面
│   ├── styles/         # 全局样式
│   └── content.config.ts  # 内容集合定义
├── public/             # 静态资源
└── astro.config.mjs    # Astro 配置
```

## 📝 写文章

在 `src/content/blog/` 下创建 `.md` 或 `.mdx` 文件：

```markdown
---
title: 文章标题
description: 文章描述
date: 2026-04-26
tags:
  - 标签1
  - 标签2
---

正文内容...
```

### Frontmatter 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| title | ✅ | 文章标题 |
| description | ✅ | 文章描述（用于 SEO 和列表展示） |
| date | ✅ | 发布日期 |
| updated | ❌ | 更新日期 |
| tags | ❌ | 标签数组 |
| draft | ❌ | 草稿标记（设为 true 则不会构建） |

## ⚙️ 配置

### Giscus 评论

1. 前往 [giscus.app](https://giscus.app) 生成配置
2. 在 GitHub repo 中开启 Discussions 功能
3. 编辑 `src/components/Giscus.astro`，替换以下字段：
   - `data-repo` → 你的 GitHub 仓库（如 `username/repo`）
   - `data-repo-id` → 仓库 ID
   - `data-category` → 讨论区分类
   - `data-category-id` → 分类 ID

### 站点信息

- 博客名称、描述 → 编辑 `src/pages/index.astro` 的 hero 部分
- 站点 URL → 编辑 `astro.config.mjs` 的 `site` 字段
- Footer 链接 → 编辑 `src/components/Footer.astro`

## 🚢 部署

推荐使用 [Cloudflare Pages](https://pages.cloudflare.com) 或 [Vercel](https://vercel.com)：

1. 将代码推送到 GitHub
2. 在平台中导入仓库
3. 构建命令：`npm run build`
4. 输出目录：`dist`

免费额度完全够用，无需购买域名即可通过 `xxx.pages.dev` 访问。

## 🛠 技术栈

- [Astro](https://astro.build) — 静态站点生成器
- [Tailwind CSS](https://tailwindcss.com) — CSS 框架
- [Pagefind](https://pagefind.app) — 静态搜索
- [Giscus](https://giscus.app) — 评论系统
- [Shiki](https://shiki.style) — 代码高亮
