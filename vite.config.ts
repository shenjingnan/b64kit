import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8')) as {
  version: string;
};

export default defineConfig({
  // Toy 平台运行在 /toy/<slug>/ 子路径下，必须使用相对路径，否则资源 404/白屏
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
