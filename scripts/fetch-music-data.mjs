// 网易云音乐歌单数据预拉取脚本
// 用法: node scripts/fetch-music-data.mjs
// 将歌单数据存入 src/data/music-cache.json，构建时直接读取避免超时

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, '..', 'src', 'data', 'music-cache.json');
const PLAYLIST_ID = 2953785286;
const HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://music.163.com' };

function parseLRC(lrc) {
  const out = [];
  for (const line of lrc.split('\n')) {
    const m = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (m) {
      const ms = parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000 + parseInt(m[3].padEnd(3, '0'));
      const text = m[4].trim();
      if (text) out.push({ time: ms, text });
    }
  }
  return out;
}

async function fetchLyrics(songId) {
  try {
    const r = await fetch(`https://music.163.com/api/song/lyric?id=${songId}&lv=1`, { headers: HEADERS });
    const d = await r.json();
    return parseLRC(d.lrc?.lyric || '');
  } catch { return []; }
}

async function main() {
  console.log(`🎵 Fetching playlist ${PLAYLIST_ID}...`);

  const res = await fetch(
    `https://music.163.com/api/v3/playlist/detail?id=${PLAYLIST_ID}&n=100000`,
    { headers: HEADERS }
  );
  const data = await res.json();
  const pl = data.playlist;

  if (!pl) { console.error('❌ Playlist not found'); process.exit(1); }

  const coverImgUrl = pl.coverImgUrl?.replace('http:', 'https:') + '?param=200y200' || '';
  const playlistName = pl.name || '歌单';

  let rawTracks = pl.tracks || [];
  const trackIds = pl.trackIds?.map(t => t.id) || [];
  const fetchCount = Math.min(trackIds.length, 50);

  if (rawTracks.length < fetchCount && trackIds.length > 0) {
    console.log(`  Fetching ${trackIds.length - rawTracks.length} additional tracks...`);
    const existingIds = new Set(rawTracks.map(t => t.id));
    const missingIds = trackIds.filter(id => !existingIds.has(id)).slice(0, fetchCount - rawTracks.length);
    for (let i = 0; i < missingIds.length; i += 50) {
      const batchIds = missingIds.slice(i, i + 50);
      const detailRes = await fetch(
        `https://music.163.com/api/song/detail?ids=${JSON.stringify(batchIds)}`,
        { headers: HEADERS }
      );
      const detailData = await detailRes.json();
      const normalized = (detailData.songs || []).map(s => ({
        id: s.id, name: s.name,
        ar: s.artists?.map(a => ({ name: a.name })) || [],
        al: { picUrl: s.album?.picUrl }, dt: s.duration,
      }));
      rawTracks = rawTracks.concat(normalized);
    }
  }

  const lyricsLimit = Math.min(rawTracks.length, 20);
  console.log(`  Fetching lyrics for ${lyricsLimit} tracks...`);

  const lyricsResults = await Promise.allSettled(
    rawTracks.slice(0, lyricsLimit).map(t => fetchLyrics(t.id))
  );

  const tracks = rawTracks.slice(0, fetchCount).map((t, i) => ({
    id: t.id || 0,
    name: t.name || '',
    artist: t.ar?.map(a => a.name).join(', ') || '',
    cover: (t.al?.picUrl || '').replace('http:', 'https:') + '?param=200y200',
    duration: t.dt || 200000,
    lyrics: i < lyricsLimit && lyricsResults[i].status === 'fulfilled'
      ? lyricsResults[i].value : [],
  }));

  const cache = { playlistId: PLAYLIST_ID, playlistName, coverImgUrl, tracks, fetchedAt: new Date().toISOString() };

  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');

  console.log(`✅ Cached ${tracks.length} tracks to ${CACHE_FILE}`);
  console.log(`   Playlist: ${playlistName}`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
