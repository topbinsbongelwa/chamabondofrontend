import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = (env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

  let backendPattern: RegExp | null = null

  if (apiUrl) {
    try {
      backendPattern = new RegExp(`^${escapeRegExp(new URL(apiUrl).origin)}/`, 'i')
    } catch {
      backendPattern = null
    }
  }

  const apiNetworkOnly = [
    { urlPattern: /\/api(?:\/|$)/i, handler: 'NetworkOnly' as const },
    ...(['POST', 'PUT', 'PATCH', 'DELETE'] as const).map((method) => ({
      urlPattern: /\/api(?:\/|$)/i,
      method,
      handler: 'NetworkOnly' as const,
    })),
  ]

  const backendNetworkOnly = backendPattern
    ? [
        { urlPattern: backendPattern, handler: 'NetworkOnly' as const },
        ...(['POST', 'PUT', 'PATCH', 'DELETE'] as const).map((method) => ({
          urlPattern: backendPattern,
          method,
          handler: 'NetworkOnly' as const,
        })),
      ]
    : []

  return {
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
          cacheId: 'chamabondo-v2',
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            ...backendNetworkOnly,
            {
              urlPattern: /\/backend-api\/api(?:\/|$)/i,
              handler: 'NetworkOnly',
            },
            ...(['POST', 'PUT', 'PATCH', 'DELETE'] as const).map((method) => ({
              urlPattern: /\/backend-api\/api(?:\/|$)/i,
              method,
              handler: 'NetworkOnly' as const,
            })),
            ...apiNetworkOnly,
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
      proxy: {
        '/api/ai/ask': {
          target: 'https://intellli-ai.netlify.app',
          changeOrigin: true,
          rewrite: () => '/api/ask',
        },
      },
    },
    build: {
      target: 'es2019',
      cssTarget: 'chrome61',
    },
  }
})
