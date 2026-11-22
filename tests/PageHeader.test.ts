import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PageHeader from '../src/components/PageHeader.astro';

// Astro Container 需要实例化后才能渲染组件
let container: InstanceType<typeof AstroContainer>;

beforeAll(async () => {
  container = await AstroContainer.create();
});

// helper: 渲染 PageHeader 并返回 HTML 字符串
async function render(props: Record<string, unknown>) {
  return container.renderToString(PageHeader, { props });
}

describe('PageHeader', () => {
  describe('基础渲染', () => {
    it('必须提供 title 且正确渲染', async () => {
      const html = await render({ title: '归档' });
      expect(html).toContain('page-header-title');
      expect(html).toContain('归档');
    });

    it('根元素是 <header> 且有 page-header class', async () => {
      const html = await render({ title: '测试' });
      expect(html).toContain('<header');
      expect(html).toContain('class="page-header');
    });

    it('包含 stagger-in class (入场动画)', async () => {
      const html = await render({ title: '测试' });
      expect(html).toContain('stagger-in');
    });

    it('aria-label 包含 title 文本 (可访问性)', async () => {
      const html = await render({ title: '关于我' });
      expect(html).toContain('aria-label="关于我 页面头部"');
    });
  });

  describe('prompt (终端提示符)', () => {
    it('默认 prompt=true 时显示 ">" 前缀', async () => {
      const html = await render({ title: '归档' });
      expect(html).toContain('class="prompt"');
      expect(html).toContain('&gt;');
    });

    it('显式 prompt=true 时显示 ">" 前缀', async () => {
      const html = await render({ title: '归档', prompt: true });
      expect(html).toContain('class="prompt"');
    });

    it('prompt=false 时不渲染 prompt span', async () => {
      const html = await render({ title: '# 标签', prompt: false });
      expect(html).not.toContain('class="prompt"');
      // 但 title 本身仍正常渲染
      expect(html).toContain('# 标签');
    });
  });

  describe('desc (描述行)', () => {
    it('有 desc 时渲染 <p class="page-header-desc">', async () => {
      const html = await render({ title: '归档', desc: '共 5 篇文章' });
      expect(html).toContain('page-header-desc');
      expect(html).toContain('共 5 篇文章');
    });

    it('无 desc 时不渲染任何 <p>', async () => {
      const html = await render({ title: '关于我' });
      // page-header-desc 整个 class 不出现
      expect(html).not.toContain('page-header-desc');
    });

    it('空字符串 desc 视为无 (不渲染)', async () => {
      const html = await render({ title: '归档', desc: '' });
      expect(html).not.toContain('page-header-desc');
    });
  });

  describe('props 组合场景 (真实业务用法)', () => {
    it('列表页典型用法: title + desc + 默认 prompt', async () => {
      const html = await render({ title: '归档', desc: '共 5 篇文章' });
      expect(html).toContain('归档');
      expect(html).toContain('共 5 篇文章');
      expect(html).toContain('class="prompt"');
    });

    it('标签页典型用法: title 带 # + prompt=false', async () => {
      const html = await render({ title: '# 标签', desc: '共 9 个标签', prompt: false });
      expect(html).toContain('# 标签');
      expect(html).toContain('共 9 个标签');
      expect(html).not.toContain('class="prompt"');
    });

    it('图库页典型用法: emoji 标题 + prompt=false', async () => {
      const html = await render({ title: '📷 图库', desc: '共 12 张图片', prompt: false });
      expect(html).toContain('📷 图库');
      expect(html).toContain('共 12 张图片');
      expect(html).not.toContain('class="prompt"');
    });

    it('关于页用法: title only', async () => {
      const html = await render({ title: '关于我' });
      expect(html).toContain('关于我');
      expect(html).toContain('class="prompt"');
      expect(html).not.toContain('page-header-desc');
    });
  });

  describe('HTML 结构完整性', () => {
    it('包含单个 <h1>', async () => {
      const html = await render({ title: '测试' });
      // 用正则匹配 <h1 ...>...</h1>
      const h1Matches = html.match(/<h1\b[^>]*>/g);
      expect(h1Matches).toHaveLength(1);
    });

    it('h1 内部结构: 可选 prompt span + title span', async () => {
      const html = await render({ title: '归档', prompt: true });
      const h1Block = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '';
      // prompt span 必须存在
      expect(h1Block).toContain('class="prompt"');
      // title span 包含 "归档" (Astro Container 会注入 data-astro-source-* 属性，
      // 所以用文本内容匹配而非精确 <span> 标签)
      expect(h1Block).toMatch(/<span[^>]*>归档<\/span>/);
    });
  });
});
