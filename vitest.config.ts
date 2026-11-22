/// <reference types="vitest/config" />

import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.{ts,js}'],
    // Container API 渲染需要文件系统和完整的 Astro 环境
    environment: 'node',
  },
});
