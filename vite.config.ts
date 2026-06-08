import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        navigateFallback: '/index.html'
      },
      manifest: {
        name: '个人英语口语训练器',
        short_name: '口语训练',
        description: '用于个人英语口语练习的本地优先训练工具',
        display: 'standalone',
        start_url: '/',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/test/setup.ts'
  }
});
