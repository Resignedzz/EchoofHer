import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://echoofher.pages.dev',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    domains: ['p1.music.126.net', 'p2.music.126.net'],
  },
  integrations: [mdx(), sitemap(), tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    server: {
      headers: {
        'Permissions-Policy': 'encrypted-media=*, accelerometer=*, autoplay=*, fullscreen=*',
      },
      proxy: {
        '/api/netease': {
          target: 'https://music.163.com',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'http://localhost');
            const type = url.searchParams.get('type');
            const id = url.searchParams.get('id');
            const ids = url.searchParams.get('ids');
            if (type === 'playlist') return `/api/v3/playlist/detail?id=${id}&n=100000`;
            if (type === 'song-detail') return `/api/song/detail?ids=${ids}`;
            if (type === 'lyric') return `/api/song/lyric?id=${id}&lv=1`;
            return path;
          },
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://music.163.com',
          },
        },
      },
    },
  },
});
