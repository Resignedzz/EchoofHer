# 博客技术栈全览

> 生成于 2026-06-12，覆盖博客所有知识点，方便后续学习。

---

## 1. Astro 框架核心

| 知识点 | 博客中的应用 | 学习资源 |
|--------|-------------|---------|
| **静态站点生成 (SSG)** | 全站预渲染为静态 HTML，部署到 Cloudflare Pages | [Astro 文档](https://docs.astro.build) |
| **岛屿架构 (Islands)** | 交互组件（NowPlaying、ThemeToggle）按需加载 JS，纯展示组件零 JS | Astro 核心概念 |
| **内容集合 (Content Collections)** | `src/content/blog/`、`snippets/`、`books/` 用 Zod 定义 frontmatter schema → `src/content.config.ts` | [内容集合指南](https://docs.astro.build/en/guides/content-collections/) |
| **动态路由** | `[slug].astro`、`[tag].astro`、`[id].astro` 根据内容自动生成页面 | [Astro 路由文档](https://docs.astro.build/en/basics/routing/) |
| **布局 (Layouts)** | `BaseLayout.astro`（全局壳）+ `BlogPostLayout.astro`（文章壳）嵌套复用 | [布局文档](https://docs.astro.build/en/basics/layouts/) |
| **组件 (Components)** | 20 个 Astro 组件，`.astro` 文件 = HTML + `<script>` + `<style>` 三位一体 | [组件文档](https://docs.astro.build/en/basics/astro-components/) |
| **`<script is:inline>`** | 内联 JS 不经过 Astro/esbuild 打包，用于需要直接操作 DOM 的场景 | Astro 脚本指令 |
| **`<style is:inline>`** | CSS 不被 scoped 或 purged，放在 `</body>` 前可覆盖 Tailwind | Astro 样式指令 |
| **API 路由** | `src/pages/api/netease.ts` 使用 Cloudflare Functions 做音乐代理 | [端点文档](https://docs.astro.build/en/guides/endpoints/) |
| **Markdown 插件** | `remark-math` + `rehype-katex` 管道处理数学公式 | remark/rehype 生态 |
| **Shiki 代码高亮** | `shikiConfig.theme: 'github-dark'` 自动高亮所有代码块 | [Shiki 文档](https://shiki.style/) |
| **RSS** | `src/pages/rss.xml.ts` 自动生成 RSS feed | [@astrojs/rss](https://docs.astro.build/en/guides/rss/) |
| **Sitemap** | `@astrojs/sitemap` 自动生成 sitemap.xml | [文档](https://docs.astro.build/en/guides/integrations-guide/sitemap/) |

---

## 2. Tailwind CSS

| 知识点 | 博客中的应用 | 学习资源 |
|--------|-------------|---------|
| **Utility-first** | 所有布局/间距/颜色/响应式断点用 Tailwind 工具类 | [Tailwind 文档](https://tailwindcss.com/docs) |
| **`@layer` 机制** | 自定义 CSS 放在非 layer 位置可防 Tailwind purge | [layer 文档](https://tailwindcss.com/docs/adding-custom-styles#using-css-and-layer) |
| **自定义主题变量** | CSS 自定义属性 `--glass-bg`、`--tint-blue` 等扩展 Tailwind 色彩系统 | CSS Variables |
| **暗色模式** | `class="dark"` 策略，通过 `html.light` 切换 CSS 变量 | [Tailwind 暗色模式](https://tailwindcss.com/docs/dark-mode) |
| **响应式设计** | `sm:` `md:` `lg:` `xl:` 断点实现移动端适配 | Tailwind 响应式 |
| **`@astrojs/tailwind` v6** | Astro 官方 Tailwind 集成 | [文档](https://docs.astro.build/en/guides/integrations-guide/tailwind/) |

---

## 3. HTML5 Canvas 动画

### 星球纹背景 (ParticleTrail.astro)

| 知识点 | 实现细节 | 学习资源 |
|--------|---------|---------|
| **Canvas 初始化** | `canvas.getContext('2d')` + `requestAnimationFrame` 60fps 动画循环 | [MDN Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| **对数螺旋公式** | `r = r₀·e^(k·θ)` 生成星系旋臂粒子分布 | 极坐标/对数螺旋 |
| **3D 透视投影** | `scale = focalLength / (z + focalLength)` 实现近大远小 | 3D 投影数学 |
| **深度排序** | `Array.sort((a,b) => a.scale - b.scale)` 先画远再画近 | z-sorting |
| **径向渐变** | `ctx.createRadialGradient()` 核心发光、光晕 | MDN 渐变 |
| **粒子闪烁** | `Math.sin(time * speed + phase)` 独立闪烁周期 | 正弦函数 |
| **滚轮缩放** | `wheel` 事件控制 `focalLength` 实现缩放 | MDN WheelEvent |
| **Canvas 深色/亮色切换** | 每帧检查 `html.light` class 切换粒子颜色和背景 | MutationObserver |

### 3D 标签云 (TagCloud.astro)

| 知识点 | 实现细节 | 学习资源 |
|--------|---------|---------|
| **球面均匀分布** | 黄金角度 `φ = acos(1 - 2*(i+0.5)/n)` 散布标签 | 球面分布算法 |
| **拖拽旋转** | `pointerdown/move/up` 事件控制旋转角 | MDN Pointer Events |
| **深度排序** | 按 z 坐标排序 + `fillStyle` alpha 通道实现远近效果 | Canvas 渲染顺序 |

### HeroGlobe (HeroGlobe.astro)

| 知识点 | 实现细节 | 学习资源 |
|--------|---------|---------|
| **球体投影** | `x = r·cos(θ)·cos(φ)`, `y = r·sin(φ)` 画星球 | 球坐标 |
| **鼠标拖拽** | pointer 事件更新 `dragAngleX/Y` 旋转星球 | 交互设计 |
| **大陆/云层/大气** | 多层 dots + 径向渐变 rim glow 模拟行星 | Canvas 分层绘制 |

### 其他 Canvas 组件

| 组件 | 知识点 |
|------|--------|
| **Clock.astro** | SVG 时钟：`setTransform` 旋转时针/分针/秒针 |
| **ScrollTop.astro** | Canvas 环形进度条：`arc()` + `stroke`，监听 `scroll` 事件 |

---

## 4. Markdown/MDX 增强

| 知识点 | 实现 | 学习资源 |
|--------|------|---------|
| **KaTeX 数学公式** | `$inline$` 和 `$$block$$` 渲染，`remark-math` 解析 + `rehype-katex` 输出 HTML | [KaTeX 文档](https://katex.org/) |
| **Mermaid 图表** | `MermaidRenderer.astro` 客户端加载 mermaid.js 渲染 `pre[data-language="mermaid"]` | [Mermaid 文档](https://mermaid.js.org/) |
| **代码高亮** | Astro 内置 Shiki + `github-dark` 主题 | Shiki |
| **图片灯箱** | `ImageLightbox.astro`：点击文章图片 → 全屏遮罩 + 放大 | DOM 事件处理 |

---

## 5. Cloudflare Pages 部署

| 知识点 | 详细 | 学习资源 |
|--------|------|---------|
| **Cloudflare Functions** | `functions/api/` 下的 TypeScript 自动成为 Serverless 端点 | [CF Functions](https://developers.cloudflare.com/pages/functions/) |
| **音乐代理** | `functions/api/netease.ts` 代理网易云音乐 API（播放列表、歌词、歌曲详情） | Fetch API |
| **评论系统** | `functions/api/comments.ts` 用 GitHub Issues API 做后端，每个帖子一个 Issue | [GitHub Issues API](https://docs.github.com/en/rest/issues) |
| **Wrangler CLI** | `wrangler pages deploy dist --project-name=echoofher` 直接部署 | [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/) |
| **CDN 加速** | Cloudflare 全球 CDN 分发静态资源 | Cloudflare CDN |

---

## 6. 第三方集成

| 集成 | 用途 | 技术点 |
|------|------|--------|
| **Giscus** | GitHub Discussions 驱动的评论区 | `<script>` 嵌入 + `data-*` 属性配置 |
| **Pagefind** | 纯静态站内搜索 | 构建时生成索引 → `pagefind.search()` |
| **busuanzi** | 不蒜子访问统计 | 脚本标签注入 |
| **Google Fonts** | Inter + Noto Sans SC 字体 | CSS `@import` |
| **GitHub Heatmap** | `ghchart.rshah.org` 生成 SVG 贡献图，构建时抓取 | fetch + 正则解析 |

---

## 7. CSS 高级技巧

| 技巧 | 博客中的应用 | 学习资源 |
|------|-------------|---------|
| **Glassmorphism（毛玻璃）** | `backdrop-filter: blur()` + 半透明背景 + 细边框 | [玻璃态教程](https://css.glass/) |
| **CSS 自定义属性** | `--bg`, `--accent`, `--glass-bg` 等全局变量 | [CSS 变量](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) |
| **深色/亮色主题切换** | `html.light` class → CSS 变量值全量切换 | CSS 变量 + JS |
| **`MutationObserver`** | 监听 `html` class 变化驱动 Canvas 主题响应 | MDN MutationObserver |
| **CSS 动画** | `@keyframes` 实现打字机效果、背景漂移、淡入 | CSS Animations |
| **`z-index` 分层** | canvas(z:1) → 内容(z:10-50) → 弹窗(z:1000) | CSS 层叠上下文 |
| **`pointer-events: none`** | Canvas 背景不拦截鼠标事件 | CSS 交互 |
| **Masonry 布局** | Photos 页用 `column-count` CSS 实现瀑布流 | CSS Columns |

---

## 8. TypeScript / Node.js

| 知识点 | 应用 | 学习资源 |
|--------|------|---------|
| **Astro 端点类型** | `APIRoute` 类型定义 API 函数签名 | Astro 类型 |
| **Fetch API** | `functions/api/` 中大量使用 `fetch()` 请求第三方 API | MDN Fetch |
| **环境变量** | `process.env.GITHUB_TOKEN` 管理密钥 | Node.js 环境变量 |
| **CORS** | Cloudflare Functions 自动处理跨域 | CORS 基础 |
| **CLI 脚本** | `scripts/generate-summaries.mjs` 用 Node.js 处理 Markdown | Node.js 脚本 |

---

## 9. 构建与工具链

| 工具 | 用途 | 学习资源 |
|------|------|---------|
| **Astro Build** | `astro build` 预渲染全站为静态 HTML | Astro CLI |
| **Pagefind CLI** | 构建后索引静态文件生成搜索数据 | [Pagefind](https://pagefind.app/) |
| **Wrangler** | Cloudflare Pages 部署 CLI | Wrangler |
| **npm** | 包管理，`package.json` 脚本 | npm 文档 |
| **Git** | 版本控制 | Git 基础 |
| **PowerShell** | Windows 命令行，`;` 连接命令 | PowerShell 基础 |

---

## 10. 博客完整组件清单

| 组件 | 类型 | 核心技术 |
|------|------|---------|
| `BaseLayout.astro` | 布局 | `<html>` 壳 + 全局 CSS + Canvas 背景 + 字体 |
| `BlogPostLayout.astro` | 布局 | 文章壳 + Giscus + 灯箱 + Mermaid + 目录 |
| `Header.astro` | 导航 | 响应式汉堡菜单 + 暗色切换按钮 |
| `Footer.astro` | 页脚 | 社交链接 + busuanzi |
| `ThemeToggle.astro` | 交互 | `localStorage` + `classList.toggle('light')` |
| `NowPlaying.astro` | 交互 | `<audio>` + 歌词同步 + 网易云 API 代理 |
| `HeroGlobe.astro` | 动画 | Canvas 3D 星球 |
| `ParticleTrail.astro` | 动画 | Canvas 星系旋臂 + 樱花花瓣 |
| `TagCloud.astro` | 动画 | Canvas 3D 球体标签 |
| `Clock.astro` | 动画 | SVG 模拟时钟 |
| `ScrollTop.astro` | 交互 | Canvas 环形进度条 + 回到顶部 |
| `GitHubHeatmap.astro` | 数据 | 外部 API + SVG 渲染 |
| `AISummary.astro` | 内容 | AI 摘要展示 |
| `BlogStats.astro` | 数据 | 构建时统计字数/篇数/天数 |
| `TechStack.astro` | 展示 | 技能图标网格 |
| `GuestComments.astro` | 交互 | 匿名评论表单 + GitHub Issues 后端 |
| `Giscus.astro` | 集成 | GitHub Discussions 评论嵌入 |
| `ImageLightbox.astro` | 交互 | 图片点击放大 + ESC 关闭 |
| `MermaidRenderer.astro` | 内容 | 客户端 Mermaid 渲染 + CDN fallback |
| `ParticleBackground.astro` | 动画 | （已弃用，保留文件） |

---

## 11. 推荐学习路径

```
Week 1-2: Astro 基础
  └─ 静态站点生成 → 内容集合 → 路由 → 布局 → 组件

Week 3-4: Tailwind CSS
  └─ Utility classes → 响应式 → 暗色模式 → 自定义主题

Week 5-6: Canvas 动画
  └─ 2D context → 粒子系统 → 3D 投影 → 交互

Week 7: 进阶主题
  └─ Cloudflare Pages → Serverless Functions → Markdown 插件 → 第三方 API 集成
```
