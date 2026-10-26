import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Chamabondo Teacher Management',
        short_name: 'Chamabondo',
        description:
          'Chamabondo teacher portal for attendance, KRAs, scheme books and school activities.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1B5E20',
        background_color: '#FFFFFF',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /\/api\/ai(?:\/|$)/i,
            handler: 'NetworkOnly',
          },
          ...(['POST', 'PUT', 'PATCH', 'DELETE'] as const).map((method) => ({
            urlPattern: /\/api\/ai(?:\/|$)/i,
            method,
            handler: 'NetworkOnly' as const,
          })),
          {
            urlPattern: /\/api\/auth\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'chamabondo-api',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    open: true,
  },
  build: {
    target: 'es2019',
    cssTarget: 'chrome61',
  },
})
