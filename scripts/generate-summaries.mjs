// AI 摘要生成脚本
// 用法: node scripts/generate-summaries.mjs
// 环境变量:
//   AI_API_URL  - API 地址 (OpenAI 兼容格式)
//   AI_API_KEY  - API 密钥
//   AI_MODEL    - 模型名称 (默认 gpt-4o-mini)

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const BLOG_DIR = './src/content/blog';
const SUMMARY_DIR = './src/data/summaries';

if (!API_KEY) {
  console.error('❌ 请设置 AI_API_KEY 环境变量');
  console.error('   示例: AI_API_KEY=sk-xxx node scripts/generate-summaries.mjs');
  process.exit(1);
}

if (!existsSync(SUMMARY_DIR)) mkdirSync(SUMMARY_DIR, { recursive: true });

async function generateSummary(title, content) {
  const truncatedContent = content.length > 3000 ? content.slice(0, 3000) + '...' : content;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一个博客摘要助手。请用 2-3 句中文总结文章核心内容，简洁明了。只输出摘要文本，不要有任何前缀或格式标记。'
        },
        {
          role: 'user',
          content: `标题: ${title}\n\n内容:\n${truncatedContent}`
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    throw new Error(`API 请求失败: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function main() {
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  if (files.length === 0) {
    console.log('📭 没有找到博客文章');
    return;
  }

  console.log(`📡 找到 ${files.length} 篇文章，开始生成摘要...\n`);

  let success = 0;
  let skipped = 0;

  for (const file of files) {
    const slug = basename(file, /\.(md|mdx)$/);
    const summaryPath = join(SUMMARY_DIR, `${slug}.json`);

    const raw = readFileSync(join(BLOG_DIR, file), 'utf-8');
    // Extract frontmatter
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) continue;

    const titleMatch = fmMatch[1].match(/title:\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, '') : slug;
    const content = fmMatch[2];

    // Skip if summary already exists (use --force to regenerate)
    if (existsSync(summaryPath) && !process.argv.includes('--force')) {
      console.log(`  ⏭️  ${title} (已有摘要，跳过)`);
      skipped++;
      continue;
    }

    try {
      console.log(`  🔄 生成: ${title}...`);
      const summary = await generateSummary(title, content);

      writeFileSync(summaryPath, JSON.stringify({
        title,
        summary,
        generatedAt: new Date().toISOString(),
        model: MODEL,
      }, null, 2));

      console.log(`  ✅ ${title}`);
      console.log(`     → "${summary.slice(0, 60)}..."`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${title}: ${err.message}`);
    }

    // Rate limit: 1s between requests
    if (files.indexOf(file) < files.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n🎉 完成! 生成 ${success} 篇，跳过 ${skipped} 篇`);
  console.log(`   摘要保存在 ${SUMMARY_DIR}/`);
  console.log(`   使用 --force 参数可强制重新生成所有摘要`);
}

main().catch(console.error);
