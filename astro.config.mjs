import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://echoofher.pages.dev',
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
    },
  },
});
