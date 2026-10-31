import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLEFILE=1 时打包成单文件 HTML，可离线双击打开
const singleFile = process.env.SINGLEFILE === '1'

export default defineConfig({
  // 相对路径：站点既有根目录形态也有子目录形态，相对引用两边都能用；hash 路由不改变文档路径
  base: './',
  plugins: [vue(), ...(singleFile ? [viteSingleFile()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
  },
  build: {
    ...(singleFile
      ? {
          assetsInlineLimit: 100_000_000,
          cssCodeSplit: false,
          chunkSizeWarningLimit: 4096,
        }
      : {}),
  },
})
