// Cloudflare Pages Function — Guest comments via GitHub Issues API
// Each blog post slug gets one GitHub Issue (label: comment-{slug})
// Comments are stored as issue comments.
// Requires GITHUB_TOKEN secret set in Cloudflare Pages env vars.

interface Env {
  GITHUB_TOKEN: string;
}

const OWNER = 'Resignedzz';
const REPO = 'EchoofHer';
const LABEL_PREFIX = 'comment-';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return json({ error: 'missing slug' }, 400);

  const issue = await findOrCreateIssue(slug, ctx.env.GITHUB_TOKEN);
  if (!issue) return json({ error: 'failed to get issue' }, 500);

  const comments = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues/${issue.number}/comments?per_page=50`, {
    headers: {
      'Authorization': `token ${ctx.env.GITHUB_TOKEN}`,
      'User-Agent': 'echoofher-blog',
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!comments.ok) return json({ error: 'failed to fetch comments' }, 500);
  const list = (await comments.json()) as any[];

  return json({
    issue_number: issue.number,
    comments: list.map((c: any) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user: c.user ? c.user.login : 'guest',
    })),
  }, 200);
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return json({ error: 'missing slug' }, 400);

  let body: { name?: string; text?: string };
  try { body = await ctx.request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  if (!body.text || !body.text.trim()) return json({ error: 'empty comment' }, 400);
  if (body.text.length > 2000) return json({ error: 'comment too long (max 2000)' }, 400);

  const name = (body.name || '匿名').trim().slice(0, 50);
  const commentBody = `**${name}** 说：\n\n${body.text.trim()}`;

  const issue = await findOrCreateIssue(slug, ctx.env.GITHUB_TOKEN);
  if (!issue) return json({ error: 'failed to get issue' }, 500);

  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues/${issue.number}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${ctx.env.GITHUB_TOKEN}`,
      'User-Agent': 'echoofher-blog',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: commentBody }),
  });

  if (!res.ok) {
    const err = await res.text();
    return json({ error: 'GitHub API error: ' + err }, res.status);
  }

  const created = await res.json() as any;
  return json({
    ok: true,
    comment: {
      id: created.id,
      body: commentBody,
      created_at: created.created_at,
      user: 'guest',
    },
  }, 200);
};

async function findOrCreateIssue(slug: string, token: string) {
  const label = LABEL_PREFIX + slug;
  // Search for existing issue with this label
  const searchRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/issues?labels=${encodeURIComponent(label)}&state=all&per_page=1`,
    {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'echoofher-blog',
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );
  if (searchRes.ok) {
    const issues = await searchRes.json() as any[];
    if (issues.length > 0) return issues[0];
  }

  // Create new issue
  const createRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'echoofher-blog',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `💬 访客评论: ${slug}`,
      body: `这个 Issue 用于存储文章 \`${slug}\` 的匿名访客评论。请勿手动删除。`,
      labels: [label, 'guest-comment'],
    }),
  });
  if (!createRes.ok) return null;
  return await createRes.json() as any;
}

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
