// Cloudflare Functions / Netlify Functions compatible proxy for Netease Cloud Music API
// Handles: playlist, song-detail, lyric

const NETEASE_API = 'https://music.163.com';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REFERER = 'https://music.163.com';

export async function GET({ request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');
  const ids = url.searchParams.get('ids');

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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
  }

  try {
    const res = await fetch(`${NETEASE_API}${apiPath}`, {
      headers: {
        'User-Agent': UA,
        'Referer': REFERER,
      },
    });
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
