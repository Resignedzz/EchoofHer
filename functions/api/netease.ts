// Cloudflare Pages Function — 独立于 Astro SSR
// 自动处理 /api/netease 请求

const NETEASE_API = 'https://music.163.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REFERER = 'https://music.163.com';

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');
  const ids = url.searchParams.get('ids');

  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // ── Audio redirect ──
  if (type === 'song-url') {
    const songId = id || '';
    if (!songId) return new Response('Missing id', { status: 400, headers: corsHeaders });

    try {
      const res = await fetch(
        `${NETEASE_API}/api/song/enhance/player/url?id=${songId}&ids=%5B${songId}%5D&br=320000`,
        { headers: { 'User-Agent': UA, 'Referer': REFERER } }
      );
      const data = await res.json();
      const urls = data.data || [];
      if (urls.length > 0 && urls[0].url) {
        return Response.redirect(urls[0].url, 302);
      }
    } catch (_) {}

    return Response.redirect(
      `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
      302
    );
  }

  // ── JSON API endpoints ──
  let apiPath = '';
  switch (type) {
    case 'playlist':
      apiPath = `/api/v3/playlist/detail?id=${id}&n=100000`;
      break;
    case 'song-detail':
      apiPath = `/api/song/detail?ids=${ids}`;
      break;
    case 'lyric':
      apiPath = `/api/song/lyric?id=${id}&lv=1`;
      break;
    default:
      return new Response(JSON.stringify({ error: 'Unknown type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
  }

  try {
    const res = await fetch(`${NETEASE_API}${apiPath}`, {
      headers: { 'User-Agent': UA, 'Referer': REFERER },
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
