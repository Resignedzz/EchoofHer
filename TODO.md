# Astro 赛博朋克博客 — 优化 Todo

## P0 紧急必做
- [x] ~~1. 导航栏当前路由高亮~~ ✅ 已完成
- [x] ~~2. 移动端汉堡菜单~~ ✅ 已有
- [x] ~~3. 首页数据自动统计~~ ✅ 已有（构建时读取 collection）
- [x] 4. 音乐播放器默认收起为小图标 ✅ v9.1 两态模式
- [ ] 5. 统一全局光标样式（终端指针）

## P1 体验升级
- [ ] 1. 全局虚拟终端（`~` 唤起，支持 ls/cd/cat/help）
- [ ] 2a. 文章页树形目录大纲（悬浮跟随）
- [ ] 2b. 文章页阅读时长/字数（wc 命令格式）
- [ ] 2c. 代码块一键复制
- [ ] 3. 搜索结果终端列表样式 + 霓虹高亮
- [ ] 4. Hero 打字机改用真实 Linux 启动日志

## P2 视觉细节
- [ ] 1. 亮色模式降低扫描线/网格透明度
- [ ] 2. 光标 Glow 强度下调
- [ ] 3. 滚动条移动端禁用
- [ ] 4. 导航按钮 hover 霓虹发光

## P3 架构 & 性能
- [x] 1. 特效性能降级策略 ✅ deviceMemory/CPU/network 检测 + reduced-motion
- [x] 2. 图片优化配置 ✅ compressHTML + inlineStylesheets + image domains
- [x] 3. 统一 Frontmatter 规范 ✅ blog/snippets 加 image，books 加 isbn/cover
- [x] 4. 完善 SEO ✅ robots.txt + OG locale/site_name + twitter cards + 中文 description

## P4 高级拓展
- [x] 1. 亮色赛博朋克主题 ✅ html.light CSS 变量 + ThemeToggle 重写 + vinyl/header 适配
- [x] 2. 侧边栏访客统计 ✅ 不蒜子 busuanzi + netstat 样式 sidebar
- [x] 3. 书单接入外部API ✅ Open Library ISBN 封面 + 书籍卡片封面图
- [x] 4. 友链存活检测 ✅ 构建时 HEAD 检测 + 死链标红 💀 + 不可达标黄 ?
